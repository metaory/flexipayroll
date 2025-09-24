/**
 * Functional payroll calculator - pure functions for all calculations
 * Declarative step definitions with minimal complexity
 */

import { calculateDailyRate, calculateHourlyRate, calculateBonuses, calculateWorkingHours, formatCurrency, formatHours } from './core.js'

// Step definitions - declarative configuration
export const STEPS = [
  { id: 'config', title: 'Config', icon: 'solar:settings-bold-duotone', type: 'config' },
  { id: 'employees', title: 'Employees', icon: 'solar:users-group-rounded-bold-duotone', type: 'form' },
  { id: 'attendance', title: 'Attendance', icon: 'solar:calendar-mark-bold-duotone', type: 'form' },
  { id: 'daily-rate', title: 'Daily Rate', icon: 'solar:calculator-minimalistic-bold-duotone', type: 'calc', formula: 'Monthly Salary ÷ Working Days' },
  { id: 'hourly-rate', title: 'Hourly Rate', icon: 'solar:clock-circle-bold-duotone', type: 'calc', formula: 'Daily Rate ÷ Working Hours' },
  { id: 'base-salary', title: 'Base Salary', icon: 'solar:dollar-minimalistic-bold-duotone', type: 'calc', formula: 'Hours Worked × Hourly Rate' },
  { id: 'bonus-e', title: 'Bonus E', icon: 'solar:gift-bold-duotone', type: 'calc', formula: 'Daily Rate × Bonus E Days', config: 'bonusE' },
  { id: 'bonus-s', title: 'Bonus S', icon: 'solar:star-bold-duotone', type: 'calc', formula: 'Daily Rate × Bonus S Days', config: 'bonusS' },
  { id: 'bonus-fixed', title: 'Fixed Bonuses', icon: 'solar:medal-star-bold-duotone', type: 'calc', formula: 'Bonus K + Bonus M', config: ['bonusK', 'bonusM'] },
  { id: 'bonus-married', title: 'Marital Bonus', icon: 'solar:heart-bold-duotone', type: 'calc', formula: 'Bonus T (if married)', config: 'bonusT' },
  { id: 'adjustments', title: 'Adjustments', icon: 'solar:tuning-2-bold-duotone', type: 'form' },
  { id: 'gross', title: 'Gross Salary', icon: 'solar:money-bag-bold-duotone', type: 'calc', formula: 'Base + Bonuses + Adjustments' },
  { id: 'insurance', title: 'Insurance', icon: 'solar:shield-check-bold-duotone', type: 'calc', formula: 'Gross × Insurance Rate', config: 'insuranceRate' },
  { id: 'final', title: 'Final Result', icon: 'solar:check-circle-bold-duotone', type: 'calc', formula: 'Gross - Insurance' },
  { id: 'report', title: 'Reports', icon: 'solar:document-text-bold-duotone', type: 'report' }
]

// Pure calculation functions
export const calculateEmployeePayroll = (employee, attendance, adjustments, config) => {
  const dailyRate = calculateDailyRate(employee.monthlySalary, config.workingDaysPerMonth)
  const hourlyRate = calculateHourlyRate(dailyRate, config.workdayHours)
  
  // Calculate total hours from attendance
  const totalHours = Object.values(attendance || {}).reduce((sum, dayData) => {
    if (dayData.type === 'regular' && dayData.entryTime && dayData.exitTime) {
      return sum + calculateWorkingHours(dayData.entryTime, dayData.exitTime)
    }
    if (dayData.type === 'holiday') {
      return sum + config.workdayHours
    }
    return sum
  }, 0)
  
  const baseSalary = totalHours * hourlyRate
  const bonuses = calculateBonuses(employee, config)
  const adjustmentTotal = adjustments.reduce((sum, adj) => sum + (adj.amount || 0), 0)
  const grossSalary = baseSalary + Object.values(bonuses).reduce((sum, bonus) => sum + bonus, 0) + adjustmentTotal
  const insuranceDeduction = grossSalary * config.insuranceRate
  const finalSalary = grossSalary - insuranceDeduction
  
  return {
    employee,
    dailyRate,
    hourlyRate,
    totalHours,
    baseSalary,
    bonuses,
    adjustmentTotal,
    grossSalary,
    insuranceDeduction,
    finalSalary,
    configSnapshot: { ...config }
  }
}

// Step-specific calculation extractors
export const getStepValue = (step, result, config) => {
  const values = {
    'daily-rate': () => ({ input: result.employee.monthlySalary, divisor: config.workingDaysPerMonth, output: result.dailyRate }),
    'hourly-rate': () => ({ input: result.dailyRate, divisor: config.workdayHours, output: result.hourlyRate }),
    'base-salary': () => ({ hours: result.totalHours, rate: result.hourlyRate, output: result.baseSalary }),
    'bonus-e': () => ({ rate: result.dailyRate, days: config.bonusE, output: result.bonuses.bonusE }),
    'bonus-s': () => ({ rate: result.dailyRate, days: config.bonusS, output: result.bonuses.bonusS }),
    'bonus-fixed': () => ({ k: result.bonuses.bonusK, m: result.bonuses.bonusM, output: result.bonuses.bonusK + result.bonuses.bonusM }),
    'bonus-married': () => ({ status: result.employee.maritalStatus, eligible: result.employee.maritalStatus === 'married', output: result.bonuses.bonusT }),
    'gross': () => ({ base: result.baseSalary, bonuses: Object.values(result.bonuses).reduce((s, b) => s + b, 0), adjustments: result.adjustmentTotal, output: result.grossSalary }),
    'insurance': () => ({ gross: result.grossSalary, rate: config.insuranceRate, output: result.insuranceDeduction }),
    'final': () => ({ gross: result.grossSalary, deduction: result.insuranceDeduction, output: result.finalSalary })
  }
  return values[step.id]?.() || {}
}

// Form field definitions
export const CONFIG_FIELDS = [
  { key: 'workdayHours', label: 'Working Hours/Day', type: 'number', min: 1, max: 24, step: 0.5 },
  { key: 'workingDaysPerMonth', label: 'Working Days/Month', type: 'number', min: 1, max: 31 },
  { key: 'bonusE', label: 'Bonus E (Days)', type: 'number', min: 0, step: 0.5 },
  { key: 'bonusS', label: 'Bonus S (Days)', type: 'number', min: 0, step: 0.5 },
  { key: 'bonusK', label: 'Bonus K (Fixed)', type: 'number', min: 0, step: 1000 },
  { key: 'bonusM', label: 'Bonus M (Fixed)', type: 'number', min: 0, step: 1000 },
  { key: 'bonusT', label: 'Bonus T (Married)', type: 'number', min: 0, step: 1000 },
  { key: 'insuranceRate', label: 'Insurance Rate', type: 'number', min: 0, max: 1, step: 0.01 }
]

export const EMPLOYEE_FIELDS = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'gender', label: 'Gender', type: 'select', options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }] },
  { key: 'maritalStatus', label: 'Marital Status', type: 'select', options: [{ value: 'single', label: 'Single' }, { value: 'married', label: 'Married' }] },
  { key: 'monthlySalary', label: 'Monthly Salary', type: 'number', required: true, min: 0 }
]
