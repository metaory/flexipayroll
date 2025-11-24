/**
 * Core business logic and utilities
 * Clean, functional, dynamic approach
 */

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
  workdayHours: 6.5,
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
    errors.name = 'Name must be at least 2 characters'
  }
  
  if (!data.dailySalary || data.dailySalary <= 0) {
    errors.dailySalary = 'Daily salary must be greater than 0'
  }
  
  if (!['male', 'female'].includes(data.gender)) {
    errors.gender = 'Invalid gender'
  }
  
  if (!['single', 'married'].includes(data.maritalStatus)) {
    errors.maritalStatus = 'Invalid marital status'
  }
  
  return Object.keys(errors).length === 0 ? null : errors
}

export const validateAttendance = (data) => {
  const errors = {}
  
  if (data.type === 'regular' && (!data.entryTime || !data.exitTime)) {
    errors.entryExitTimes = 'Entry and exit times required for regular days'
  }
  
  if (data.entryTime && data.exitTime && data.exitTime <= data.entryTime) {
    errors.timeOrder = 'Exit time must be after entry time'
  }
  
  return Object.keys(errors).length === 0 ? null : errors
}

// ============================================================================
// CALCULATION UTILITIES
// ============================================================================

export const calculateDailyRate = (dailySalary) => 
  dailySalary

export const calculateHourlyRate = (dailySalary, workdayHours = 8) => 
  dailySalary / workdayHours

export const calculateBaseSalary = (hoursWorked, hourlyRate) => 
  hoursWorked * hourlyRate

// calculateBonuses removed - now handled by rules engine

// calculateDeductions removed - now handled by rules engine

// calculateFinalSalary removed - now handled by rules engine

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

export const formatCurrency = (amount, locale = 'id-ID', currency = 'IDR', currencySymbol = null) => {
  // Handle undefined, null, or NaN values
  if (amount === undefined || amount === null || isNaN(amount)) {
    console.warn('formatCurrency received invalid amount:', amount)
    return currencySymbol ? `${currencySymbol} 0` : '0'
  }
  
  // Ensure amount is a number
  const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0
  
  if (currencySymbol) {
    return `${currencySymbol} ${numAmount.toLocaleString(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numAmount)
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

// Get weekday name based on day number and first day of month weekday
export const getWeekdayName = (dayNumber, firstDayWeekday) => {
  if (!firstDayWeekday) return 'Mon' // Default fallback
  
  // Map full weekday names to short names
  const weekdayMap = {
    'Saturday': 'Sat',
    'Sunday': 'Sun', 
    'Monday': 'Mon',
    'Tuesday': 'Tue',
    'Wednesday': 'Wed',
    'Thursday': 'Thu',
    'Friday': 'Fri'
  }
  
  const weekdayNames = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  const shortName = weekdayMap[firstDayWeekday] || 'Sat' // Default to Sat if not found
  const firstDayIndex = weekdayNames.indexOf(shortName)
  
  const dayIndex = (firstDayIndex + dayNumber - 1) % 7
  return weekdayNames[dayIndex]
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
  
  // Handle both "HH:MM" and "HH:MM:SS" formats
  const entryStr = entryTime.includes(':') ? entryTime : `${entryTime}:00`
  const exitStr = exitTime.includes(':') ? exitTime : `${exitTime}:00`
  
  // Ensure we have seconds
  const entryFormatted = entryStr.split(':').length === 2 ? `${entryStr}:00` : entryStr
  const exitFormatted = exitStr.split(':').length === 2 ? `${exitStr}:00` : exitStr
  
  const entry = new Date(`1970-01-01T${entryFormatted}`)
  const exit = new Date(`1970-01-01T${exitFormatted}`)
  
  if (exit <= entry || isNaN(entry.getTime()) || isNaN(exit.getTime())) return 0
  
  const diffMs = exit.getTime() - entry.getTime()
  return diffMs / (1000 * 60 * 60) // Convert to hours
}

// calculateSalaryRecord removed - now handled by rules engine in payroll.js

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
