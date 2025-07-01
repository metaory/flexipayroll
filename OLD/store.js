/**
 * Storage and data management for xPayroll
 * Consumer-focused APIs with localStorage persistence
 */

import { DEFAULT_CONFIG } from './core.js'

// ============================================================================
// STORAGE LAYER
// ============================================================================

const STORAGE_KEYS = {
  EMPLOYEES: 'xpayroll_employees',
  ATTENDANCE: 'xpayroll_attendance', 
  CONFIG: 'xpayroll_config'
}

const createReactiveStore = (key, defaultValue) => {
  const data = JSON.parse(localStorage.getItem(key) || JSON.stringify(defaultValue))
  
  return new Proxy(data, {
    set(target, prop, value) {
      target[prop] = value
      localStorage.setItem(key, JSON.stringify(target))
      return true
    },
    deleteProperty(target, prop) {
      delete target[prop]
      localStorage.setItem(key, JSON.stringify(target))
      return true
    }
  })
}

// ============================================================================
// DATA STORES
// ============================================================================

const employeesData = createReactiveStore(STORAGE_KEYS.EMPLOYEES, [])
const attendanceData = createReactiveStore(STORAGE_KEYS.ATTENDANCE, {})
const configData = createReactiveStore(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG)

// ============================================================================
// CONSUMER-FRIENDLY APIs
// ============================================================================

// Employee management
export const employees = {
  // Get all employees
  getAll: () => employeesData,
  
  // Get employee by ID
  getById: (id) => employeesData.find(emp => emp.id === id),
  
  // Add new employee
  add: (employee) => {
    const newEmployee = { ...employee, id: Date.now().toString() }
    employeesData.push(newEmployee)
    return newEmployee.id
  },
  
  // Update employee
  update: (id, updates) => {
    const index = employeesData.findIndex(emp => emp.id === id)
    if (index >= 0) {
      employeesData[index] = { ...employeesData[index], ...updates }
      return true
    }
    return false
  },
  
  // Delete employee
  delete: (id) => {
    const index = employeesData.findIndex(emp => emp.id === id)
    if (index >= 0) {
      employeesData.splice(index, 1)
      return true
    }
    return false
  }
}

// Attendance management
export const attendance = {
  // Get attendance for employee in date range
  getForEmployee: (employeeId, startDate, endDate) => {
    const results = {}
    const empAttendance = attendanceData[employeeId] || {}
    
    for (const date of Object.keys(empAttendance)) {
      if (date >= startDate && date <= endDate) {
        results[date] = empAttendance[date]
      }
    }
    return results
  },
  
  // Get attendance for employee in month
  getForMonth: (employeeId, year, month) => {
    const monthStr = `${year}-${month.toString().padStart(2, '0')}`
    const results = {}
    const empAttendance = attendanceData[employeeId] || {}
    
    for (const [date, data] of Object.entries(empAttendance)) {
      if (date.startsWith(monthStr)) {
        results[date] = data
      }
    }
    return results
  },
  
  // Record attendance
  record: (employeeId, date, data) => {
    if (!attendanceData[employeeId]) {
      attendanceData[employeeId] = {}
    }
    attendanceData[employeeId][date] = data
  }
}

// Configuration management
export const config = {
  // Get current config
  get: () => configData,
  
  // Update config
  update: (updates) => {
    Object.assign(configData, updates)
  },
  
  // Reset to defaults
  reset: () => {
    Object.assign(configData, DEFAULT_CONFIG)
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const clearAllData = () => {
  localStorage.removeItem(STORAGE_KEYS.EMPLOYEES)
  localStorage.removeItem(STORAGE_KEYS.ATTENDANCE)
  localStorage.removeItem(STORAGE_KEYS.CONFIG)
  location.reload()
}


