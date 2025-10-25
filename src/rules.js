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
  PERCENTAGE: 'percentage',
  HOURLY_MULTIPLIER: 'hourly_multiplier'
}

export const RULE_CATEGORIES = {
  BONUS: 'bonus',
  DEDUCTION: 'deduction'
}

export const CRITERIA_TYPES = {
  ALL: 'all',
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
    criteria: { appliesTo: [CRITERIA_TYPES.ALL] },
    category: RULE_CATEGORIES.BONUS,
    order: 1,
    enabled: true
  },
  {
    id: 'insurance',
    label: 'Insurance Deduction',
    type: RULE_TYPES.PERCENTAGE,
    value: 0.07,
    criteria: { appliesTo: [CRITERIA_TYPES.ALL] },
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
  const errors = {}
  
  if (!rule.id || rule.id.length < 2) {
    errors.id = 'Rule ID must be at least 2 characters'
  }
  
  if (!rule.label || rule.label.length < 2) {
    errors.label = 'Rule label must be at least 2 characters'
  }
  
  if (!Object.values(RULE_TYPES).includes(rule.type)) {
    errors.type = 'Invalid rule type'
  }
  
  if (typeof rule.value !== 'number' || rule.value < 0) {
    errors.value = 'Value must be a positive number'
  }
  
  if (!rule.criteria || !rule.criteria.appliesTo || !Array.isArray(rule.criteria.appliesTo)) {
    errors.criteria = 'Criteria must specify appliesTo as an array'
  }
  
  if (rule.criteria.appliesTo.length === 0) {
    errors.criteria = 'At least one criteria must be selected'
  }
  
  if (!rule.criteria.appliesTo.every(criteria => Object.values(CRITERIA_TYPES).includes(criteria))) {
    errors.criteria = 'Invalid criteria type in array'
  }
  
  if (!Object.values(RULE_CATEGORIES).includes(rule.category)) {
    errors.category = 'Invalid category'
  }
  
  if (typeof rule.order !== 'number' || rule.order < 0) {
    errors.order = 'Order must be a positive number'
  }
  
  return Object.keys(errors).length === 0 ? null : errors
}

// ============================================================================
// RULE APPLICATION
// ============================================================================

export const appliesToEmployee = (rule, employee) => {
  const { appliesTo } = rule.criteria
  
  // If 'all' is selected, always applies
  if (appliesTo.includes(CRITERIA_TYPES.ALL)) {
    return true
  }
  
  // Check if employee matches ANY of the selected criteria (OR logic)
  return appliesTo.some(criteria => {
    switch (criteria) {
      case CRITERIA_TYPES.MARRIED:
        return employee.maritalStatus === 'married'
      case CRITERIA_TYPES.SINGLE:
        return employee.maritalStatus === 'single'
      case CRITERIA_TYPES.MALE:
        return employee.gender === 'male'
      case CRITERIA_TYPES.FEMALE:
        return employee.gender === 'female'
      case CRITERIA_TYPES.CUSTOM:
        // For now, custom conditions not implemented
        return false
      default:
        return false
    }
  })
}

export const calculateRuleValue = (rule, employee, attendance, config) => {
  if (!appliesToEmployee(rule, employee)) {
    return 0
  }
  
  const dailyRate = employee.monthlySalary / config.workingDaysPerMonth
  const hourlyRate = dailyRate / config.workdayHours
  
  switch (rule.type) {
    case RULE_TYPES.FIXED:
      return rule.value
      
    case RULE_TYPES.DAYS_MULTIPLIER:
      return dailyRate * rule.value
      
    case RULE_TYPES.PERCENTAGE:
      // This will be applied to gross salary later
      return rule.value
      
    case RULE_TYPES.HOURLY_MULTIPLIER:
      const totalHours = Object.values(attendance || {}).reduce((sum, dayData) => {
        if (dayData.type === 'regular' && dayData.entryTime && dayData.exitTime) {
          return sum + calculateWorkingHours(dayData.entryTime, dayData.exitTime)
        }
        if (dayData.type === 'holiday') {
          return sum + config.workdayHours
        }
        return sum
      }, 0)
      return hourlyRate * rule.value * totalHours
      
    default:
      return 0
  }
}

// ============================================================================
// RULE PROCESSING
// ============================================================================

export const applyRules = (employee, attendance, rules, config) => {
  const results = {
    bonuses: {},
    deductions: {}
  }
  
  // Sort rules by order
  const sortedRules = [...rules].sort((a, b) => a.order - b.order)
  
  let grossSalary = 0
  
  // First pass: calculate bonuses and deductions
  sortedRules.forEach(rule => {
    if (!rule.enabled) return
    
    const value = calculateRuleValue(rule, employee, attendance, config)
    
    if (value > 0) {
      if (rule.category === RULE_CATEGORIES.BONUS) {
        if (rule.type === RULE_TYPES.PERCENTAGE) {
          // Store percentage for later application to gross
          results.bonuses[rule.id] = { rule, value, percentage: true }
        } else {
          results.bonuses[rule.id] = { rule, value, percentage: false }
          grossSalary += value
        }
      } else if (rule.category === RULE_CATEGORIES.DEDUCTION) {
        if (rule.type === RULE_TYPES.PERCENTAGE) {
          // Store percentage for later application to gross
          results.deductions[rule.id] = { rule, value, percentage: true }
        } else {
          results.deductions[rule.id] = { rule, value, percentage: false }
          grossSalary -= value
        }
      }
    }
  })
  
  // Second pass: apply percentage-based bonuses to gross salary
  Object.values(results.bonuses).forEach(item => {
    if (item.percentage) {
      const bonus = grossSalary * item.value
      item.finalValue = bonus
      grossSalary += bonus
    }
  })
  
  // Third pass: apply percentage-based deductions to gross salary
  Object.values(results.deductions).forEach(item => {
    if (item.percentage) {
      const deduction = grossSalary * item.value
      item.finalValue = deduction
      grossSalary -= deduction
    }
  })
  
  return {
    ...results,
    grossSalary,
    finalSalary: grossSalary
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

const calculateWorkingHours = (entryTime, exitTime) => {
  if (!entryTime || !exitTime) return 0
  
  const entry = new Date(`1970-01-01T${entryTime}:00`)
  const exit = new Date(`1970-01-01T${exitTime}:00`)
  
  if (exit <= entry) return 0
  
  const diffMs = exit - entry
  return diffMs / (1000 * 60 * 60) // Convert to hours
}
