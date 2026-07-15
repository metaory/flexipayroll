/**
 * Core utilities and session I/O
 */

import {
  buildBackupPayload,
  normalizeBackupData,
  validateBackupData,
  parseLegacyPayload,
  readAllSessionData,
  listSessionKeys,
  resolveLocale
} from './persist.js'

export { normalizeAttendance } from './persist.js'

export const round2 = (n) => Math.round(n * 100) / 100

/** (dailySalary ÷ rate) × hours */
export const attendancePay = (hours, rate, dailySalary) => {
  const h = Number(hours)
  const r = Number(rate)
  const s = Number(dailySalary)
  if (!h || !r || !s) return 0
  return (s / r) * h
}

export const calculateDailyRate = (dailySalary) => dailySalary

export const calculateHourlyRate = (dailySalary, workdayHours = 8) =>
  dailySalary / workdayHours

export const formatCurrency = (amount, locale = 'id-ID', currency = 'IDR', currencySymbol = null, decimals = 0) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return currencySymbol ? `${currencySymbol} 0` : '0'
  }
  const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0
  if (currencySymbol) {
    return `${currencySymbol} ${numAmount.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}`
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(numAmount)
}

export const formatHours = (hours) => {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

const localizedDateOptions = (locale, { day = true } = {}) => ({
  year: 'numeric',
  month: '2-digit',
  ...(day ? { day: '2-digit' } : {}),
  ...(String(locale).startsWith('fa') ? { calendar: 'persian' } : {})
})

export const formatLocalizedDate = (date = new Date(), locale = 'id-ID') =>
  new Intl.DateTimeFormat(locale, localizedDateOptions(locale)).format(new Date(date))

export const formatLocalizedPeriod = (period, locale = 'id-ID') => {
  const [year, month] = String(period).split('-').map(Number)
  if (!year || !month) return period
  return new Intl.DateTimeFormat(locale, localizedDateOptions(locale, { day: false }))
    .format(new Date(year, month - 1, 1))
}

export const generateEmployeeId = () =>
  `emp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`

const decodeUtf8Base64 = (base64) =>
  new TextDecoder().decode(Uint8Array.from(atob(base64), (char) => char.charCodeAt(0)))

const parseSessionPayload = (text) => {
  const payload = String(text ?? '').trim()
  if (payload.startsWith('{')) return JSON.parse(payload)
  const utf8Decoded = decodeUtf8Base64(payload)
  if (utf8Decoded.startsWith('{')) return JSON.parse(utf8Decoded)
  return JSON.parse(atob(payload))
}

const fileToken = (value) =>
  String(value ?? '').trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')

export const SESSION_EXT = '.json'

export const defaultSessionBasename = (locale = 'id-ID', date = new Date()) => {
  const resolved = resolveLocale(locale)
  const d = new Date(date)
  const parts = new Intl.DateTimeFormat(resolved, localizedDateOptions(resolved, { day: false }))
    .formatToParts(d)
  const year = parts.find((p) => p.type === 'year')?.value ?? ''
  const monthNumber = parts.find((p) => p.type === 'month')?.value ?? ''
  const monthName = fileToken(
    new Intl.DateTimeFormat(resolved, {
      month: 'long',
      ...(String(resolved).startsWith('fa') ? { calendar: 'persian' } : {})
    }).format(d)
  )
  return `xpay-${year}-${monthNumber}-${monthName}`
}

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
  },

  exportSession: () => JSON.stringify(buildBackupPayload(localStorage), null, 2),

  importSession: (text, { reload = true } = {}) => {
    try {
      const session = parseLegacyPayload(parseSessionPayload(text))
      if (!session) return { ok: false, error: 'Invalid or incompatible backup file' }

      const normalized = normalizeBackupData(session)
      const validation = validateBackupData(normalized)
      if (!validation.ok) return validation

      const existingKeys = listSessionKeys(localStorage)
      const snapshot = Object.fromEntries(existingKeys.map((key) => [key, localStorage.getItem(key)]))
      const keysToClear = [...new Set([...existingKeys, ...Object.keys(normalized)])]

      keysToClear.map((key) => localStorage.removeItem(key))
      Object.entries(normalized).map(([key, value]) => storage.set(key, value))

      const verify = validateBackupData(normalizeBackupData(readAllSessionData(localStorage)))
      if (!verify.ok) {
        keysToClear.map((key) => localStorage.removeItem(key))
        Object.entries(snapshot)
          .filter(([, value]) => value !== null)
          .map(([key, value]) => localStorage.setItem(key, value))
        return verify
      }

      if (reload) location.reload()
      return { ok: true }
    } catch {
      return { ok: false, error: 'Invalid or incompatible backup file' }
    }
  },

  downloadSession: (basename) => {
    const locale = storage.get('xpayroll_basic_config', {})?.locale
    const name = `${String(basename ?? '').trim() || defaultSessionBasename(locale)}${SESSION_EXT}`
    const blob = new Blob([storage.exportSession()], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    Object.assign(document.createElement('a'), { href: url, download: name }).click()
    URL.revokeObjectURL(url)
  },

  loadSessionFile: (file, options) => {
    if (!file) return Promise.resolve({ ok: false, error: 'No file selected' })
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(storage.importSession(e.target.result, options))
      reader.onerror = () => resolve({ ok: false, error: 'Could not read backup file' })
      reader.readAsText(file, 'UTF-8')
    })
  }
}
