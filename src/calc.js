/**
 * Calculation module for xPayroll
 * Handles salary and payroll computations
 * 
 * @deprecated Use core.js for business logic calculations
 */

import { config } from './store.js'
import { 
  BUSINESS_RULES, 
  calculateWorkingHours, 
  calculateDailyRate, 
  calculateHourlyRate,
  calculateAttendanceSummary,
  calculateBasicSalary,
  calculateCompleteSalary
} from './core.js'

// Legacy exports for backward compatibility
export const DAY_TYPES = BUSINESS_RULES.DAY_TYPES
export const calculateHours = calculateWorkingHours
export const calculateTotalHours = calculateAttendanceSummary

// Calculate total salary with all bonuses and deductions
export const calculateSalary = (employee, attendanceData, adjustments = []) => {
  return calculateCompleteSalary(employee, attendanceData, config, adjustments)
}
