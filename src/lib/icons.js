// Tabler icon mapping used across the app.
export const ICONS = {
  add: 'tabler:plus',
  check: 'tabler:check',
  close: 'tabler:x',
  delete: 'tabler:trash',
  edit: 'tabler:edit',
  eye: 'tabler:eye',
  eyeClosed: 'tabler:eye-closed',
  folderOpen: 'tabler:folder-open',
  refresh: 'tabler:refresh',
  save: 'tabler:device-floppy',
  warning: 'tabler:alert-triangle',
  info: 'tabler:info-circle',
  error: 'tabler:alert-circle',
  success: 'tabler:circle-check',
  themeDark: 'tabler:moon',
  themeLight: 'tabler:sun',
  arrowLeft: 'tabler:arrow-left',
  arrowRight: 'tabler:arrow-right',
  stepConfig: 'tabler:settings',
  stepEmployees: 'tabler:users',
  stepAttendance: 'tabler:clock',
  stepAdjustments: 'tabler:adjustments',
  stepReport: 'tabler:file-text'
}

export const getIcon = (key, fallback = 'tabler:help-circle') => ICONS[key] || fallback