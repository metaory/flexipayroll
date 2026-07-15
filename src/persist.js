/**
 * Backup keys, defaults, and normalization for session export/import
 */

import { ensureRuleId } from './rules.js'
import { normalizeProbationFields } from './probation.js'

const normalizeAttendanceRecord = (data) => {
  if (Array.isArray(data)) return { items: data, absent: 0 }
  if (!data || typeof data !== 'object') return { items: [], absent: 0 }
  return {
    items: Array.isArray(data.items) ? data.items : [],
    absent: Math.max(0, Math.floor(Number(data.absent) || 0))
  }
}

export const SESSION_PREFIX = 'xpayroll_'

export const listSessionKeys = (ls) => {
  const keys = []
  for (let i = 0; i < ls.length; i++) {
    const key = ls.key(i)
    if (key?.startsWith(SESSION_PREFIX)) keys.push(key)
  }
  return keys
}

export const readAllSessionData = (ls) => {
  const data = {}
  listSessionKeys(ls).forEach((key) => {
    const raw = ls.getItem(key)
    if (raw === null) return
    try {
      data[key] = JSON.parse(raw)
    } catch {
      data[key] = raw
    }
  })
  return data
}

export const DEFAULT_PRINT_LABELS = {
  monthSalary: 'Month salary',
  dailySalary: 'Daily salary',
  adjustments: 'Adjustments',
  adjustment: 'ADJUSTMENT',
  totalAdjustments: 'Total adjustments',
  attendance: 'Attendance',
  net: 'Net'
}

const LOCALE_OPTIONS = [
  'id-ID', 'en-US', 'en-GB', 'fa-IR', 'ar-SA', 'de-DE', 'fr-FR',
  'es-ES', 'nl-NL', 'pt-BR', 'tr-TR', 'ja-JP', 'zh-CN', 'hi-IN'
]

const LOCALE_VALUES = new Set(LOCALE_OPTIONS)

export const DEFAULT_BASIC_CONFIG = {
  organizationName: 'XPayroll',
  workdayHours: 8,
  workingDaysPerMonth: 22,
  currencySymbol: '$',
  locale: 'id-ID',
  monthDays: 30,
  firstDayWeekday: 'Saturday',
  overtimeRate: 1.5,
  undertimeRate: 0.5,
  footerLabel: '',
  printLabels: { ...DEFAULT_PRINT_LABELS }
}

export const DEFAULT_SETTINGS = {
  currency: 'IDR',
  locale: 'id-ID',
  dateFormat: 'dd/MM/yyyy',
  timeFormat: '24h',
  numberFormat: { decimal: ',', thousands: '.' }
}

export const BACKUP_DEFAULTS = {
  xpayroll_basic_config: DEFAULT_BASIC_CONFIG,
  xpayroll_rules: [],
  xpayroll_settings: DEFAULT_SETTINGS,
  xpayroll_employees: [],
  xpayroll_attendance: {},
  xpayroll_attendance_items: {},
  xpayroll_adjustments: {}
}

const toNum = (v, fallback) => (Number.isFinite(Number(v)) ? Number(v) : fallback)

export const resolveLocale = (locale) => {
  const trimmed = String(locale ?? '').trim()
  if (LOCALE_VALUES.has(trimmed)) return trimmed
  if (!trimmed) return DEFAULT_BASIC_CONFIG.locale
  try {
    new Intl.DateTimeFormat(trimmed)
    return trimmed
  } catch {
    return DEFAULT_BASIC_CONFIG.locale
  }
}

const uniqId = (id, used) => {
  const base = String(id)
  if (!used.has(base)) return base
  const next = (n) => `${base}_${n}`
  const n = Array.from({ length: 999 }, (_, i) => i + 2).find(i => !used.has(next(i)))
  return n ? next(n) : `${base}_${Date.now().toString(36)}`
}

export const normalizeBasicConfig = (c) => ({
  ...DEFAULT_BASIC_CONFIG,
  ...c,
  printLabels: { ...DEFAULT_PRINT_LABELS, ...c?.printLabels },
  locale: resolveLocale(c?.locale),
  overtimeRate: toNum(c?.overtimeRate, DEFAULT_BASIC_CONFIG.overtimeRate),
  undertimeRate: toNum(c?.undertimeRate ?? c?.undertimeDeductionRate, DEFAULT_BASIC_CONFIG.undertimeRate)
})

export const normalizeRules = (list) => {
  const used = new Set()
  return (Array.isArray(list) ? list : [])
    .map((r, i) => ({ ...r, order: Number.isFinite(Number(r?.order)) ? Number(r.order) : i + 1 }))
    .map((r) => {
      const id = uniqId(ensureRuleId(r), used)
      used.add(id)
      return { ...r, id }
    })
}

export const normalizeEmployee = (emp) => normalizeProbationFields(emp)

export const normalizeAttendanceStore = (store) =>
  Object.fromEntries(
    Object.entries(store || {}).map(([period, employees]) => [
      period,
      Object.fromEntries(
        Object.entries(employees || {}).map(([empId, record]) => [
          empId,
          normalizeAttendanceRecord(record)
        ])
      )
    ])
  )

const normalizeAdjustment = (adj) => {
  if (!adj || typeof adj !== 'object') return null
  const amount = Number(adj.amount)
  if (!Number.isFinite(amount) || amount === 0) return null
  return {
    id: String(adj.id || `adj_${Date.now().toString(36)}`),
    label: String(adj.label || 'Adjustment'),
    amount: -Math.abs(amount)
  }
}

export const normalizeAdjustmentsStore = (store) =>
  Object.fromEntries(
    Object.entries(store || {}).map(([period, employees]) => [
      period,
      Object.fromEntries(
        Object.entries(employees || {}).map(([empId, list]) => [
          empId,
          (Array.isArray(list) ? list : []).map(normalizeAdjustment).filter(Boolean)
        ])
      )
    ])
  )

const NORMALIZERS = {
  xpayroll_basic_config: normalizeBasicConfig,
  xpayroll_rules: normalizeRules,
  xpayroll_settings: (v) => ({ ...DEFAULT_SETTINGS, ...v }),
  xpayroll_employees: (list) => (Array.isArray(list) ? list : []).map(normalizeEmployee),
  xpayroll_attendance: (v) => (v && typeof v === 'object' ? v : {}),
  xpayroll_attendance_items: normalizeAttendanceStore,
  xpayroll_adjustments: normalizeAdjustmentsStore
}

export const normalizeBackupEntry = (key, value) => {
  const normalizer = NORMALIZERS[key]
  if (normalizer) return normalizer(value ?? BACKUP_DEFAULTS[key])
  return value
}

export const normalizeBackupData = (data) =>
  Object.fromEntries(
    Object.entries(data || {})
      .filter(([key]) => key.startsWith(SESSION_PREFIX))
      .map(([key, value]) => [key, normalizeBackupEntry(key, value)])
  )

const isObject = (v) => v && typeof v === 'object' && !Array.isArray(v)

export const validateBackupData = (data) => {
  if (!isObject(data)) return { ok: false, error: 'Backup payload is not an object' }

  const keys = Object.keys(data).filter((key) => key.startsWith(SESSION_PREFIX))
  if (!keys.length) return { ok: false, error: 'Backup contains no session data' }

  if ('xpayroll_employees' in data) {
    const employees = data.xpayroll_employees
    if (!Array.isArray(employees)) return { ok: false, error: 'Employees must be an array' }
    const badEmployee = employees.find((e) => !e?.id || !e?.name || !Number.isFinite(Number(e?.dailySalary)))
    if (badEmployee) return { ok: false, error: 'Employee records must include id, name, and dailySalary' }
  }

  if ('xpayroll_rules' in data) {
    const rules = data.xpayroll_rules
    if (!Array.isArray(rules)) return { ok: false, error: 'Rules must be an array' }
    const badRule = rules.find((r) =>
      !r?.id || !r?.type || !Number.isFinite(Number(r?.value)) || !r?.category || !Number.isFinite(Number(r?.order))
    )
    if (badRule) return { ok: false, error: 'Rule records must include id, type, value, category, and order' }
  }

  if ('xpayroll_basic_config' in data) {
    const config = data.xpayroll_basic_config
    if (!isObject(config)) return { ok: false, error: 'Basic config must be an object' }
    if (!Number.isFinite(Number(config.workdayHours))) return { ok: false, error: 'Basic config workdayHours must be numeric' }
    if (!Number.isFinite(Number(config.overtimeRate))) return { ok: false, error: 'Basic config overtimeRate must be numeric' }
    if (!Number.isFinite(Number(config.undertimeRate))) return { ok: false, error: 'Basic config undertimeRate must be numeric' }
  }

  if ('xpayroll_attendance_items' in data && !isObject(data.xpayroll_attendance_items)) {
    return { ok: false, error: 'Attendance items must be an object' }
  }
  if ('xpayroll_adjustments' in data && !isObject(data.xpayroll_adjustments)) {
    return { ok: false, error: 'Adjustments must be an object' }
  }

  return { ok: true }
}

export const buildBackupPayload = (ls) => {
  const data = normalizeBackupData(readAllSessionData(ls))
  return { version: 1, exportedAt: new Date().toISOString(), data }
}

const parseStoredValue = (value) => {
  if (typeof value === 'string') {
    try { return JSON.parse(value) } catch { return value }
  }
  return value
}

export const parseLegacyPayload = (payload) => {
  if (payload?.version === 1 && payload?.data) return payload.data
  if (!payload || typeof payload !== 'object') return null
  const entries = Object.entries(payload).filter(([key]) => key.startsWith(SESSION_PREFIX))
  if (!entries.length) return null
  return Object.fromEntries(entries.map(([key, value]) => [key, parseStoredValue(value)]))
}
