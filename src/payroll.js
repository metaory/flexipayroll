/**
 * Functional payroll calculator - pure functions for all calculations
 * Declarative step definitions with minimal complexity
 */

import { calculateDailyRate, calculateHourlyRate, calculateWorkingHours, formatCurrency, formatHours } from './core.js'
import { applyRules } from './rules.js'

// Step definitions - simplified for rules-based system
export const STEPS = [
  { id: 'config', title: 'Configuration', icon: 'solar:settings-bold-duotone', type: 'config' },
  { id: 'employees', title: 'Employees', icon: 'solar:users-group-rounded-bold-duotone', type: 'form' },
  { id: 'attendance', title: 'Attendance', icon: 'solar:calendar-mark-bold-duotone', type: 'form' },
  { id: 'adjustments', title: 'Adjustments', icon: 'solar:settings-minimalistic-bold-duotone', type: 'form' },
  { id: 'report', title: 'Reports', icon: 'solar:document-text-bold-duotone', type: 'report' }
]

// Pure calculation functions using rules engine
export const calculateEmployeePayroll = (employee, attendance, adjustments, rules, basicConfig) => {
  const dailyRate = calculateDailyRate(employee.monthlySalary, basicConfig.workingDaysPerMonth)
  const hourlyRate = calculateHourlyRate(dailyRate, basicConfig.workdayHours)
  
  // Calculate total hours from attendance
  const totalHours = Object.values(attendance || {}).reduce((sum, dayData) => {
    if (dayData.type === 'regular' && dayData.entryTime && dayData.exitTime) {
      return sum + calculateWorkingHours(dayData.entryTime, dayData.exitTime)
    }
    if (dayData.type === 'holiday') {
      return sum + basicConfig.workdayHours
    }
    return sum
  }, 0)
  
  const baseSalary = totalHours * hourlyRate
  
  // Apply rules engine
  const ruleResults = applyRules(employee, attendance, rules, basicConfig)
  
  // Add manual adjustments
  const adjustmentTotal = adjustments.reduce((sum, adj) => sum + (adj.amount || 0), 0)
  const finalGrossSalary = ruleResults.grossSalary + adjustmentTotal
  
  return {
    employee,
    dailyRate,
    hourlyRate,
    totalHours,
    baseSalary,
    ruleResults,
    adjustmentTotal,
    grossSalary: finalGrossSalary,
    finalSalary: finalGrossSalary,
    configSnapshot: { ...basicConfig }
  }
}

// Step-specific calculation extractors (simplified for rules-based system)
export const getStepValue = (step, result, basicConfig) => {
  const values = {
    'daily-rate': () => ({ input: result.employee.monthlySalary, divisor: basicConfig.workingDaysPerMonth, output: result.dailyRate }),
    'hourly-rate': () => ({ input: result.dailyRate, divisor: basicConfig.workdayHours, output: result.hourlyRate }),
    'base-salary': () => ({ hours: result.totalHours, rate: result.hourlyRate, output: result.baseSalary }),
    'gross': () => ({ base: result.baseSalary, rules: result.ruleResults, adjustments: result.adjustmentTotal, output: result.grossSalary }),
    'final': () => ({ gross: result.grossSalary, output: result.finalSalary })
  }
  return values[step.id]?.() || {}
}

// Basic config field definitions
export const BASIC_CONFIG_FIELDS = [
  { key: 'workdayHours', label: 'Working Hours/Day', type: 'number', min: 1, max: 24, step: 0.5 },
  { key: 'workingDaysPerMonth', label: 'Working Days/Month', type: 'number', min: 1, max: 31 },
  { key: 'currencySymbol', label: 'Currency Symbol', type: 'text' },
  { key: 'monthDays', label: 'Days in Month', type: 'number', min: 28, max: 31 },
  { key: 'firstDayWeekday', label: 'First Day Weekday', type: 'select', options: [
    { value: 'Saturday', label: 'Saturday' },
    { value: 'Sunday', label: 'Sunday' },
    { value: 'Monday', label: 'Monday' },
    { value: 'Tuesday', label: 'Tuesday' },
    { value: 'Wednesday', label: 'Wednesday' },
    { value: 'Thursday', label: 'Thursday' },
    { value: 'Friday', label: 'Friday' }
  ]}
]

// Calculation transparency - build detailed steps for formula display
export const buildCalculationSteps = (result) => {
  const steps = []
  
  // Step 1: Daily Rate
  steps.push({
    label: 'Daily Rate',
    formula: 'Monthly Salary ÷ Working Days per Month',
    formulaWithValues: `${result.employee.monthlySalary.toLocaleString()} ÷ ${result.configSnapshot.workingDaysPerMonth}`,
    result: result.dailyRate,
    explanation: 'Calculate how much the employee earns per working day by dividing their monthly salary by the number of working days in the month.',
    inputs: { 
      monthlySalary: result.employee.monthlySalary,
      workingDays: result.configSnapshot.workingDaysPerMonth 
    },
    type: 'base'
  })
  
  // Step 2: Hourly Rate
  steps.push({
    label: 'Hourly Rate',
    formula: 'Daily Rate ÷ Working Hours per Day',
    formulaWithValues: `${result.dailyRate.toLocaleString()} ÷ ${result.configSnapshot.workdayHours}`,
    result: result.hourlyRate,
    explanation: 'Using the daily rate from Step 1, we calculate the hourly rate by dividing by the standard working hours per day.',
    inputs: { 
      dailyRate: result.dailyRate,
      workingHours: result.configSnapshot.workdayHours 
    },
    type: 'base'
  })
  
  // Step 3: Base Salary
  steps.push({
    label: 'Base Salary',
    formula: 'Total Hours Worked × Hourly Rate',
    formulaWithValues: `${result.totalHours}h × ${result.hourlyRate.toLocaleString()}/h`,
    result: result.baseSalary,
    explanation: 'We multiply the actual hours worked this period by the hourly rate to get the base salary before any bonuses or deductions.',
    inputs: { 
      totalHours: result.totalHours,
      hourlyRate: result.hourlyRate 
    },
    type: 'base'
  })
  
  // Step 4: Bonuses (Fixed Amount)
  Object.entries(result.ruleResults.bonuses || {}).forEach(([ruleId, ruleData]) => {
    if (!ruleData.percentage) {
      steps.push({
        label: ruleData.rule.label,
        formula: 'Fixed Amount',
        formulaWithValues: `${ruleData.value.toLocaleString()}`,
        result: ruleData.value,
        explanation: `A fixed bonus amount that applies to ${(!ruleData.rule.criteria.appliesTo || ruleData.rule.criteria.appliesTo.length === 0) ? 'all employees' : 'specific employee criteria'}.`,
        inputs: { amount: ruleData.value },
        type: 'bonus'
      })
    }
  })
  
  // Step 5: Bonuses (Days Multiplier)
  Object.entries(result.ruleResults.bonuses || {}).forEach(([ruleId, ruleData]) => {
    if (ruleData.rule.type === 'days_multiplier') {
      steps.push({
        label: ruleData.rule.label,
        formula: 'Daily Rate × Multiplier',
        formulaWithValues: `${result.dailyRate.toLocaleString()} × ${ruleData.rule.value}`,
        result: ruleData.value,
        explanation: `Bonus calculated by multiplying the daily rate by ${ruleData.rule.value}. This represents ${ruleData.rule.value} days worth of salary as bonus.`,
        inputs: { 
          dailyRate: result.dailyRate,
          multiplier: ruleData.rule.value 
        },
        type: 'bonus'
      })
    }
  })
  
  // Step 6: Bonuses (Hourly Multiplier)
  Object.entries(result.ruleResults.bonuses || {}).forEach(([ruleId, ruleData]) => {
    if (ruleData.rule.type === 'hourly_multiplier') {
      steps.push({
        label: ruleData.rule.label,
        formula: 'Hourly Rate × Multiplier × Total Hours',
        formulaWithValues: `${result.hourlyRate.toLocaleString()} × ${ruleData.rule.value} × ${result.totalHours}h`,
        result: ruleData.value,
        explanation: `Overtime or hourly bonus calculated by multiplying the hourly rate by ${ruleData.rule.value} for each hour worked.`,
        inputs: { 
          hourlyRate: result.hourlyRate,
          multiplier: ruleData.rule.value,
          totalHours: result.totalHours
        },
        type: 'bonus'
      })
    }
  })
  
  // Step 7: Bonuses (Percentage Monthly)
  Object.entries(result.ruleResults.bonuses || {}).forEach(([ruleId, ruleData]) => {
    if (ruleData.rule.type === 'percentage_monthly') {
      steps.push({
        label: ruleData.rule.label,
        formula: 'Monthly Salary × Percentage',
        formulaWithValues: `${result.employee.monthlySalary.toLocaleString()} × ${(ruleData.rule.value * 100).toFixed(1)}%`,
        result: ruleData.value,
        explanation: `Bonus calculated as ${(ruleData.rule.value * 100).toFixed(1)}% of the employee's monthly salary, regardless of hours worked.`,
        inputs: { 
          monthlySalary: result.employee.monthlySalary,
          percentage: `${(ruleData.rule.value * 100).toFixed(1)}%`
        },
        type: 'bonus'
      })
    }
  })
  
  // Step 8: Bonuses (Percentage Base)
  Object.entries(result.ruleResults.bonuses || {}).forEach(([ruleId, ruleData]) => {
    if (ruleData.rule.type === 'percentage_base') {
      steps.push({
        label: ruleData.rule.label,
        formula: 'Base Salary × Percentage',
        formulaWithValues: `${result.baseSalary.toLocaleString()} × ${(ruleData.rule.value * 100).toFixed(1)}%`,
        result: ruleData.finalValue,
        explanation: `Bonus calculated as ${(ruleData.rule.value * 100).toFixed(1)}% of the base salary (hours worked). This bonus varies based on actual attendance.`,
        inputs: { 
          baseSalary: result.baseSalary,
          percentage: `${(ruleData.rule.value * 100).toFixed(1)}%`
        },
        type: 'bonus'
      })
    }
  })
  
  // Step 9: Deductions (Fixed Amount)
  Object.entries(result.ruleResults.deductions || {}).forEach(([ruleId, ruleData]) => {
    if (!ruleData.percentage) {
      steps.push({
        label: ruleData.rule.label,
        formula: 'Fixed Amount',
        formulaWithValues: `${ruleData.value.toLocaleString()}`,
        result: ruleData.value,
        explanation: `A fixed deduction amount that applies to ${(!ruleData.rule.criteria.appliesTo || ruleData.rule.criteria.appliesTo.length === 0) ? 'all employees' : 'specific employee criteria'}.`,
        inputs: { amount: ruleData.value },
        type: 'deduction'
      })
    }
  })
  
  // Step 10: Deductions (Percentage Monthly)
  Object.entries(result.ruleResults.deductions || {}).forEach(([ruleId, ruleData]) => {
    if (ruleData.rule.type === 'percentage_monthly') {
      steps.push({
        label: ruleData.rule.label,
        formula: 'Monthly Salary × Percentage',
        formulaWithValues: `${result.employee.monthlySalary.toLocaleString()} × ${(ruleData.rule.value * 100).toFixed(1)}%`,
        result: ruleData.value,
        explanation: `Deduction calculated as ${(ruleData.rule.value * 100).toFixed(1)}% of the employee's monthly salary, regardless of hours worked.`,
        inputs: { 
          monthlySalary: result.employee.monthlySalary,
          percentage: `${(ruleData.rule.value * 100).toFixed(1)}%`
        },
        type: 'deduction'
      })
    }
  })
  
  // Step 11: Deductions (Percentage Base)
  Object.entries(result.ruleResults.deductions || {}).forEach(([ruleId, ruleData]) => {
    if (ruleData.rule.type === 'percentage_base') {
      steps.push({
        label: ruleData.rule.label,
        formula: 'Base Salary × Percentage',
        formulaWithValues: `${result.baseSalary.toLocaleString()} × ${(ruleData.rule.value * 100).toFixed(1)}%`,
        result: ruleData.finalValue,
        explanation: `Deduction calculated as ${(ruleData.rule.value * 100).toFixed(1)}% of the base salary (hours worked). This deduction varies based on actual attendance.`,
        inputs: { 
          baseSalary: result.baseSalary,
          percentage: `${(ruleData.rule.value * 100).toFixed(1)}%`
        },
        type: 'deduction'
      })
    }
  })
  
  // Step 12: Manual Adjustments
  if (result.adjustmentTotal !== 0) {
    const adjustmentCount = result.adjustments?.length || 0
    steps.push({
      label: 'Manual Adjustments',
      formula: 'Sum of all manual adjustments',
      formulaWithValues: `${adjustmentCount} adjustment${adjustmentCount !== 1 ? 's' : ''} totaling ${result.adjustmentTotal.toLocaleString()}`,
      result: result.adjustmentTotal,
      explanation: `Manual adjustments added by the administrator. These can be positive (bonuses, gifts) or negative (loans, penalties) amounts.`,
      inputs: { count: adjustmentCount },
      type: 'adjustment'
    })
  }
  
  // Step 13: Gross Salary
  const totalBonuses = Object.values(result.ruleResults.bonuses || {}).reduce((sum, item) => sum + (item.finalValue || item.value), 0)
  steps.push({
    label: 'Gross Salary',
    formula: 'Base Salary + All Bonuses + Manual Adjustments',
    formulaWithValues: `${result.baseSalary.toLocaleString()} + ${totalBonuses.toLocaleString()} + ${result.adjustmentTotal.toLocaleString()}`,
    result: result.grossSalary,
    explanation: 'The total salary before deductions. This includes base salary, all bonuses, and manual adjustments.',
    inputs: { 
      base: result.baseSalary,
      bonuses: totalBonuses,
      adjustments: result.adjustmentTotal
    },
    type: 'summary'
  })
  
  // Step 14: Final Salary
  const totalDeductions = Object.values(result.ruleResults.deductions || {}).reduce((sum, item) => sum + (item.finalValue || item.value), 0)
  steps.push({
    label: 'Take-Home Salary',
    formula: 'Gross Salary - All Deductions',
    formulaWithValues: `${result.grossSalary.toLocaleString()} - ${totalDeductions.toLocaleString()}`,
    result: result.finalSalary,
    explanation: 'The final amount the employee receives after all deductions have been subtracted from the gross salary.',
    inputs: { 
      gross: result.grossSalary,
      deductions: totalDeductions
    },
    type: 'final'
  })
  
  return steps
}

export const EMPLOYEE_FIELDS = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'gender', label: 'Gender', type: 'select', options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }] },
  { key: 'maritalStatus', label: 'Marital Status', type: 'select', options: [{ value: 'single', label: 'Single' }, { value: 'married', label: 'Married' }] },
  { key: 'monthlySalary', label: 'Monthly Salary', type: 'number', required: true, min: 0 },
  { key: 'yearsOfExperience', label: 'Years of Experience', type: 'number', min: 0, step: 0.1 }
]
