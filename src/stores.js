/**
 * Centralized state management
 * Clean, functional stores with minimal complexity
 */

import { writable, derived, get } from 'svelte/store'
import { storage } from './core.js'
import { DEFAULT_RULES, createRule, validateRule, getNextOrder } from './rules.js'

// ============================================================================
// STORAGE KEYS
// ============================================================================

const KEYS = {
  EMPLOYEES: 'xpayroll_employees',
  ATTENDANCE: 'xpayroll_attendance', 
  PAYROLL: 'xpayroll_payroll',
  RULES: 'xpayroll_rules',
  BASIC_CONFIG: 'xpayroll_basic_config',
  ADJUSTMENTS: 'xpayroll_adjustments',
  THEME: 'xpayroll_theme',
  SETTINGS: 'xpayroll_settings'
}

// ============================================================================
// DEFAULT DATA
// ============================================================================

const DEFAULT_BASIC_CONFIG = {
  organizationName: 'XPayroll',
  workdayHours: 8,
  workingDaysPerMonth: 22,
  currencySymbol: '$',
  monthDays: 30,
  firstDayWeekday: 'Saturday',
  overtimeRate: 1.5,
  undertimeRate: 0.5
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
  }
}

// ============================================================================
// STORES
// ============================================================================

// Theme store
export const theme = writable(storage.get(KEYS.THEME, DEFAULT_THEME))
theme.subscribe(value => storage.set(KEYS.THEME, value))

// Rules store
export const rules = writable(storage.get(KEYS.RULES, DEFAULT_RULES))
rules.subscribe(value => storage.set(KEYS.RULES, value))

// Basic config store (workdayHours, workingDaysPerMonth)
const loadBasicConfig = () => {
  const loaded = storage.get(KEYS.BASIC_CONFIG, DEFAULT_BASIC_CONFIG)
  // Migrate old workdayHours from 6.5 to 8 if needed
  if (loaded.workdayHours === 6.5) {
    return { ...DEFAULT_BASIC_CONFIG, ...loaded, workdayHours: 8 }
  }
  // Ensure workdayHours exists, default to 8
  if (!loaded.workdayHours) {
    return { ...DEFAULT_BASIC_CONFIG, ...loaded, workdayHours: 8 }
  }
  // Ensure overtimeRate and undertimeRate exist with defaults
  return {
    ...DEFAULT_BASIC_CONFIG,
    ...loaded,
    overtimeRate: loaded.overtimeRate ?? DEFAULT_BASIC_CONFIG.overtimeRate,
    undertimeRate: loaded.undertimeRate ?? DEFAULT_BASIC_CONFIG.undertimeRate
  }
}
export const basicConfig = writable(loadBasicConfig())
basicConfig.subscribe(value => storage.set(KEYS.BASIC_CONFIG, value))

// Employees store with migration
const loadEmployees = () => {
  const loaded = storage.get(KEYS.EMPLOYEES, [])
  // Migrate monthlySalary to dailySalary (divide by 30)
  // Ensure jadid field exists with default false
  return loaded.map(emp => {
    const migrated = { ...emp }
    
    if (emp.monthlySalary && !emp.dailySalary) {
      const { monthlySalary, ...rest } = emp
      migrated.dailySalary = monthlySalary / 30
      delete migrated.monthlySalary
      Object.assign(migrated, rest)
    }
    
    // Ensure jadid field exists (default to false if not present)
    if (migrated.jadid === undefined) {
      migrated.jadid = false
    }
    
    return migrated
  })
}

export const employees = writable(loadEmployees())
employees.subscribe(value => storage.set(KEYS.EMPLOYEES, value))

// Attendance store
export const attendance = writable(storage.get(KEYS.ATTENDANCE, {}))
attendance.subscribe(value => storage.set(KEYS.ATTENDANCE, value))

// Adjustments store
export const adjustments = writable(storage.get(KEYS.ADJUSTMENTS, {}))
adjustments.subscribe(value => storage.set(KEYS.ADJUSTMENTS, value))

// Payroll store
export const payroll = writable(storage.get(KEYS.PAYROLL, {}))
payroll.subscribe(value => storage.set(KEYS.PAYROLL, value))

// Settings store
export const settings = writable(storage.get(KEYS.SETTINGS, DEFAULT_SETTINGS))
settings.subscribe(value => storage.set(KEYS.SETTINGS, value))

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
  const totalPayroll = $employees.reduce((sum, emp) => sum + ((emp.dailySalary || 0) * 30), 0)
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
  
  // Clean up related data - remove employee from all periods
  const cleanupPeriods = (data) => 
    Object.fromEntries(
      Object.entries(data).map(([period, periodData]) => [
        period,
        Object.fromEntries(Object.entries(periodData).filter(([empId]) => empId !== id))
      ])
    )
  
  attendance.update(cleanupPeriods)
  payroll.update(cleanupPeriods)
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

// Adjustment actions
export const addAdjustment = (period, employeeId, adjustment) => {
  adjustments.update(current => ({
    ...current,
    [period]: {
      ...current[period],
      [employeeId]: [
        ...(current[period]?.[employeeId] || []),
        { id: `adj_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, ...adjustment }
      ]
    }
  }))
}

export const updateAdjustment = (period, employeeId, adjustmentId, updates) => {
  adjustments.update(current => ({
    ...current,
    [period]: {
      ...current[period],
      [employeeId]: (current[period]?.[employeeId] || []).map(adj => 
        adj.id === adjustmentId ? { ...adj, ...updates } : adj
      )
    }
  }))
}

export const removeAdjustment = (period, employeeId, adjustmentId) => {
  adjustments.update(current => ({
    ...current,
    [period]: {
      ...current[period],
      [employeeId]: (current[period]?.[employeeId] || []).filter(adj => adj.id !== adjustmentId)
    }
  }))
}

export const getAdjustments = (period, employeeId) => 
  get(adjustments)[period]?.[employeeId] || []

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

// Rules actions
export const addRule = (ruleData) => {
  const rule = createRule(ruleData)
  const errors = validateRule(rule)
  if (errors) {
    throw new Error(`Invalid rule: ${Object.values(errors).join(', ')}`)
  }
  
  rules.update(current => {
    const newRule = { ...rule, order: getNextOrder(current) }
    return [...current, newRule]
  })
}

export const updateRule = (id, updates) => {
  rules.update(current => 
    current.map(rule => {
      if (rule.id === id) {
        const updatedRule = { ...rule, ...updates }
        const errors = validateRule(updatedRule)
        if (errors) {
          throw new Error(`Invalid rule: ${Object.values(errors).join(', ')}`)
        }
        return updatedRule
      }
      return rule
    })
  )
}

export const removeRule = (id) => {
  rules.update(current => current.filter(rule => rule.id !== id))
}

export const toggleRule = (id) => {
  rules.update(current => 
    current.map(rule => 
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    )
  )
}

export const reorderRules = (ruleIds) => {
  rules.update(current => {
    const reordered = ruleIds.map((id, index) => {
      const rule = current.find(r => r.id === id)
      return rule ? { ...rule, order: index + 1 } : null
    }).filter(Boolean)
    
    // Keep any rules not in the reorder list at the end
    const remaining = current.filter(rule => !ruleIds.includes(rule.id))
    return [...reordered, ...remaining]
  })
}

export const resetRules = () => {
  rules.set(DEFAULT_RULES)
}

// Basic config actions
export const updateBasicConfig = (updates) => {
  basicConfig.update(current => ({ ...current, ...updates }))
}

export const resetBasicConfig = () => {
  basicConfig.set(DEFAULT_BASIC_CONFIG)
}

// Settings actions
export const updateSettings = (updates) => {
  settings.update(current => ({ ...current, ...updates }))
}

export const resetSettings = () => {
  settings.set(DEFAULT_SETTINGS)
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

export const getSalaryRecord = (period, employeeId) => 
  get(salaryRecords)[period]?.[employeeId] || null

export const getPeriodSalaryRecords = (period) => 
  get(salaryRecords)[period] || {}

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

export const getEmployee = (id) => 
  get(employees).find(emp => emp.id === id) || null

export const getAttendance = (period, employeeId) => 
  get(attendance)[period]?.[employeeId] || {}

export const getPayroll = (period, employeeId) => 
  get(payroll)[period]?.[employeeId] || null
