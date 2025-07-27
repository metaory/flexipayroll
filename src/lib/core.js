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

const processDay = (dayData, config) => {
  const dayType = config.dayTypes[dayData.type]
  const hours = dayType?.hours === 'calculated' 
    ? calculateWorkingHours(dayData.entryTime, dayData.exitTime)
    : dayType?.hours || 0
  
  return { type: dayData.type, hours }
}

export const calculateAttendanceSummary = (attendanceData, config = DEFAULT_CONFIG) => {
  const processedDays = Object.entries(attendanceData).map(([date, dayData]) => ({
    date,
    ...processDay(dayData, config)
  }))
  
  return processedDays.reduce((summary, day) => ({
    hours: summary.hours + day.hours,
    days: summary.days + 1,
    byType: { ...summary.byType, [day.type]: (summary.byType[day.type] || 0) + 1 }
  }), { hours: 0, days: 0, byType: {} })
}

const calculateBonus = (bonus, employee, dailyRate) => {
  const isEligible = bonus.condition ? bonus.condition(employee) : true
  if (!isEligible) return 0
  
  return bonus.type === 'daily_rate_multiplier' 
    ? dailyRate * bonus.value 
    : bonus.value
}

export const calculateSalaryBreakdown = (employee, attendanceData, adjustments = [], config = DEFAULT_CONFIG) => {
  const attendanceSummary = calculateAttendanceSummary(attendanceData, config)
  const basicSalary = calculateHourlyRate(employee.monthlySalary, config) * attendanceSummary.hours
  const dailyRate = calculateDailyRate(employee.monthlySalary, config.workingDaysPerMonth)
  
  const bonuses = Object.entries(config.bonuses).map(([key, bonus]) => ({
    key,
    amount: calculateBonus(bonus, employee, dailyRate)
  }))
  
  const bonusTotal = bonuses.reduce((sum, { amount }) => sum + amount, 0)
  const adjustmentTotal = adjustments.reduce((sum, adj) => sum + adj.amount, 0)
  const subtotal = basicSalary + bonusTotal + adjustmentTotal
  const insuranceDeduction = subtotal * config.deductions.insurance.value
  const total = subtotal - insuranceDeduction
  
  const bonusComponents = bonuses.reduce((acc, { key, amount }) => ({
    ...acc,
    [`bonus${key}`]: amount
  }), {})
  
  return {
    components: {
      basicSalary,
      ...bonusComponents,
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

const validations = {
  employee: [
    { test: emp => emp.name?.trim().length >= 2, message: 'Name must be at least 2 characters' },
    { test: emp => ['male', 'female'].includes(emp.gender), message: 'Invalid gender' },
    { test: emp => ['single', 'married'].includes(emp.maritalStatus), message: 'Invalid marital status' },
    { test: emp => emp.monthlySalary > 0, message: 'Monthly salary must be greater than 0' }
  ],
  attendance: (config) => [
    { test: att => Object.keys(config.dayTypes).includes(att.type), message: 'Invalid day type' },
    { test: att => att.type !== 'regular' || (att.entryTime && att.exitTime), message: 'Entry and exit times required for regular days' },
    { test: att => att.type !== 'regular' || calculateWorkingHours(att.entryTime, att.exitTime) >= 0, message: 'Exit time must be after entry time' }
  ]
}

const runValidations = (validations, data) => {
  const errors = validations.filter(v => !v.test(data)).map(v => v.message)
  return { isValid: errors.length === 0, errors }
}

export const validateEmployee = (employee) => runValidations(validations.employee, employee)

export const validateAttendance = (attendance, config = DEFAULT_CONFIG) => 
  runValidations(validations.attendance(config), attendance)

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