/**
 * Enhanced i18n system for XPayroll
 * Workflow-focused with comprehensive label management
 */

import { get } from 'svelte/store'

// ============================================================================
// COMPREHENSIVE LABELS DICTIONARY
// ============================================================================

const labels = {
  en: {
    // Application
    appName: 'XPayroll',
    appSubtitle: 'Professional Payroll Management',
    appDescription: 'Modern payroll management system for efficient business operations',
    
    // Workflows
    setup: 'Setup',
    employees: 'Employees', 
    attendance: 'Attendance',
    payroll: 'Payroll',
    reports: 'Reports',
    settings: 'Settings',
    
    // Workflow Descriptions
    setupDescription: 'Configure business rules and calculations',
    employeesDescription: 'Manage employee information',
    attendanceDescription: 'Record daily attendance',
    payrollDescription: 'Calculate salaries transparently',
    reportsDescription: 'Generate payslip reports',
    settingsDescription: 'System preferences and data management',
    
    // Wizard Steps
    wizardStep: 'Step',
    wizardStepOf: 'of',
    wizardPrevious: 'Previous',
    wizardNext: 'Next',
    wizardComplete: 'Complete',
    wizardBack: 'Back',
    
    // Business Configuration
    businessConfiguration: 'Business Configuration',
    workingTime: 'Working Time',
    workingTimeDescription: 'Configure basic working hours and days',
    bonusStructure: 'Bonus Structure',
    bonusStructureDescription: 'Setup bonus calculations and amounts',
    deductions: 'Deductions',
    deductionsDescription: 'Configure automatic deductions',
    dayTypes: 'Day Types',
    dayTypesDescription: 'Define how different day types are handled',
    reviewSave: 'Review & Save',
    reviewSaveDescription: 'Review your configuration and save changes',
    
    // Working Time Configuration
    workdayHours: 'Working Hours Per Day',
    workdayHoursDescription: 'Standard working hours per day (including breaks)',
    workingDaysPerMonth: 'Working Days Per Month',
    workingDaysPerMonthDescription: 'Number of working days in a typical month',
    
    // Calculations Explanations
    howWorkingTimeAffectsSalary: 'How Working Time Affects Salary',
    dailyRateCalculation: 'Daily Rate Calculation',
    hourlyRateCalculation: 'Hourly Rate Calculation',
    dailyRateFormula: 'Monthly Salary ÷ Working Days = Daily Rate',
    hourlyRateFormula: 'Daily Rate ÷ Working Hours = Hourly Rate',
    example: 'Example',
    
    // Bonus Configuration
    howBonusesAreCalculated: 'How Bonuses Are Calculated',
    dailyRateBonuses: 'Daily Rate Bonuses (E & S)',
    fixedAmountBonuses: 'Fixed Amount Bonuses (K, M, T)',
    dailyRateBonusFormula: 'Bonus Amount = Daily Rate × Multiplier',
    fixedBonusFormula: 'Fixed amount added to salary',
    bonusE: 'Bonus E',
    bonusEDescription: 'Multiplier of daily rate (typically 5 days)',
    bonusS: 'Bonus S', 
    bonusSDescription: 'Multiplier of daily rate (typically 2.5 days)',
    bonusK: 'Bonus K',
    bonusKDescription: 'Fixed amount for all employees',
    bonusM: 'Bonus M',
    bonusMDescription: 'Fixed amount for all employees',
    bonusT: 'Bonus T',
    bonusTDescription: 'Additional bonus for married employees',
    bonusTMarried: 'Bonus T (Married Only)',
    
    // Deductions Configuration
    howDeductionsAreApplied: 'How Deductions Are Applied',
    insuranceDeductionProcess: 'Insurance Deduction Process',
    finalSalaryCalculation: 'Final Salary Calculation',
    insuranceDeductionFormula: 'Deduction = (Basic Salary + All Bonuses + Adjustments) × Rate',
    finalSalaryFormula: 'Final Salary = Total Before Deductions - Insurance',
    insuranceDeductionRate: 'Insurance Deduction Rate',
    insuranceDeductionRateDescription: 'Percentage of total salary deducted for insurance (0.07 = 7%)',
    
    // Day Types Configuration
    dayTypesHourCalculations: 'Day Types & Hour Calculations',
    regularDays: 'Regular Days',
    regularDaysDescription: 'Hours = Calculated from entry/exit times',
    holidayPaidLeave: 'Holiday & Paid Leave',
    holidayPaidLeaveDescription: 'Hours = Fixed hours automatically',
    regularDayExample: 'Entry: 08:00, Exit: 17:00 = 9 hours',
    fixedHoursExample: 'Employee gets full day credit without working',
    
    // Configuration Summary
    configurationSummary: 'Configuration Summary',
    workingTimeSummary: 'Working Time',
    bonusesSummary: 'Bonuses', 
    deductionsSummary: 'Deductions',
    unsavedChanges: 'You have unsaved changes that will be applied when you complete the wizard.',
    configurationUpToDate: 'Configuration is up to date.',
    
    // Employee Management
    employeeManagement: 'Employee Management',
    employeeOverview: 'Employee Overview',
    employeeOverviewDescription: 'View and manage all employees',
    basicInformation: 'Basic Information',
    basicInformationDescription: 'Employee name and demographics',
    salaryDetails: 'Salary Details',
    salaryDetailsDescription: 'Monthly salary and calculations',
    
    // Employee Information
    employeeDemographics: 'Employee Demographics',
    employeeDemographicsDescription: 'Basic employee information is used for bonus calculations and reporting. Marital status determines eligibility for Bonus T (married employees only).',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Enter employee\'s full name',
    gender: 'Gender',
    maritalStatus: 'Marital Status',
    maritalStatusDescription: 'Married employees receive additional Bonus T',
    monthlySalary: 'Monthly Salary',
    monthlySalaryPlaceholder: 'Enter monthly salary amount',
    
    // Gender Options
    male: 'Male',
    female: 'Female',
    
    // Marital Status Options
    single: 'Single',
    married: 'Married',
    
    // Salary Calculations
    salaryCalculations: 'Salary Calculations',
    salaryCalculationsDescription: 'The monthly salary is the base for all payroll calculations. Daily and hourly rates are automatically calculated based on your business configuration.',
    calculatedRates: 'Calculated Rates',
    dailyRate: 'Daily Rate',
    hourlyRate: 'Hourly Rate',
    dailyRateDetail: 'Monthly ÷ working days',
    hourlyRateDetail: 'Daily ÷ working hours',
    
    // Employee Summary
    employeeSummary: 'Employee Summary',
    bonusEligibility: 'This employee is eligible for Bonus T',
    
    // Employee Actions
    addNewEmployee: 'Add New Employee',
    addFirstEmployee: 'Add First Employee',
    editEmployee: 'Edit Employee',
    deleteEmployee: 'Delete Employee',
    noEmployeesAdded: 'No Employees Added',
    noEmployeesDescription: 'Start by adding your first employee to manage payroll.',
    backToEmployeeList: 'Back to Employee List',
    
    // Employee Statistics
    totalEmployees: 'Total Employees',
    totalMonthlyPayroll: 'Total Monthly Payroll',
    marriedEmployees: 'Married Employees',
    
    // Attendance Management
    attendanceManagement: 'Attendance Management',
    attendanceOverview: 'Attendance Overview',
    attendanceOverviewDescription: 'View attendance summary for all employees',
    selectEmployee: 'Select Employee',
    selectEmployeeDescription: 'Choose employee to record attendance',
    calendarView: 'Calendar View',
    calendarViewDescription: 'Record daily attendance for the month',
    bulkOperations: 'Bulk Operations',
    bulkOperationsDescription: 'Apply attendance to multiple employees',
    
    // Attendance Recording
    recordAttendance: 'Record Attendance',
    selectEmployeeCalculation: 'Select Employee for Calculation',
    daysRecorded: 'Days Recorded',
    totalHours: 'Total Hours',
    quickAdd: 'Quick Add',
    allWeekdays: 'All Weekdays',
    allWeekends: 'All Weekends',
    entireMonth: 'Entire Month',
    backToOverview: 'Back to Overview',
    
    // Day Types
    regular: 'Regular Work Day',
    holiday: 'Holiday',
    paidLeave: 'Paid Leave',
    unpaidLeave: 'Unpaid Leave',
    overtime: 'Overtime',
    
    // Calendar
    period: 'Period',
    entryTime: 'Entry Time',
    exitTime: 'Exit Time',
    hours: 'Hours',
    variable: 'Variable',
    fixed: 'Fixed',
    
    // Payroll Calculation
    payrollCalculation: 'Payroll Calculation',
    payrollOverview: 'Payroll Overview',
    payrollOverviewDescription: 'Review salary calculations for all employees',
    baseSalary: 'Base Salary',
    baseSalaryDescription: 'Calculate base salary from attendance',
    bonuses: 'Bonuses',
    bonusesDescription: 'Apply bonus calculations',
    adjustments: 'Adjustments',
    adjustmentsDescription: 'Add manual adjustments',
    deductionsStep: 'Deductions',
    deductionsStepDescription: 'Apply insurance deduction',
    finalResult: 'Final Result',
    finalResultDescription: 'Review and save calculation',
    
    // Salary Calculation Steps
    baseSalaryCalculationStep: 'Base Salary Calculation',
    baseSalaryCalculationDescription: 'Calculate base salary from hours worked',
    baseSalaryFormula: 'Hours Worked × Hourly Rate',
    bonusCalculationsStep: 'Bonus Calculations',
    bonusCalculationsDescription: 'Add all applicable bonuses',
    bonusCalculationsFormula: 'Daily Rate Bonuses + Fixed Amount Bonuses',
    manualAdjustments: 'Manual Adjustments',
    manualAdjustmentsDescription: 'Add positive/negative adjustments',
    manualAdjustmentsFormula: 'Sum of all adjustments',
    subtotalBeforeDeductions: 'Subtotal Before Deductions',
    subtotalBeforeDeductionsDescription: 'Sum of base salary, bonuses, and adjustments',
    subtotalFormula: 'Base + Bonuses + Adjustments',
    insuranceDeduction: 'Insurance Deduction',
    insuranceDeductionDescription: 'Apply insurance deduction percentage',
    insuranceDeductionFormula2: 'Subtotal × Insurance Rate',
    finalSalary: 'Final Salary',
    finalSalaryDescription: 'Subtract deductions from subtotal',
    finalSalaryFormula2: 'Subtotal - Insurance Deduction',
    
    // Calculation Details
    baseSalaryBreakdown: 'Base Salary Breakdown',
    bonusBreakdown: 'Bonus Breakdown',
    manualAdjustmentsDetail: 'Manual Adjustments',
    noManualAdjustments: 'No manual adjustments for this employee',
    subtotalComponents: 'Subtotal Components',
    insuranceDeductionDetail: 'Insurance Deduction',
    finalSalarySummary: 'Final Salary Summary',
    calculationComplete: 'Calculation Complete',
    calculationCompleteDescription: 'Review the final salary amount and click "Complete" to save this calculation.',
    
    // Payroll Overview
    totalPayroll: 'Total Payroll',
    calculated: 'Calculated',
    fixedBonuses: 'Fixed Bonuses',
    recalculateAll: 'Recalculate All',
    calculateSalary: 'Calculate Salary',
    preview: 'Preview',
    review: 'Review',
    
    // Reports Center
    reportsCenter: 'Reports Center',
    reportsOverview: 'Reports Overview',
    reportsOverviewDescription: 'View and generate payslip reports',
    generateReports: 'Generate Reports',
    summaryPayslip: 'Summary Payslip',
    detailedPayslip: 'Detailed Payslip',
    download: 'Download',
    exportAll: 'Export All',
    
    // Report Types
    reportType: 'Report Type',
    summary: 'Summary',
    detailed: 'Detailed',
    
    // Period Summary
    periodSummary: 'Summary',
    employees: 'Employees',
    averageSalary: 'Average Salary',
    
    // Payslip
    payslip: 'Payslip',
    summaryReport: 'Summary Report',
    detailedReport: 'Detailed Report',
    companyName: 'XPayroll Company',
    companyDescription: 'Professional Payroll Management',
    generated: 'Generated',
    type: 'Type',
    
    // Employee Information Section
    employeeInformation: 'Employee Information',
    name: 'Name',
    
    // Attendance Summary Section
    attendanceSummary: 'Attendance Summary',
    workingDays: 'Working Days',
    regularDays2: 'Regular Days',
    holidays: 'Holidays',
    
    // Salary Breakdown Section
    salaryBreakdown: 'Salary Breakdown',
    totalBonuses: 'Total Bonuses',
    insurance: 'Insurance',
    subtotal: 'Subtotal',
    
    // Detailed Calculations
    hoursWorked: 'Hours Worked',
    hoursWorkedDetail: 'Hours Worked:',
    hourlyRateDetail2: 'Hourly Rate:',
    baseSalaryResult: 'Base Salary:',
    noComment: 'No comment',
    insuranceRate: 'Insurance Rate',
    deductionAmount: 'Deduction Amount',
    subtotalAmount: 'Subtotal Amount',
    totalDeductions: 'Total Deductions',
    
    // Payslip Footer
    payslipFooter1: 'This is a computer-generated payslip and does not require a signature.',
    payslipFooter2: 'Generated by XPayroll Management System',
    
    // Actions
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    remove: 'Remove',
    close: 'Close',
    print: 'Print',
    export: 'Export',
    import: 'Import',
    reset: 'Reset',
    calculate: 'Calculate',
    recalculate: 'Recalculate',
    
    // Messages
    saved: 'Saved',
    deleted: 'Deleted',
    added: 'Added',
    updated: 'Updated',
    exported: 'Exported',
    imported: 'Imported',
    calculated: 'Calculated',
    
    // Status Messages
    configurationSaved: 'Configuration saved successfully!',
    employeeAdded: 'Employee added successfully!',
    employeeUpdated: 'Employee updated successfully!',
    employeeDeleted: 'Employee deleted successfully!',
    attendanceSaved: 'Attendance saved successfully!',
    attendanceRemoved: 'Attendance removed successfully!',
    salaryCalculated: 'Salary calculation saved successfully!',
    allSalariesRecalculated: 'All salary calculations updated!',
    payslipDownloaded: 'Payslip downloaded:',
    allPayslipsExported: 'All payslips exported successfully!',
    
    // Validation Messages
    nameRequired: 'Name must be at least 2 characters',
    salaryRequired: 'Monthly salary must be greater than 0',
    invalidGender: 'Invalid gender',
    invalidMaritalStatus: 'Invalid marital status',
    entryExitRequired: 'Entry and exit times required for regular days',
    exitAfterEntry: 'Exit time must be after entry time',
    
    // Confirmation Messages
    confirmDelete: 'Confirm Delete',
    confirmDeleteEmployee: 'Are you sure you want to delete',
    actionCannotBeUndone: 'This action cannot be undone and will remove all attendance records for this employee.',
    
    // Empty States
    noSalaryRecords: 'No Salary Records Found',
    noSalaryRecordsDescription: 'No salary calculations found for {period}. Calculate payroll first to generate reports.',
    noEmployeesForAttendance: 'No Employees Added',
    noEmployeesForAttendanceDescription: 'Add employees first before recording attendance.',
    noEmployeesForPayroll: 'No Employees Added',
    noEmployeesForPayrollDescription: 'Add employees first before calculating payroll.',
    
    // Form Labels
    formula: 'Formula',
    calculation: 'Calculation',
    result: 'Result',
    
    // Time Formats
    at: 'at',
    
    // Currency
    currency: 'IDR',
    
    // Footer
    footerDescription: 'Built with transparency and precision in mind',
    footerCopyright: '© 2025 XPayroll. All rights reserved.',
    
    // System
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Info'
  },
  
  fa: {
    // Application
    appName: 'XPayroll',
    appSubtitle: 'مدیریت حقوق و دستمزد حرفه‌ای',
    appDescription: 'سیستم مدیریت حقوق و دستمزد مدرن برای عملیات تجاری کارآمد',
    
    // Workflows
    setup: 'تنظیمات',
    employees: 'کارمندان', 
    attendance: 'حضور و غیاب',
    payroll: 'حقوق و دستمزد',
    reports: 'گزارشات',
    settings: 'تنظیمات',
    
    // Workflow Descriptions
    setupDescription: 'پیکربندی قوانین کسب‌وکار و محاسبات',
    employeesDescription: 'مدیریت اطلاعات کارمندان',
    attendanceDescription: 'ثبت حضور روزانه',
    payrollDescription: 'محاسبه حقوق به صورت شفاف',
    reportsDescription: 'تولید گزارشات فیش حقوق',
    settingsDescription: 'تنظیمات سیستم و مدیریت داده',
    
    // Wizard Steps
    wizardStep: 'مرحله',
    wizardStepOf: 'از',
    wizardPrevious: 'قبلی',
    wizardNext: 'بعدی',
    wizardComplete: 'تکمیل',
    wizardBack: 'بازگشت',
    
    // Business Configuration
    businessConfiguration: 'پیکربندی کسب‌وکار',
    workingTime: 'زمان کاری',
    workingTimeDescription: 'پیکربندی ساعات کاری پایه و روزها',
    bonusStructure: 'ساختار پاداش',
    bonusStructureDescription: 'تنظیم محاسبات و مبالغ پاداش',
    deductions: 'کسورات',
    deductionsDescription: 'پیکربندی کسورات خودکار',
    dayTypes: 'انواع روز',
    dayTypesDescription: 'تعریف نحوه برخورد با انواع مختلف روز',
    reviewSave: 'بررسی و ذخیره',
    reviewSaveDescription: 'پیکربندی خود را بررسی کنید و تغییرات را ذخیره کنید',
    
    // Working Time Configuration
    workdayHours: 'ساعات کاری در روز',
    workdayHoursDescription: 'ساعات کاری استاندارد در روز (شامل استراحت)',
    workingDaysPerMonth: 'روزهای کاری در ماه',
    workingDaysPerMonthDescription: 'تعداد روزهای کاری در یک ماه معمولی',
    
    // Calculations Explanations
    howWorkingTimeAffectsSalary: 'چگونه زمان کاری بر حقوق تأثیر می‌گذارد',
    dailyRateCalculation: 'محاسبه نرخ روزانه',
    hourlyRateCalculation: 'محاسبه نرخ ساعتی',
    dailyRateFormula: 'حقوق ماهانه ÷ روزهای کاری = نرخ روزانه',
    hourlyRateFormula: 'نرخ روزانه ÷ ساعات کاری = نرخ ساعتی',
    example: 'مثال',
    
    // Bonus Configuration
    howBonusesAreCalculated: 'چگونه پاداش‌ها محاسبه می‌شوند',
    dailyRateBonuses: 'پاداش‌های نرخ روزانه (E & S)',
    fixedAmountBonuses: 'پاداش‌های مبلغ ثابت (K, M, T)',
    dailyRateBonusFormula: 'مبلغ پاداش = نرخ روزانه × ضریب',
    fixedBonusFormula: 'مبلغ ثابت اضافه شده به حقوق',
    bonusE: 'پاداش E',
    bonusEDescription: 'ضریب نرخ روزانه (معمولاً 5 روز)',
    bonusS: 'پاداش S', 
    bonusSDescription: 'ضریب نرخ روزانه (معمولاً 2.5 روز)',
    bonusK: 'پاداش K',
    bonusKDescription: 'مبلغ ثابت برای همه کارمندان',
    bonusM: 'پاداش M',
    bonusMDescription: 'مبلغ ثابت برای همه کارمندان',
    bonusT: 'پاداش T',
    bonusTDescription: 'پاداش اضافی برای کارمندان متأهل',
    bonusTMarried: 'پاداش T (فقط متأهل)',
    
    // Deductions Configuration
    howDeductionsAreApplied: 'چگونه کسورات اعمال می‌شوند',
    insuranceDeductionProcess: 'فرآیند کسر بیمه',
    finalSalaryCalculation: 'محاسبه حقوق نهایی',
    insuranceDeductionFormula: 'کسورات = (حقوق پایه + همه پاداش‌ها + تعدیلات) × نرخ',
    finalSalaryFormula: 'حقوق نهایی = کل قبل از کسورات - بیمه',
    insuranceDeductionRate: 'نرخ کسر بیمه',
    insuranceDeductionRateDescription: 'درصدی از کل حقوق که برای بیمه کسر می‌شود (0.07 = 7%)',
    
    // Employee Management
    employeeManagement: 'مدیریت کارمندان',
    employeeOverview: 'نمای کلی کارمندان',
    employeeOverviewDescription: 'مشاهده و مدیریت همه کارمندان',
    basicInformation: 'اطلاعات پایه',
    basicInformationDescription: 'نام و اطلاعات دموگرافیک کارمند',
    salaryDetails: 'جزئیات حقوق',
    salaryDetailsDescription: 'حقوق ماهانه و محاسبات',
    
    // Employee Information
    employeeDemographics: 'اطلاعات دموگرافیک کارمند',
    employeeDemographicsDescription: 'اطلاعات پایه کارمند برای محاسبات پاداش و گزارش‌گیری استفاده می‌شود. وضعیت تأهل تعیین‌کننده واجد شرایط بودن برای پاداش T (فقط کارمندان متأهل) است.',
    fullName: 'نام کامل',
    fullNamePlaceholder: 'نام کامل کارمند را وارد کنید',
    gender: 'جنسیت',
    maritalStatus: 'وضعیت تأهل',
    maritalStatusDescription: 'کارمندان متأهل پاداش T اضافی دریافت می‌کنند',
    monthlySalary: 'حقوق ماهانه',
    monthlySalaryPlaceholder: 'مبلغ حقوق ماهانه را وارد کنید',
    
    // Gender Options
    male: 'مرد',
    female: 'زن',
    
    // Marital Status Options
    single: 'مجرد',
    married: 'متأهل',
    
    // Actions
    save: 'ذخیره',
    cancel: 'لغو',
    delete: 'حذف',
    edit: 'ویرایش',
    add: 'افزودن',
    remove: 'حذف',
    close: 'بستن',
    print: 'چاپ',
    export: 'صادرات',
    import: 'واردات',
    reset: 'بازنشانی',
    calculate: 'محاسبه',
    recalculate: 'محاسبه مجدد',
    
    // Messages
    saved: 'ذخیره شد',
    deleted: 'حذف شد',
    added: 'اضافه شد',
    updated: 'به‌روزرسانی شد',
    exported: 'صادر شد',
    imported: 'وارد شد',
    calculated: 'محاسبه شد',
    
    // Status Messages
    configurationSaved: 'پیکربندی با موفقیت ذخیره شد!',
    employeeAdded: 'کارمند با موفقیت اضافه شد!',
    employeeUpdated: 'کارمند با موفقیت به‌روزرسانی شد!',
    employeeDeleted: 'کارمند با موفقیت حذف شد!',
    attendanceSaved: 'حضور و غیاب با موفقیت ذخیره شد!',
    attendanceRemoved: 'حضور و غیاب با موفقیت حذف شد!',
    salaryCalculated: 'محاسبه حقوق با موفقیت ذخیره شد!',
    allSalariesRecalculated: 'همه محاسبات حقوق به‌روزرسانی شد!',
    payslipDownloaded: 'فیش حقوق دانلود شد:',
    allPayslipsExported: 'همه فیش‌های حقوق با موفقیت صادر شد!',
    
    // System
    loading: 'در حال بارگذاری...',
    error: 'خطا',
    success: 'موفقیت',
    warning: 'هشدار',
    info: 'اطلاعات',
    
    // Footer
    footerDescription: 'ساخته شده با شفافیت و دقت در نظر',
    footerCopyright: '© 2025 XPayroll. تمامی حقوق محفوظ است.'
  }
}

// ============================================================================
// REACTIVE TRANSLATION FUNCTION
// ============================================================================

// Create a reactive translation function
export const createT = (languageStore) => {
  return new Proxy({}, {
    get(target, key) {
      const currentLang = get(languageStore)
      const langLabels = labels[currentLang] || labels.en
      const value = langLabels[key]
      
      // Return interpolation function if value exists
      if (value) {
        return typeof value === 'string' && value.includes('{') 
          ? (params = {}) => {
              return Object.entries(params).reduce(
                (str, [paramKey, paramValue]) => str.replace(`{${paramKey}}`, paramValue),
                value
              )
            }
          : value
      }
      
      // Fallback: return key as human-readable text
      return String(key)
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, s => s.toUpperCase())
        .trim()
    }
  })
}

// Main translation function with fallback and interpolation
export const t = new Proxy({}, {
  get(target, key) {
    // Get current language from store
    const currentLang = typeof window !== 'undefined' && window.__svelte_stores__?.language?.value || 'en'
    const langLabels = labels[currentLang] || labels.en
    const value = langLabels[key]
    
    // Return interpolation function if value exists
    if (value) {
      return typeof value === 'string' && value.includes('{') 
        ? (params = {}) => {
            return Object.entries(params).reduce(
              (str, [paramKey, paramValue]) => str.replace(`{${paramKey}}`, paramValue),
              value
            )
          }
        : value
    }
    
    // Fallback: return key as human-readable text
    return String(key)
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, s => s.toUpperCase())
      .trim()
  }
})

// ============================================================================
// WORKFLOW-SPECIFIC LABEL GROUPS
// ============================================================================

export const workflowLabels = {
  setup: [
    'businessConfiguration', 'workingTime', 'bonusStructure', 'deductions', 
    'dayTypes', 'reviewSave'
  ],
  employees: [
    'employeeManagement', 'employeeOverview', 'basicInformation', 
    'salaryDetails', 'employeeSummary'
  ],
  attendance: [
    'attendanceManagement', 'attendanceOverview', 'selectEmployee',
    'calendarView', 'bulkOperations'
  ],
  payroll: [
    'payrollCalculation', 'payrollOverview', 'baseSalary', 'bonuses',
    'adjustments', 'deductionsStep', 'finalResult'
  ],
  reports: [
    'reportsCenter', 'reportsOverview', 'summaryPayslip', 'detailedPayslip'
  ]
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Get labels for a specific workflow
export const getWorkflowLabels = (workflowId) => {
  const workflowKeys = workflowLabels[workflowId] || []
  return workflowKeys.reduce((acc, key) => {
    acc[key] = t[key]
      return acc
    }, {})
}

// Format currency with locale support
export const formatCurrency = (amount, locale = 'id-ID', currency = 'IDR') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Format date with locale support
export const formatDate = (date, locale = 'en-US', options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
  
  return new Date(date).toLocaleDateString(locale, { ...defaultOptions, ...options })
}

// Format time with locale support
export const formatTime = (date, locale = 'en-US', options = {}) => {
  const defaultOptions = {
    hour: '2-digit',
    minute: '2-digit'
  }
  
  return new Date(date).toLocaleTimeString(locale, { ...defaultOptions, ...options })
}

// Get field label with icon suggestion
export const getFieldInfo = (fieldKey) => {
  const iconMap = {
    name: 'user',
    gender: 'user',
    maritalStatus: 'heart',
    monthlySalary: 'money',
    workdayHours: 'clock',
    workingDaysPerMonth: 'calendar',
    bonusE: 'star',
    bonusS: 'star',
    bonusK: 'wadMoney',
    bonusM: 'wadMoney',
    bonusT: 'heart',
    insurance: 'shield',
    entryTime: 'clock',
    exitTime: 'clock',
    regular: 'calendar',
    holiday: 'star',
    paidLeave: 'heart',
    unpaidLeave: 'minus'
  }
  
  return {
    label: t[fieldKey],
    icon: iconMap[fieldKey] || 'tag',
    description: t[`${fieldKey}Description`] || null
  }
}

// Generate form validation messages
export const getValidationMessage = (field, error) => {
  const validationKeys = {
    name: 'nameRequired',
    monthlySalary: 'salaryRequired',
    gender: 'invalidGender',
    maritalStatus: 'invalidMaritalStatus',
    entryExitTimes: 'entryExitRequired',
    timeOrder: 'exitAfterEntry'
  }
  
  return t[validationKeys[error]] || t.error
}

// Get success message for actions
export const getSuccessMessage = (action, entity = '') => {
  const messageKey = `${entity}${action.charAt(0).toUpperCase() + action.slice(1)}`
  return t[messageKey] || `${entity} ${action} successfully!`
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

// For backward compatibility
export const labelDict = labels
export const g = new Proxy({
  bonuses: 'Bonus Labels',
  deductions: 'Deduction Labels',
  dayTypes: 'Day Type Labels',
  sections: 'Section Labels',
  fields: 'Field Labels',
  buttons: 'Button Labels'
}, {
  get(target, key) {
    return target[key] || key
  }
})

// ============================================================================
// MAIN EXPORTS
// ============================================================================

// Export labels object for settings compatibility
export { labels }

// Export default for convenience
export default { t, labels, getWorkflowLabels, formatCurrency, formatDate, formatTime, getFieldInfo }