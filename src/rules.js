/**
 * Generic Rules Engine
 * Flexible, user-configurable calculation rules system
 */

// ============================================================================
// RULE TYPES & STRUCTURE
// ============================================================================

export const RULE_TYPES = {
  FIXED: 'fixed',
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
  [CRITERIA_TYPES.CUSTOM]: () => false // Custom conditions not implemented yet
}

export const appliesToEmployee = (rule, employee) => {
  const { appliesTo } = rule.criteria
  
  // If no criteria selected, applies to all
  if (!appliesTo || appliesTo.length === 0) return true
  
  // Check if employee matches ANY of the selected criteria (OR logic)
  return appliesTo.some(criteria => CRITERIA_CHECKERS[criteria]?.(employee) ?? false)
}

const RULE_CALCULATORS = {
  [RULE_TYPES.FIXED]: (rule, _, __, ___, daysWorkedProportion) => 
    rule.value * daysWorkedProportion,
  
  [RULE_TYPES.DAYS_MULTIPLIER]: (rule, _, __, hourlyRate, daysWorkedProportion) => {
    const standardDayHours = 8
    const bonusHours = rule.value * standardDayHours * daysWorkedProportion
    return bonusHours * hourlyRate
  },
  
  [RULE_TYPES.PERCENTAGE_MONTHLY]: (rule) => rule.value,
  
  [RULE_TYPES.PERCENTAGE_BASE]: (rule) => rule.value,
  
  [RULE_TYPES.HOURLY_MULTIPLIER]: (rule, _, __, hourlyRate) => hourlyRate * rule.value
}

export const calculateRuleValue = (rule, employee, attendance, config) => {
  if (!appliesToEmployee(rule, employee)) return 0
  
  const hourlyRate = employee.dailySalary / config.workdayHours
  
  const actualDaysWorked = Object.values(attendance || {}).filter(dayData => 
    dayData && (
      (dayData.type === 'regular' && dayData.entryTime && dayData.exitTime) ||
      dayData.type === 'holiday'
    )
  ).length
  
  const expectedMonthDays = config.monthDays || 30
  const daysWorkedProportion = expectedMonthDays > 0 ? Math.min(actualDaysWorked / expectedMonthDays, 1.0) : 0
  
  const calculator = RULE_CALCULATORS[rule.type]
  return calculator ? calculator(rule, employee, attendance, hourlyRate, daysWorkedProportion) : 0
}

// ============================================================================
// RULE PROCESSING
// ============================================================================

export const applyRules = (employee, attendance, rules, config) => {
  const results = {
    bonuses: {},
    deductions: {}
  }
  
  // Calculate base salary first
  const dailyRate = employee.dailySalary
  const hourlyRate = employee.dailySalary / config.workdayHours
  
  // Count actual days with attendance data
  const actualDays = Object.values(attendance || {}).filter(dayData => 
    dayData && (
      (dayData.type === 'regular' && dayData.entryTime && dayData.exitTime) ||
      dayData.type === 'holiday'
    )
  ).length
  
  // Calculate total hours: actual days × 8 hours (standard day)
  // Each day counts as exactly 8 hours, regardless of actual entry/exit times
  const standardDayHours = 8
  const totalHours = actualDays * standardDayHours
  
  const baseSalary = totalHours * hourlyRate
  let grossSalary = baseSalary
  
  // If employee is jadid (new), skip all rules - only base salary applies
  if (employee.jadid) {
    return {
      baseSalary,
      bonuses: {},
      deductions: {},
      grossSalary,
      totalHours,
      actualDays
    }
  }
  
  // Sort rules by order
  const sortedRules = [...rules].sort((a, b) => a.order - b.order)
  
  // First pass: calculate bonuses and deductions (store deductions, don't subtract yet)
  sortedRules.forEach(rule => {
    if (!rule.enabled) return
    
    const value = calculateRuleValue(rule, employee, attendance, config)
    
    if (value > 0) {
      if (rule.category === RULE_CATEGORIES.BONUS) {
        if (rule.type === RULE_TYPES.PERCENTAGE_BASE) {
          // Store percentage for later application to base salary
          results.bonuses[rule.id] = { rule, value, percentage: true, percentageType: 'base' }
        } else {
          results.bonuses[rule.id] = { rule, value, percentage: false }
          grossSalary += value
        }
      } else if (rule.category === RULE_CATEGORIES.DEDUCTION) {
        if (rule.type === RULE_TYPES.PERCENTAGE_BASE) {
          // Store percentage for later application to base salary
          results.deductions[rule.id] = { rule, value, percentage: true, percentageType: 'base' }
        } else {
          // Store deduction but don't subtract from grossSalary yet
          results.deductions[rule.id] = { rule, value, percentage: false }
        }
      }
    }
  })
  
  // Second pass: apply percentage-based bonuses to base salary
  Object.values(results.bonuses).forEach(item => {
    if (item.percentage && item.percentageType === 'base') {
      const bonus = baseSalary * item.value
      item.finalValue = bonus
      grossSalary += bonus
    }
  })
  
  // Third pass: calculate percentage-based deductions (store but don't subtract)
  Object.values(results.deductions).forEach(item => {
    if (item.percentage && item.percentageType === 'base') {
      const deduction = baseSalary * item.value
      item.finalValue = deduction
    }
    // For PERCENTAGE_MONTHLY, the value is already calculated in calculateRuleValue
    // No need to recalculate, just ensure it's stored correctly
  })
  
  // Use the calculated grossSalary directly (it already includes base + all bonuses)
  // This ensures consistency with what we calculated above
  return {
    ...results,
    baseSalary,
    grossSalary: grossSalary,
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

export const getNextOrder = (rules) => {
  if (rules.length === 0) return 1
  return Math.max(...rules.map(r => r.order)) + 1
}

// ============================================================================
// MISSING FUNCTION (from core.js)
// ============================================================================

import { calculateWorkingHours } from './core.js'
