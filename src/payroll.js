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

// Basic config field definitions (workdayHours, workingDaysPerMonth only)
export const BASIC_CONFIG_FIELDS = [
  { key: 'workdayHours', label: 'Working Hours/Day', type: 'number', min: 1, max: 24, step: 0.5 },
  { key: 'workingDaysPerMonth', label: 'Working Days/Month', type: 'number', min: 1, max: 31 }
]

export const EMPLOYEE_FIELDS = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'gender', label: 'Gender', type: 'select', options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }] },
  { key: 'maritalStatus', label: 'Marital Status', type: 'select', options: [{ value: 'single', label: 'Single' }, { value: 'married', label: 'Married' }] },
  { key: 'monthlySalary', label: 'Monthly Salary', type: 'number', required: true, min: 0 }
]
