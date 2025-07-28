/**
 * Svelte stores for xPayroll data management
 * Clean, functional stores with localStorage persistence
 */

import { writable } from 'svelte/store'
import { DEFAULT_CONFIG } from './core.js'

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  EMPLOYEES: 'xpayroll_employees',
  ATTENDANCE: 'xpayroll_attendance',
  CONFIG: 'xpayroll_config',
  ADJUSTMENTS: 'xpayroll_adjustments',
  THEME: 'xpayroll_theme'
}

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

const getItem = (key, fallback = null) => {
  const item = localStorage.getItem(key)
  return item ? JSON.parse(item) : fallback
}

const setItem = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value))
}

const removeItem = (key) => {
  localStorage.removeItem(key)
}

// ============================================================================
// DATA STORES
// ============================================================================

export const employees = writable(getItem(STORAGE_KEYS.EMPLOYEES, []))
export const attendance = writable(getItem(STORAGE_KEYS.ATTENDANCE, {}))
export const config = writable(getItem(STORAGE_KEYS.CONFIG) || DEFAULT_CONFIG)

// Theme store
export const theme = writable(getItem(STORAGE_KEYS.THEME) || {
  mode: 'light',
  name: 'default'
})

// Current period store
export const currentPeriod = writable({
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1
})

// ============================================================================
// STORE SUBSCRIPTIONS
// ============================================================================

// Auto-save to localStorage
employees.subscribe(value => setItem(STORAGE_KEYS.EMPLOYEES, value))
attendance.subscribe(value => setItem(STORAGE_KEYS.ATTENDANCE, value))
config.subscribe(value => setItem(STORAGE_KEYS.CONFIG, value))
theme.subscribe(value => setItem(STORAGE_KEYS.THEME, value))

// ============================================================================
// STORAGE OPERATIONS
// ============================================================================

export const storage = {
  // Adjustment operations
  getAdjustments: (employeeId) => getItem(`${STORAGE_KEYS.ADJUSTMENTS}_${employeeId}`, []),
  setAdjustments: (employeeId, adjustments) => setItem(`${STORAGE_KEYS.ADJUSTMENTS}_${employeeId}`, adjustments),
  
  // Backup operations
  exportData: (configData) => ({
    employees: getItem(STORAGE_KEYS.EMPLOYEES, []),
    attendance: getItem(STORAGE_KEYS.ATTENDANCE, {}),
    config: configData || getItem(STORAGE_KEYS.CONFIG)
  }),
  
  importData: (data) => {
    const { employees: empData, attendance: attData, config: cfgData } = data
    
    if (empData) setItem(STORAGE_KEYS.EMPLOYEES, empData)
    if (attData) setItem(STORAGE_KEYS.ATTENDANCE, attData)
    if (cfgData) setItem(STORAGE_KEYS.CONFIG, cfgData)
  },
  
  // Clear operations
  clearAll: () => {
    Object.values(STORAGE_KEYS).forEach(key => removeItem(key))
    // Clear adjustment keys
    const keys = Object.keys(localStorage)
    keys.filter(key => key.startsWith(STORAGE_KEYS.ADJUSTMENTS))
        .forEach(key => removeItem(key))
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const clearAllData = () => {
  storage.clearAll()
  location.reload()
}

export const toggleTheme = () => {
  theme.update(current => ({
    ...current,
    mode: current.mode === 'dark' ? 'light' : 'dark'
  }))
}

 