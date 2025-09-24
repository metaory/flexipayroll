/**
 * Centralized state management
 * Clean, functional stores with minimal complexity
 */

import { writable, derived } from 'svelte/store'
import { storage } from './core.js'

// ============================================================================
// STORAGE KEYS
// ============================================================================

const KEYS = {
  EMPLOYEES: 'xpayroll_employees',
  ATTENDANCE: 'xpayroll_attendance', 
  PAYROLL: 'xpayroll_payroll',
  CONFIG: 'xpayroll_config',
  THEME: 'xpayroll_theme',
  SETTINGS: 'xpayroll_settings',
  I18N_LABELS: 'xpayroll_i18n_labels'
}

// ============================================================================
// DEFAULT DATA
// ============================================================================

const DEFAULT_CONFIG = {
  workdayHours: 8,
  workingDaysPerMonth: 22,
  bonusE: 5,
  bonusS: 2.5,
  bonusK: 100000,
  bonusM: 200000,
  bonusT: 150000,
  insuranceRate: 0.07
}

const DEFAULT_THEME = {
  mode: 'light'
}

export const DEFAULT_SETTINGS = {
  currency: 'IDR',
  locale: 'id-ID',
  dateFormat: 'dd/MM/yyyy',
  timeFormat: '24h',
  numberFormat: {
    decimal: ',',
    thousands: '.'
  },
  labels: {}
}

// ============================================================================
// STORES
// ============================================================================

// Theme store
export const theme = writable(storage.get(KEYS.THEME, DEFAULT_THEME))
theme.subscribe(value => storage.set(KEYS.THEME, value))

// Config store  
export const config = writable(storage.get(KEYS.CONFIG, DEFAULT_CONFIG))
config.subscribe(value => storage.set(KEYS.CONFIG, value))

// Employees store
export const employees = writable(storage.get(KEYS.EMPLOYEES, []))
employees.subscribe(value => storage.set(KEYS.EMPLOYEES, value))

// Attendance store
export const attendance = writable(storage.get(KEYS.ATTENDANCE, {}))
attendance.subscribe(value => storage.set(KEYS.ATTENDANCE, value))

// Payroll store
export const payroll = writable(storage.get(KEYS.PAYROLL, {}))
payroll.subscribe(value => storage.set(KEYS.PAYROLL, value))

// Settings store
export const settings = writable(storage.get(KEYS.SETTINGS, DEFAULT_SETTINGS))
settings.subscribe(value => storage.set(KEYS.SETTINGS, value))

// I18n labels store
export const i18nLabels = writable(storage.get(KEYS.I18N_LABELS, {}))

// Salary records store
export const salaryRecords = writable(storage.get('xpayroll_salary_records', {}))
salaryRecords.subscribe(value => storage.set('xpayroll_salary_records', value))

// ============================================================================
// DERIVED STORES
// ============================================================================

// Employee statistics
export const employeeStats = derived(employees, ($employees) => {
  const total = $employees.length
  const married = $employees.filter(emp => emp.maritalStatus === 'married').length
  const totalPayroll = $employees.reduce((sum, emp) => sum + emp.monthlySalary, 0)
  const averageSalary = total > 0 ? totalPayroll / total : 0
  
  return { total, married, totalPayroll, averageSalary }
})

// Current period
export const currentPeriod = derived([], () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
})

// ============================================================================
// ACTIONS
// ============================================================================

// Theme actions
export const toggleTheme = () => {
  theme.update(current => ({
    ...current,
    mode: current.mode === 'dark' ? 'light' : 'dark'
  }))
}

// Employee actions
export const addEmployee = (employee) => {
  employees.update(current => [...current, employee])
}

export const updateEmployee = (id, updates) => {
  employees.update(current => 
    current.map(emp => emp.id === id ? { ...emp, ...updates } : emp)
  )
}

export const removeEmployee = (id) => {
  employees.update(current => current.filter(emp => emp.id !== id))
  
  // Clean up related data
  attendance.update(current => {
    const updated = { ...current }
    Object.keys(updated).forEach(period => {
      delete updated[period]?.[id]
    })
    return updated
  })
  
  payroll.update(current => {
    const updated = { ...current }
    Object.keys(updated).forEach(period => {
      delete updated[period]?.[id]
    })
    return updated
  })
}

// Attendance actions
export const setAttendance = (period, employeeId, date, data) => {
  attendance.update(current => ({
    ...current,
    [period]: {
      ...current[period],
      [employeeId]: {
        ...current[period]?.[employeeId],
        [date]: data
      }
    }
  }))
}

export const removeAttendance = (period, employeeId, date) => {
  attendance.update(current => {
    const updated = { ...current }
    if (updated[period]?.[employeeId]) {
      delete updated[period][employeeId][date]
    }
    return updated
  })
}

// Payroll actions
export const setPayroll = (period, employeeId, data) => {
  payroll.update(current => ({
    ...current,
    [period]: {
      ...current[period],
      [employeeId]: data
    }
  }))
}

export const removePayroll = (period, employeeId) => {
  payroll.update(current => {
    const updated = { ...current }
    if (updated[period]) {
      delete updated[period][employeeId]
    }
    return updated
  })
}

// Config actions
export const updateConfig = (updates) => {
  config.update(current => ({ ...current, ...updates }))
}

export const resetConfig = () => {
  config.set(DEFAULT_CONFIG)
}

// Settings actions
export const updateSettings = (updates) => {
  settings.update(current => ({ ...current, ...updates }))
}

export const resetSettings = () => {
  settings.set(DEFAULT_SETTINGS)
  i18nLabels.set({})
}

// Salary record actions
export const storeSalaryRecord = (period, employeeId, record) => {
  salaryRecords.update(current => ({
    ...current,
    [period]: {
      ...current[period],
      [employeeId]: record
    }
  }))
}

export const getSalaryRecord = (period, employeeId) => {
  let result = null
  salaryRecords.subscribe(current => {
    result = current[period]?.[employeeId] || null
  })()
  return result
}

export const getPeriodSalaryRecords = (period) => {
  let result = {}
  salaryRecords.subscribe(current => {
    result = current[period] || {}
  })()
  return result
}

export const clearPeriodSalaryRecords = (period) => {
  salaryRecords.update(current => {
    const updated = { ...current }
    delete updated[period]
    return updated
  })
}

// ============================================================================
// GETTERS
// ============================================================================

export const getEmployee = (id) => {
  let result = null
  employees.subscribe(current => {
    result = current.find(emp => emp.id === id)
  })()
  return result
}

export const getAttendance = (period, employeeId) => {
  let result = {}
  attendance.subscribe(current => {
    result = current[period]?.[employeeId] || {}
  })()
  return result
}

export const getPayroll = (period, employeeId) => {
  let result = null
  payroll.subscribe(current => {
    result = current[period]?.[employeeId] || null
  })()
  return result
}
