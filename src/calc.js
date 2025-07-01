/**
 * Calculation module for xPayroll
 * Handles salary and payroll computations
 * 
 * @deprecated Use core.js for business logic calculations
 */

import { config } from './store.js'
import { 
  calculateSalaryBreakdown,
  calculateWorkingHours,
  calculateAttendanceSummary
} from './core.js'

// Legacy exports for backward compatibility
export const DAY_TYPES = {
  REGULAR: 'regular',
  HOLIDAY: 'holiday', 
  PAID_LEAVE: 'paid_leave',
  UNPAID_LEAVE: 'unpaid_leave'
}

export const calculateHours = calculateWorkingHours
export const calculateTotalHours = calculateAttendanceSummary

// Calculate total salary with all bonuses and deductions
export const calculateSalary = (employee, attendanceData, adjustments = []) => {
  return calculateSalaryBreakdown(employee, attendanceData, adjustments, config)
}
