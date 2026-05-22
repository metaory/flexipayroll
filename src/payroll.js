/**
 * Functional payroll calculator - pure functions for all calculations
 * Declarative step definitions with minimal complexity
 */

import { calculateDailyRate, calculateHourlyRate } from './core.js'
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
export const calculateEmployeePayroll = (employee, attendanceItems, adjustments, rules, basicConfig) => {
  const dailyRate = calculateDailyRate(employee.dailySalary)
  const hourlyRate = calculateHourlyRate(employee.dailySalary, basicConfig.workdayHours)
  const ruleResults = applyRules(employee, attendanceItems, rules, basicConfig)
  const baseSalary = ruleResults.baseSalary
  
  // Add manual adjustments
  const adjustmentTotal = adjustments.reduce((sum, adj) => sum + (adj.amount || 0), 0)
  
  // Build salary before monthly percentage rules.
  const monthlyBaseSalary = ruleResults.grossSalary + adjustmentTotal

  // Apply monthly percentage bonuses last on the monthly base salary.
  const monthlyBonusTotal = Object.values(ruleResults.bonuses || {}).reduce((sum, item) => {
    if (item?.rule?.type !== RULE_TYPES.PERCENTAGE_MONTHLY) return sum
    const bonusValue = monthlyBaseSalary * item.value
    item.finalValue = bonusValue
    return sum + bonusValue
  }, 0)

  const grossSalary = monthlyBaseSalary + monthlyBonusTotal
  
  // Calculate total deductions
  // PERCENTAGE_MONTHLY deductions (like insurance) should be calculated on GROSS salary
  // Other deductions use their stored values
  const totalDeductions = Object.values(ruleResults.deductions || {}).reduce((sum, item) => {
    if (!item?.rule) return sum
    
    // PERCENTAGE_MONTHLY deductions are applied last on the same monthly base.
    if (item.rule.type === RULE_TYPES.PERCENTAGE_MONTHLY || item.rule.type === 'percentage_monthly') {
      const deductionValue = monthlyBaseSalary * item.value
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
    attendanceItems: attendanceItems || [],
    adjustments: adjustments || [],
    dailyRate,
    hourlyRate,
    totalHours: ruleResults.totalHours,
    actualDays: ruleResults.actualDays,
    baseSalary,
    attendanceAdjustment: ruleResults.attendanceAdjustment ?? 0,
    hoursAdjustment: ruleResults.hoursAdjustment ?? 0,
    ruleResults,
    adjustmentTotal,
    monthlyBaseSalary,
    monthlyBonusTotal,
    grossSalary,
    finalSalary,
    configSnapshot: { ...basicConfig }
  }
}

const formatPercentage = (value) => `${(value * 100).toFixed(1)}%`
const RULE_TYPE_LABELS = {
  fixed: 'Fixed',
  hourly_prorated: 'Hourly Prorated',
  prorated: 'Hourly Prorated',
  fixed_daily_prorated: 'Fixed Daily Prorated',
  days_multiplier: 'Days x',
  hourly_multiplier: 'Hourly x',
  percentage_monthly: '% Monthly',
  percentage_base: '% Base'
}

const createFixedRuleStep = (ruleData, _result, type) => ({
  label: ruleData.rule.label,
  formula: 'Fixed Amount',
  formulaWithValues: `${ruleData.rule.value.toLocaleString()} = ${ruleData.value.toLocaleString()}`,
  result: ruleData.value,
  explanation: `Fixed ${type} amount added as-is (no proration by days worked).`,
  inputs: { amount: ruleData.rule.value },
  type
})

const createHourlyProratedStep = (ruleData, result, type) => {
  const monthDays = result.configSnapshot?.monthDays ?? 30
  const monthHourEquivalentDays = result.ruleResults?.monthHourEquivalentDays ?? monthDays
  const ratio = monthDays > 0 ? monthHourEquivalentDays / monthDays : 0
  const fullValue = ruleData.rule.value
  const formulaWithValues = `${fullValue.toLocaleString()} × (${monthHourEquivalentDays.toFixed(2)} ÷ ${monthDays}) = ${ruleData.value.toLocaleString()}`
  return {
    label: ruleData.rule.label,
    formula: 'Value × (Hour-equivalent month days ÷ Month days)',
    formulaWithValues,
    result: ruleData.value,
    explanation: `${type.charAt(0).toUpperCase() + type.slice(1)} uses hour-based attendance converted to month day-equivalent (${monthHourEquivalentDays.toFixed(2)}).`,
    inputs: { fullValue, monthHourEquivalentDays, monthDays, ratio },
    type
  }
}

const createFixedDailyProratedStep = (ruleData, result, type) => {
  const monthDays = result.configSnapshot?.monthDays ?? 30
  const effectiveDays = result.ruleResults?.effectiveDays ?? monthDays
  const cappedEffectiveDays = Math.min(effectiveDays, monthDays)
  return {
    label: ruleData.rule.label,
    formula: '(Fixed amount × Effective days) ÷ Month days',
    formulaWithValues: `(${ruleData.rule.value.toLocaleString()} × min(${effectiveDays}, ${monthDays})) ÷ ${monthDays} = ${ruleData.value.toLocaleString()}`,
    result: ruleData.value,
    explanation: `${type.charAt(0).toUpperCase() + type.slice(1)} uses day blocks from attendance and is capped at 100% of the fixed amount.`,
    inputs: { amount: ruleData.rule.value, effectiveDays, cappedEffectiveDays, monthDays },
    type
  }
}

const createDaysMultiplierStep = (ruleData, result, type) => {
  const monthDays = result.configSnapshot?.monthDays ?? 30
  const attendanceDelta = result.ruleResults?.attendanceDays ?? 0
  const effectiveDays = result.ruleResults?.effectiveDays ?? monthDays
  const totalDaysWorked = result.ruleResults?.totalDaysWorked ?? monthDays
  const dailyRate = result.employee.dailySalary
  const fullMonthValue = ruleData.rule.value * dailyRate
  const fmt = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const deltaStr = attendanceDelta >= 0 ? `+${attendanceDelta}` : `${attendanceDelta}`
  const ratio = monthDays > 0 ? effectiveDays / monthDays : 0
  const formulaWithValues = `(${ruleData.rule.value} × ${fmt(dailyRate)}) × (${effectiveDays} ÷ ${monthDays}) = ${fmt(fullMonthValue)} × ${ratio.toFixed(4)} = ${ruleData.value.toLocaleString()}`
  return {
    label: ruleData.rule.label,
    formula: '(Multiplier × Daily salary) × (Effective days ÷ Month days)',
    formulaWithValues,
    result: ruleData.value,
    explanation: `${type.charAt(0).toUpperCase() + type.slice(1)} uses effective days (${effectiveDays}) derived from attendance day blocks (month baseline ${monthDays}, attendance delta ${deltaStr}).`,
    inputs: { fullMonthValue, totalDaysWorked, effectiveDays, monthDays, dailyRate, multiplier: ruleData.rule.value },
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
  const monthlySalary = result.monthlyBaseSalary ?? result.grossSalary
  const percentage = ruleData.value // Already normalized
  const calc = monthlySalary * percentage
  
  return {
    label: ruleData.rule.label,
    formula: 'Monthly base salary × Percentage',
    formulaWithValues: `${monthlySalary.toLocaleString()} × ${formatPercentage(percentage)} = ${calc.toLocaleString()}`,
    result: ruleData.finalValue ?? calc,
    explanation: `${type.charAt(0).toUpperCase() + type.slice(1)} calculated last as ${formatPercentage(percentage)} of monthly base salary (after base, amount rules, % Base, and adjustments).`,
    inputs: { monthlySalary, percentage: formatPercentage(percentage) },
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
  hourly_prorated: createHourlyProratedStep,
  prorated: createHourlyProratedStep,
  fixed_daily_prorated: createFixedDailyProratedStep,
  days_multiplier: createDaysMultiplierStep,
  hourly_multiplier: createHourlyMultiplierStep,
  percentage_monthly: createPercentageMonthlyStep,
  percentage_base: createPercentageBaseStep
}

const createRuleStep = (ruleData, result, type) => {
  const builder = RULE_STEP_BUILDERS[ruleData.rule.type]
  const ruleTypeLabel = RULE_TYPE_LABELS[ruleData.rule.type] || ruleData.rule.type
  if (!builder) {
    return {
      label: `${ruleData.rule.label} [${ruleTypeLabel}]`,
      formula: 'Fixed Amount',
      formulaWithValues: `${ruleData.value.toLocaleString()}`,
      result: ruleData.value,
      explanation: `A fixed ${type} amount.`,
      inputs: { amount: ruleData.value },
      type
    }
  }
  const step = builder(ruleData, result, type)
  return { ...step, label: `${step.label} [${ruleTypeLabel}]` }
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
  
  steps.push({
    label: 'Input Summary',
    formula: 'Base = Expected month base + Attendance hours adjustment',
    formulaWithValues: `Expected month base = working days × daily salary. Attendance adjustment = (OT hours × OT rate − UT hours × UT rate) × hourly rate.`,
    result: result.employee.dailySalary,
    explanation: 'Employee daily salary and config. Overtime and undertime are calculated directly from attendance hours (including minute fractions).',
    inputs: { dailySalary: result.employee.dailySalary, workdayHours: result.configSnapshot.workdayHours, workDays: result.configSnapshot.workingDaysPerMonth ?? 22 },
    type: 'base',
    section: 'inputs'
  })
  steps.push({
    label: 'Daily Rate',
    formula: 'Daily Salary = Daily Rate',
    formulaWithValues: `${result.employee.dailySalary.toLocaleString()} = ${result.dailyRate.toLocaleString()}`,
    result: result.dailyRate,
    explanation: 'The daily salary is the base rate per working day. Daily rate equals daily salary.',
    inputs: { dailySalary: result.employee.dailySalary },
    type: 'base',
    section: 'inputs'
  })
  const hourlyRateCalc = result.employee.dailySalary / result.configSnapshot.workdayHours
  steps.push({
    label: 'Hourly Rate',
    formula: 'Daily Salary ÷ Hours per Day',
    formulaWithValues: `${result.employee.dailySalary.toLocaleString()} ÷ ${result.configSnapshot.workdayHours} = ${hourlyRateCalc.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
    result: result.hourlyRate,
    explanation: `Calculate the hourly rate by dividing the daily salary by ${result.configSnapshot.workdayHours} hours (standard working hours per day).`,
    inputs: { dailySalary: result.employee.dailySalary, workingHours: result.configSnapshot.workdayHours },
    type: 'base',
    section: 'inputs'
  })
  const workDays = result.configSnapshot.workingDaysPerMonth ?? 22
  const workdayHours = result.configSnapshot.workdayHours
  const expectedHours = workDays * workdayHours
  const fmtRate = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const adj = result.hoursAdjustment ?? 0
  const attendanceEffect = result.attendanceAdjustment ?? 0
  const daysNotWorked = result.ruleResults.daysNotWorked ?? Math.max(0, workDays - (result.ruleResults.totalDaysWorked ?? workDays))
  const totalDaysWorked = result.ruleResults.totalDaysWorked ?? workDays
  const baseFromDays = result.ruleResults.baseFromDays ?? (result.employee.dailySalary * totalDaysWorked)
  const overtimePay = result.ruleResults.overtimePay ?? 0
  const undertimePay = result.ruleResults.undertimePay ?? 0
  const rawOvertimeHours = result.ruleResults.rawOvertimeHours ?? 0
  const rawUndertimeHours = result.ruleResults.rawUndertimeHours ?? 0
  const dailyRate = result.employee.dailySalary
  const otUtFormula = adj !== 0
    ? `(OT ${rawOvertimeHours.toFixed(2)}h × OT rate − UT ${rawUndertimeHours.toFixed(2)}h × UT rate) × ${fmtRate(result.hourlyRate)}/h = +${overtimePay.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} - ${undertimePay.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} = ${attendanceEffect >= 0 ? '+' : ''}${attendanceEffect.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : null
  steps.push(adj !== 0
    ? {
        label: 'Overtime / Undertime',
        formula: '(OT hours × OT rate × Hourly rate) − (UT hours × UT rate × Hourly rate)',
        formulaWithValues: otUtFormula,
        result: attendanceEffect,
        explanation: 'Attendance adjustment is hour-based. Entered hours/minutes in attendance directly impact payroll using OT/UT rates.',
        inputs: { expectedHours, hoursAdjustment: adj, hourlyRate: result.hourlyRate, rawOvertimeHours, rawUndertimeHours, overtimePay, undertimePay },
        type: 'attendance',
        section: 'attendance'
      }
    : {
        label: 'Overtime / Undertime',
        formula: 'No adjustment',
        formulaWithValues: 'Expected hours only; no overtime or undertime.',
        result: 0,
        explanation: 'No attendance-based hours adjustment this period.',
        inputs: { expectedHours },
        type: 'attendance',
        section: 'attendance'
      })
  const baseFormulaValues = `${workDays} days × ${dailyRate.toLocaleString()}/day = ${baseFromDays.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}; attendance adjustment ${attendanceEffect >= 0 ? '+' : ''}${attendanceEffect.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} => ${result.baseSalary.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  steps.push({
    label: 'Base Salary',
    formula: 'Expected month base + Attendance adjustment',
    formulaWithValues: baseFormulaValues,
    result: result.baseSalary,
    explanation: 'Expected month base comes from configured working days. Attendance adjustment then adds overtime pay and subtracts undertime pay from hour-based inputs.',
    inputs: { workDays, daysNotWorked, totalDaysWorked, dailyRate, baseFromDays, overtimePay, undertimePay, attendanceEffect },
    type: 'base',
    section: 'base'
  })
  steps.push(
    ...Object.values(result.ruleResults.bonuses || {}).map(d => ({ ...createRuleStep(d, result, 'bonus'), section: 'bonuses' })),
    ...Object.values(result.ruleResults.deductions || {}).map(d => ({ ...createRuleStep(d, result, 'deduction'), section: 'deductions' }))
  )
  if (result.adjustmentTotal !== 0) {
    const adjustmentCount = result.adjustments?.length || 0
    steps.push({
      label: 'Manual Adjustments',
      formula: 'Sum of all manual adjustments',
      formulaWithValues: `${adjustmentCount} adjustment${adjustmentCount !== 1 ? 's' : ''} totaling ${result.adjustmentTotal.toLocaleString()}`,
      result: result.adjustmentTotal,
      explanation: `Manual adjustments added by the administrator. These can be positive (bonuses, gifts) or negative (loans, penalties) amounts.`,
      inputs: { count: adjustmentCount },
      type: 'adjustment',
      section: 'adjustment'
    })
  }
  const totalBonuses = Object.values(result.ruleResults.bonuses || {}).reduce((sum, item) => sum + (item.finalValue || item.value), 0)
  const grossSalaryCalc = result.baseSalary + totalBonuses + result.adjustmentTotal
  steps.push({
    label: 'Gross Salary',
    formula: 'Base + Bonuses + Manual Adjustments',
    formulaWithValues: `${result.baseSalary.toLocaleString()} + ${totalBonuses.toLocaleString()} + ${result.adjustmentTotal.toLocaleString()} = ${grossSalaryCalc.toLocaleString()}`,
    result: result.grossSalary,
    explanation: 'The total salary before deductions. This includes base salary (hours-based), all bonuses, and manual adjustments.',
    inputs: { base: result.baseSalary, bonuses: totalBonuses, adjustments: result.adjustmentTotal },
    type: 'summary',
    section: 'summary'
  })
  const totalDeductions = Object.values(result.ruleResults.deductions || {}).reduce((sum, item) => sum + (item.finalValue || item.value), 0)
  steps.push({
    label: 'Take-Home Salary',
    formula: 'Gross Salary - All Deductions',
    formulaWithValues: `${result.grossSalary.toLocaleString()} - ${totalDeductions.toLocaleString()} = ${result.finalSalary.toLocaleString()}`,
    result: result.finalSalary,
    explanation: 'The final amount the employee receives after all deductions have been subtracted from the gross salary (which includes base salary, bonuses, and adjustments).',
    inputs: { gross: result.grossSalary, deductions: totalDeductions },
    type: 'final',
    section: 'final'
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
