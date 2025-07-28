import { writable } from 'svelte/store'
import { labels } from './i18n.js'

// ============================================================================
// STORAGE NAMESPACES - Clear isolation between data types
// ============================================================================

const STORAGE_KEYS = {
  // Core settings (currency, theme, etc.)
  CORE_SETTINGS: 'xpayroll_core_settings',
  
  // I18n labels (customizable labels)
  I18N_LABELS: 'xpayroll_i18n_labels',
  
  // Theme settings
  THEME: 'xpayroll_theme',
  
  // App configuration
  CONFIG: 'xpayroll_config'
}

// ============================================================================
// DEFAULT SETTINGS
// ============================================================================

export const DEFAULT_SETTINGS = {
  // Core settings
  currency: {
    code: 'USD',
    symbol: '$',
    locale: 'en-US',
    position: 'before'
  },
  
  // I18n labels (default values)
  labels,
  
  // Theme settings
  theme: {
    mode: 'light',
    name: 'default'
  },
  
  // App configuration
  config: {
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'HH:mm'
  }
}

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

const getItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

const setItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

// ============================================================================
// STORES
// ============================================================================

// Core settings store (currency, etc.)
export const coreSettings = writable(getItem(STORAGE_KEYS.CORE_SETTINGS, {
  currency: DEFAULT_SETTINGS.currency
}))

// I18n labels store
export const i18nLabels = writable(getItem(STORAGE_KEYS.I18N_LABELS, DEFAULT_SETTINGS.labels))

// Theme store
export const theme = writable(getItem(STORAGE_KEYS.THEME, DEFAULT_SETTINGS.theme))

// Config store
export const config = writable(getItem(STORAGE_KEYS.CONFIG, DEFAULT_SETTINGS.config))

// Combined settings store (for backward compatibility)
export const settings = writable({
  ...getItem(STORAGE_KEYS.CORE_SETTINGS, { currency: DEFAULT_SETTINGS.currency }),
  labels: getItem(STORAGE_KEYS.I18N_LABELS, DEFAULT_SETTINGS.labels),
  theme: getItem(STORAGE_KEYS.THEME, DEFAULT_SETTINGS.theme),
  config: getItem(STORAGE_KEYS.CONFIG, DEFAULT_SETTINGS.config)
})

// ============================================================================
// AUTO-SAVE SUBSCRIPTIONS
// ============================================================================

// Auto-save each store to its own namespace
coreSettings.subscribe(value => setItem(STORAGE_KEYS.CORE_SETTINGS, value))
i18nLabels.subscribe(value => setItem(STORAGE_KEYS.I18N_LABELS, value))
theme.subscribe(value => setItem(STORAGE_KEYS.THEME, value))
config.subscribe(value => setItem(STORAGE_KEYS.CONFIG, value))

// Keep combined store in sync
settings.subscribe(value => {
  setItem(STORAGE_KEYS.CORE_SETTINGS, { currency: value.currency })
  setItem(STORAGE_KEYS.I18N_LABELS, value.labels)
  setItem(STORAGE_KEYS.THEME, value.theme)
  setItem(STORAGE_KEYS.CONFIG, value.config)
})

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Update specific setting
export const updateSetting = (path, value) => {
  settings.update(current => {
    const newSettings = { ...current }
    const keys = path.split('.')
    let currentLevel = newSettings
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!currentLevel[keys[i]]) {
        currentLevel[keys[i]] = {}
      }
      currentLevel = currentLevel[keys[i]]
    }
    
    currentLevel[keys[keys.length - 1]] = value
    return newSettings
  })
}

// Get specific setting
export const getSetting = (path) => {
  let currentSettings
  settings.subscribe(value => {
    currentSettings = value
  })()
  
  const keys = path.split('.')
  let result = currentSettings
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key]
    } else {
      return undefined
    }
  }
  
  return result
}

// Reset all settings to defaults
export const resetSettings = () => {
  settings.set(DEFAULT_SETTINGS)
}

// Reset specific namespace
export const resetNamespace = (namespace) => {
  switch (namespace) {
    case 'core':
      coreSettings.set({ currency: DEFAULT_SETTINGS.currency })
      break
    case 'i18n':
      i18nLabels.set(DEFAULT_SETTINGS.labels)
      break
    case 'theme':
      theme.set(DEFAULT_SETTINGS.theme)
      break
    case 'config':
      config.set(DEFAULT_SETTINGS.config)
      break
  }
}

// Export settings for use in other modules
export const getSettings = () => {
  let currentSettings
  settings.subscribe(value => {
    currentSettings = value
  })()
  return currentSettings
}

// Export theme toggle function
export const toggleTheme = () => {
  theme.update(current => ({
    ...current,
    mode: current.mode === 'dark' ? 'light' : 'dark'
  }))
} 