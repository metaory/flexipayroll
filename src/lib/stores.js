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

// Helper to safely parse JSON with fallback
const safeParse = (data, fallback) => {
  try {
    return data ? JSON.parse(data) : fallback
  } catch {
    return fallback
  }
}

// Helper to create persistent stores with error handling
const createPersistentStore = (key, defaultValue) => {
  let stored
  try {
    stored = localStorage.getItem(key)
  } catch {
    console.warn(`Failed to read from localStorage for key: ${key}`)
    stored = null
  }
  
  const initialValue = safeParse(stored, defaultValue)
  
  const store = writable(initialValue)
  
  store.subscribe(value => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Failed to save to localStorage for key: ${key}`, error)
    }
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

// Form store for centralized form state
export const formState = writable({
  isSubmitting: false,
  errors: {},
  message: ''
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
  try {
    localStorage.removeItem(STORAGE_KEYS.EMPLOYEES)
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE)
    localStorage.removeItem(STORAGE_KEYS.CONFIG)
    location.reload()
  } catch (error) {
    console.error('Failed to clear data:', error)
  }
}

// Theme management functions
export const toggleTheme = () => {
  theme.update(current => ({
    ...current,
    mode: current.mode === 'dark' ? 'light' : 'dark'
  }))
}

// Form utility functions
export const setFormError = (errors) => {
  formState.update(state => ({ ...state, errors, message: '' }))
}

export const setFormMessage = (message) => {
  formState.update(state => ({ ...state, message, errors: {} }))
}

export const setSubmitting = (isSubmitting) => {
  formState.update(state => ({ ...state, isSubmitting }))
}

export const resetFormState = () => {
  formState.set({ isSubmitting: false, errors: {}, message: '' })
}

 