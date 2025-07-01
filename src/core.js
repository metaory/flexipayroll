/**
 * Business Logic Core for XPayroll
 * Contains all payroll rules, calculations, and business understanding
 */

// ============================================================================
// BUSINESS CONSTANTS & RULES
// ============================================================================

export const BUSINESS_RULES = {
  // Working hours configuration
  WORKDAY_HOURS: 8, // Including 1-hour lunch break
  WORKING_DAYS_PER_MONTH: 22, // Standard working days per month
  
  // Day types for attendance
  DAY_TYPES: {
    REGULAR: 'regular',      // Normal working day with entry/exit times
    HOLIDAY: 'holiday',      // Holiday with pay (8 hours)
    PAID_LEAVE: 'paid_leave', // Paid leave (8 hours)
    UNPAID_LEAVE: 'unpaid_leave' // Unpaid leave (0 hours)
  },
  
  // Employee attributes that affect calculations
  EMPLOYEE_ATTRIBUTES: {
    GENDER: ['male', 'female'],
    MARITAL_STATUS: ['single', 'married']
  }
}

// ============================================================================
// BONUS & DEDUCTION RULES
// ============================================================================

export const BONUS_RULES = {
  // Bonus E: 5 working days × Daily rate
  BONUS_E: {
    name: 'Bonus E',
    description: 'Additional bonus of 5 working days',
    calculation: (dailyRate) => dailyRate * 5,
    condition: () => true, // Applies to all employees
    type: 'daily_rate_multiplier'
  },
  
  // Bonus S: 2.5 working days × Daily rate
  BONUS_S: {
    name: 'Bonus S', 
    description: 'Additional bonus of 2.5 working days',
    calculation: (dailyRate) => dailyRate * 2.5,
    condition: () => true, // Applies to all employees
    type: 'daily_rate_multiplier'
  },
  
  // Bonus K: Fixed 14 million (global)
  BONUS_K: {
    name: 'Bonus K',
    description: 'Fixed additional bonus of 14 million',
    calculation: () => 14000000,
    condition: () => true, // Applies to all employees
    type: 'fixed_amount'
  },
  
  // Bonus M: Fixed 9 million (global)
  BONUS_M: {
    name: 'Bonus M',
    description: 'Fixed additional bonus of 9 million',
    calculation: () => 9000000,
    condition: () => true, // Applies to all employees
    type: 'fixed_amount'
  },
  
  // Bonus T: Fixed 5 million (married employees only)
  BONUS_T: {
    name: 'Bonus T',
    description: 'Fixed additional bonus of 5 million (married only)',
    calculation: () => 5000000,
    condition: (employee) => employee.maritalStatus === 'married',
    type: 'fixed_amount'
  }
}

export const DEDUCTION_RULES = {
  // Deduct I: 7% of total calculated salary (includes all bonuses)
  DEDUCT_I: {
    name: 'Insurance Deduction',
    description: 'Deduction of 7 percent of total calculated salary for insurance',
    calculation: (subtotal) => subtotal * 0.07,
    condition: () => true, // Applies to all employees
    type: 'percentage'
  }
}

// ============================================================================
// CORE CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate daily rate from monthly salary
 * @param {number} monthlySalary - Employee's monthly salary
 * @returns {number} Daily rate
 */
export const calculateDailyRate = (monthlySalary) => {
  return monthlySalary / BUSINESS_RULES.WORKING_DAYS_PER_MONTH
}

/**
 * Calculate hourly rate from monthly salary
 * @param {number} monthlySalary - Employee's monthly salary
 * @returns {number} Hourly rate
 */
export const calculateHourlyRate = (monthlySalary) => {
  const dailyRate = calculateDailyRate(monthlySalary)
  return dailyRate / BUSINESS_RULES.WORKDAY_HOURS
}

/**
 * Calculate working hours from entry and exit times
 * @param {string} entryTime - Entry time in HH:MM format
 * @param {string} exitTime - Exit time in HH:MM format
 * @returns {number} Working hours (rounded to 2 decimal places)
 */
export const calculateWorkingHours = (entryTime, exitTime) => {
  if (!entryTime || !exitTime) return 0

  const [entryHour, entryMin] = entryTime.split(':').map(Number)
  const [exitHour, exitMin] = exitTime.split(':').map(Number)

  const entryMinutes = entryHour * 60 + entryMin
  const exitMinutes = exitHour * 60 + exitMin

  // Calculate duration in hours, round to 2 decimal places
  return Math.round((exitMinutes - entryMinutes) / 60 * 100) / 100
}

/**
 * Calculate total hours and day counts from attendance data
 * @param {Object} attendanceData - Attendance records for a period
 * @returns {Object} Summary of hours and day counts
 */
export const calculateAttendanceSummary = (attendanceData) => {
  let totalHours = 0
  let totalRegularDays = 0
  let totalHolidays = 0
  let totalPaidLeave = 0
  let totalUnpaidLeave = 0

  for (const day of Object.values(attendanceData)) {
    switch (day.type) {
      case BUSINESS_RULES.DAY_TYPES.REGULAR:
        totalHours += calculateWorkingHours(day.entryTime, day.exitTime)
        totalRegularDays++
        break
      case BUSINESS_RULES.DAY_TYPES.HOLIDAY:
      case BUSINESS_RULES.DAY_TYPES.PAID_LEAVE:
        totalHours += BUSINESS_RULES.WORKDAY_HOURS
        day.type === BUSINESS_RULES.DAY_TYPES.HOLIDAY ? totalHolidays++ : totalPaidLeave++
        break
      case BUSINESS_RULES.DAY_TYPES.UNPAID_LEAVE:
        totalUnpaidLeave++
        break
    }
  }

  return {
    hours: totalHours,
    regularDays: totalRegularDays,
    holidays: totalHolidays,
    paidLeave: totalPaidLeave,
    unpaidLeave: totalUnpaidLeave,
    totalDays: Object.keys(attendanceData).length
  }
}

/**
 * Calculate basic salary based on hours worked
 * @param {number} monthlySalary - Employee's monthly salary
 * @param {number} totalHours - Total hours worked
 * @returns {number} Basic salary
 */
export const calculateBasicSalary = (monthlySalary, totalHours) => {
  const hourlyRate = calculateHourlyRate(monthlySalary)
  return hourlyRate * totalHours
}

// ============================================================================
// BONUS & DEDUCTION CALCULATIONS
// ============================================================================

/**
 * Calculate all applicable bonuses for an employee
 * @param {Object} employee - Employee data
 * @param {Object} config - Current configuration
 * @returns {Object} All bonus calculations
 */
export const calculateBonuses = (employee, config) => {
  const dailyRate = calculateDailyRate(employee.monthlySalary)
  const bonuses = {}

  // Calculate each bonus based on rules
  for (const [key, rule] of Object.entries(BONUS_RULES)) {
    if (rule.condition(employee)) {
      bonuses[key] = {
        name: rule.name,
        description: rule.description,
        amount: rule.calculation(dailyRate),
        type: rule.type
      }
    }
  }

  return bonuses
}

/**
 * Calculate all applicable deductions
 * @param {Object} employee - Employee data
 * @param {Object} config - Current configuration
 * @param {number} subtotal - Subtotal before deductions
 * @returns {Object} All deduction calculations
 */
export const calculateDeductions = (employee, config, subtotal) => {
  const deductions = {}

  for (const [key, rule] of Object.entries(DEDUCTION_RULES)) {
    if (rule.condition(employee)) {
      deductions[key] = {
        name: rule.name,
        description: rule.description,
        amount: rule.calculation(subtotal),
        type: rule.type
      }
    }
  }

  return deductions
}

// ============================================================================
// COMPLETE SALARY CALCULATION
// ============================================================================

/**
 * Calculate complete salary breakdown for an employee
 * @param {Object} employee - Employee data
 * @param {Object} attendanceData - Attendance records for the period
 * @param {Object} config - Current configuration
 * @param {Array} adjustments - Manual adjustments
 * @returns {Object} Complete salary breakdown
 */
export const calculateCompleteSalary = (employee, attendanceData, config, adjustments = []) => {
  // Step 1: Calculate attendance summary
  const attendanceSummary = calculateAttendanceSummary(attendanceData)
  
  // Step 2: Calculate basic salary
  const basicSalary = calculateBasicSalary(employee.monthlySalary, attendanceSummary.hours)
  
  // Step 3: Calculate bonuses
  const bonuses = calculateBonuses(employee, config)
  const bonusTotal = Object.values(bonuses).reduce((sum, bonus) => sum + bonus.amount, 0)
  
  // Step 4: Calculate adjustment total
  const adjustmentTotal = adjustments.reduce((sum, adj) => sum + adj.amount, 0)
  
  // Step 5: Calculate subtotal before deductions
  const subtotal = basicSalary + bonusTotal + adjustmentTotal
  
  // Step 6: Calculate deductions
  const deductions = calculateDeductions(employee, config, subtotal)
  const deductionTotal = Object.values(deductions).reduce((sum, deduction) => sum + deduction.amount, 0)
  
  // Step 7: Calculate final total
  const total = subtotal - deductionTotal

  return {
    employeeId: employee.id,
    employeeName: employee.name,
    period: {
      startDate: Object.keys(attendanceData).sort()[0],
      endDate: Object.keys(attendanceData).sort().pop(),
      ...attendanceSummary
    },
    components: {
      basicSalary,
      bonuses,
      bonusTotal,
      adjustments,
      adjustmentTotal,
      deductions,
      deductionTotal
    },
    summary: {
      subtotal,
      total,
      calculatedAt: new Date().toISOString()
    }
  }
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

export const VALIDATION_RULES = {
  /**
   * Validate employee data
   * @param {Object} employee - Employee data to validate
   * @returns {Object} Validation result
   */
  validateEmployee: (employee) => {
    const errors = []
    
    if (!employee.name || employee.name.trim().length < 2) {
      errors.push('Employee name must be at least 2 characters')
    }
    
    if (!BUSINESS_RULES.EMPLOYEE_ATTRIBUTES.GENDER.includes(employee.gender)) {
      errors.push('Invalid gender selection')
    }
    
    if (!BUSINESS_RULES.EMPLOYEE_ATTRIBUTES.MARITAL_STATUS.includes(employee.maritalStatus)) {
      errors.push('Invalid marital status selection')
    }
    
    if (!employee.monthlySalary || employee.monthlySalary <= 0) {
      errors.push('Monthly salary must be greater than 0')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  },

  /**
   * Validate attendance data
   * @param {Object} attendance - Attendance data to validate
   * @returns {Object} Validation result
   */
  validateAttendance: (attendance) => {
    const errors = []
    
    if (!attendance.type || !Object.values(BUSINESS_RULES.DAY_TYPES).includes(attendance.type)) {
      errors.push('Invalid day type')
    }
    
    if (attendance.type === BUSINESS_RULES.DAY_TYPES.REGULAR) {
      if (!attendance.entryTime || !attendance.exitTime) {
        errors.push('Entry and exit times required for regular days')
      } else {
        const hours = calculateWorkingHours(attendance.entryTime, attendance.exitTime)
        if (hours < 0) {
          errors.push('Exit time must be after entry time')
        }
        if (hours > 24) {
          errors.push('Working hours cannot exceed 24 hours')
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  },

  /**
   * Validate configuration
   * @param {Object} config - Configuration to validate
   * @returns {Object} Validation result
   */
  validateConfig: (config) => {
    const errors = []
    
    if (config.workdayHours <= 0 || config.workdayHours > 24) {
      errors.push('Workday hours must be between 0 and 24')
    }
    
    if (config.bonusE < 0) errors.push('Bonus E cannot be negative')
    if (config.bonusS < 0) errors.push('Bonus S cannot be negative')
    if (config.bonusK < 0) errors.push('Bonus K cannot be negative')
    if (config.bonusM < 0) errors.push('Bonus M cannot be negative')
    if (config.bonusT < 0) errors.push('Bonus T cannot be negative')
    
    if (config.deductI < 0 || config.deductI > 1) {
      errors.push('Insurance deduction must be between 0 and 1 (0% to 100%)')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get default configuration values
 * @returns {Object} Default configuration
 */
export const getDefaultConfig = () => ({
  workdayHours: BUSINESS_RULES.WORKDAY_HOURS,
  bonusE: 5,
  bonusS: 2.5,
  bonusK: 14000000,
  bonusM: 9000000,
  bonusT: 5000000,
  deductI: 0.07
})

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Format time for display
 * @param {string} time - Time in HH:MM format
 * @returns {string} Formatted time string
 */
export const formatTime = (time) => {
  if (!time) return ''
  const [hours, minutes] = time.split(':')
  return `${hours}:${minutes}`
} 