/**
 * Generic Rules Engine
 * Flexible, user-configurable calculation rules system
 */

import { getProbationExclusions, ruleMatchesProbationList } from './probation.js'
import { attendancePay, normalizeAttendance } from './core.js'

// ============================================================================
// RULE TYPES & STRUCTURE
// ============================================================================

export const RULE_TYPES = {
  FIXED: 'fixed',
  HOURLY_PRORATED: 'hourly_prorated',
  FIXED_DAILY_PRORATED: 'fixed_daily_prorated',
  DAYS_MULTIPLIER: 'days_multiplier',
  PERCENTAGE_MONTHLY: 'percentage_monthly',
  PERCENTAGE_BASE: 'percentage_base',
  HOURLY_MULTIPLIER: 'hourly_multiplier'
}

const LEGACY_RULE_TYPES = {
  PRORATED: 'prorated'
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
  const validTypes = [...Object.values(RULE_TYPES), ...Object.values(LEGACY_RULE_TYPES)]
  const validations = [
    [!rule.id || rule.id.length < 2, 'id', 'Rule ID must be at least 2 characters'],
    [!rule.label || rule.label.length < 2, 'label', 'Rule label must be at least 2 characters'],
    [!validTypes.includes(rule.type), 'type', 'Invalid rule type'],
    [typeof rule.value !== 'number' || rule.value < 0, 'value', 'Value must be a positive number'],
    [!rule.criteria || !rule.criteria.appliesTo || !Array.isArray(rule.criteria.appliesTo), 'criteria', 'Criteria must specify appliesTo as an array'],
    [rule.criteria?.appliesTo && !rule.criteria.appliesTo.every(criteria => Object.values(CRITERIA_TYPES).includes(criteria)), 'criteria', 'Invalid criteria type in array'],
    [!Object.values(RULE_CATEGORIES).includes(rule.category), 'category', 'Invalid category'],
    [typeof rule.order !== 'number' || rule.order < 0, 'order', 'Order must be a positive number']
  ]
  
  const errors = validations
    .filter(([condition]) => condition)
    .reduce((acc, [, field, message]) => {
      acc[String(field)] = message
      return acc
    }, {})
  
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

const resolveWorkdayHours = (config) => (config.workdayHours > 0 ? config.workdayHours : 8)

const resolveWorkingDays = (config) => (config.workingDaysPerMonth ?? 22)

const resolveMonthDays = (config) => (config.monthDays ?? 30)

const normalizeRuleType = (type) =>
  type === LEGACY_RULE_TYPES.PRORATED ? RULE_TYPES.HOURLY_PRORATED : type

const toDayBlocks = (hours, workdayHours) =>
  Math.floor(Math.abs(hours) / workdayHours)

const resolveEffectiveDays = (workDays, absentDays) =>
  Math.max(0, workDays - Math.max(0, Math.floor(Number(absentDays) || 0)))

export const FULL_BONUS_DAYS_THRESHOLD = 30

export const bonusProrationRatio = (effectiveDays, monthDays) =>
  effectiveDays >= FULL_BONUS_DAYS_THRESHOLD ? 1
  : monthDays > 0 ? Math.min(effectiveDays, monthDays) / monthDays : 0

const buildAttendanceMetrics = (attendanceData, config) => {
  const { items, absent } = normalizeAttendance(attendanceData)
  const workdayHours = resolveWorkdayHours(config)
  const workDays = resolveWorkingDays(config)
  const monthDays = resolveMonthDays(config)
  const rawHours = rawHoursDelta(items)
  const rawUndertimeHours = items.reduce((sum, item) => {
    const hours = Number(item.hours) || 0
    return hours < 0 ? sum + Math.abs(hours) : sum
  }, 0)
  const rawOvertimeHours = items.reduce((sum, item) =>
    sum + Math.max(0, Number(item.hours) || 0), 0)
  const overtimeDayBlocks = toDayBlocks(rawOvertimeHours, workdayHours)
  const undertimeDayBlocks = toDayBlocks(rawUndertimeHours, workdayHours)
  const hourEquivalentDays = rawHours / workdayHours
  const monthHourEquivalentDays = Math.max(0, workDays + hourEquivalentDays)
  const dayEquivalent = Math.max(0, workDays + hourEquivalentDays)
  const effectiveDays = resolveEffectiveDays(workDays, absent)

  return {
    workDays,
    monthDays,
    rawHours,
    rawUndertimeHours,
    rawOvertimeHours,
    overtimeDayBlocks,
    undertimeDayBlocks,
    absentDays: absent,
    monthHourEquivalentDays,
    dayEquivalent,
    effectiveDays
  }
}

const RULE_CALCULATORS = {
  [RULE_TYPES.FIXED]: (rule) => rule.value,

  [RULE_TYPES.HOURLY_PRORATED]: (rule, _, __, ___, config, ____, metrics) => {
    const monthDays = resolveMonthDays(config)
    if (monthDays <= 0) return 0
    return rule.value * bonusProrationRatio(metrics.effectiveDays, monthDays)
  },

  [LEGACY_RULE_TYPES.PRORATED]: (rule, employee, attendanceItems, hourlyRate, config, totalDaysWorked, metrics) =>
    RULE_CALCULATORS[RULE_TYPES.HOURLY_PRORATED](rule, employee, attendanceItems, hourlyRate, config, totalDaysWorked, metrics),

  [RULE_TYPES.FIXED_DAILY_PRORATED]: (rule, _, __, ___, config, ____, metrics) => {
    const monthDays = resolveMonthDays(config)
    if (monthDays <= 0) return 0
    return rule.value * bonusProrationRatio(metrics.effectiveDays, monthDays)
  },

  [RULE_TYPES.DAYS_MULTIPLIER]: (rule, employee, _, __, config, ___, metrics) => {
    const monthDays = resolveMonthDays(config)
    const fullMonthValue = rule.value * employee.dailySalary
    if (monthDays <= 0) return 0
    return fullMonthValue * bonusProrationRatio(metrics.effectiveDays, monthDays)
  },

  [RULE_TYPES.PERCENTAGE_MONTHLY]: (rule) => normalizePercentage(rule.value),

  [RULE_TYPES.PERCENTAGE_BASE]: (rule) => normalizePercentage(rule.value),

  [RULE_TYPES.HOURLY_MULTIPLIER]: (rule, _, __, hourlyRate) => hourlyRate * rule.value
}

export const calculateRuleValue = (rule, employee, attendanceData, config, totalDaysWorked) => {
  if (!appliesToEmployee(rule, employee)) return 0

  const normalizedType = normalizeRuleType(rule.type)
  const workdayHours = resolveWorkdayHours(config)
  const hourlyRate = employee.dailySalary / workdayHours
  const workDays = resolveWorkingDays(config)
  const { items } = normalizeAttendance(attendanceData)
  const attendanceDelta = hoursDeltaToDays(rawHoursDelta(items), workdayHours)
  const days = totalDaysWorked ?? Math.max(0, workDays + attendanceDelta)
  const metrics = buildAttendanceMetrics(attendanceData, config)

  const calculator = RULE_CALCULATORS[normalizedType]
  return calculator ? calculator(rule, employee, items, hourlyRate, config, days, metrics) : 0
}

// ============================================================================
// RULE PROCESSING
// ============================================================================

export const applyRules = (employee, attendanceData, rules, config) => {
  const { items } = normalizeAttendance(attendanceData)
  const workdayHours = resolveWorkdayHours(config)
  const hourlyRate = employee.dailySalary / workdayHours
  const attendanceMetrics = buildAttendanceMetrics(attendanceData, config)
  const workDays = attendanceMetrics.workDays
  const monthDays = attendanceMetrics.monthDays
  const expectedHours = workDays * workdayHours
  const otRate = Number(config.overtimeRate)
  const rawUt = config.undertimeRate ?? config.undertimeDeductionRate
  const utRate = Number(rawUt)
  const hoursAdjustment = items.reduce((sum, item) => {
    const hours = Number(item.hours) || 0
    if (hours > 0) return sum + hours * otRate
    if (hours < 0) return sum + hours * utRate
    return sum
  }, 0)
  const rawHours = attendanceMetrics.rawHours
  const rawUndertimeHours = attendanceMetrics.rawUndertimeHours
  const rawOvertimeHours = attendanceMetrics.rawOvertimeHours
  const daysNotWorked = attendanceMetrics.absentDays
  const totalDaysWorked = attendanceMetrics.effectiveDays
  const attendanceDays = hoursDeltaToDays(rawHours, workdayHours)
  const overtimePay = attendancePay(rawOvertimeHours, otRate, employee.dailySalary)
  const undertimePay = attendancePay(rawUndertimeHours, utRate, employee.dailySalary)
  const expectedBaseFull = employee.dailySalary * workDays
  const effectiveDays = attendanceMetrics.effectiveDays
  const cappedEffectiveDays = workDays > 0 ? Math.min(effectiveDays, workDays) : 0
  const attendancePayAdjustment = overtimePay - undertimePay
  const attendanceAdjustment = attendancePayAdjustment
  const baseSalary = employee.dailySalary * effectiveDays
  const baseFromDays = baseSalary
  const totalHours = expectedHours + hoursAdjustment
  const actualDays = attendanceMetrics.effectiveDays

  const probationExclusions = getProbationExclusions(employee)

  const processedRules = [...rules]
    .sort((a, b) => a.order - b.order)
    .filter(r => r.enabled)
    .map(rule => {
      const probationExcluded = probationExclusions !== null && ruleMatchesProbationList(rule, probationExclusions)
      return {
        rule,
        value: probationExcluded ? 0 : calculateRuleValue(rule, employee, attendanceData, config, totalDaysWorked),
        probationExcluded
      }
    })

  // Categorize rules
  const categorized = processedRules.reduce((acc, { rule, value, probationExcluded }) => {
    const normalizedType = normalizeRuleType(rule.type)
    const isPercentBase = normalizedType === RULE_TYPES.PERCENTAGE_BASE
    const isPercentMonthly = normalizedType === RULE_TYPES.PERCENTAGE_MONTHLY
    const entry = {
      rule: { ...rule, type: normalizedType },
      value,
      probationExcluded,
      percentage: isPercentBase || isPercentMonthly,
      percentageType: isPercentBase ? 'base' : (isPercentMonthly ? 'monthly' : null)
    }
    acc[rule.category === RULE_CATEGORIES.BONUS ? 'bonuses' : 'deductions'][rule.id] = entry
    return acc
  }, { bonuses: {}, deductions: {} })

  const fixedBonusTotal = Object.values(categorized.bonuses)
    .filter(i => !i.probationExcluded && !i.percentage)
    .reduce((sum, i) => sum + i.value, 0)

  Object.values(categorized.bonuses)
    .filter(i => !i.probationExcluded && i.percentage && i.percentageType === 'base')
    .map(i => { i.finalValue = baseSalary * i.value; return i })

  Object.values(categorized.deductions)
    .filter(i => !i.probationExcluded && i.percentage && i.percentageType === 'base')
    .map(i => { i.finalValue = baseSalary * i.value; return i })

  const percentBonusTotal = Object.values(categorized.bonuses)
    .filter(i => !i.probationExcluded && i.percentage)
    .reduce((sum, i) => sum + (i.finalValue || 0), 0)

  return {
    ...categorized,
    baseSalary,
    attendanceAdjustment,
    hoursAdjustment,
    attendanceDays,
    totalDaysWorked,
    workedDayEquivalent: attendanceMetrics.dayEquivalent,
    effectiveDays: attendanceMetrics.effectiveDays,
    absentDays: attendanceMetrics.absentDays,
    monthHourEquivalentDays: attendanceMetrics.monthHourEquivalentDays,
    proratedWorkDays: workDays,
    daysNotWorked,
    rawOvertimeHours,
    rawUndertimeHours,
    otRate,
    utRate,
    baseFromDays,
    expectedBaseFull,
    cappedEffectiveDays,
    overtimePay,
    undertimePay,
    attendancePayAdjustment,
    grossSalary: baseSalary + attendancePayAdjustment + fixedBonusTotal + percentBonusTotal,
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

const uid = () =>
  globalThis.crypto?.randomUUID?.() ||
  `t${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

export const ensureRuleId = (data) => {
  const raw = String(data?.id || '').trim()
  const fromLabel = generateRuleId(String(data?.label || ''))
  const base = raw.length >= 2 ? raw : (fromLabel.length >= 2 ? fromLabel : `rule_${uid()}`)
  return base
}

export const createRule = (data) => {
  const rule = {
    id: ensureRuleId(data),
    label: data.label,
    type: normalizeRuleType(data.type),
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
