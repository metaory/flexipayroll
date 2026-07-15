/**
 * Functional payroll calculator - pure functions for all calculations
 * Declarative step definitions with minimal complexity
 */

import { calculateDailyRate, calculateHourlyRate } from './core.js'
import { applyRules, RULE_TYPES, bonusProrationRatio, FULL_BONUS_DAYS_THRESHOLD } from './rules.js'
import {
  getProbationLabel,
  getActiveProbationRules,
  getProbationRulesFor,
  hasProbationRules,
  isOnProbation,
  probationRulesKey,
  resolveProbation
} from './probation.js'
import { ICONS } from './lib/icons.js'

// Step definitions - simplified for rules-based system
export const STEPS = [
  { id: 'config', title: 'Configuration', icon: ICONS.stepConfig, type: 'config' },
  { id: 'employees', title: 'Employees', icon: ICONS.stepEmployees, type: 'form' },
  { id: 'attendance', title: 'Attendance', icon: ICONS.stepAttendance, type: 'form' },
  { id: 'adjustments', title: 'Adjustments', icon: ICONS.stepAdjustments, type: 'form' },
  { id: 'report', title: 'Reports', icon: ICONS.stepReport, type: 'report' }
]

// Pure calculation functions using rules engine
const asAdjustmentList = (adjustments) =>
  Array.isArray(adjustments) ? adjustments : []

/** Manual adjustments page is deduction-only; always reduce pay. */
const sumAdjustmentDeductions = (adjustments) =>
  asAdjustmentList(adjustments).reduce((sum, adj) => sum - Math.abs(Number(adj?.amount) || 0), 0)

export const calculateEmployeePayroll = (employee, attendanceItems, adjustments, rules, basicConfig) => {
  const dailyRate = calculateDailyRate(employee.dailySalary)
  const hourlyRate = calculateHourlyRate(employee.dailySalary, basicConfig.workdayHours)
  const ruleResults = applyRules(employee, attendanceItems, rules, basicConfig)
  const baseSalary = ruleResults.baseSalary
  const adjustmentList = asAdjustmentList(adjustments).map(adj => ({
    ...adj,
    amount: -Math.abs(Number(adj?.amount) || 0)
  }))
  const adjustmentTotal = sumAdjustmentDeductions(adjustmentList)
  
  // Build salary before monthly percentage rules (adjustments reduce this base).
  const monthlyBaseSalary = ruleResults.grossSalary + adjustmentTotal

  // Apply monthly percentage bonuses last on the monthly base salary.
  const monthlyBonusTotal = Object.values(ruleResults.bonuses || {}).reduce((sum, item) => {
    if (item?.probationExcluded) return sum
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
    if (item.probationExcluded) return sum
    
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
    adjustments: adjustmentList,
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

const employeeEffectiveDays = (result) =>
  result.ruleResults?.effectiveDays ?? result.configSnapshot?.workingDaysPerMonth ?? 22

const bonusDaysExplain = (result, effectiveDays) => {
  const workDays = result.configSnapshot?.workingDaysPerMonth ?? 22
  const absentDays = result.ruleResults?.absentDays ?? 0
  const undertimeDayBlocks = result.ruleResults?.undertimeDayBlocks ?? 0
  const parts = [`${workDays} working days`]
  if (absentDays > 0) parts.push(`${absentDays} absent`)
  if (undertimeDayBlocks > 0) parts.push(`${undertimeDayBlocks} net undertime days`)
  return parts.length === 1
    ? `effective work days (${effectiveDays})`
    : `${parts.join(' − ')} = ${effectiveDays}`
}

const createHourlyProratedStep = (ruleData, result, type) => {
  const effectiveDays = employeeEffectiveDays(result)
  const workDays = result.configSnapshot?.workingDaysPerMonth ?? 22
  const absentDays = result.ruleResults?.absentDays ?? 0
  const undertimeDayBlocks = result.ruleResults?.undertimeDayBlocks ?? 0
  const ratio = bonusProrationRatio(effectiveDays)
  const fullValue = ruleData.rule.value
  const formulaWithValues = ratio >= 1
    ? `${fullValue.toLocaleString()} = ${ruleData.value.toLocaleString()}`
    : `(${fullValue.toLocaleString()} × ${effectiveDays}) ÷ ${FULL_BONUS_DAYS_THRESHOLD} = ${ruleData.value.toLocaleString()}`
  return {
    label: ruleData.rule.label,
    formula: ratio >= 1 ? `Full bonus (≥ ${FULL_BONUS_DAYS_THRESHOLD} effective days)` : `(Value × Effective days) ÷ ${FULL_BONUS_DAYS_THRESHOLD}`,
    formulaWithValues,
    result: ruleData.value,
    explanation: ratio >= 1
      ? `${type.charAt(0).toUpperCase() + type.slice(1)} is paid in full because effective work days (${effectiveDays}) are at least ${FULL_BONUS_DAYS_THRESHOLD}.`
      : `${type.charAt(0).toUpperCase() + type.slice(1)} uses ${bonusDaysExplain(result, effectiveDays)}, divided by ${FULL_BONUS_DAYS_THRESHOLD}.`,
    inputs: { fullValue, effectiveDays, workDays, ratio, absentDays, undertimeDayBlocks },
    type
  }
}

const createFixedDailyProratedStep = (ruleData, result, type) => {
  const effectiveDays = employeeEffectiveDays(result)
  const workDays = result.configSnapshot?.workingDaysPerMonth ?? 22
  const absentDays = result.ruleResults?.absentDays ?? 0
  const undertimeDayBlocks = result.ruleResults?.undertimeDayBlocks ?? 0
  const ratio = bonusProrationRatio(effectiveDays)
  const formulaWithValues = ratio >= 1
    ? `${ruleData.rule.value.toLocaleString()} = ${ruleData.value.toLocaleString()}`
    : `(${ruleData.rule.value.toLocaleString()} × ${effectiveDays}) ÷ ${FULL_BONUS_DAYS_THRESHOLD} = ${ruleData.value.toLocaleString()}`
  return {
    label: ruleData.rule.label,
    formula: ratio >= 1 ? `Full bonus (≥ ${FULL_BONUS_DAYS_THRESHOLD} effective days)` : `(Fixed amount × Effective days) ÷ ${FULL_BONUS_DAYS_THRESHOLD}`,
    formulaWithValues,
    result: ruleData.value,
    explanation: ratio >= 1
      ? `${type.charAt(0).toUpperCase() + type.slice(1)} is paid in full because effective work days (${effectiveDays}) are at least ${FULL_BONUS_DAYS_THRESHOLD}.`
      : `${type.charAt(0).toUpperCase() + type.slice(1)} uses ${bonusDaysExplain(result, effectiveDays)}, divided by ${FULL_BONUS_DAYS_THRESHOLD}.`,
    inputs: { amount: ruleData.rule.value, effectiveDays, workDays, ratio, absentDays, undertimeDayBlocks },
    type
  }
}

const createDaysMultiplierStep = (ruleData, result, type) => {
  const effectiveDays = employeeEffectiveDays(result)
  const workDays = result.configSnapshot?.workingDaysPerMonth ?? 22
  const absentDays = result.ruleResults?.absentDays ?? 0
  const undertimeDayBlocks = result.ruleResults?.undertimeDayBlocks ?? 0
  const dailyRate = result.employee.dailySalary
  const fullMonthValue = ruleData.rule.value * dailyRate
  const fmt = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const ratio = bonusProrationRatio(effectiveDays)
  const formulaWithValues = ratio >= 1
    ? `${ruleData.rule.value} × ${fmt(dailyRate)} = ${ruleData.value.toLocaleString()}`
    : `(${ruleData.rule.value} × ${fmt(dailyRate)}) × (${effectiveDays} ÷ ${FULL_BONUS_DAYS_THRESHOLD}) = ${fmt(fullMonthValue)} × ${ratio.toFixed(4)} = ${ruleData.value.toLocaleString()}`
  return {
    label: ruleData.rule.label,
    formula: ratio >= 1 ? '(Multiplier × Daily salary) — full bonus' : `(Multiplier × Daily salary) × (Effective days ÷ ${FULL_BONUS_DAYS_THRESHOLD})`,
    formulaWithValues,
    result: ruleData.value,
    explanation: ratio >= 1
      ? `${type.charAt(0).toUpperCase() + type.slice(1)} is paid in full because effective work days (${effectiveDays}) are at least ${FULL_BONUS_DAYS_THRESHOLD}.`
      : `${type.charAt(0).toUpperCase() + type.slice(1)} uses ${bonusDaysExplain(result, effectiveDays)}, divided by ${FULL_BONUS_DAYS_THRESHOLD}.`,
    inputs: { fullMonthValue, effectiveDays, workDays, dailyRate, multiplier: ruleData.rule.value, ratio, absentDays, undertimeDayBlocks },
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
  const ruleTypeLabel = RULE_TYPE_LABELS[ruleData.rule.type] || ruleData.rule.type
  if (ruleData.probationExcluded) {
    return {
      label: `${ruleData.rule.label} [${ruleTypeLabel}]`,
      formula: 'Not applicable',
      formulaWithValues: 'Excluded during probation',
      result: 0,
      explanation: 'This item is not provided during the probation period.',
      type
    }
  }
  const builder = RULE_STEP_BUILDERS[ruleData.rule.type]
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
    'base-salary': () => ({
      dailyRate: result.employee.dailySalary,
      workDays: result.configSnapshot.workingDaysPerMonth ?? 22,
      monthDays: result.configSnapshot.monthDays ?? 30,
      effectiveDays: result.ruleResults?.effectiveDays,
      output: result.baseSalary
    }),
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
    formula: 'Base = Effective work days × Daily salary',
    formulaWithValues: 'Effective work days = working days − absent − full undertime days. Bonuses use those same days ÷ 30.',
    result: result.employee.dailySalary,
    explanation: 'Employee daily salary and config. Base salary, report days, and prorated bonuses all use the same effective work days. Only the bonus divisor is hardcoded to 30.',
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
  const fmtAmt = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  const rawOvertimeHours = result.ruleResults.rawOvertimeHours ?? 0
  const rawUndertimeHours = result.ruleResults.rawUndertimeHours ?? 0
  const hasAttendanceHours = rawOvertimeHours > 0 || rawUndertimeHours > 0
  const attendanceEffect = result.attendanceAdjustment ?? 0
  const overtimePay = result.ruleResults.overtimePay ?? 0
  const undertimePay = result.ruleResults.undertimePay ?? 0
  const otRate = result.ruleResults.otRate ?? result.configSnapshot.overtimeRate
  const utRate = result.ruleResults.utRate ?? result.configSnapshot.undertimeRate
  const dailySalary = fmtAmt(result.employee.dailySalary)
  const otTerm = rawOvertimeHours > 0
    ? `(${dailySalary}/day ÷ ${otRate}) × ${rawOvertimeHours.toFixed(2)}h = ${fmtAmt(overtimePay)}`
    : null
  const utTerm = rawUndertimeHours > 0
    ? `(${dailySalary}/day ÷ ${utRate}) × ${rawUndertimeHours.toFixed(2)}h = ${fmtAmt(undertimePay)}`
    : null
  const otUtFormula = hasAttendanceHours
    ? `${[otTerm, utTerm].filter(Boolean).join(' − ')} = ${attendanceEffect >= 0 ? '+' : ''}${fmtAmt(attendanceEffect)}`
    : null
  const otUtFormulaLabel = rawOvertimeHours > 0 && rawUndertimeHours > 0
    ? '(Daily salary ÷ Overtime rate × Overtime hours) − (Daily salary ÷ Undertime rate × Undertime hours)'
    : rawOvertimeHours > 0
      ? 'Daily salary ÷ Overtime rate × Overtime hours'
      : 'Daily salary ÷ Undertime rate × Undertime hours'
  const dailyRate = result.employee.dailySalary
  const effectiveDays = result.ruleResults?.effectiveDays ?? workDays
  const absentDays = result.ruleResults?.absentDays ?? 0
  const undertimeDayBlocks = result.ruleResults?.undertimeDayBlocks ?? 0
  const workdayHoursLabel = result.configSnapshot.workdayHours
  const dayParts = [`working days per month (${workDays})`]
  if (absentDays > 0) dayParts.push(`absent (${absentDays})`)
  if (undertimeDayBlocks > 0) dayParts.push(`net undertime days (${undertimeDayBlocks}, from net undertime hours ÷ ${workdayHoursLabel}h/day)`)
  steps.push(hasAttendanceHours
    ? {
        label: 'Overtime / Undertime',
        formula: otUtFormulaLabel,
        formulaWithValues: otUtFormula,
        result: attendanceEffect,
        explanation: 'Overtime and undertime pay are calculated separately from attendance hour items. Net undertime (after OT offsets UT) can also reduce effective work days.',
        inputs: { expectedHours, dailySalary: result.employee.dailySalary, rawOvertimeHours, rawUndertimeHours, overtimePay, undertimePay },
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
  const baseFormulaValues = `${effectiveDays} days × ${dailyRate.toLocaleString()}/day = ${result.baseSalary.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  steps.push({
    label: 'Base Salary',
    formula: 'Effective work days × Daily salary',
    formulaWithValues: baseFormulaValues,
    result: result.baseSalary,
    explanation: `Effective work days (${effectiveDays}) = ${dayParts.join(' minus ')}. Overtime and undertime pay are separate.`,
    inputs: { workDays, absentDays, undertimeDayBlocks, effectiveDays, dailyRate, result: result.baseSalary },
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
  const attendanceAdj = result.attendanceAdjustment ?? 0
  const grossSalaryCalc = result.baseSalary + attendanceAdj + totalBonuses + result.adjustmentTotal
  const grossParts = [
    result.baseSalary.toLocaleString(),
    ...(attendanceAdj !== 0 ? [`${attendanceAdj >= 0 ? '+' : ''}${attendanceAdj.toLocaleString()}`] : []),
    totalBonuses.toLocaleString(),
    result.adjustmentTotal.toLocaleString()
  ].join(' + ')
  steps.push({
    label: 'Gross Salary',
    formula: 'Base + Overtime/Undertime + Bonuses + Manual Adjustments',
    formulaWithValues: `${grossParts} = ${grossSalaryCalc.toLocaleString()}`,
    result: result.grossSalary,
    explanation: 'The total salary before deductions. This includes base salary, overtime/undertime, all bonuses, and manual adjustments.',
    inputs: { base: result.baseSalary, attendance: attendanceAdj, bonuses: totalBonuses, adjustments: result.adjustmentTotal },
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

export {
  getProbationLabel,
  getActiveProbationRules,
  getProbationRulesFor,
  hasProbationRules,
  isOnProbation,
  probationRulesKey,
  resolveProbation
} from './probation.js'

export const EMPLOYEE_FIELDS = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'gender', label: 'Gender', type: 'select', options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }] },
  { key: 'maritalStatus', label: 'Marital Status', type: 'select', options: [{ value: 'single', label: 'Single' }, { value: 'married', label: 'Married' }] },
  { key: 'childrenStatus', label: 'Has children', type: 'checkbox' },
  { key: 'dailySalary', label: 'Daily Salary', type: 'number', required: true, min: 0 },
  { key: 'yearsOfExperience', label: 'Years of Experience', type: 'number', min: 0, step: 0.1 }
]
