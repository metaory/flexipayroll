/**
 * Centralized state management
 * Clean, functional stores with minimal complexity
 */

import { writable, derived } from 'svelte/store'
import { storage } from './core.js'
import { DEFAULT_RULES, createRule, validateRule, getNextOrder, ensureRuleId } from './rules.js'
import {
  DEFAULT_PRINT_LABELS,
  DEFAULT_THEME,
  normalizeBasicConfig,
  normalizeRules,
  normalizeEmployee,
  normalizeAttendanceStore,
  normalizeAdjustmentsStore,
  normalizeAttendance,
  DEFAULT_SETTINGS
} from './persist.js'

export { DEFAULT_PRINT_LABELS, DEFAULT_SETTINGS, DEFAULT_THEME, resolveLocale } from './persist.js'

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
// DEFAULT DATA (re-exported from persist for consumers)
// ============================================================================

export const PRINT_LABEL_FIELDS = [
  { key: 'payslip', label: 'Payslip title', fallback: DEFAULT_PRINT_LABELS.payslip },
  { key: 'days', label: 'Days', fallback: DEFAULT_PRINT_LABELS.days },
  { key: 'daily', label: 'Daily', fallback: DEFAULT_PRINT_LABELS.daily },
  { key: 'hourly', label: 'Hourly', fallback: DEFAULT_PRINT_LABELS.hourly },
  { key: 'earnings', label: 'Earnings section', fallback: DEFAULT_PRINT_LABELS.earnings },
  { key: 'monthSalary', label: 'Month salary', fallback: DEFAULT_PRINT_LABELS.monthSalary },
  { key: 'dailySalary', label: 'Daily salary', fallback: DEFAULT_PRINT_LABELS.dailySalary },
  { key: 'gross', label: 'Gross', fallback: DEFAULT_PRINT_LABELS.gross },
  { key: 'adjustments', label: 'Adjustments section', fallback: DEFAULT_PRINT_LABELS.adjustments },
  { key: 'adjustment', label: 'Adjustment', fallback: DEFAULT_PRINT_LABELS.adjustment },
  { key: 'totalAdjustments', label: 'Total adjustments', fallback: DEFAULT_PRINT_LABELS.totalAdjustments },
  { key: 'attendance', label: 'Attendance', fallback: DEFAULT_PRINT_LABELS.attendance },
  { key: 'summary', label: 'Summary section', fallback: DEFAULT_PRINT_LABELS.summary },
  { key: 'net', label: 'Net', fallback: DEFAULT_PRINT_LABELS.net },
  { key: 'probationA', label: 'Probation (3 months)', fallback: DEFAULT_PRINT_LABELS.probationA },
  { key: 'probationB', label: 'Probation (6 months)', fallback: DEFAULT_PRINT_LABELS.probationB }
]

export const resolvePrintLabels = (config = {}) => ({
  ...DEFAULT_PRINT_LABELS,
  ...config?.printLabels
})

export const LOCALE_OPTIONS = [
  { value: 'id-ID', label: 'Indonesian' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'fa-IR', label: 'Persian' },
  { value: 'ar-SA', label: 'Arabic' },
  { value: 'de-DE', label: 'German' },
  { value: 'fr-FR', label: 'French' },
  { value: 'es-ES', label: 'Spanish' },
  { value: 'nl-NL', label: 'Dutch' },
  { value: 'pt-BR', label: 'Portuguese (Brazil)' },
  { value: 'tr-TR', label: 'Turkish' },
  { value: 'ja-JP', label: 'Japanese' },
  { value: 'zh-CN', label: 'Chinese (Simplified)' },
  { value: 'hi-IN', label: 'Hindi' }
]

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

export const rules = writable(normalizeRules(storage.get(KEYS.RULES, DEFAULT_RULES)))
rules.subscribe(value => storage.set(KEYS.RULES, value))

// Basic config store
export const basicConfig = writable(normalizeBasicConfig(storage.get(KEYS.BASIC_CONFIG, {})))
basicConfig.subscribe(value => storage.set(KEYS.BASIC_CONFIG, value))

// Employees store
export const employees = writable(
  (storage.get(KEYS.EMPLOYEES, []) || []).map(normalizeEmployee)
)
employees.subscribe(value => storage.set(KEYS.EMPLOYEES, value))

// Attendance store
export const attendance = writable(storage.get(KEYS.ATTENDANCE, {}))
attendance.subscribe(value => storage.set(KEYS.ATTENDANCE, value))

// Adjustments store (deduction-only lists per period/employee)
export const adjustments = writable(
  normalizeAdjustmentsStore(storage.get(KEYS.ADJUSTMENTS, {}))
)
adjustments.subscribe(value => storage.set(KEYS.ADJUSTMENTS, normalizeAdjustmentsStore(value)))

// Attendance items store (hours adjustment per employee)
export const attendanceItems = writable(
  normalizeAttendanceStore(storage.get(KEYS.ATTENDANCE_ITEMS, {}))
)
attendanceItems.subscribe(value => storage.set(KEYS.ATTENDANCE_ITEMS, normalizeAttendanceStore(value)))

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
  employees.update((current) => current.filter((emp) => emp.id !== id))
  const cleanupPeriods = (data) =>
    Object.fromEntries(
      Object.entries(data).map(([period, periodData]) => [
        period,
        Object.fromEntries(Object.entries(periodData).filter(([empId]) => empId !== id))
      ])
    )
  ;[attendance, attendanceItems, adjustments, payroll].map((store) => store.update(cleanupPeriods))
}

// Adjustment actions
export const addAdjustment = (period, employeeId, adjustment) => {
  const amount = -Math.abs(Number(adjustment?.amount) || 0)
  if (!amount) return
  adjustments.update(current => ({
    ...current,
    [period]: {
      ...current[period],
      [employeeId]: [
        ...(current[period]?.[employeeId] || []),
        {
          id: `adj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          label: String(adjustment?.label || 'Adjustment'),
          amount
        }
      ]
    }
  }))
}

export const updateAdjustment = (period, employeeId, adjustmentId, updates) => {
  const amount = updates?.amount != null ? -Math.abs(Number(updates.amount) || 0) : null
  adjustments.update(current => ({
    ...current,
    [period]: {
      ...current[period],
      [employeeId]: (current[period]?.[employeeId] || []).map(adj => {
        if (adj.id !== adjustmentId) return adj
        return {
          ...adj,
          ...updates,
          ...(amount != null ? { amount } : {}),
          label: String(updates?.label ?? adj.label)
        }
      }).filter(adj => adj.amount)
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
  basicConfig.update((current) => normalizeBasicConfig({ ...current, ...updates }))
}
