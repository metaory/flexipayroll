/**
 * Business Logic Core for XPayroll
 * Functional, composable, and declarative payroll calculations
 */

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

export const DEFAULT_CONFIG = {
  workdayHours: 8,
  workingDaysPerMonth: 22,
  dayTypes: {
    regular: { hours: 'calculated', label: 'Regular Work Day' },
    holiday: { hours: 8, label: 'Holiday' },
    paid_leave: { hours: 8, label: 'Paid Leave' },
    unpaid_leave: { hours: 0, label: 'Unpaid Leave' }
  },
  bonuses: {
    E: { type: 'daily_rate_multiplier', value: 5, label: 'Bonus E' },
    S: { type: 'daily_rate_multiplier', value: 2.5, label: 'Bonus S' },
    K: { type: 'fixed_amount', value: 14000000, label: 'Bonus K' },
    M: { type: 'fixed_amount', value: 9000000, label: 'Bonus M' },
    T: { type: 'fixed_amount', value: 5000000, label: 'Bonus T', condition: emp => emp.maritalStatus === 'married' }
  },
  deductions: {
    insurance: { type: 'percentage', value: 0.07, label: 'Insurance Deduction' }
  }
}

// ============================================================================
// PURE FUNCTIONS - RATE CALCULATIONS
// ============================================================================

export const calculateDailyRate = (monthlySalary, workingDays = DEFAULT_CONFIG.workingDaysPerMonth) =>
  monthlySalary / workingDays

export const calculateHourlyRate = (monthlySalary, config = DEFAULT_CONFIG) =>
  calculateDailyRate(monthlySalary, config.workingDaysPerMonth) / config.workdayHours

// ============================================================================
// PURE FUNCTIONS - TIME CALCULATIONS
// ============================================================================

export const parseTime = time => time?.split(':').map(Number) || [0, 0]

export const timeToMinutes = time => {
  const [hours, minutes] = parseTime(time)
  return hours * 60 + minutes
}

export const calculateWorkingHours = (entryTime, exitTime) => {
  if (!entryTime || !exitTime) return 0
  const duration = timeToMinutes(exitTime) - timeToMinutes(entryTime)
  return Math.round((duration / 60) * 100) / 100
}

// ============================================================================
// PURE FUNCTIONS - ATTENDANCE PROCESSING
// ============================================================================

export const getDayHours = (dayData, config = DEFAULT_CONFIG) => {
  const dayType = config.dayTypes[dayData.type]
  return dayType?.hours === 'calculated' 
    ? calculateWorkingHours(dayData.entryTime, dayData.exitTime)
    : dayType?.hours || 0
}

export const processAttendanceDay = (dayData, config = DEFAULT_CONFIG) => ({
  type: dayData.type,
  hours: getDayHours(dayData, config),
  entryTime: dayData.entryTime,
  exitTime: dayData.exitTime,
  notes: dayData.notes
})

export const processAttendanceData = (attendanceData, config = DEFAULT_CONFIG) =>
  Object.entries(attendanceData).map(([date, dayData]) => ({
    date,
    ...processAttendanceDay(dayData, config)
  }))

export const countDayType = (summary, dayType) => {
  const newByType = Object.assign({}, summary.byType)
  newByType[dayType] = (newByType[dayType] || 0) + 1
  return newByType
}

export const aggregateDayStats = (summary, day) => ({
  hours: summary.hours + day.hours,
  days: summary.days + 1,
  byType: countDayType(summary, day.type)
})

export const calculateAttendanceSummary = (attendanceData, config = DEFAULT_CONFIG) => {
  const processedDays = processAttendanceData(attendanceData, config)
  return processedDays.reduce(aggregateDayStats, { hours: 0, days: 0, byType: {} })
}

// ============================================================================
// PURE FUNCTIONS - SALARY COMPONENTS
// ============================================================================

export const calculateBasicSalary = (monthlySalary, totalHours, config = DEFAULT_CONFIG) =>
  calculateHourlyRate(monthlySalary, config) * totalHours

export const isBonusApplicable = (bonus, employee) =>
  bonus && (!bonus.condition || bonus.condition(employee))

export const calculateBonusAmount = (bonus, dailyRate) =>
  bonus.type === 'daily_rate_multiplier' ? dailyRate * bonus.value : bonus.value

export const calculateBonus = (bonusKey, employee, config = DEFAULT_CONFIG) => {
  const bonus = config.bonuses[bonusKey]
  if (!isBonusApplicable(bonus, employee)) return 0
  
  const dailyRate = calculateDailyRate(employee.monthlySalary, config.workingDaysPerMonth)
  return calculateBonusAmount(bonus, dailyRate)
}

export const calculateAllBonuses = (employee, config = DEFAULT_CONFIG) =>
  Object.keys(config.bonuses).reduce((bonuses, key) => {
    bonuses[key] = {
      amount: calculateBonus(key, employee, config),
      label: config.bonuses[key].label
    }
    return bonuses
  }, {})

export const calculateDeduction = (deductionKey, subtotal, config = DEFAULT_CONFIG) => {
  const deduction = config.deductions[deductionKey]
  return deduction ? subtotal * deduction.value : 0
}

export const calculateAllDeductions = (subtotal, config = DEFAULT_CONFIG) =>
  Object.keys(config.deductions).reduce((deductions, key) => {
    deductions[key] = {
      amount: calculateDeduction(key, subtotal, config),
      label: config.deductions[key].label
    }
    return deductions
  }, {})

// ============================================================================
// PURE FUNCTIONS - SALARY CALCULATION STEPS
// ============================================================================

export const sumBonusTotal = (bonuses) =>
  Object.values(bonuses).reduce((sum, bonus) => sum + bonus.amount, 0)

export const sumAdjustmentTotal = (adjustments) =>
  adjustments.reduce((sum, adj) => sum + adj.amount, 0)

export const sumDeductionTotal = (deductions) =>
  Object.values(deductions).reduce((sum, deduction) => sum + deduction.amount, 0)

export const calculateSubtotal = (basicSalary, bonusTotal, adjustmentTotal) =>
  basicSalary + bonusTotal + adjustmentTotal

export const calculateFinalTotal = (subtotal, deductionTotal) =>
  subtotal - deductionTotal

// ============================================================================
// PURE FUNCTIONS - COMPLETE CALCULATION
// ============================================================================

export const calculateSalaryBreakdown = (employee, attendanceData, adjustments = [], config = DEFAULT_CONFIG) => {
  const attendanceSummary = calculateAttendanceSummary(attendanceData, config)
  const basicSalary = calculateBasicSalary(employee.monthlySalary, attendanceSummary.hours, config)
  const bonuses = calculateAllBonuses(employee, config)
  const bonusTotal = sumBonusTotal(bonuses)
  const adjustmentTotal = sumAdjustmentTotal(adjustments)
  const subtotal = calculateSubtotal(basicSalary, bonusTotal, adjustmentTotal)
  const deductions = calculateAllDeductions(subtotal, config)
  const deductionTotal = sumDeductionTotal(deductions)
  const total = calculateFinalTotal(subtotal, deductionTotal)
  
  return {
    basicSalary,
    bonuses,
    bonusTotal,
    adjustments,
    adjustmentTotal,
    deductions,
    deductionTotal,
    subtotal,
    total,
    attendanceSummary
  }
}

// ============================================================================
// PURE FUNCTIONS - VALIDATION HELPERS
// ============================================================================

export const runValidations = (validations) => {
  const errors = validations
    .filter(validation => !validation.test())
    .map(validation => validation.message)
  
  return { isValid: errors.length === 0, errors }
}

export const validateName = (name) => name?.trim().length >= 2

export const validateGender = (gender) => ['male', 'female'].includes(gender)

export const validateMaritalStatus = (maritalStatus) => ['single', 'married'].includes(maritalStatus)

export const validateSalary = (salary) => salary > 0

export const validateDayType = (type, config) => Object.keys(config.dayTypes).includes(type)

export const validateRegularDayTimes = (type, entryTime, exitTime) =>
  type !== 'regular' || (entryTime && exitTime)

export const validateTimeSequence = (type, entryTime, exitTime) =>
  type !== 'regular' || calculateWorkingHours(entryTime, exitTime) >= 0

// ============================================================================
// PURE FUNCTIONS - VALIDATION
// ============================================================================

export const validateEmployee = (employee) => {
  const validations = [
    { test: () => validateName(employee.name), message: 'Name must be at least 2 characters' },
    { test: () => validateGender(employee.gender), message: 'Invalid gender' },
    { test: () => validateMaritalStatus(employee.maritalStatus), message: 'Invalid marital status' },
    { test: () => validateSalary(employee.monthlySalary), message: 'Monthly salary must be greater than 0' }
  ]
  
  return runValidations(validations)
}

export const validateAttendance = (attendance, config = DEFAULT_CONFIG) => {
  const validations = [
    { test: () => validateDayType(attendance.type, config), message: 'Invalid day type' },
    { 
      test: () => validateRegularDayTimes(attendance.type, attendance.entryTime, attendance.exitTime),
      message: 'Entry and exit times required for regular days'
    },
    {
      test: () => validateTimeSequence(attendance.type, attendance.entryTime, attendance.exitTime),
      message: 'Exit time must be after entry time'
    }
  ]
  
  return runValidations(validations)
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)

export const formatTime = (time) => time || ''

export const mergeConfig = (baseConfig, overrides) => ({
  ...baseConfig,
  ...overrides,
  dayTypes: { ...baseConfig.dayTypes, ...overrides.dayTypes },
  bonuses: { ...baseConfig.bonuses, ...overrides.bonuses },
  deductions: { ...baseConfig.deductions, ...overrides.deductions }
})

// ============================================================================
// LEGACY EXPORTS FOR BACKWARD COMPATIBILITY
// ============================================================================

export const BUSINESS_RULES = {
  WORKDAY_HOURS: DEFAULT_CONFIG.workdayHours,
  WORKING_DAYS_PER_MONTH: DEFAULT_CONFIG.workingDaysPerMonth,
  DAY_TYPES: Object.keys(DEFAULT_CONFIG.dayTypes).reduce((types, key) => {
    types[key.toUpperCase()] = key
    return types
  }, {}),
  EMPLOYEE_ATTRIBUTES: {
    GENDER: ['male', 'female'],
    MARITAL_STATUS: ['single', 'married']
  }
}

export const BONUS_RULES = Object.entries(DEFAULT_CONFIG.bonuses).reduce((rules, [key, bonus]) => {
  rules[`BONUS_${key}`] = {
    name: bonus.label,
    description: `${bonus.label} calculation`,
    calculation: bonus.type === 'daily_rate_multiplier' 
      ? (dailyRate) => dailyRate * bonus.value
      : () => bonus.value,
    condition: bonus.condition || (() => true),
    type: bonus.type
  }
  return rules
}, {})

export const DEDUCTION_RULES = Object.entries(DEFAULT_CONFIG.deductions).reduce((rules, [key, deduction]) => {
  rules[`DEDUCT_${key.toUpperCase()}`] = {
    name: deduction.label,
    description: `${deduction.label} calculation`,
    calculation: (subtotal) => subtotal * deduction.value,
    condition: () => true,
    type: deduction.type
  }
  return rules
}, {})

export const VALIDATION_RULES = {
  validateEmployee,
  validateAttendance,
  validateConfig: (config) => ({ isValid: true, errors: [] })
}

export const getDefaultConfig = () => ({ ...DEFAULT_CONFIG })

// Legacy function names for backward compatibility
export const calculateCompleteSalary = calculateSalaryBreakdown 