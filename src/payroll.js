/**
 * Functional payroll calculator - pure functions for all calculations
 * Declarative step definitions with minimal complexity
 */

import { calculateDailyRate, calculateHourlyRate } from './core.js'
import { applyRules, RULE_TYPES, normalizePercentage } from './rules.js'

// Step definitions - simplified for rules-based system
export const STEPS = [
  { id: 'config', title: 'Configuration', icon: 'solar:settings-bold-duotone', type: 'config' },
  { id: 'employees', title: 'Employees', icon: 'solar:users-group-rounded-bold-duotone', type: 'form' },
  { id: 'attendance', title: 'Attendance', icon: 'solar:calendar-mark-bold-duotone', type: 'form' },
  { id: 'adjustments', title: 'Adjustments', icon: 'solar:settings-minimalistic-bold-duotone', type: 'form' },
  { id: 'report', title: 'Reports', icon: 'solar:document-text-bold-duotone', type: 'report' }
]

// Pure calculation functions using rules engine
export const calculateEmployeePayroll = (employee, attendanceItems, adjustments, rules, basicConfig) => {
  const dailyRate = calculateDailyRate(employee.dailySalary)
  const hourlyRate = calculateHourlyRate(employee.dailySalary, basicConfig.workdayHours)
  const ruleResults = applyRules(employee, attendanceItems, rules, basicConfig)
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
    
    // PERCENTAGE_MONTHLY deductions: item.value is already normalized percentage, apply to gross
    if (item.rule.type === RULE_TYPES.PERCENTAGE_MONTHLY || item.rule.type === 'percentage_monthly') {
      const deductionValue = grossSalary * item.value
      item.finalValue = deductionValue
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
    totalHours: ruleResults.totalHours,
    actualDays: ruleResults.actualDays,
    baseSalary,
    attendanceAdjustment: ruleResults.attendanceAdjustment ?? 0,
    hoursAdjustment: ruleResults.hoursAdjustment ?? 0,
    ruleResults,
    adjustmentTotal,
    grossSalary,
    finalSalary,
    configSnapshot: { ...basicConfig }
  }
}

const formatPercentage = (value) => `${(value * 100).toFixed(1)}%`

const createFixedRuleStep = (ruleData, _result, type) => ({
  label: ruleData.rule.label,
  formula: 'Fixed Amount',
  formulaWithValues: `${ruleData.rule.value.toLocaleString()} = ${ruleData.value.toLocaleString()}`,
  result: ruleData.value,
  explanation: `Fixed ${type} amount added as-is (no proration by days worked).`,
  inputs: { amount: ruleData.rule.value },
  type
})

const createDaysMultiplierStep = (ruleData, result, type) => {
  const workDays = result.configSnapshot?.workingDaysPerMonth ?? 22
  const attendanceDelta = result.ruleResults?.attendanceDays ?? 0
  const totalDaysWorked = result.ruleResults?.totalDaysWorked ?? Math.max(0, workDays + attendanceDelta)
  const dailyRate = result.employee.dailySalary
  const fullMonthValue = ruleData.rule.value * dailyRate
  const fmt = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const deltaStr = attendanceDelta >= 0 ? `+${attendanceDelta}` : `${attendanceDelta}`
  const capped = totalDaysWorked >= workDays
  const formulaWithValues = capped
    ? `(${ruleData.rule.value} × ${fmt(dailyRate)}) = ${fmt(fullMonthValue)} (full month, ${totalDaysWorked} days ≥ ${workDays})`
    : `(${ruleData.rule.value} × ${fmt(dailyRate)}) × (${totalDaysWorked} ÷ ${workDays}) = ${fmt(fullMonthValue)} × (${totalDaysWorked}/${workDays}) = ${ruleData.value.toLocaleString()}`
  return {
    label: ruleData.rule.label,
    formula: capped ? 'Multiplier × Daily salary (capped at full month)' : '(Multiplier × Daily salary) × (Days worked ÷ Working days/month)',
    formulaWithValues,
    result: ruleData.value,
    explanation: capped
      ? `${type.charAt(0).toUpperCase() + type.slice(1)}: full month = ${ruleData.rule.value} × daily salary = ${fmt(fullMonthValue)} (days worked ${totalDaysWorked} ≥ ${workDays}).`
      : `${type.charAt(0).toUpperCase() + type.slice(1)}: full month = ${ruleData.rule.value} × daily salary = ${fmt(fullMonthValue)}; prorated for ${totalDaysWorked} days (${workDays} base ${deltaStr} attendance).`,
    inputs: { fullMonthValue, totalDaysWorked, workDays, dailyRate, multiplier: ruleData.rule.value },
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
  const percentage = ruleData.value // Already normalized
  const calc = monthlySalary * percentage
  
  return {
    label: ruleData.rule.label,
    formula: type === 'bonus' ? '(Daily Salary × 30) × Percentage' : 'Gross Salary × Percentage',
    formulaWithValues: type === 'bonus' 
      ? `(${result.employee.dailySalary.toLocaleString()} × 30) × ${formatPercentage(percentage)} = ${monthlySalary.toLocaleString()} × ${formatPercentage(percentage)} = ${calc.toLocaleString()}`
      : `${result.grossSalary.toLocaleString()} × ${formatPercentage(percentage)} = ${calc.toLocaleString()}`,
    result: ruleData.finalValue ?? calc,
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
  const percentage = ruleData.value // Already normalized
  const calc = result.baseSalary * percentage
  return {
    label: ruleData.rule.label,
    formula: 'Base Salary × Percentage',
    formulaWithValues: `${result.baseSalary.toLocaleString()} × ${formatPercentage(percentage)} = ${calc.toLocaleString()}`,
    result: ruleData.finalValue ?? calc,
    explanation: `${type.charAt(0).toUpperCase() + type.slice(1)} calculated as ${formatPercentage(percentage)} of the base salary (hours worked).`,
    inputs: { baseSalary: result.baseSalary, percentage: formatPercentage(percentage) },
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
    'base-salary': () => ({ dailyRate: result.employee.dailySalary, workDays: result.configSnapshot.workingDaysPerMonth ?? 22, output: result.baseSalary }),
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
  steps.push({
    label: 'Input Summary',
    formula: 'Base = Days worked × Daily rate',
    formulaWithValues: `Days worked = working days in month − days not worked (from attendance). Base = days worked × daily salary. See Base Salary step.`,
    result: result.employee.dailySalary,
    explanation: 'Employee daily salary and config. Base = days worked × daily rate; days not worked = full days of undertime (undertime hours ÷ hours per day).',
    inputs: { dailySalary: result.employee.dailySalary, workdayHours: result.configSnapshot.workdayHours, workDays: result.configSnapshot.workingDaysPerMonth ?? 22 },
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
  const workDays = result.configSnapshot.workingDaysPerMonth ?? 22
  const workdayHours = result.configSnapshot.workdayHours
  const expectedHours = workDays * workdayHours
  const fmtRate = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const adj = result.hoursAdjustment ?? 0
  const attendanceEffect = result.attendanceAdjustment ?? 0
  steps.push(adj !== 0
    ? {
        label: 'Overtime / Undertime',
        formula: 'Hours adjustment × Hourly rate = effect on base',
        formulaWithValues: `Expected ${expectedHours.toFixed(1)}h; adjustment ${adj >= 0 ? '+' : ''}${adj.toFixed(1)}h × ${fmtRate(result.hourlyRate)}/h = ${attendanceEffect >= 0 ? '+' : ''}${attendanceEffect.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        result: attendanceEffect,
        explanation: 'Overtime adds to and undertime subtracts from base; applied using configured OT/UT rates.',
        inputs: { expectedHours, hoursAdjustment: adj, hourlyRate: result.hourlyRate },
        type: 'attendance'
      }
    : {
        label: 'Overtime / Undertime',
        formula: 'No adjustment',
        formulaWithValues: 'Expected hours only; no overtime or undertime.',
        result: 0,
        explanation: 'No attendance-based hours adjustment this period.',
        inputs: { expectedHours },
        type: 'attendance'
      })
  const daysNotWorked = result.ruleResults.daysNotWorked ?? Math.max(0, workDays - (result.ruleResults.totalDaysWorked ?? workDays))
  const totalDaysWorked = result.ruleResults.totalDaysWorked ?? workDays
  const baseFromDays = result.ruleResults.baseFromDays ?? (result.employee.dailySalary * totalDaysWorked)
  const overtimePay = result.ruleResults.overtimePay ?? 0
  const dailyRate = result.employee.dailySalary
  const baseFormulaValues = overtimePay > 0
    ? `${workDays} − ${daysNotWorked} days not worked = ${totalDaysWorked} days × ${dailyRate.toLocaleString()}/day = ${baseFromDays.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}; + Overtime ${overtimePay.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} = ${result.baseSalary.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : `${workDays} − ${daysNotWorked} days not worked = ${totalDaysWorked} days × ${dailyRate.toLocaleString()}/day = ${result.baseSalary.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  steps.push({
    label: 'Base Salary',
    formula: overtimePay > 0 ? 'Days worked × Daily rate + Overtime pay' : 'Days worked × Daily rate',
    formulaWithValues: baseFormulaValues,
    result: result.baseSalary,
    explanation: 'Days worked = working days in month − days not worked (each full day of undertime counts as 1). Base = days worked × daily rate; overtime added if any.',
    inputs: { workDays, daysNotWorked, totalDaysWorked, dailyRate, baseFromDays, overtimePay },
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
    formula: 'Base + Bonuses + Manual Adjustments',
    formulaWithValues: `${result.baseSalary.toLocaleString()} + ${totalBonuses.toLocaleString()} + ${result.adjustmentTotal.toLocaleString()} = ${grossSalaryCalc.toLocaleString()}`,
    result: result.grossSalary,
    explanation: 'The total salary before deductions. This includes base salary (hours-based), all bonuses, and manual adjustments.',
    inputs: { base: result.baseSalary, bonuses: totalBonuses, adjustments: result.adjustmentTotal },
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
  { key: 'childrenStatus', label: 'Has children', type: 'checkbox' },
  { key: 'dailySalary', label: 'Daily Salary', type: 'number', required: true, min: 0 },
  { key: 'yearsOfExperience', label: 'Years of Experience', type: 'number', min: 0, step: 0.1 },
  { key: 'probationary', label: 'Probationary', type: 'checkbox' }
]
