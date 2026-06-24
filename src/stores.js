/**
 * Centralized state management
 * Clean, functional stores with minimal complexity
 */

import { writable, derived, get } from 'svelte/store'
import { storage, normalizeAttendance } from './core.js'
import { DEFAULT_RULES, createRule, validateRule, getNextOrder, ensureRuleId } from './rules.js'
import { normalizeProbationFields } from './probation.js'

// ============================================================================
// STORAGE KEYS
// ============================================================================

const KEYS = {
  EMPLOYEES: 'xpayroll_employees',
  ATTENDANCE: 'xpayroll_attendance',
  ATTENDANCE_ITEMS: 'xpayroll_attendance_items',
  PAYROLL: 'xpayroll_payroll',
  RULES: 'xpayroll_rules',
  BASIC_CONFIG: 'xpayroll_basic_config',
  ADJUSTMENTS: 'xpayroll_adjustments',
  THEME: 'xpayroll_theme',
  SETTINGS: 'xpayroll_settings',
  WIZARD_STEP: 'xpayroll_wizard_step'
}

// ============================================================================
// DEFAULT DATA
// ============================================================================

export const DEFAULT_PRINT_LABELS = {
  monthSalary: 'Month salary',
  dailySalary: 'Daily salary',
  adjustment: 'ADJUSTMENT',
  totalAdjustments: 'Total adjustments',
  attendance: 'Attendance'
}

export const PRINT_LABEL_FIELDS = [
  { key: 'monthSalary', label: 'Month salary', fallback: DEFAULT_PRINT_LABELS.monthSalary },
  { key: 'dailySalary', label: 'Daily salary', fallback: DEFAULT_PRINT_LABELS.dailySalary },
  { key: 'adjustment', label: 'Adjustment', fallback: DEFAULT_PRINT_LABELS.adjustment },
  { key: 'totalAdjustments', label: 'Total adjustments', fallback: DEFAULT_PRINT_LABELS.totalAdjustments },
  { key: 'attendance', label: 'Attendance', fallback: DEFAULT_PRINT_LABELS.attendance }
]

export const resolvePrintLabels = (config = {}) => ({
  ...DEFAULT_PRINT_LABELS,
  ...config?.printLabels
})

const DEFAULT_BASIC_CONFIG = {
  organizationName: 'XPayroll',
  workdayHours: 8,
  workingDaysPerMonth: 22,
  currencySymbol: '$',
  monthDays: 30,
  firstDayWeekday: 'Saturday',
  overtimeRate: 1.5,
  undertimeRate: 0.5,
  printLabels: { ...DEFAULT_PRINT_LABELS }
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

// Wizard step store
export const wizardStep = writable(storage.get(KEYS.WIZARD_STEP, 0))
wizardStep.subscribe(value => storage.set(KEYS.WIZARD_STEP, value))

// Rules store
const uniqId = (id, used) => {
  const base = String(id)
  if (!used.has(base)) return base
  const next = (n) => `${base}_${n}`
  const n = Array.from({ length: 999 }, (_, i) => i + 2).find(i => !used.has(next(i)))
  return n ? next(n) : `${base}_${Date.now().toString(36)}`
}

const normalizeRules = (list) => {
  const used = new Set()
  return (Array.isArray(list) ? list : [])
    .map((r, i) => ({ ...r, order: Number.isFinite(Number(r?.order)) ? Number(r.order) : i + 1 }))
    .map((r) => {
      const id = uniqId(ensureRuleId(r), used)
      used.add(id)
      return { ...r, id }
    })
}

export const rules = writable(normalizeRules(storage.get(KEYS.RULES, DEFAULT_RULES)))
rules.subscribe(value => storage.set(KEYS.RULES, value))

const toNum = (v, fallback) => (Number.isFinite(Number(v)) ? Number(v) : fallback)
// Normalize numeric config so OT/UT decimals from settings are always numbers
const normalizeBasicConfig = (c) => ({
  ...DEFAULT_BASIC_CONFIG,
  ...c,
  printLabels: { ...DEFAULT_PRINT_LABELS, ...c?.printLabels },
  overtimeRate: toNum(c?.overtimeRate, DEFAULT_BASIC_CONFIG.overtimeRate),
  undertimeRate: toNum(c?.undertimeRate ?? c?.undertimeDeductionRate, DEFAULT_BASIC_CONFIG.undertimeRate)
})

// Basic config store
export const basicConfig = writable(normalizeBasicConfig(storage.get(KEYS.BASIC_CONFIG, {})))
basicConfig.subscribe(value => storage.set(KEYS.BASIC_CONFIG, value))

const normalizeEmployee = (emp) => normalizeProbationFields(emp)

// Employees store
export const employees = writable(
  (storage.get(KEYS.EMPLOYEES, []) || []).map(normalizeEmployee)
)
employees.subscribe(value => storage.set(KEYS.EMPLOYEES, value))

// Attendance store
export const attendance = writable(storage.get(KEYS.ATTENDANCE, {}))
attendance.subscribe(value => storage.set(KEYS.ATTENDANCE, value))

// Adjustments store
export const adjustments = writable(storage.get(KEYS.ADJUSTMENTS, {}))
adjustments.subscribe(value => storage.set(KEYS.ADJUSTMENTS, value))

// Attendance items store (hours adjustment per employee)
export const attendanceItems = writable(storage.get(KEYS.ATTENDANCE_ITEMS, {}))
attendanceItems.subscribe(value => storage.set(KEYS.ATTENDANCE_ITEMS, value))

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
  employees.update(current => [...current, normalizeEmployee(employee)])
}

export const updateEmployee = (id, updates) => {
  employees.update(current =>
    current.map(emp => emp.id === id ? normalizeEmployee({ ...emp, ...updates }) : emp)
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

// Attendance items actions
const attendanceRecord = (period, employeeId, current) =>
  normalizeAttendance(current[period]?.[employeeId])

export const addAttendanceItem = (period, employeeId, item) => {
  attendanceItems.update(current => {
    const record = attendanceRecord(period, employeeId, current)
    return {
      ...current,
      [period]: {
        ...current[period],
        [employeeId]: {
          ...record,
          items: [
            ...record.items,
            { id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, ...item }
          ]
        }
      }
    }
  })
}

export const updateAttendanceItem = (period, employeeId, itemId, updates) => {
  attendanceItems.update(current => {
    const record = attendanceRecord(period, employeeId, current)
    return {
      ...current,
      [period]: {
        ...current[period],
        [employeeId]: {
          ...record,
          items: record.items.map(item =>
            item.id === itemId ? { ...item, ...updates } : item
          )
        }
      }
    }
  })
}

export const removeAttendanceItem = (period, employeeId, itemId) => {
  attendanceItems.update(current => {
    const record = attendanceRecord(period, employeeId, current)
    return {
      ...current,
      [period]: {
        ...current[period],
        [employeeId]: {
          ...record,
          items: record.items.filter(item => item.id !== itemId)
        }
      }
    }
  })
}

export const setAbsentDays = (period, employeeId, absent) => {
  attendanceItems.update(current => {
    const record = attendanceRecord(period, employeeId, current)
    return {
      ...current,
      [period]: {
        ...current[period],
        [employeeId]: {
          ...record,
          absent: Math.max(0, Math.floor(Number(absent) || 0))
        }
      }
    }
  })
}

export const getAttendanceItems = (period, employeeId) =>
  attendanceRecord(period, employeeId, get(attendanceItems)).items

export const getAbsentDays = (period, employeeId) =>
  attendanceRecord(period, employeeId, get(attendanceItems)).absent

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
    const used = new Set(current.map(r => r.id))
    const id = uniqId(rule.id, used)
    const newRule = { ...rule, id, order: getNextOrder(current) }
    return [...current, newRule]
  })
}

export const updateRule = (id, updates) => {
  rules.update(current => 
    current.map(rule => {
      if (rule.id === id) {
        const nextId = updates?.id && updates.id !== id
          ? uniqId(ensureRuleId(updates), new Set(current.filter(r => r.id !== id).map(r => r.id)))
          : rule.id
        const updatedRule = { ...rule, ...updates, id: nextId }
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
  const normalized = { ...updates }
  if (updates.overtimeRate !== undefined) normalized.overtimeRate = toNum(updates.overtimeRate, DEFAULT_BASIC_CONFIG.overtimeRate)
  if (updates.undertimeRate !== undefined) normalized.undertimeRate = toNum(updates.undertimeRate, DEFAULT_BASIC_CONFIG.undertimeRate)
  basicConfig.update(current => ({ ...current, ...normalized }))
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
