/**
 * Functional payroll calculator - pure functions for all calculations
 * Declarative step definitions with minimal complexity
 */

import { calculateDailyRate, calculateHourlyRate, calculateWorkingHours, formatCurrency, formatHours } from './core.js'
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
  
  // Count actual days with attendance data
  const actualDays = Object.values(attendance || {}).filter(dayData => 
    dayData && (
      (dayData.type === 'regular' && dayData.entryTime && dayData.exitTime) ||
      dayData.type === 'holiday'
    )
  ).length
  
  // Calculate total hours: actual days × 8 hours (standard day)
  // Each day counts as exactly 8 hours, regardless of actual entry/exit times
  const standardDayHours = 8
  const totalHours = actualDays * standardDayHours
  
  console.log('=== Attendance Data Check ===')
  console.log('Employee:', employee.name)
  console.log('Attendance object:', attendance)
  console.log('Attendance keys:', Object.keys(attendance || {}))
  console.log('Total Hours calculated:', totalHours)
  
  if (!attendance || Object.keys(attendance).length === 0) {
    console.warn('⚠️ WARNING: No attendance data found for employee', employee.name)
    console.warn('This will result in zero hours worked and zero base salary!')
  } else {
    Object.entries(attendance || {}).forEach(([date, dayData]) => {
      if (dayData && dayData.type === 'regular') {
        const hours = calculateWorkingHours(dayData.entryTime, dayData.exitTime)
        console.log(`  ${date}: ${dayData.entryTime} - ${dayData.exitTime} = ${hours} hours`)
      } else if (dayData) {
        console.log(`  ${date}: ${dayData.type}`)
      }
    })
  }
  
  if (totalHours === 0) {
    console.warn('⚠️ WARNING: Total hours is 0! Base salary will be 0!')
  }
  
  // Apply rules engine (this calculates baseSalary internally)
  const ruleResults = applyRules(employee, attendance, rules, basicConfig)
  
  // Use baseSalary from ruleResults to ensure consistency
  const baseSalary = ruleResults.baseSalary
  
  // Add manual adjustments
  const adjustmentTotal = adjustments.reduce((sum, adj) => sum + (adj.amount || 0), 0)
  
  // Gross salary = base + bonuses + adjustments (before deductions)
  // ruleResults.grossSalary already contains base + bonuses (no deductions)
  const grossSalary = ruleResults.grossSalary + adjustmentTotal
  
  console.log('=== Gross Salary Calculation ===')
  console.log('Base Salary:', baseSalary)
  console.log('Rule Results Gross (base + bonuses):', ruleResults.grossSalary)
  console.log('Adjustments:', adjustmentTotal)
  console.log('Final Gross Salary:', grossSalary)
  
  // Calculate total deductions
  // PERCENTAGE_MONTHLY deductions (like insurance) should be calculated on GROSS salary
  // Other deductions use their stored values
  let totalDeductions = 0
  
  Object.values(ruleResults.deductions || {}).forEach(item => {
    if (!item || !item.rule) return
    
    console.log('Processing deduction:', item.rule.label, 'Type:', item.rule.type, 'Rule value:', item.rule.value, 'Stored item.value:', item.value)
    
    // PERCENTAGE_MONTHLY deductions should be calculated on GROSS salary (base + bonuses + adjustments)
    // This matches business rule: "7% of total calculated salary (includes all bonuses and adjustments)"
    // item.value from calculateRuleValue is just the percentage (e.g., 0.07 for 7%), not the calculated amount
    // Check both the constant and string form to be safe
    if (item.rule.type === RULE_TYPES.PERCENTAGE_MONTHLY || item.rule.type === 'percentage_monthly') {
      // Ensure percentage is in decimal form (0.07 for 7%, not 7)
      // Handle both cases: if value is stored as 7 (percentage) or 0.07 (decimal)
      const percentage = item.rule.value >= 1 ? item.rule.value / 100 : item.rule.value
      const deductionValue = grossSalary * percentage
      console.log('  -> PERCENTAGE_MONTHLY: rule.value=', item.rule.value, 'percentage=', percentage, 'grossSalary=', grossSalary, 'deductionValue=', deductionValue)
      // Update the stored value for display purposes
      item.value = deductionValue
      totalDeductions += deductionValue
      return
    }
    
    // Percentage base deductions have finalValue calculated from baseSalary
    if (item.percentage && item.percentageType === 'base') {
      const deductionValue = item.finalValue !== undefined ? item.finalValue : 0
      console.log('  -> Percentage base deduction:', deductionValue)
      totalDeductions += deductionValue
      return
    }
    
    // All other deductions (FIXED, HOURLY_MULTIPLIER, DAYS_MULTIPLIER)
    // use the value directly (already calculated in calculateRuleValue)
    const deductionValue = item.value !== undefined ? item.value : 0
    console.log('  -> Other deduction (', item.rule.type, '):', deductionValue)
    
    // Safety check: warn if deduction seems unreasonably large
    if (item.rule.type === 'hourly_multiplier' && Math.abs(deductionValue) > grossSalary * 2) {
      console.error(`⚠️ WARNING: HOURLY_MULTIPLIER deduction (${deductionValue}) is more than 2x gross salary (${grossSalary})!`)
      console.error(`   Rule: ${item.rule.label}, Multiplier: ${item.rule.value}, This might be incorrect.`)
    }
    
    totalDeductions += deductionValue
  })
  
  console.log('Total Deductions calculated:', totalDeductions)
  
  // Final salary = gross salary - deductions (subtract only once)
  const finalSalary = Math.max(0, grossSalary - totalDeductions)
  
  // Debug: Log calculation details
  console.log('=== Payroll Calculation Debug ===')
  console.log('Employee:', employee.name)
  console.log('Daily Salary:', employee.dailySalary)
  console.log('Hourly Rate:', hourlyRate, '(calculated as dailySalary / workdayHours =', employee.dailySalary, '/', basicConfig.workdayHours, '=', employee.dailySalary / basicConfig.workdayHours, ')')
  console.log('Total Hours:', totalHours)
  console.log('Base Salary:', baseSalary, '(should be totalHours × hourlyRate =', totalHours, '×', hourlyRate, '=', totalHours * hourlyRate, ')')
  console.log('Bonuses:', ruleResults.bonuses)
  console.log('Gross Salary (before adjustments):', ruleResults.grossSalary, '(should be base + bonuses)')
  console.log('Adjustments:', adjustmentTotal)
  console.log('Gross Salary (after adjustments):', grossSalary)
  console.log('Deductions breakdown:')
  Object.entries(ruleResults.deductions || {}).forEach(([ruleId, item]) => {
    if (item && item.rule) {
      console.log(`  - ${item.rule.label} (${item.rule.type}): value=${item.value}, finalValue=${item.finalValue}`)
    }
  })
  console.log('Total Deductions:', totalDeductions)
  console.log('Final Salary Calculation:', grossSalary, '-', totalDeductions, '=', grossSalary - totalDeductions)
  console.log('Final Salary (with Math.max):', finalSalary)
  
  if (finalSalary === 0 && grossSalary > 0) {
    console.error('⚠️ ERROR: Final salary is 0 but gross salary is positive!')
    console.error('   Gross Salary:', grossSalary)
    console.error('   Total Deductions:', totalDeductions)
    console.error('   Difference:', grossSalary - totalDeductions)
    console.error('   This means deductions (', totalDeductions, ') >= gross salary (', grossSalary, ')')
    console.error('   Check if any deduction values are too large, especially HOURLY_MULTIPLIER deductions.')
    console.error('   HOURLY_MULTIPLIER formula: hourlyRate × multiplier × totalHours')
    console.error('   If multiplier or totalHours is too high, the deduction will be huge.')
  }
  
  if (finalSalary < 0) {
    console.error('⚠️ ERROR: Final salary calculation resulted in negative value!')
    console.error('   Gross Salary:', grossSalary)
    console.error('   Total Deductions:', totalDeductions)
    console.error('   This should not happen due to Math.max(0, ...) safeguard.')
  }
  
  console.log('================================')
  
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
  const standardDayHours = 8
  steps.push({
    label: 'Base Salary',
    formula: 'Actual Days × 8 hours × Hourly Rate',
    formulaWithValues: `${daysWorked} days × ${standardDayHours}h = ${result.totalHours}h × ${result.hourlyRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/h = ${baseSalaryCalc.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
    result: result.baseSalary,
    explanation: `Base salary calculated as ${daysWorked} days worked × ${standardDayHours} hours per day = ${result.totalHours} hours × hourly rate. Each day counts as exactly ${standardDayHours} hours.`,
    inputs: { 
      actualDays: daysWorked,
      hoursPerDay: standardDayHours,
      totalHours: result.totalHours,
      hourlyRate: result.hourlyRate 
    },
    type: 'base'
  })
  
  // Step 4: Bonuses (Fixed Amount)
  Object.entries(result.ruleResults.bonuses || {}).forEach(([ruleId, ruleData]) => {
    if (!ruleData.percentage) {
      // Check if it's a FIXED type rule (not DAYS_MULTIPLIER or HOURLY_MULTIPLIER)
      if (ruleData.rule.type === 'fixed') {
        const monthDays = result.configSnapshot.monthDays || 30
        const actualDays = result.actualDays || 0
        const daysProportion = monthDays > 0 ? Math.min(actualDays / monthDays, 1.0) : 0
        const fullAmount = ruleData.rule.value
        const actualAmount = ruleData.value
        
        steps.push({
          label: ruleData.rule.label,
          formula: 'Fixed Amount × Days Worked Proportion',
          formulaWithValues: `${fullAmount.toLocaleString()} × ${(daysProportion * 100).toFixed(1)}% = ${actualAmount.toLocaleString()}`,
          result: ruleData.value,
          explanation: `Fixed bonus amount proportionally adjusted based on actual days worked (${actualDays} out of ${monthDays} days = ${(daysProportion * 100).toFixed(1)}%).`,
          inputs: { 
            fullAmount: fullAmount,
            actualDays: actualDays,
            expectedDays: monthDays,
            daysProportion: `${(daysProportion * 100).toFixed(1)}%`,
            actualAmount: actualAmount
          },
          type: 'bonus'
        })
      } else {
        // Other non-percentage rules (HOURLY_MULTIPLIER handled separately)
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
    }
  })
  
  // Step 5: Bonuses (Days Multiplier)
  Object.entries(result.ruleResults.bonuses || {}).forEach(([ruleId, ruleData]) => {
    if (ruleData.rule.type === 'days_multiplier') {
      const standardDayHours = 8
      const monthDays = result.configSnapshot.monthDays || 30
      const actualDays = result.actualDays || 0
      const fullBonusHours = ruleData.rule.value * standardDayHours
      const actualBonusHours = ruleData.value / result.hourlyRate // Reverse calculate from final value
      const daysProportion = monthDays > 0 ? Math.min(actualDays / monthDays, 1.0) : 0
      
      steps.push({
        label: ruleData.rule.label,
        formula: '(Days Multiplier × 8 hours × Days Worked Proportion) × Hourly Rate',
        formulaWithValues: `(${ruleData.rule.value} days × ${standardDayHours}h × ${(daysProportion * 100).toFixed(1)}%) × ${result.hourlyRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/h = ${actualBonusHours.toFixed(2)}h × ${result.hourlyRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/h = ${ruleData.value.toLocaleString()}`,
        result: ruleData.value,
        explanation: `Bonus calculated as ${ruleData.rule.value} days × ${standardDayHours} hours, proportionally adjusted based on actual days worked (${actualDays} out of ${monthDays} days = ${(daysProportion * 100).toFixed(1)}%).`,
        inputs: { 
          days: ruleData.rule.value,
          hoursPerDay: standardDayHours,
          fullHours: fullBonusHours,
          actualHours: actualBonusHours,
          actualDays: actualDays,
          expectedDays: monthDays,
          daysProportion: `${(daysProportion * 100).toFixed(1)}%`,
          hourlyRate: result.hourlyRate
        },
        type: 'bonus'
      })
    }
  })
  
  // Step 6: Bonuses (Hourly Multiplier)
  Object.entries(result.ruleResults.bonuses || {}).forEach(([ruleId, ruleData]) => {
    if (ruleData.rule.type === 'hourly_multiplier') {
      const hourlyMultiplierCalc = result.hourlyRate * ruleData.rule.value
      steps.push({
        label: ruleData.rule.label,
        formula: 'Hourly Rate × Hours',
        formulaWithValues: `${result.hourlyRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} × ${ruleData.rule.value}h = ${hourlyMultiplierCalc.toLocaleString()}`,
        result: ruleData.value,
        explanation: `Bonus/deduction calculated by multiplying the hourly rate (${result.hourlyRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) by ${ruleData.rule.value} hours. The multiplier value represents the number of hours this rule applies to.`,
        inputs: { 
          hourlyRate: result.hourlyRate,
          hours: ruleData.rule.value
        },
        type: 'bonus'
      })
    }
  })
  
  // Step 7: Bonuses (Percentage Monthly)
  Object.entries(result.ruleResults.bonuses || {}).forEach(([ruleId, ruleData]) => {
    if (ruleData.rule.type === 'percentage_monthly') {
      const monthlySalary = result.employee.dailySalary * 30
      const percentageCalc = monthlySalary * ruleData.rule.value
      steps.push({
        label: ruleData.rule.label,
        formula: '(Daily Salary × 30) × Percentage',
        formulaWithValues: `(${result.employee.dailySalary.toLocaleString()} × 30) × ${(ruleData.rule.value * 100).toFixed(1)}% = ${monthlySalary.toLocaleString()} × ${(ruleData.rule.value * 100).toFixed(1)}% = ${percentageCalc.toLocaleString()}`,
        result: ruleData.value,
        explanation: `Bonus calculated as ${(ruleData.rule.value * 100).toFixed(1)}% of the employee's monthly salary (daily salary × 30), regardless of hours worked.`,
        inputs: { 
          dailySalary: result.employee.dailySalary,
          monthlySalary: monthlySalary,
          percentage: `${(ruleData.rule.value * 100).toFixed(1)}%`
        },
        type: 'bonus'
      })
    }
  })
  
  // Step 8: Bonuses (Percentage Base)
  Object.entries(result.ruleResults.bonuses || {}).forEach(([ruleId, ruleData]) => {
    if (ruleData.rule.type === 'percentage_base') {
      const percentageBaseCalc = result.baseSalary * ruleData.rule.value
      steps.push({
        label: ruleData.rule.label,
        formula: 'Base Salary × Percentage',
        formulaWithValues: `${result.baseSalary.toLocaleString()} × ${(ruleData.rule.value * 100).toFixed(1)}% = ${percentageBaseCalc.toLocaleString()}`,
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
  
  // Step 9: Deductions (Fixed Amount and Hourly Multiplier)
  Object.entries(result.ruleResults.deductions || {}).forEach(([ruleId, ruleData]) => {
    if (!ruleData.percentage) {
      // Handle hourly multiplier deductions
      if (ruleData.rule.type === 'hourly_multiplier') {
        const hourlyMultiplierCalc = result.hourlyRate * ruleData.rule.value
        steps.push({
          label: ruleData.rule.label,
          formula: 'Hourly Rate × Hours',
          formulaWithValues: `${result.hourlyRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} × ${ruleData.rule.value}h = ${hourlyMultiplierCalc.toLocaleString()}`,
          result: ruleData.value,
          explanation: `Deduction calculated by multiplying the hourly rate (${result.hourlyRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) by ${ruleData.rule.value} hours. The multiplier value represents the number of hours this deduction applies to (e.g., hours not worked).`,
          inputs: { 
            hourlyRate: result.hourlyRate,
            hours: ruleData.rule.value
          },
          type: 'deduction'
        })
      } else if (ruleData.rule.type === 'days_multiplier') {
        // Handle days multiplier deductions
        const standardDayHours = 8
        const monthDays = result.configSnapshot.monthDays || 30
        const actualDays = result.actualDays || 0
        const fullDeductionHours = ruleData.rule.value * standardDayHours
        const actualDeductionHours = ruleData.value / result.hourlyRate // Reverse calculate from final value
        const daysProportion = monthDays > 0 ? Math.min(actualDays / monthDays, 1.0) : 0
        
        steps.push({
          label: ruleData.rule.label,
          formula: '(Days Multiplier × 8 hours × Days Worked Proportion) × Hourly Rate',
          formulaWithValues: `(${ruleData.rule.value} days × ${standardDayHours}h × ${(daysProportion * 100).toFixed(1)}%) × ${result.hourlyRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/h = ${actualDeductionHours.toFixed(2)}h × ${result.hourlyRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/h = ${ruleData.value.toLocaleString()}`,
          result: ruleData.value,
          explanation: `Deduction calculated as ${ruleData.rule.value} days × ${standardDayHours} hours, proportionally adjusted based on actual days worked (${actualDays} out of ${monthDays} days = ${(daysProportion * 100).toFixed(1)}%).`,
          inputs: { 
            days: ruleData.rule.value,
            hoursPerDay: standardDayHours,
            fullHours: fullDeductionHours,
            actualHours: actualDeductionHours,
            actualDays: actualDays,
            expectedDays: monthDays,
            daysProportion: `${(daysProportion * 100).toFixed(1)}%`,
            hourlyRate: result.hourlyRate
          },
          type: 'deduction'
        })
      } else if (ruleData.rule.type === 'fixed') {
        // Fixed amount deductions - proportional to days worked
        const monthDays = result.configSnapshot.monthDays || 30
        const actualDays = result.actualDays || 0
        const daysProportion = monthDays > 0 ? Math.min(actualDays / monthDays, 1.0) : 0
        const fullAmount = ruleData.rule.value
        const actualAmount = ruleData.value
        
        steps.push({
          label: ruleData.rule.label,
          formula: 'Fixed Amount × Days Worked Proportion',
          formulaWithValues: `${fullAmount.toLocaleString()} × ${(daysProportion * 100).toFixed(1)}% = ${actualAmount.toLocaleString()}`,
          result: ruleData.value,
          explanation: `Fixed deduction amount proportionally adjusted based on actual days worked (${actualDays} out of ${monthDays} days = ${(daysProportion * 100).toFixed(1)}%).`,
          inputs: { 
            fullAmount: fullAmount,
            actualDays: actualDays,
            expectedDays: monthDays,
            daysProportion: `${(daysProportion * 100).toFixed(1)}%`,
            actualAmount: actualAmount
          },
          type: 'deduction'
        })
      } else {
        // Other fixed amount deductions (fallback)
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
    }
  })
  
  // Step 10: Deductions (Percentage Monthly)
  Object.entries(result.ruleResults.deductions || {}).forEach(([ruleId, ruleData]) => {
    if (ruleData.rule.type === 'percentage_monthly') {
      const percentage = ruleData.rule.value >= 1 ? ruleData.rule.value / 100 : ruleData.rule.value
      const percentageCalc = result.grossSalary * percentage
      steps.push({
        label: ruleData.rule.label,
        formula: 'Gross Salary × Percentage',
        formulaWithValues: `${result.grossSalary.toLocaleString()} × ${(percentage * 100).toFixed(1)}% = ${percentageCalc.toLocaleString()}`,
        result: ruleData.value,
        explanation: `Deduction calculated as ${(percentage * 100).toFixed(1)}% of gross salary (base salary + bonuses + adjustments).`,
        inputs: { 
          grossSalary: result.grossSalary,
          percentage: `${(percentage * 100).toFixed(1)}%`
        },
        type: 'deduction'
      })
    }
  })
  
  // Step 11: Deductions (Percentage Base)
  Object.entries(result.ruleResults.deductions || {}).forEach(([ruleId, ruleData]) => {
    if (ruleData.rule.type === 'percentage_base') {
      const percentageBaseCalc = result.baseSalary * ruleData.rule.value
      steps.push({
        label: ruleData.rule.label,
        formula: 'Base Salary × Percentage',
        formulaWithValues: `${result.baseSalary.toLocaleString()} × ${(ruleData.rule.value * 100).toFixed(1)}% = ${percentageBaseCalc.toLocaleString()}`,
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
