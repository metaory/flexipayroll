// Solar Icon Collection Mapping for XPayroll
// All icons are from the Solar collection (solar:*)

export const ICONS = {
  // Navigation & UI
  home: 'solar:home-bold',
  settings: 'solar:settings-bold',
  menu: 'solar:hamburger-menu-bold',
  close: 'solar:close-circle-bold',
  back: 'solar:arrow-left-bold',
  forward: 'solar:arrow-right-bold',
  up: 'solar:arrow-up-bold',
  down: 'solar:arrow-down-bold',
  
  // Users & Employees
  user: 'solar:user-bold',
  users: 'solar:users-group-rounded-bold',
  userAdd: 'solar:user-plus-bold',
  userEdit: 'solar:user-edit-bold',
  userRemove: 'solar:user-remove-bold',
  shieldUser: 'solar:shield-user-bold',
  
  // Time & Attendance
  clock: 'solar:clock-bold',
  calendar: 'solar:calendar-bold',
  calendarDate: 'solar:calendar-date-bold',
  alarm: 'solar:alarm-bold',
  timer: 'solar:timer-bold',
  time: 'solar:clock-circle-bold',
  
  // Money & Finance
  money: 'solar:dollar-bold',
  wallet: 'solar:wallet-bold',
  walletMoney: 'solar:wallet-money-bold',
  wadMoney: 'solar:wad-of-money-bold',
  handMoney: 'solar:hand-money-bold',
  chatMoney: 'solar:chat-round-money-bold',
  
  // Actions & Operations
  add: 'solar:add-circle-bold',
  edit: 'solar:edit-bold',
  delete: 'solar:trash-bin-trash-bold',
  save: 'solar:floppy-disk-bold',
  download: 'solar:download-bold',
  upload: 'solar:upload-bold',
  export: 'solar:export-bold',
  import: 'solar:import-bold',
  refresh: 'solar:refresh-bold',
  check: 'solar:check-circle-bold',
  cancel: 'solar:close-circle-bold',
  
  // Status & Feedback
  success: 'solar:check-circle-bold',
  error: 'solar:close-circle-bold',
  warning: 'solar:danger-triangle-bold',
  info: 'solar:info-circle-bold',
  loading: 'solar:spinner-bold',
  
  // Data & Storage
  database: 'solar:database-bold',
  cloudStorage: 'solar:cloud-storage-bold',
  folder: 'solar:folder-bold',
  file: 'solar:document-bold',
  document: 'solar:document-text-bold',
  
  // Charts & Analytics
  chart: 'solar:chart-bold',
  graph: 'solar:graph-bold',
  pieChart: 'solar:pie-chart-bold',
  presentationGraph: 'solar:presentation-graph-bold',
  roundGraph: 'solar:round-graph-bold',
  
  // Forms & Input
  calculator: 'solar:calculator-bold',
  percent: 'solar:percent-bold',
  list: 'solar:list-bold',
  search: 'solar:magnifer-bold',
  filter: 'solar:filter-bold',
  
  // Business & Work
  work: 'solar:briefcase-bold',
  office: 'solar:building-bold',
  meeting: 'solar:users-group-two-rounded-bold',
  task: 'solar:task-list-bold',
  project: 'solar:widget-bold',
  
  // Communication
  message: 'solar:chat-round-bold',
  email: 'solar:letter-bold',
  phone: 'solar:phone-bold',
  notification: 'solar:bell-bold',
  
  // Health & Benefits
  heart: 'solar:heart-bold',
  medical: 'solar:medical-kit-bold',
  insurance: 'solar:shield-bold',
  health: 'solar:health-bold',
  
  // Time Off & Leave
  vacation: 'solar:airplane-bold',
  sick: 'solar:medical-kit-bold',
  holiday: 'solar:star-bold',
  weekend: 'solar:calendar-bold',
  
  // Payroll Specific
  salary: 'solar:wallet-money-bold',
  bonus: 'solar:gift-bold',
  deduction: 'solar:minus-circle-bold',
  tax: 'solar:percent-bold',
  overtime: 'solar:clock-bold',
  attendance: 'solar:document-add-bold',
  payroll: 'solar:chart-bold',
  
  // Gender & Demographics
  male: 'solar:male-bold',
  female: 'solar:female-bold',
  married: 'solar:heart-bold',
  single: 'solar:user-bold',
  
  // Day Types
  regular: 'solar:clock-bold',
  holiday: 'solar:star-bold',
  paidLeave: 'solar:heart-bold',
  unpaidLeave: 'solar:minus-circle-bold',
  overtime: 'solar:clock-bold',
  
  // Actions by Context
  addEmployee: 'solar:user-plus-bold',
  editEmployee: 'solar:user-edit-bold',
  deleteEmployee: 'solar:user-remove-bold',
  addAttendance: 'solar:document-add-bold',
  editAttendance: 'solar:edit-bold',
  deleteAttendance: 'solar:trash-bin-trash-bold',
  addAdjustment: 'solar:plus-circle-bold',
  removeAdjustment: 'solar:minus-circle-bold',
  saveConfig: 'solar:floppy-disk-bold',
  resetConfig: 'solar:refresh-bold',
  exportData: 'solar:export-bold',
  importData: 'solar:import-bold',
  clearData: 'solar:trash-bin-trash-bold',
  
  // Status Badges
  statusActive: 'solar:check-circle-bold',
  statusInactive: 'solar:close-circle-bold',
  statusPending: 'solar:clock-bold',
  statusApproved: 'solar:check-circle-bold',
  statusRejected: 'solar:close-circle-bold',
  
  // Navigation Icons
  navEmployees: 'solar:users-group-rounded-bold',
  navAttendance: 'solar:clock-circle-bold',
  navPayroll: 'solar:calculator-bold',
  navPayslips: 'solar:document-text-bold',
  navConfig: 'solar:settings-bold',
  
  // Theme & UI
  themeLight: 'solar:sun-bold',
  themeDark: 'solar:moon-bold',
  themeToggle: 'solar:sun-bold',
  menuToggle: 'solar:hamburger-menu-bold',
  
  // Additional Useful Icons
  star: 'solar:star-bold',
  gift: 'solar:gift-bold',
  shield: 'solar:shield-bold',
  lock: 'solar:lock-bold',
  unlock: 'solar:unlock-bold',
  eye: 'solar:eye-bold',
  eyeClosed: 'solar:eye-closed-bold',
  copy: 'solar:copy-bold',
  paste: 'solar:clipboard-bold',
  link: 'solar:link-bold',
  external: 'solar:external-link-bold',
  help: 'solar:question-circle-bold',
  about: 'solar:info-circle-bold',
  support: 'solar:headphones-bold',
  feedback: 'solar:chat-round-bold'
}

// Helper function to get icon name with fallback
export const getIcon = (key, fallback = 'solar:question-circle-bold') => {
  return ICONS[key] || fallback
}

// Icon categories for easier selection
export const ICON_CATEGORIES = {
  navigation: ['home', 'settings', 'menu', 'close', 'back', 'forward'],
  users: ['user', 'users', 'userAdd', 'userEdit', 'userRemove', 'shieldUser'],
  time: ['clock', 'calendar', 'calendarDate', 'alarm', 'timer', 'time'],
  money: ['money', 'wallet', 'walletMoney', 'wadMoney', 'handMoney', 'chatMoney'],
  actions: ['add', 'edit', 'delete', 'save', 'download', 'upload', 'export', 'import'],
  status: ['success', 'error', 'warning', 'info', 'loading'],
  data: ['database', 'cloudStorage', 'folder', 'file', 'document'],
  charts: ['chart', 'graph', 'pieChart', 'presentationGraph', 'roundGraph'],
  forms: ['calculator', 'percent', 'list', 'search', 'filter'],
  business: ['work', 'office', 'meeting', 'task', 'project'],
  communication: ['message', 'email', 'phone', 'notification'],
  health: ['heart', 'medical', 'insurance', 'health'],
  timeOff: ['vacation', 'sick', 'holiday', 'weekend'],
  payroll: ['salary', 'bonus', 'deduction', 'tax', 'overtime', 'attendance', 'payroll'],
  demographics: ['male', 'female', 'married', 'single'],
  dayTypes: ['regular', 'holiday', 'paidLeave', 'unpaidLeave', 'overtime'],
  ui: ['themeLight', 'themeDark', 'themeToggle', 'menuToggle']
} 