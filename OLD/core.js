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
// PURE FUNCTIONS - CORE CALCULATIONS
// ============================================================================

export const calculateDailyRate = (monthlySalary, workingDays = DEFAULT_CONFIG.workingDaysPerMonth) =>
  monthlySalary / workingDays

export const calculateHourlyRate = (monthlySalary, config = DEFAULT_CONFIG) =>
  calculateDailyRate(monthlySalary, config.workingDaysPerMonth) / config.workdayHours

export const calculateWorkingHours = (entryTime, exitTime) => {
  if (!entryTime || !exitTime) return 0
  const [entryHour, entryMin] = entryTime.split(':').map(Number)
  const [exitHour, exitMin] = exitTime.split(':').map(Number)
  const duration = (exitHour * 60 + exitMin) - (entryHour * 60 + entryMin)
  return Math.round((duration / 60) * 100) / 100
}

// ============================================================================
// PURE FUNCTIONS - ATTENDANCE & SALARY CALCULATIONS
// ============================================================================

export const calculateAttendanceSummary = (attendanceData, config = DEFAULT_CONFIG) => {
  const processedDays = Object.entries(attendanceData).map(([date, dayData]) => {
    const dayType = config.dayTypes[dayData.type]
    const hours = dayType?.hours === 'calculated' 
      ? calculateWorkingHours(dayData.entryTime, dayData.exitTime)
      : dayType?.hours || 0
    
    return { date, type: dayData.type, hours }
  })
  
  return processedDays.reduce((summary, day) => ({
    hours: summary.hours + day.hours,
    days: summary.days + 1,
    byType: { ...summary.byType, [day.type]: (summary.byType[day.type] || 0) + 1 }
  }), { hours: 0, days: 0, byType: {} })
}

export const calculateSalaryBreakdown = (employee, attendanceData, adjustments = [], config = DEFAULT_CONFIG) => {
  const attendanceSummary = calculateAttendanceSummary(attendanceData, config)
  const basicSalary = calculateHourlyRate(employee.monthlySalary, config) * attendanceSummary.hours
  const dailyRate = calculateDailyRate(employee.monthlySalary, config.workingDaysPerMonth)
  
  // Calculate bonuses
  const bonusE = config.bonuses.E.condition?.(employee) !== false ? (config.bonuses.E.type === 'daily_rate_multiplier' ? dailyRate * config.bonuses.E.value : config.bonuses.E.value) : 0
  const bonusS = config.bonuses.S.condition?.(employee) !== false ? (config.bonuses.S.type === 'daily_rate_multiplier' ? dailyRate * config.bonuses.S.value : config.bonuses.S.value) : 0
  const bonusK = config.bonuses.K.condition?.(employee) !== false ? (config.bonuses.K.type === 'daily_rate_multiplier' ? dailyRate * config.bonuses.K.value : config.bonuses.K.value) : 0
  const bonusM = config.bonuses.M.condition?.(employee) !== false ? (config.bonuses.M.type === 'daily_rate_multiplier' ? dailyRate * config.bonuses.M.value : config.bonuses.M.value) : 0
  const bonusT = config.bonuses.T.condition?.(employee) !== false ? (config.bonuses.T.type === 'daily_rate_multiplier' ? dailyRate * config.bonuses.T.value : config.bonuses.T.value) : 0
  
  const bonusTotal = bonusE + bonusS + bonusK + bonusM + bonusT
  const adjustmentTotal = adjustments.reduce((sum, adj) => sum + adj.amount, 0)
  const subtotal = basicSalary + bonusTotal + adjustmentTotal
  const insuranceDeduction = subtotal * config.deductions.insurance.value
  const total = subtotal - insuranceDeduction
  
  return {
    components: {
      basicSalary,
      bonusE, bonusS, bonusK, bonusM, bonusT,
      adjustments,
      adjustmentTotal,
      insuranceDeduction
    },
    period: {
      workdays: attendanceSummary.days,
      hours: attendanceSummary.hours,
      ...attendanceSummary.byType
    },
    subtotal,
    total
  }
}

// ============================================================================
// PURE FUNCTIONS - VALIDATION
// ============================================================================

export const validateEmployee = (employee) => {
  const validations = [
    { test: () => employee.name?.trim().length >= 2, message: 'Name must be at least 2 characters' },
    { test: () => ['male', 'female'].includes(employee.gender), message: 'Invalid gender' },
    { test: () => ['single', 'married'].includes(employee.maritalStatus), message: 'Invalid marital status' },
    { test: () => employee.monthlySalary > 0, message: 'Monthly salary must be greater than 0' }
  ]
  
  const errors = validations.filter(v => !v.test()).map(v => v.message)
  return { isValid: errors.length === 0, errors }
}

export const validateAttendance = (attendance, config = DEFAULT_CONFIG) => {
  const validations = [
    { test: () => Object.keys(config.dayTypes).includes(attendance.type), message: 'Invalid day type' },
    { test: () => attendance.type !== 'regular' || (attendance.entryTime && attendance.exitTime), message: 'Entry and exit times required for regular days' },
    { test: () => attendance.type !== 'regular' || calculateWorkingHours(attendance.entryTime, attendance.exitTime) >= 0, message: 'Exit time must be after entry time' }
  ]
  
  const errors = validations.filter(v => !v.test()).map(v => v.message)
  return { isValid: errors.length === 0, errors }
}

// ============================================================================
// CONSUMER-FRIENDLY EXPORTS
// ============================================================================

export const DAY_TYPES = {
  REGULAR: 'regular',
  HOLIDAY: 'holiday', 
  PAID_LEAVE: 'paid_leave',
  UNPAID_LEAVE: 'unpaid_leave'
}

export const EMPLOYEE_ATTRIBUTES = {
  GENDER: ['male', 'female'],
  MARITAL_STATUS: ['single', 'married']
}

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)

export const calculateSalary = (employee, attendanceData, adjustments = [], configOverride = null) => {
  const finalConfig = configOverride || DEFAULT_CONFIG
  return calculateSalaryBreakdown(employee, attendanceData, adjustments, finalConfig)
} 