/**
 * Svelte stores for xPayroll data management
 * Reactive stores with localStorage persistence
 */

import { writable } from 'svelte/store'
import { DEFAULT_CONFIG } from './core.js'

// ============================================================================
// STORAGE LAYER
// ============================================================================

const STORAGE_KEYS = {
  EMPLOYEES: 'xpayroll_employees',
  ATTENDANCE: 'xpayroll_attendance', 
  CONFIG: 'xpayroll_config',
  THEME: 'xpayroll_theme'
}

// Helper to create persistent stores
const createPersistentStore = (key, defaultValue) => {
  const stored = localStorage.getItem(key)
  const initialValue = stored ? JSON.parse(stored) : defaultValue
  
  const store = writable(initialValue)
  
  store.subscribe(value => {
    localStorage.setItem(key, JSON.stringify(value))
  })
  
  return store
}

// ============================================================================
// DATA STORES
// ============================================================================

export const employees = createPersistentStore(STORAGE_KEYS.EMPLOYEES, [])
export const attendance = createPersistentStore(STORAGE_KEYS.ATTENDANCE, {})
export const config = createPersistentStore(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG)

// Theme management
export const theme = createPersistentStore(STORAGE_KEYS.THEME, {
  mode: 'light',
  name: 'cerberus'
})

// ============================================================================
// DERIVED STORES
// ============================================================================

import { derived } from 'svelte/store'

// Current month/year for attendance
export const currentPeriod = writable({
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1
})

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const clearAllData = () => {
  localStorage.removeItem(STORAGE_KEYS.EMPLOYEES)
  localStorage.removeItem(STORAGE_KEYS.ATTENDANCE)
  localStorage.removeItem(STORAGE_KEYS.CONFIG)
  location.reload()
}

// Format date as YYYY-MM-DD
export const formatDate = (date) => {
  return date.toISOString().split('T')[0]
}

// Get attendance for employee in month
export const getAttendanceForMonth = (employeeId, year, month) => {
  const monthStr = `${year}-${month.toString().padStart(2, '0')}`
  const results = {}
  
  attendance.subscribe(attData => {
    const empAttendance = attData[employeeId] || {}
    for (const [date, data] of Object.entries(empAttendance)) {
      if (date.startsWith(monthStr)) {
        results[date] = data
      }
    }
  })()
  
  return results
}

// Theme management functions
export const toggleTheme = () => {
  theme.update(current => ({
    ...current,
    mode: current.mode === 'dark' ? 'light' : 'dark'
  }))
}

export const setTheme = (themeName) => {
  theme.update(current => ({
    ...current,
    name: themeName
  }))
} 