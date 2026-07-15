/**
 * Backup keys, defaults, and normalization for session export/import
 */

import { ensureRuleId } from './rules.js'
import { normalizeProbationFields } from './probation.js'
import pkg from '../package.json' with { type: 'json' }

export const BACKUP_VERSION = 2
export const APP_VERSION = pkg.version
export const SESSION_PREFIX = 'xpayroll_'

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

export const DEFAULT_THEME = { mode: 'light' }

export const BACKUP_DEFAULTS = {
  xpayroll_basic_config: DEFAULT_BASIC_CONFIG,
  xpayroll_rules: [],
  xpayroll_settings: DEFAULT_SETTINGS,
  xpayroll_employees: [],
  xpayroll_attendance: {},
  xpayroll_attendance_items: {},
  xpayroll_adjustments: {},
  xpayroll_theme: DEFAULT_THEME,
  xpayroll_wizard_step: 0,
  xpayroll_payroll: {},
  xpayroll_salary_records: {}
}

const isObject = (v) => v && typeof v === 'object' && !Array.isArray(v)
const toNum = (v, fallback) => (Number.isFinite(Number(v)) ? Number(v) : fallback)
const toPositiveNum = (v, fallback) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : fallback
}
const finite = (v) => Number.isFinite(Number(v))

const parseJsonOrRaw = (raw) => {
  try { return JSON.parse(raw) } catch { return raw }
}

export const listSessionKeys = (ls) =>
  Array.from({ length: ls.length }, (_, i) => ls.key(i))
    .filter((key) => key?.startsWith(SESSION_PREFIX))

export const readAllSessionData = (ls) =>
  Object.fromEntries(
    listSessionKeys(ls)
      .map((key) => [key, ls.getItem(key)])
      .filter(([, raw]) => raw !== null)
      .map(([key, raw]) => [key, parseJsonOrRaw(raw)])
  )

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
  const n = Array.from({ length: 999 }, (_, i) => i + 2).find((i) => !used.has(next(i)))
  return n ? next(n) : `${base}_${Date.now().toString(36)}`
}

const mapByPeriod = (store, mapEmployee) =>
  Object.fromEntries(
    Object.entries(store || {}).map(([period, employees]) => [
      period,
      Object.fromEntries(
        Object.entries(employees || {}).map(([empId, value]) => [empId, mapEmployee(value)])
      )
    ])
  )

const normalizeAttendanceItem = (item) =>
  item && typeof item === 'object'
    ? {
        id: String(item.id || `att_${Date.now().toString(36)}`),
        label: String(item.label || 'Attendance'),
        hours: finite(item.hours) ? Number(item.hours) : 0
      }
    : null

export const normalizeAttendance = (data) => {
  const source = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : [])
  return {
    items: source.map(normalizeAttendanceItem).filter(Boolean),
    absent: Array.isArray(data) ? 0 : Math.max(0, Math.floor(Number(data?.absent) || 0))
  }
}

const normalizeAdjustment = (adj) => {
  if (!adj || typeof adj !== 'object') return null
  const amount = Number(adj.amount)
  if (!finite(amount) || amount === 0) return null
  return {
    id: String(adj.id || `adj_${Date.now().toString(36)}`),
    label: String(adj.label || 'Adjustment'),
    amount: -Math.abs(amount)
  }
}

export const normalizeBasicConfig = (c) => ({
  ...DEFAULT_BASIC_CONFIG,
  ...c,
  printLabels: { ...DEFAULT_PRINT_LABELS, ...c?.printLabels },
  locale: resolveLocale(c?.locale),
  workdayHours: toPositiveNum(c?.workdayHours, DEFAULT_BASIC_CONFIG.workdayHours),
  workingDaysPerMonth: toPositiveNum(c?.workingDaysPerMonth, DEFAULT_BASIC_CONFIG.workingDaysPerMonth),
  monthDays: toPositiveNum(c?.monthDays, DEFAULT_BASIC_CONFIG.monthDays),
  overtimeRate: toNum(c?.overtimeRate, DEFAULT_BASIC_CONFIG.overtimeRate),
  undertimeRate: toNum(
    c?.undertimeRate ?? c?.undertimeDeductionRate,
    DEFAULT_BASIC_CONFIG.undertimeRate
  ),
  organizationName: String(c?.organizationName ?? DEFAULT_BASIC_CONFIG.organizationName),
  currencySymbol: String(c?.currencySymbol ?? DEFAULT_BASIC_CONFIG.currencySymbol),
  footerLabel: String(c?.footerLabel ?? ''),
  firstDayWeekday: String(c?.firstDayWeekday || DEFAULT_BASIC_CONFIG.firstDayWeekday)
})

export const normalizeRules = (list) => {
  const used = new Set()
  return (Array.isArray(list) ? list : [])
    .map((r, i) => ({ ...r, order: finite(r?.order) ? Number(r.order) : i + 1 }))
    .map((r) => {
      const id = uniqId(ensureRuleId(r), used)
      used.add(id)
      return { ...r, id }
    })
}

export const normalizeEmployee = (emp) => normalizeProbationFields(emp)

export const normalizeAttendanceStore = (store) =>
  mapByPeriod(store, normalizeAttendance)

export const normalizeAdjustmentsStore = (store) =>
  mapByPeriod(store, (list) => (Array.isArray(list) ? list : []).map(normalizeAdjustment).filter(Boolean))

const normalizeObjectStore = (v) => (isObject(v) ? v : {})

const NORMALIZERS = {
  xpayroll_basic_config: normalizeBasicConfig,
  xpayroll_rules: normalizeRules,
  xpayroll_settings: (v) => ({ ...DEFAULT_SETTINGS, ...v }),
  xpayroll_employees: (list) => (Array.isArray(list) ? list : []).map(normalizeEmployee),
  xpayroll_attendance: normalizeObjectStore,
  xpayroll_attendance_items: normalizeAttendanceStore,
  xpayroll_adjustments: normalizeAdjustmentsStore,
  xpayroll_theme: (v) => ({ mode: v?.mode === 'dark' ? 'dark' : 'light' }),
  xpayroll_wizard_step: (v) => (finite(v) ? Number(v) : 0),
  xpayroll_payroll: normalizeObjectStore,
  xpayroll_salary_records: normalizeObjectStore
}

export const normalizeBackupEntry = (key, value) =>
  (NORMALIZERS[key] ?? ((v) => v))(value ?? BACKUP_DEFAULTS[key])

export const normalizeBackupData = (data) =>
  Object.fromEntries(
    Object.entries({
      ...BACKUP_DEFAULTS,
      ...Object.fromEntries(
        Object.entries(data || {}).filter(([key]) => key.startsWith(SESSION_PREFIX))
      )
    }).map(([key, value]) => [key, normalizeBackupEntry(key, value)])
  )

const VALIDATORS = [
  {
    applies: (d) => 'xpayroll_employees' in d,
    check: (d) =>
      !Array.isArray(d.xpayroll_employees)
        ? 'Employees must be an array'
        : d.xpayroll_employees.find((e) => !e?.id || !e?.name || !finite(e?.dailySalary))
          ? 'Employee records must include id, name, and dailySalary'
          : null
  },
  {
    applies: (d) => 'xpayroll_rules' in d,
    check: (d) =>
      !Array.isArray(d.xpayroll_rules)
        ? 'Rules must be an array'
        : d.xpayroll_rules.find((r) =>
            !r?.id || !r?.type || !finite(r?.value) || !r?.category || !finite(r?.order)
          )
          ? 'Rule records must include id, type, value, category, and order'
          : null
  },
  {
    applies: (d) => 'xpayroll_basic_config' in d,
    check: (d) => {
      const c = d.xpayroll_basic_config
      if (!isObject(c)) return 'Basic config must be an object'
      if (!finite(c.workdayHours)) return 'Basic config workdayHours must be numeric'
      if (!finite(c.overtimeRate)) return 'Basic config overtimeRate must be numeric'
      if (!finite(c.undertimeRate)) return 'Basic config undertimeRate must be numeric'
      return null
    }
  },
  {
    applies: (d) => 'xpayroll_attendance_items' in d,
    check: (d) => (isObject(d.xpayroll_attendance_items) ? null : 'Attendance items must be an object')
  },
  {
    applies: (d) => 'xpayroll_adjustments' in d,
    check: (d) => (isObject(d.xpayroll_adjustments) ? null : 'Adjustments must be an object')
  }
]

export const validateBackupData = (data) => {
  if (!isObject(data)) return { ok: false, error: 'Backup payload is not an object' }
  if (!Object.keys(data).some((key) => key.startsWith(SESSION_PREFIX))) {
    return { ok: false, error: 'Backup contains no session data' }
  }
  const error = VALIDATORS.map(({ applies, check }) => (applies(data) ? check(data) : null)).find(Boolean)
  return error ? { ok: false, error } : { ok: true }
}

export const buildBackupPayload = (ls) => ({
  version: BACKUP_VERSION,
  appVersion: APP_VERSION,
  exportedAt: new Date().toISOString(),
  data: normalizeBackupData(readAllSessionData(ls))
})

const parseStoredValue = (value) =>
  typeof value === 'string' ? parseJsonOrRaw(value) : value

export const parseLegacyPayload = (payload) => {
  if ((payload?.version === 1 || payload?.version === 2) && payload?.data) return payload.data
  if (!payload || typeof payload !== 'object') return null
  const entries = Object.entries(payload)
    .filter(([key]) => key.startsWith(SESSION_PREFIX))
    .map(([key, value]) => [key, parseStoredValue(value)])
  return entries.length ? Object.fromEntries(entries) : null
}
