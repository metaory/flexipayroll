/**
 * Calculation module for xPayroll
 * Handles salary and payroll computations
 */

import { config } from './store.js'

// Day type constants
export const DAY_TYPES = {
  REGULAR: 'regular',
  HOLIDAY: 'holiday',
  PAID_LEAVE: 'paid_leave',
  UNPAID_LEAVE: 'unpaid_leave'
}

// Calculate working hours from entry and exit times
export const calculateHours = (entryTime, exitTime) => {
  if (!entryTime || !exitTime) return 0

  const [entryHour, entryMin] = entryTime.split(':').map(Number)
  const [exitHour, exitMin] = exitTime.split(':').map(Number)

  const entryMinutes = entryHour * 60 + entryMin
  const exitMinutes = exitHour * 60 + exitMin

  // Calculate duration in hours, round to 2 decimal places
  return Math.round((exitMinutes - entryMinutes) / 60 * 100) / 100
}

// Calculate daily rate from monthly salary
export const calculateDailyRate = (monthlySalary) => {
  return monthlySalary / 22 // Assuming 22 working days per month
}

// Calculate hourly rate from monthly salary
export const calculateHourlyRate = (monthlySalary) => {
  const dailyRate = calculateDailyRate(monthlySalary)
  return dailyRate / config.workdayHours
}

// Calculate total hours worked in a period
export const calculateTotalHours = (attendanceData) => {
  let totalHours = 0
  let totalRegularDays = 0
  let totalHolidays = 0
  let totalPaidLeave = 0
  let totalUnpaidLeave = 0

  Object.values(attendanceData).forEach(day => {
    switch (day.type) {
      case DAY_TYPES.REGULAR:
        totalHours += calculateHours(day.entryTime, day.exitTime)
        totalRegularDays++
        break
      case DAY_TYPES.HOLIDAY:
      case DAY_TYPES.PAID_LEAVE:
        totalHours += config.workdayHours
        day.type === DAY_TYPES.HOLIDAY ? totalHolidays++ : totalPaidLeave++
        break
      case DAY_TYPES.UNPAID_LEAVE:
        totalUnpaidLeave++
        break
    }
  })

  return {
    hours: totalHours,
    regularDays: totalRegularDays,
    holidays: totalHolidays,
    paidLeave: totalPaidLeave,
    unpaidLeave: totalUnpaidLeave
  }
}

// Calculate basic salary based on hours worked
export const calculateBasicSalary = (monthlySalary, totalHours) => {
  const hourlyRate = calculateHourlyRate(monthlySalary)
  return hourlyRate * totalHours
}

// Calculate total salary with all bonuses and deductions
export const calculateSalary = (employee, attendanceData, adjustments = []) => {
  // Calculate hours worked
  const { hours } = calculateTotalHours(attendanceData)

  // Calculate base salary
  const basicSalary = calculateBasicSalary(employee.monthlySalary, hours)

  // Calculate bonuses
  const dailyRate = calculateDailyRate(employee.monthlySalary)
  const bonusE = dailyRate * config.bonusE
  const bonusS = dailyRate * config.bonusS
  const bonusK = config.bonusK
  const bonusM = config.bonusM
  const bonusT = employee.maritalStatus === 'married' ? config.bonusT : 0

  // Sum all adjustments
  const adjustmentTotal = adjustments.reduce((sum, adj) => sum + adj.amount, 0)

  // Calculate subtotal before insurance deduction
  const subtotal = basicSalary + bonusE + bonusS + bonusK + bonusM + bonusT + adjustmentTotal

  // Calculate insurance deduction
  const insuranceDeduction = subtotal * config.deductI

  // Calculate final total
  const total = subtotal - insuranceDeduction

  // Return detailed breakdown
  return {
    employeeId: employee.id,
    employeeName: employee.name,
    period: {
      hours,
      workdays: Object.keys(attendanceData).length
    },
    components: {
      basicSalary,
      bonusE,
      bonusS,
      bonusK,
      bonusM,
      bonusT,
      adjustments,
      adjustmentTotal,
      insuranceDeduction
    },
    subtotal,
    total,
    calculatedAt: new Date().toISOString()
  }
}
