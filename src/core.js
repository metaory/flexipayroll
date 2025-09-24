/**
 * Core business logic and utilities
 * Clean, functional, dynamic approach
 */

import { t } from './lib/i18n.js'

// ============================================================================
// CONSTANTS
// ============================================================================

export const EMPLOYEE_ATTRIBUTES = {
  GENDER: ['male', 'female'],
  MARITAL_STATUS: ['single', 'married']
}

export const DAY_TYPES = {
  REGULAR: 'regular',
  HOLIDAY: 'holiday', 
  SICK: 'sick',
  LEAVE: 'leave',
  ABSENT: 'absent'
}

export const DEFAULT_CONFIG = {
  workdayHours: 8,
  workingDaysPerMonth: 22,
  bonusE: 5,
  bonusS: 2.5,
  bonusK: 100000,
  bonusM: 200000,
  bonusT: 150000,
  insuranceRate: 0.07
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export const validateEmployee = (data) => {
  const errors = {}
  
  if (!data.name || data.name.length < 2) {
    errors.name = t.nameRequired
  }
  
  if (!data.monthlySalary || data.monthlySalary <= 0) {
    errors.monthlySalary = t.salaryRequired
  }
  
  if (!['male', 'female'].includes(data.gender)) {
    errors.gender = t.invalidGender
  }
  
  if (!['single', 'married'].includes(data.maritalStatus)) {
    errors.maritalStatus = t.invalidMaritalStatus
  }
  
  return Object.keys(errors).length === 0 ? null : errors
}

export const validateAttendance = (data) => {
  const errors = {}
  
  if (data.type === 'regular' && (!data.entryTime || !data.exitTime)) {
    errors.entryExitTimes = t.entryExitRequired
  }
  
  if (data.entryTime && data.exitTime && data.exitTime <= data.entryTime) {
    errors.timeOrder = t.exitAfterEntry
  }
  
  return Object.keys(errors).length === 0 ? null : errors
}

// ============================================================================
// CALCULATION UTILITIES
// ============================================================================

export const calculateDailyRate = (monthlySalary, workingDaysPerMonth = 22) => 
  monthlySalary / workingDaysPerMonth

export const calculateHourlyRate = (dailyRate, workdayHours = 8) => 
  dailyRate / workdayHours

export const calculateBaseSalary = (hoursWorked, hourlyRate) => 
  hoursWorked * hourlyRate

export const calculateBonuses = (employee, config) => {
  const dailyRate = calculateDailyRate(employee.monthlySalary, config.workingDaysPerMonth)
  
  return {
    bonusE: dailyRate * config.bonusE,
    bonusS: dailyRate * config.bonusS,
    bonusK: config.bonusK,
    bonusM: config.bonusM,
    bonusT: employee.maritalStatus === 'married' ? config.bonusT : 0
  }
}

export const calculateDeductions = (grossSalary, insuranceRate = 0.07) => ({
  insurance: grossSalary * insuranceRate
})

export const calculateFinalSalary = (baseSalary, bonuses, deductions, adjustments = 0) => {
  const grossSalary = baseSalary + Object.values(bonuses).reduce((sum, bonus) => sum + bonus, 0) + adjustments
  const totalDeductions = Object.values(deductions).reduce((sum, deduction) => sum + deduction, 0)
  
  return {
    grossSalary,
    totalDeductions,
    finalSalary: grossSalary - totalDeductions
  }
}

// ============================================================================
// ATTENDANCE UTILITIES
// ============================================================================

export const calculateHours = (entryTime, exitTime) => {
  if (!entryTime || !exitTime) return 0
  
  const entry = new Date(`2000-01-01 ${entryTime}`)
  const exit = new Date(`2000-01-01 ${exitTime}`)
  
  if (exit <= entry) return 0
  
  return (exit - entry) / (1000 * 60 * 60) // Convert ms to hours
}

export const getDefaultHours = (dayType, workdayHours = 8) => {
  const hourMap = {
    regular: 0, // Calculated from entry/exit
    holiday: workdayHours,
    paidLeave: workdayHours,
    unpaidLeave: 0,
    overtime: 0
  }
  
  return hourMap[dayType] || 0
}

// ============================================================================
// FORMAT UTILITIES
// ============================================================================

export const formatCurrency = (amount, locale = 'id-ID', currency = 'IDR') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export const formatHours = (hours) => {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export const formatDate = (date, locale = 'en-US') => {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export const formatTime = (time) => {
  if (!time) return ''
  return time.substring(0, 5) // HH:MM format
}

// ============================================================================
// PERIOD UTILITIES
// ============================================================================

export const getCurrentPeriod = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export const formatPeriod = (period) => {
  const [year, month] = period.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  })
}

export const getDaysInMonth = (period) => {
  const [year, month] = period.split('-')
  return new Date(parseInt(year), parseInt(month), 0).getDate()
}

export const getWeekdays = (period) => {
  const [year, month] = period.split('-')
  const daysInMonth = getDaysInMonth(period)
  const weekdays = []
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(parseInt(year), parseInt(month) - 1, day)
    const dayOfWeek = date.getDay()
    
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      weekdays.push(`${period}-${String(day).padStart(2, '0')}`)
    }
  }
  
  return weekdays
}

// ============================================================================
// DATA UTILITIES
// ============================================================================

export const generateEmployeeId = () => {
  return `emp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
}

export const sortEmployees = (employees, field = 'name', order = 'asc') => {
  return [...employees].sort((a, b) => {
    const aVal = a[field]
    const bVal = b[field]
    
    if (typeof aVal === 'string') {
      return order === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }
    
    return order === 'asc' ? aVal - bVal : bVal - aVal
  })
}

export const filterEmployees = (employees, query) => {
  if (!query) return employees
  
  const searchTerm = query.toLowerCase()
  return employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm) ||
    emp.gender.toLowerCase().includes(searchTerm) ||
    emp.maritalStatus.toLowerCase().includes(searchTerm)
  )
}

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key)
      return true
    } catch {
      return false
    }
  }
}

// ============================================================================
// MISSING COMPLEX FUNCTIONS
// ============================================================================

export const calculateWorkingHours = (entryTime, exitTime) => {
  if (!entryTime || !exitTime) return 0
  
  const entry = new Date(`1970-01-01T${entryTime}:00`)
  const exit = new Date(`1970-01-01T${exitTime}:00`)
  
  if (exit <= entry) return 0
  
  const diffMs = exit - entry
  return diffMs / (1000 * 60 * 60) // Convert to hours
}

export const calculateSalaryRecord = (employee, attendance, adjustments = [], config = DEFAULT_CONFIG) => {
  const dailyRate = calculateDailyRate(employee.monthlySalary, config.workingDaysPerMonth)
  const hourlyRate = calculateHourlyRate(dailyRate, config.workdayHours)
  
  // Calculate total hours from attendance
  let totalHours = 0
  Object.values(attendance || {}).forEach(dayData => {
    if (dayData.type === 'regular' && dayData.entryTime && dayData.exitTime) {
      totalHours += calculateWorkingHours(dayData.entryTime, dayData.exitTime)
    } else if (dayData.type === 'holiday') {
      totalHours += config.workdayHours // Holiday credited as full day
    }
  })
  
  const basicSalary = calculateBaseSalary(totalHours, hourlyRate)
  const bonuses = calculateBonuses(employee, config)
  const grossSalary = basicSalary + Object.values(bonuses).reduce((sum, bonus) => sum + bonus, 0)
  const deductions = calculateDeductions(grossSalary, config.insuranceRate)
  
  const adjustmentTotal = adjustments.reduce((sum, adj) => sum + adj.amount, 0)
  const finalSalary = calculateFinalSalary(basicSalary, bonuses, deductions, adjustmentTotal)
  
  return {
    employee,
    period: getCurrentPeriod(),
    hoursWorked: totalHours,
    components: {
      basicSalary,
      ...bonuses,
      insuranceDeduction: deductions.insurance
    },
    adjustments,
    adjustmentTotal,
    finalSalary,
    configSnapshot: config
  }
}

export const calculateAttendanceSummary = (attendance, config = DEFAULT_CONFIG) => {
  let totalDays = 0
  let presentDays = 0
  let totalHours = 0
  let holidayDays = 0
  let sickDays = 0
  let leaveDays = 0
  
  Object.values(attendance || {}).forEach(dayData => {
    totalDays++
    
    switch (dayData.type) {
      case 'regular':
        if (dayData.entryTime && dayData.exitTime) {
          presentDays++
          totalHours += calculateWorkingHours(dayData.entryTime, dayData.exitTime)
        }
        break
      case 'holiday':
        holidayDays++
        totalHours += config.workdayHours
        break
      case 'sick':
        sickDays++
        break
      case 'leave':
        leaveDays++
        break
    }
  })
  
  return {
    totalDays,
    presentDays,
    totalHours,
    holidayDays,
    sickDays,
    leaveDays,
    absentDays: totalDays - presentDays - holidayDays - sickDays - leaveDays
  }
}
