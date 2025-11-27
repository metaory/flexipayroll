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
  const validations = [
    [!data.name || data.name.length < 2, 'name', 'Name must be at least 2 characters'],
    [!data.dailySalary || data.dailySalary <= 0, 'dailySalary', 'Daily salary must be greater than 0'],
    [!['male', 'female'].includes(data.gender), 'gender', 'Invalid gender'],
    [!['single', 'married'].includes(data.maritalStatus), 'maritalStatus', 'Invalid marital status']
  ]
  
  const errors = validations
    .filter(([condition]) => condition)
    .reduce((acc, [, field, message]) => ({ ...acc, [field]: message }), {})
  
  return Object.keys(errors).length === 0 ? null : errors
}

export const validateAttendance = (data) => {
  const validations = [
    [data.type === 'regular' && (!data.entryTime || !data.exitTime), 'entryExitTimes', 'Entry and exit times required for regular days'],
    [data.entryTime && data.exitTime && data.exitTime <= data.entryTime, 'timeOrder', 'Exit time must be after entry time']
  ]
  
  const errors = validations
    .filter(([condition]) => condition)
    .reduce((acc, [, field, message]) => ({ ...acc, [field]: message }), {})
  
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

const DEFAULT_HOURS_MAP = {
  regular: 0, // Calculated from entry/exit
  paidLeave: (hours) => hours,
  unpaidLeave: 0,
  overtime: 0
}

export const getDefaultHours = (dayType, workdayHours = 8) => {
  const hourValue = DEFAULT_HOURS_MAP[dayType]
  if (dayType === 'holiday' || dayType === 'paidLeave') return workdayHours
  return typeof hourValue === 'function' ? hourValue(workdayHours) : (hourValue ?? 0)
}

// ============================================================================
// FORMAT UTILITIES
// ============================================================================

export const formatCurrency = (amount, locale = 'id-ID', currency = 'IDR', currencySymbol = null) => {
  // Handle undefined, null, or NaN values
  if (amount === undefined || amount === null || isNaN(amount)) {
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
  return Array.from({ length: getDaysInMonth(period) }, (_, i) => i + 1)
    .filter(day => {
      const dayOfWeek = new Date(parseInt(year), parseInt(month) - 1, day).getDay()
      return dayOfWeek !== 0 && dayOfWeek !== 6
    })
    .map(day => `${period}-${String(day).padStart(2, '0')}`)
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

const ATTENDANCE_HANDLERS = {
  regular: (dayData, config) => ({
    present: dayData.entryTime && dayData.exitTime ? 1 : 0,
    hours: dayData.entryTime && dayData.exitTime ? calculateWorkingHours(dayData.entryTime, dayData.exitTime) : 0
  }),
  holiday: (_, config) => ({ holiday: 1, hours: config.workdayHours }),
  sick: () => ({ sick: 1 }),
  leave: () => ({ leave: 1 })
}

export const calculateAttendanceSummary = (attendance, config = DEFAULT_CONFIG) => {
  const initial = {
    totalDays: 0,
    presentDays: 0,
    totalHours: 0,
    holidayDays: 0,
    sickDays: 0,
    leaveDays: 0
  }
  
  const summary = Object.values(attendance || {}).reduce((acc, dayData) => {
    const handler = ATTENDANCE_HANDLERS[dayData.type]
    const result = handler ? handler(dayData, config) : {}
    
    return {
      totalDays: acc.totalDays + 1,
      presentDays: acc.presentDays + (result.present ?? 0),
      totalHours: acc.totalHours + (result.hours ?? 0),
      holidayDays: acc.holidayDays + (result.holiday ?? 0),
      sickDays: acc.sickDays + (result.sick ?? 0),
      leaveDays: acc.leaveDays + (result.leave ?? 0)
    }
  }, initial)
  
  return {
    ...summary,
    absentDays: summary.totalDays - summary.presentDays - summary.holidayDays - summary.sickDays - summary.leaveDays
  }
}
