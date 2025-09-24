/**
 * Simple, clean i18n system with meta-programming
 * Dictionary-driven with functional utilities
 */

// ============================================================================
// LABELS DICTIONARY - Single source of truth
// ============================================================================

const defaultLabels = {
  // Bonuses
  bonusE: 'Bonus E',
  bonusS: 'Bonus S', 
  bonusK: 'Bonus K',
  bonusM: 'Bonus M',
  bonusT: 'Bonus T (Married)',
  
  // Deductions
  insurance: 'Insurance Deduction',
  
  // Day types
  regular: 'Regular Work Day',
  holiday: 'Holiday',
  paid_leave: 'Paid Leave',
  unpaid_leave: 'Unpaid Leave',
  
  // Sections
  employees: 'Employees',
  attendance: 'Attendance',
  payroll: 'Payroll',
  payslips: 'Payslips',
  config: 'Configuration',
  settings: 'Settings',
  
  // Fields
  name: 'Name',
  gender: 'Gender',
  maritalStatus: 'Marital Status',
  monthlySalary: 'Monthly Salary',
  workdayHours: 'Workday Hours',
  workingDaysPerMonth: 'Working Days/Month',
  adjustment: 'Adjustment',
  comment: 'Comment',
  period: 'Period',
  baseSalary: 'Base Salary',
  finalSalary: 'Final Salary',
  
  // Buttons
  save: 'Save',
  cancel: 'Cancel',
  addEmployee: 'Add Employee',
  addAttendance: 'Add Attendance',
  addAdjustment: 'Add Adjustment',
  recalculate: 'Recalculate',
  print: 'Print',
  download: 'Download',
  delete: 'Delete',
  edit: 'Edit',
  close: 'Close',
  reset: 'Reset',
  import: 'Import',
  export: 'Export'
}

// ============================================================================
// PROXY-BASED ACCESS
// ============================================================================

// Create a proxy that always returns a value (key as fallback)
export const t = new Proxy(defaultLabels, {
  get(target, key) {
    return target[key] || key
  }
})

// Group definitions with defaults
const groups = {
  bonuses: 'Bonus Labels',
  deductions: 'Deduction Labels', 
  dayTypes: 'Day Type Labels',
  sections: 'Section Labels',
  fields: 'Field Labels',
  buttons: 'Button Labels'
}

// Proxy for groups with defaults
export const g = new Proxy(groups, {
  get(target, key) {
    return target[key] || key
  }
})

// ============================================================================
// META-PROGRAMMING UTILITIES
// ============================================================================

// Group labels by convention (prefix-based)
export const groupBy = (prefix) => 
  Object.entries(defaultLabels)
    .filter(([key]) => key.startsWith(prefix))
    .reduce((acc, [key, value]) => {
      const field = key.replace(prefix, '')
      acc[field] = { key, value, displayName: formatName(field) }
      return acc
    }, {})

// Get all labels that don't start with any prefix
export const getUngrouped = () => 
  Object.entries(defaultLabels)
    .filter(([key]) => !key.startsWith('bonus'))
    .reduce((acc, [key, value]) => {
      acc[key] = { key, value, displayName: formatName(key) }
      return acc
    }, {})

// Format field name for display
export const formatName = (name) => 
  name.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim()

// Get icon by convention
export const getIcon = (name) => {
  const icons = {
    bonus: 'star',
    insurance: 'insurance',
    name: 'user',
    gender: 'user',
    salary: 'money',
    hours: 'clock',
    days: 'calendar',
    adjustment: 'plus',
    comment: 'message',
    period: 'calendar',
    save: 'save',
    cancel: 'cancel',
    add: 'plus',
    delete: 'trash',
    edit: 'edit',
    close: 'close',
    reset: 'refresh',
    import: 'upload',
    export: 'download',
    print: 'print',
    recalculate: 'refresh',
    regular: 'calendar',
    holiday: 'star',
    paidLeave: 'calendar',
    unpaidLeave: 'calendar',
    employees: 'users',
    attendance: 'calendar',
    payroll: 'money',
    payslips: 'file',
    config: 'settings',
    settings: 'settings'
  }
  
  return Object.entries(icons).find(([key]) => name.includes(key))?.[1] || 'tag'
}

// ============================================================================
// DYNAMIC FORM GENERATION
// ============================================================================

// Generate form fields for a group
export const generateFields = (groupName, settings, updateFn) => {
  let fields = []
  
  if (groupName === 'bonuses') {
    // Handle bonus group specifically
    const bonusFields = groupBy('bonus')
    fields = Object.entries(bonusFields).map(([field, info]) => ({
      id: `bonus-${field}`,
      value: settings[info.key] || info.value,
      label: info.displayName,
      icon: getIcon(field),
      onChange: (value) => updateFn(info.key, value)
    }))
  } else {
    // Handle other groups (ungrouped items)
    const ungrouped = getUngrouped()
    const groupItems = {
      deductions: ['insurance'],
      dayTypes: ['regular', 'holiday', 'paid_leave', 'unpaid_leave'],
      sections: ['employees', 'attendance', 'payroll', 'payslips', 'config', 'settings'],
      fields: ['name', 'gender', 'maritalStatus', 'monthlySalary', 'workdayHours', 'workingDaysPerMonth', 'adjustment', 'comment', 'period', 'baseSalary', 'finalSalary'],
      buttons: ['save', 'cancel', 'addEmployee', 'addAttendance', 'addAdjustment', 'recalculate', 'print', 'download', 'delete', 'edit', 'close', 'reset', 'import', 'export']
    }
    
    const keys = groupItems[groupName] || []
    fields = keys.map(key => ({
      id: `${groupName}-${key}`,
      value: settings[key] || t[key],
      label: formatName(key),
      icon: getIcon(key),
      onChange: (value) => updateFn(key, value)
    }))
  }
  
  return fields
}

// ============================================================================
// CONVENTIONS
// ============================================================================

// Get all groups
export const getGroups = () => Object.keys(groups)

// Legacy exports for backward compatibility
export const labels = defaultLabels
export const getGroupTitle = (groupName) => g[groupName] 