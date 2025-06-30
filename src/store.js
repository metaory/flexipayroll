/**
 * Storage module for xPayroll
 * Handles persistence using localStorage with proxied objects
 */

// Storage keys
const KEYS = {
  EMPLOYEES: 'xpayroll_employees',
  ATTENDANCE: 'xpayroll_attendance',
  CONFIG: 'xpayroll_config',
}

// Create reactive storage with localStorage persistence
const createStore = (key, defaultValue = {}) => {
  // Load data from localStorage or use default
  const data = JSON.parse(localStorage.getItem(key) || JSON.stringify(defaultValue))

  // Create a proxy to intercept changes and save to localStorage
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

// Store instances
export const employees = createStore(KEYS.EMPLOYEES, [])
export const attendance = createStore(KEYS.ATTENDANCE, {})
export const config = createStore(KEYS.CONFIG, {
  // Default configuration values
  workdayHours: 8,
  bonusE: 5, // 5 working days bonus
  bonusS: 2.5, // 2.5 working days bonus
  bonusK: 14000000, // Fixed bonus 14 million
  bonusM: 9000000, // Fixed bonus 9 million
  bonusT: 5000000, // Fixed bonus 5 million (married only)
  deductI: 0.07, // Insurance deduction (7%)
})

// Helper methods for store management
export const storeUtils = {
  // Add a new employee
  addEmployee(employee) {
    employee.id = Date.now().toString()
    employees.push(employee)
    return employee.id
  },

  // Update an existing employee
  updateEmployee(id, updates) {
    const index = employees.findIndex(emp => emp.id === id)
    if (index >= 0) {
      employees[index] = { ...employees[index], ...updates }
      return true
    }
    return false
  },

  // Delete an employee
  deleteEmployee(id) {
    const index = employees.findIndex(emp => emp.id === id)
    if (index >= 0) {
      employees.splice(index, 1)
      return true
    }
    return false
  },

  // Record attendance for an employee
  recordAttendance(employeeId, date, data) {
    if (!attendance[employeeId]) attendance[employeeId] = {}
    attendance[employeeId][date] = data
  },

  // Get attendance for an employee in a date range
  getAttendance(employeeId, startDate, endDate) {
    const results = {}
    if (!attendance[employeeId]) return results

    const empAttendance = attendance[employeeId]
    Object.keys(empAttendance).forEach(date => {
      if (date >= startDate && date <= endDate) {
        results[date] = empAttendance[date]
      }
    })
    return results
  },

  // Update configuration values
  updateConfig(updates) {
    Object.assign(config, updates)
  },

  // Clear all data (for testing)
  clearAllData() {
    localStorage.removeItem(KEYS.EMPLOYEES)
    localStorage.removeItem(KEYS.ATTENDANCE)
    localStorage.removeItem(KEYS.CONFIG)
    location.reload()
  }
}
