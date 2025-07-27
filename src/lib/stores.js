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
  CONFIG: 'xpayroll_config'
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

// Theme store
export const theme = createPersistentStore('xpayroll_theme', {
  mode: 'light',
  name: 'default'
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

// Theme management functions
export const toggleTheme = () => {
  theme.update(current => ({
    ...current,
    mode: current.mode === 'dark' ? 'light' : 'dark'
  }))
}

 