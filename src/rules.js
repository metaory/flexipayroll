/**
 * Generic Rules Engine
 * Flexible, user-configurable calculation rules system
 */

// ============================================================================
// RULE TYPES & STRUCTURE
// ============================================================================

export const RULE_TYPES = {
  FIXED: 'fixed',
  PRORATED: 'prorated',
  DAYS_MULTIPLIER: 'days_multiplier',
  PERCENTAGE_MONTHLY: 'percentage_monthly',
  PERCENTAGE_BASE: 'percentage_base',
  HOURLY_MULTIPLIER: 'hourly_multiplier'
}

export const RULE_CATEGORIES = {
  BONUS: 'bonus',
  DEDUCTION: 'deduction'
}

export const CRITERIA_TYPES = {
  MARRIED: 'married',
  SINGLE: 'single',
  MALE: 'male',
  FEMALE: 'female',
  HAS_CHILDREN: 'has_children',
  HAS_NO_CHILDREN: 'no_children',
  CUSTOM: 'custom'
}

// ============================================================================
// DEFAULT RULES
// ============================================================================

export const DEFAULT_RULES = [
  {
    id: 'bonus_e',
    label: 'Bonus E',
    type: RULE_TYPES.DAYS_MULTIPLIER,
    value: 5,
    criteria: { appliesTo: [] },
    category: RULE_CATEGORIES.BONUS,
    order: 1,
    enabled: true
  },
  {
    id: 'insurance',
    label: 'Insurance Deduction',
    type: RULE_TYPES.PERCENTAGE_MONTHLY,
    value: 0.07,
    criteria: { appliesTo: [] },
    category: RULE_CATEGORIES.DEDUCTION,
    order: 2,
    enabled: true
  },
  {
    id: 'marital_bonus',
    label: 'Marital Bonus',
    type: RULE_TYPES.FIXED,
    value: 150000,
    criteria: { appliesTo: [CRITERIA_TYPES.MARRIED] },
    category: RULE_CATEGORIES.BONUS,
    order: 3,
    enabled: true
  }
]

// ============================================================================
// PERCENTAGE NORMALIZATION
// ============================================================================

// Normalize percentage: values >= 1 treated as whole % (7 → 0.07), values < 1 as decimal
export const normalizePercentage = (value) => value >= 1 ? value / 100 : value

// ============================================================================
// RULE VALIDATION
// ============================================================================

export const validateRule = (rule) => {
  const validations = [
    [!rule.id || rule.id.length < 2, 'id', 'Rule ID must be at least 2 characters'],
    [!rule.label || rule.label.length < 2, 'label', 'Rule label must be at least 2 characters'],
    [!Object.values(RULE_TYPES).includes(rule.type), 'type', 'Invalid rule type'],
    [typeof rule.value !== 'number' || rule.value < 0, 'value', 'Value must be a positive number'],
    [!rule.criteria || !rule.criteria.appliesTo || !Array.isArray(rule.criteria.appliesTo), 'criteria', 'Criteria must specify appliesTo as an array'],
    [rule.criteria?.appliesTo && !rule.criteria.appliesTo.every(criteria => Object.values(CRITERIA_TYPES).includes(criteria)), 'criteria', 'Invalid criteria type in array'],
    [!Object.values(RULE_CATEGORIES).includes(rule.category), 'category', 'Invalid category'],
    [typeof rule.order !== 'number' || rule.order < 0, 'order', 'Order must be a positive number']
  ]
  
  const errors = validations
    .filter(([condition]) => condition)
    .reduce((acc, [, field, message]) => ({ ...acc, [field]: message }), {})
  
  return Object.keys(errors).length === 0 ? null : errors
}

// ============================================================================
// RULE APPLICATION
// ============================================================================

const CRITERIA_CHECKERS = {
  [CRITERIA_TYPES.MARRIED]: (emp) => emp.maritalStatus === 'married',
  [CRITERIA_TYPES.SINGLE]: (emp) => emp.maritalStatus === 'single',
  [CRITERIA_TYPES.MALE]: (emp) => emp.gender === 'male',
  [CRITERIA_TYPES.FEMALE]: (emp) => emp.gender === 'female',
  [CRITERIA_TYPES.HAS_CHILDREN]: (emp) => (emp.childrenStatus || 'no_children') === 'has_children',
  [CRITERIA_TYPES.HAS_NO_CHILDREN]: (emp) => (emp.childrenStatus || 'no_children') === 'no_children',
  [CRITERIA_TYPES.CUSTOM]: () => false // Custom conditions not implemented yet
}

export const appliesToEmployee = (rule, employee) => {
  const { appliesTo } = rule.criteria
  
  // If no criteria selected, applies to all
  if (!appliesTo || appliesTo.length === 0) return true
  
  // Check if employee matches ANY of the selected criteria (OR logic)
  return appliesTo.some(criteria => CRITERIA_CHECKERS[criteria]?.(employee) ?? false)
}

const rawHoursDelta = (items) =>
  (items || []).reduce((sum, item) => sum + (Number(item.hours) || 0), 0)

/** Full days from attendance hours delta; uses floor so only complete days count. */
const hoursDeltaToDays = (rawHours, workdayHours) =>
  rawHours >= 0 ? Math.floor(rawHours / workdayHours) : -Math.floor(Math.abs(rawHours) / workdayHours)

const RULE_CALCULATORS = {
  [RULE_TYPES.FIXED]: (rule) => rule.value,

  [RULE_TYPES.PRORATED]: (rule, _, __, ___, config, totalDaysWorked) => {
    const workDays = config.workingDaysPerMonth ?? 22
    if (workDays <= 0) return 0
    const ratio = Math.min(1, Math.max(0, totalDaysWorked) / workDays)
    return rule.value * ratio
  },

  [RULE_TYPES.DAYS_MULTIPLIER]: (rule, employee, _, __, config, totalDaysWorked) => {
    const workDays = config.workingDaysPerMonth ?? 22
    const fullMonthValue = rule.value * employee.dailySalary
    if (workDays <= 0) return 0
    const ratio = Math.min(1, Math.max(0, totalDaysWorked) / workDays)
    return fullMonthValue * ratio
  },

  [RULE_TYPES.PERCENTAGE_MONTHLY]: (rule) => normalizePercentage(rule.value),

  [RULE_TYPES.PERCENTAGE_BASE]: (rule) => normalizePercentage(rule.value),

  [RULE_TYPES.HOURLY_MULTIPLIER]: (rule, _, __, hourlyRate) => hourlyRate * rule.value
}

export const calculateRuleValue = (rule, employee, attendanceItems, config, totalDaysWorked) => {
  if (!appliesToEmployee(rule, employee)) return 0

  const hourlyRate = employee.dailySalary / config.workdayHours
  const workDays = config.workingDaysPerMonth ?? 22
  const attendanceDelta = hoursDeltaToDays(rawHoursDelta(attendanceItems), config.workdayHours)
  const days = totalDaysWorked ?? Math.max(0, workDays + attendanceDelta)

  const calculator = RULE_CALCULATORS[rule.type]
  return calculator ? calculator(rule, employee, attendanceItems, hourlyRate, config, days) : 0
}

// ============================================================================
// RULE PROCESSING
// ============================================================================

export const applyRules = (employee, attendanceItems, rules, config) => {
  const hourlyRate = employee.dailySalary / config.workdayHours
  const workDays = config.workingDaysPerMonth ?? 22
  const workdayHours = config.workdayHours
  const expectedHours = workDays * workdayHours
  const rawOt = Number.isFinite(Number(config.overtimeRate)) ? Number(config.overtimeRate) : 1.5
  const otRate = rawOt > 0 && rawOt < 1 ? 1 + rawOt : rawOt
  const utRate = Number.isFinite(Number(config.undertimeDeductionRate)) ? Number(config.undertimeDeductionRate) : 0.5
  const hoursAdjustment = (attendanceItems || []).reduce((sum, item) => {
    const hours = Number(item.hours) || 0
    if (hours > 0) return sum + hours * otRate
    if (hours < 0) return sum + hours * utRate
    return sum
  }, 0)
  const rawHours = rawHoursDelta(attendanceItems)
  const rawUndertimeHours = (attendanceItems || []).reduce((s, i) => {
    const h = Number(i.hours) || 0
    return h < 0 ? s + Math.abs(h) : s
  }, 0)
  const rawOvertimeHours = (attendanceItems || []).reduce((s, i) => s + Math.max(0, Number(i.hours) || 0), 0)
  const daysNotWorked = Math.floor(rawUndertimeHours / workdayHours)
  const totalDaysWorked = Math.max(0, workDays - daysNotWorked)
  const attendanceDays = hoursDeltaToDays(rawHours, workdayHours)
  const baseFromDays = employee.dailySalary * totalDaysWorked
  const overtimePay = rawOvertimeHours * otRate * hourlyRate
  const baseSalary = baseFromDays + overtimePay
  const totalHours = expectedHours + hoursAdjustment
  const actualDays = totalDaysWorked
  const expectedBase = employee.dailySalary * workDays
  const attendanceAdjustment = baseSalary - expectedBase

  if (employee.probationary) {
    return { baseSalary, attendanceAdjustment, hoursAdjustment, attendanceDays, totalDaysWorked, daysNotWorked, baseFromDays, overtimePay, bonuses: {}, deductions: {}, grossSalary: baseSalary, totalHours, actualDays }
  }

  // Process enabled rules (include value 0 so days_multiplier etc. appear in detailed steps)
  const processedRules = [...rules]
    .sort((a, b) => a.order - b.order)
    .filter(r => r.enabled)
    .map(rule => ({ rule, value: calculateRuleValue(rule, employee, attendanceItems, config, totalDaysWorked) }))

  // Categorize rules
  const categorized = processedRules.reduce((acc, { rule, value }) => {
    const isPercentBase = rule.type === RULE_TYPES.PERCENTAGE_BASE
    const entry = { rule, value, percentage: isPercentBase, percentageType: isPercentBase ? 'base' : null }
    acc[rule.category === RULE_CATEGORIES.BONUS ? 'bonuses' : 'deductions'][rule.id] = entry
    return acc
  }, { bonuses: {}, deductions: {} })

  // Calculate gross with fixed bonuses
  const fixedBonusTotal = Object.values(categorized.bonuses)
    .filter(i => !i.percentage)
    .reduce((sum, i) => sum + i.value, 0)

  // Apply percentage-based bonuses
  Object.values(categorized.bonuses)
    .filter(i => i.percentage && i.percentageType === 'base')
    .map(i => { i.finalValue = baseSalary * i.value; return i })

  // Apply percentage-based deductions
  Object.values(categorized.deductions)
    .filter(i => i.percentage && i.percentageType === 'base')
    .map(i => { i.finalValue = baseSalary * i.value; return i })

  const percentBonusTotal = Object.values(categorized.bonuses)
    .filter(i => i.percentage)
    .reduce((sum, i) => sum + (i.finalValue || 0), 0)

  return {
    ...categorized,
    baseSalary,
    attendanceAdjustment,
    hoursAdjustment,
    attendanceDays,
    totalDaysWorked,
    daysNotWorked,
    baseFromDays,
    overtimePay,
    grossSalary: baseSalary + fixedBonusTotal + percentBonusTotal,
    totalHours,
    actualDays
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const generateRuleId = (label) => {
  return label.toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

export const createRule = (data) => {
  const rule = {
    id: data.id || generateRuleId(data.label),
    label: data.label,
    type: data.type,
    value: data.value,
    criteria: data.criteria,
    category: data.category,
    order: data.order || 999,
    enabled: data.enabled !== false
  }
  
  return rule
}

export const sortRulesByOrder = (rules) => {
  return [...rules].sort((a, b) => a.order - b.order)
}

export const getNextOrder = (rules) => 
  rules.length === 0 ? 1 : Math.max(...rules.map(r => r.order)) + 1
