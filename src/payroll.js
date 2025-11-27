/**
 * Functional payroll calculator - pure functions for all calculations
 * Declarative step definitions with minimal complexity
 */

import { calculateDailyRate, calculateHourlyRate, calculateWorkingHours } from './core.js'
import { applyRules, RULE_TYPES } from './rules.js'

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
  const dailyRate = calculateDailyRate(employee.dailySalary)
  const hourlyRate = calculateHourlyRate(employee.dailySalary, basicConfig.workdayHours)
  
  // Calculate actual hours worked from attendance data
  const { totalHours, actualDays } = Object.values(attendance || {}).reduce((acc, d) => {
    if (d?.type === 'regular' && d.entryTime && d.exitTime) 
      return { totalHours: acc.totalHours + calculateWorkingHours(d.entryTime, d.exitTime), actualDays: acc.actualDays + 1 }
    if (d?.type === 'holiday') 
      return { totalHours: acc.totalHours + basicConfig.workdayHours, actualDays: acc.actualDays + 1 }
    return acc
  }, { totalHours: 0, actualDays: 0 })
  
  // Apply rules engine (this calculates baseSalary internally)
  const ruleResults = applyRules(employee, attendance, rules, basicConfig)
  
  // Use baseSalary from ruleResults to ensure consistency
  const baseSalary = ruleResults.baseSalary
  
  // Add manual adjustments
  const adjustmentTotal = adjustments.reduce((sum, adj) => sum + (adj.amount || 0), 0)
  
  // Gross salary = base + bonuses + adjustments (before deductions)
  // ruleResults.grossSalary already contains base + bonuses (no deductions)
  const grossSalary = ruleResults.grossSalary + adjustmentTotal
  
  // Calculate total deductions
  // PERCENTAGE_MONTHLY deductions (like insurance) should be calculated on GROSS salary
  // Other deductions use their stored values
  const totalDeductions = Object.values(ruleResults.deductions || {}).reduce((sum, item) => {
    if (!item?.rule) return sum
    
    // PERCENTAGE_MONTHLY deductions should be calculated on GROSS salary (base + bonuses + adjustments)
    // item.value from calculateRuleValue is just the percentage (e.g., 0.07 for 7%), not the calculated amount
    if (item.rule.type === RULE_TYPES.PERCENTAGE_MONTHLY || item.rule.type === 'percentage_monthly') {
      const percentage = item.rule.value >= 1 ? item.rule.value / 100 : item.rule.value
      const deductionValue = grossSalary * percentage
      item.value = deductionValue
      return sum + deductionValue
    }
    
    // Percentage base deductions have finalValue calculated from baseSalary
    if (item.percentage && item.percentageType === 'base') {
      return sum + (item.finalValue ?? 0)
    }
    
    // All other deductions (FIXED, HOURLY_MULTIPLIER, DAYS_MULTIPLIER)
    return sum + (item.value ?? 0)
  }, 0)
  
  // Final salary = gross salary - deductions (subtract only once)
  const finalSalary = Math.max(0, grossSalary - totalDeductions)
  
  return {
    employee,
    dailyRate,
    hourlyRate,
    totalHours,
    actualDays,
    baseSalary,
    ruleResults,
    adjustmentTotal,
    grossSalary: grossSalary,
    finalSalary: finalSalary,
    configSnapshot: { ...basicConfig }
  }
}

// Helper functions for building calculation steps
const createDaysProportionData = (result) => {
  const monthDays = result.configSnapshot.monthDays || 30
  const actualDays = result.actualDays || 0
  const daysProportion = monthDays > 0 ? Math.min(actualDays / monthDays, 1.0) : 0
  return { monthDays, actualDays, daysProportion }
}

const formatPercentage = (value) => `${(value * 100).toFixed(1)}%`

const createFixedRuleStep = (ruleData, result, type) => {
  const { monthDays, actualDays, daysProportion } = createDaysProportionData(result)
  return {
    label: ruleData.rule.label,
    formula: 'Fixed Amount × Days Worked Proportion',
    formulaWithValues: `${ruleData.rule.value.toLocaleString()} × ${formatPercentage(daysProportion)} = ${ruleData.value.toLocaleString()}`,
    result: ruleData.value,
    explanation: `Fixed ${type} amount proportionally adjusted based on actual days worked (${actualDays} out of ${monthDays} days = ${formatPercentage(daysProportion)}).`,
    inputs: { 
      fullAmount: ruleData.rule.value,
      actualDays,
      expectedDays: monthDays,
      daysProportion: formatPercentage(daysProportion),
      actualAmount: ruleData.value
    },
    type
  }
}

const createDaysMultiplierStep = (ruleData, result, type) => {
  const standardDayHours = 8
  const { monthDays, actualDays, daysProportion } = createDaysProportionData(result)
  const fullHours = ruleData.rule.value * standardDayHours
  const actualHours = ruleData.value / result.hourlyRate
  
  return {
    label: ruleData.rule.label,
    formula: '(Days Multiplier × 8 hours × Days Worked Proportion) × Hourly Rate',
    formulaWithValues: `(${ruleData.rule.value} days × ${standardDayHours}h × ${formatPercentage(daysProportion)}) × ${result.hourlyRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/h = ${actualHours.toFixed(2)}h × ${result.hourlyRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/h = ${ruleData.value.toLocaleString()}`,
    result: ruleData.value,
    explanation: `${type.charAt(0).toUpperCase() + type.slice(1)} calculated as ${ruleData.rule.value} days × ${standardDayHours} hours, proportionally adjusted based on actual days worked (${actualDays} out of ${monthDays} days = ${formatPercentage(daysProportion)}).`,
    inputs: { 
      days: ruleData.rule.value,
      hoursPerDay: standardDayHours,
      fullHours,
      actualHours,
      actualDays,
      expectedDays: monthDays,
      daysProportion: formatPercentage(daysProportion),
      hourlyRate: result.hourlyRate
    },
    type
  }
}

const createHourlyMultiplierStep = (ruleData, result, type) => {
  const calc = result.hourlyRate * ruleData.rule.value
  return {
    label: ruleData.rule.label,
    formula: 'Hourly Rate × Hours',
    formulaWithValues: `${result.hourlyRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} × ${ruleData.rule.value}h = ${calc.toLocaleString()}`,
    result: ruleData.value,
    explanation: `${type.charAt(0).toUpperCase() + type.slice(1)} calculated by multiplying the hourly rate by ${ruleData.rule.value} hours.`,
    inputs: { hourlyRate: result.hourlyRate, hours: ruleData.rule.value },
    type
  }
}

const createPercentageMonthlyStep = (ruleData, result, type) => {
  const monthlySalary = type === 'bonus' ? result.employee.dailySalary * 30 : result.grossSalary
  const percentage = ruleData.rule.value >= 1 ? ruleData.rule.value / 100 : ruleData.rule.value
  const calc = monthlySalary * percentage
  
  return {
    label: ruleData.rule.label,
    formula: type === 'bonus' ? '(Daily Salary × 30) × Percentage' : 'Gross Salary × Percentage',
    formulaWithValues: type === 'bonus' 
      ? `(${result.employee.dailySalary.toLocaleString()} × 30) × ${formatPercentage(percentage)} = ${monthlySalary.toLocaleString()} × ${formatPercentage(percentage)} = ${calc.toLocaleString()}`
      : `${result.grossSalary.toLocaleString()} × ${formatPercentage(percentage)} = ${calc.toLocaleString()}`,
    result: ruleData.value,
    explanation: type === 'bonus'
      ? `Bonus calculated as ${formatPercentage(percentage)} of the employee's monthly salary (daily salary × 30), regardless of hours worked.`
      : `Deduction calculated as ${formatPercentage(percentage)} of gross salary (base salary + bonuses + adjustments).`,
    inputs: type === 'bonus'
      ? { dailySalary: result.employee.dailySalary, monthlySalary, percentage: formatPercentage(percentage) }
      : { grossSalary: result.grossSalary, percentage: formatPercentage(percentage) },
    type
  }
}

const createPercentageBaseStep = (ruleData, result, type) => {
  const calc = result.baseSalary * ruleData.rule.value
  return {
    label: ruleData.rule.label,
    formula: 'Base Salary × Percentage',
    formulaWithValues: `${result.baseSalary.toLocaleString()} × ${formatPercentage(ruleData.rule.value)} = ${calc.toLocaleString()}`,
    result: ruleData.finalValue,
    explanation: `${type.charAt(0).toUpperCase() + type.slice(1)} calculated as ${formatPercentage(ruleData.rule.value)} of the base salary (hours worked).`,
    inputs: { baseSalary: result.baseSalary, percentage: formatPercentage(ruleData.rule.value) },
    type
  }
}

const RULE_STEP_BUILDERS = {
  fixed: createFixedRuleStep,
  days_multiplier: createDaysMultiplierStep,
  hourly_multiplier: createHourlyMultiplierStep,
  percentage_monthly: createPercentageMonthlyStep,
  percentage_base: createPercentageBaseStep
}

const createRuleStep = (ruleData, result, type) => {
  const builder = RULE_STEP_BUILDERS[ruleData.rule.type]
  if (!builder) {
    return {
      label: ruleData.rule.label,
      formula: 'Fixed Amount',
      formulaWithValues: `${ruleData.value.toLocaleString()}`,
      result: ruleData.value,
      explanation: `A fixed ${type} amount.`,
      inputs: { amount: ruleData.value },
      type
    }
  }
  return builder(ruleData, result, type)
}

// Step-specific calculation extractors (simplified for rules-based system)
export const getStepValue = (step, result, basicConfig) => {
  const values = {
    'daily-rate': () => ({ input: result.employee.dailySalary, output: result.dailyRate }),
    'hourly-rate': () => ({ input: result.employee.dailySalary, divisor: basicConfig.workdayHours, output: result.hourlyRate }),
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
  
  // Step 0: Summary of Inputs
  const actualDays = result.actualDays || 0
  const monthlySalaryDerived = result.employee.dailySalary * actualDays
  steps.push({
    label: 'Input Summary',
    formula: 'Daily Salary → Monthly Salary (based on actual attendance)',
    formulaWithValues: `Daily: ${result.employee.dailySalary.toLocaleString()}/day → Monthly: ${monthlySalaryDerived.toLocaleString()}/month (× ${actualDays} days from attendance grid)`,
    result: result.employee.dailySalary,
    explanation: `Employee daily salary. Monthly salary is calculated based on actual ${actualDays} days worked from the attendance grid.`,
    inputs: { 
      dailySalary: result.employee.dailySalary,
      actualDays: actualDays,
      monthlySalaryDerived: monthlySalaryDerived,
      workdayHours: result.configSnapshot.workdayHours
    },
    type: 'base'
  })
  
  // Step 1: Daily Rate
  steps.push({
    label: 'Daily Rate',
    formula: 'Daily Salary = Daily Rate',
    formulaWithValues: `${result.employee.dailySalary.toLocaleString()} = ${result.dailyRate.toLocaleString()}`,
    result: result.dailyRate,
    explanation: 'The daily salary is the base rate per working day. Daily rate equals daily salary.',
    inputs: { 
      dailySalary: result.employee.dailySalary
    },
    type: 'base'
  })
  
  // Step 2: Hourly Rate
  const hourlyRateCalc = result.employee.dailySalary / result.configSnapshot.workdayHours
  steps.push({
    label: 'Hourly Rate',
    formula: 'Daily Salary ÷ Hours per Day',
    formulaWithValues: `${result.employee.dailySalary.toLocaleString()} ÷ ${result.configSnapshot.workdayHours} = ${hourlyRateCalc.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
    result: result.hourlyRate,
    explanation: `Calculate the hourly rate by dividing the daily salary by ${result.configSnapshot.workdayHours} hours (standard working hours per day).`,
    inputs: { 
      dailySalary: result.employee.dailySalary,
      workingHours: result.configSnapshot.workdayHours
    },
    type: 'base'
  })
  
  // Step 3: Base Salary
  const baseSalaryCalc = result.totalHours * result.hourlyRate
  const daysWorked = result.actualDays || 0
  const avgHoursPerDay = daysWorked > 0 ? (result.totalHours / daysWorked).toFixed(1) : 0
  steps.push({
    label: 'Base Salary',
    formula: 'Actual Hours Worked × Hourly Rate',
    formulaWithValues: `${result.totalHours.toFixed(1)}h × ${result.hourlyRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/h = ${baseSalaryCalc.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
    result: result.baseSalary,
    explanation: `Base salary calculated from actual hours worked (${result.totalHours.toFixed(1)}h across ${daysWorked} days, avg ${avgHoursPerDay}h/day) × hourly rate.`,
    inputs: { 
      actualDays: daysWorked,
      totalHours: result.totalHours,
      avgHoursPerDay,
      hourlyRate: result.hourlyRate 
    },
    type: 'base'
  })
  
  // All Bonuses and Deductions
  steps.push(
    ...Object.values(result.ruleResults.bonuses || {}).map(d => createRuleStep(d, result, 'bonus')),
    ...Object.values(result.ruleResults.deductions || {}).map(d => createRuleStep(d, result, 'deduction'))
  )
  
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
  const grossSalaryCalc = result.baseSalary + totalBonuses + result.adjustmentTotal
  steps.push({
    label: 'Gross Salary',
    formula: 'Base Salary + All Bonuses + Manual Adjustments',
    formulaWithValues: `${result.baseSalary.toLocaleString()} + ${totalBonuses.toLocaleString()} + ${result.adjustmentTotal.toLocaleString()} = ${grossSalaryCalc.toLocaleString()}`,
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
  const finalSalaryCalc = result.grossSalary - totalDeductions
  steps.push({
    label: 'Take-Home Salary',
    formula: 'Gross Salary - All Deductions',
    formulaWithValues: `${result.grossSalary.toLocaleString()} - ${totalDeductions.toLocaleString()} = ${result.finalSalary.toLocaleString()}`,
    result: result.finalSalary,
    explanation: 'The final amount the employee receives after all deductions have been subtracted from the gross salary (which includes base salary, bonuses, and adjustments).',
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
  { key: 'dailySalary', label: 'Daily Salary', type: 'number', required: true, min: 0 },
  { key: 'yearsOfExperience', label: 'Years of Experience', type: 'number', min: 0, step: 0.1 },
  { key: 'jadid', label: 'Jadid (New Employee)', type: 'checkbox' }
]
