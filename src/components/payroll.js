/**
 * Payroll calculation component
 * Handles salary calculation and reporting
 */

import { employees, storeUtils, attendance, config } from '../store.js'
import { el, formGroup, modal, notify, createTable, formatCurrency, formatDate } from '../ui.js'
import { calculateSalary, calculateTotalHours } from '../calc.js'

// Create a form for adding salary adjustments
const createAdjustmentForm = (onSubmit) => {
  const form = el('form', {
    onsubmit: (e) => {
      e.preventDefault()

      const formData = new FormData(e.target)
      const adjustment = {
        amount: Number(formData.get('amount')),
        comment: formData.get('comment') || ''
      }

      onSubmit(adjustment)
    }
  })

  form.appendChild(formGroup('Amount', el('input', {
    type: 'number',
    name: 'amount',
    required: 'required',
    step: '1000'
  })))

  form.appendChild(formGroup('Comment', el('input', {
    type: 'text',
    name: 'comment'
  })))

  // Submit button
  const submitBtn = el('button', { type: 'submit', class: 'btn primary' }, 'Add Adjustment')

  // Cancel button
  const cancelBtn = el('button', {
    type: 'button',
    class: 'btn',
    onclick: () => modal.close()
  }, 'Cancel')

  form.appendChild(el('div', { class: 'form-actions' }, [cancelBtn, submitBtn]))

  return form
}

// Show adjustment modal
const showAdjustmentModal = (employeeId, adjustments, updateAdjustments) => {
  const employee = employees.find(emp => emp.id === employeeId)
  if (!employee) {
    notify('Employee not found', 'error')
    return
  }

  const form = createAdjustmentForm((adjustment) => {
    adjustments.push(adjustment)
    updateAdjustments(adjustments)
    modal.close()
  })

  modal.create(`Add Adjustment for ${employee.name}`, form)
}

// Create month selector for payroll
const createDateSelector = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

  // Create month selector
  const monthSelect = el('select', {
    id: 'payroll-month',
    onchange: renderPayrollCalculator
  })

  // Add options for current month and previous 3 months
  for (let i = 0; i < 4; i++) {
    const m = month - i
    const y = m < 0 ? year - 1 : year
    const monthIndex = m < 0 ? 12 + m : m

    const monthDate = new Date(y, monthIndex, 1)
    const monthName = monthDate.toLocaleString('default', { month: 'long', year: 'numeric' })

    monthSelect.appendChild(el('option', {
      value: `${y}-${monthIndex + 1}`,
      selected: i === 0
    }, monthName))
  }

  return el('div', { class: 'payroll-date-selector' }, [
    el('label', {}, 'Select Month:'),
    monthSelect
  ])
}

// Get attendance data for an employee in a specific month
const getAttendanceForMonth = (employeeId, year, month) => {
  const result = {}

  // Find all attendance records for the employee in the specified month
  if (attendance[employeeId]) {
    Object.entries(attendance[employeeId]).forEach(([date, data]) => {
      if (date.startsWith(`${year}-${month.toString().padStart(2, '0')}`)) {
        result[date] = data
      }
    })
  }

  return result
}

// Render employee payroll calculator
const renderPayrollCalculator = () => {
  const container = document.getElementById('payroll-calculator')
  if (!container) return

  container.innerHTML = ''

  if (employees.length === 0) {
    container.appendChild(el('div', { class: 'empty-state' }, 'No employees found.'))
    return
  }

  // Get selected month
  const monthSelect = document.getElementById('payroll-month')
  if (!monthSelect) return

  const [year, month] = monthSelect.value.split('-').map(Number)

  // Store adjustments for each employee
  const employeeAdjustments = {}

  // Create employee salary calculation sections
  employees.forEach(employee => {
    // Initialize adjustments array
    employeeAdjustments[employee.id] = []

    // Get attendance data for this month
    const attendanceData = getAttendanceForMonth(employee.id, year, month)

    // Calculate work stats
    const workStats = calculateTotalHours(attendanceData)

    // Create employee section
    const employeeSection = el('div', { class: 'employee-payroll' })

    // Create header with employee name
    employeeSection.appendChild(el('h3', {}, employee.name))

    // Create work summary
    const workSummary = el('div', { class: 'work-summary' }, [
      el('div', { class: 'stat' }, [
        el('span', { class: 'stat-label' }, 'Total Days:'),
        el('span', { class: 'stat-value' }, Object.keys(attendanceData).length)
      ]),
      el('div', { class: 'stat' }, [
        el('span', { class: 'stat-label' }, 'Regular Days:'),
        el('span', { class: 'stat-value' }, workStats.regularDays)
      ]),
      el('div', { class: 'stat' }, [
        el('span', { class: 'stat-label' }, 'Holidays:'),
        el('span', { class: 'stat-value' }, workStats.holidays)
      ]),
      el('div', { class: 'stat' }, [
        el('span', { class: 'stat-label' }, 'Paid Leave:'),
        el('span', { class: 'stat-value' }, workStats.paidLeave)
      ]),
      el('div', { class: 'stat' }, [
        el('span', { class: 'stat-label' }, 'Unpaid Leave:'),
        el('span', { class: 'stat-value' }, workStats.unpaidLeave)
      ]),
      el('div', { class: 'stat' }, [
        el('span', { class: 'stat-label' }, 'Total Hours:'),
        el('span', { class: 'stat-value' }, workStats.hours.toFixed(2))
      ]),
    ])

    employeeSection.appendChild(workSummary)

    // Function to update the salary calculation display
    const updateSalaryDisplay = (adjustments) => {
      // Calculate salary
      const salaryResult = calculateSalary(employee, attendanceData, adjustments)

      // Remove existing calculation if any
      const existingCalc = employeeSection.querySelector('.salary-calculation')
      if (existingCalc) {
        existingCalc.remove()
      }

      // Create salary breakdown
      const salaryCalc = el('div', { class: 'salary-calculation' })

      // Add calculation components
      const addLine = (label, value, isSubtotal = false) => {
        salaryCalc.appendChild(el('div', { class: `calc-line${isSubtotal ? ' subtotal' : ''}` }, [
          el('span', { class: 'calc-label' }, label),
          el('span', { class: 'calc-value' }, formatCurrency(value))
        ]))
      }

      // Add basic salary
      addLine('Basic Salary', salaryResult.components.basicSalary)

      // Add bonuses
      addLine('Bonus E (5 days)', salaryResult.components.bonusE)
      addLine('Bonus S (2.5 days)', salaryResult.components.bonusS)
      addLine('Bonus K (Fixed)', salaryResult.components.bonusK)
      addLine('Bonus M (Fixed)', salaryResult.components.bonusM)

      if (employee.maritalStatus === 'married') {
        addLine('Bonus T (Married)', salaryResult.components.bonusT)
      }

      // Add adjustments
      if (adjustments.length > 0) {
        salaryCalc.appendChild(el('div', { class: 'adjustments-header' }, 'Adjustments:'))

        adjustments.forEach((adj, index) => {
          salaryCalc.appendChild(el('div', { class: 'adjustment-item' }, [
            el('div', { class: 'calc-line' }, [
              el('span', { class: 'calc-label' }, `${index + 1}. ${adj.comment || 'Adjustment'}`),
              el('span', { class: 'calc-value' }, formatCurrency(adj.amount))
            ]),
            el('button', {
              class: 'btn small remove-btn',
              onclick: () => {
                adjustments.splice(index, 1)
                updateSalaryDisplay(adjustments)
              }
            }, '×')
          ]))
        })

        addLine('Total Adjustments', salaryResult.components.adjustmentTotal)
      }

      // Subtotal
      addLine('Subtotal', salaryResult.subtotal, true)

      // Insurance deduction
      addLine('Insurance (7%)', -salaryResult.components.insuranceDeduction)

      // Final total
      salaryCalc.appendChild(el('div', { class: 'calc-line total' }, [
        el('span', { class: 'calc-label' }, 'TOTAL'),
        el('span', { class: 'calc-value' }, formatCurrency(salaryResult.total))
      ]))

      employeeSection.appendChild(salaryCalc)
    }

    // Create adjustment button
    const adjustmentButton = el('button', {
      class: 'btn add-adjustment',
      onclick: () => {
        showAdjustmentModal(
          employee.id,
          employeeAdjustments[employee.id],
          updateSalaryDisplay
        )
      }
    }, 'Add Adjustment')

    // Create print button
    const printButton = el('button', {
      class: 'btn print-btn',
      onclick: () => {
        // Calculate salary with current adjustments
        const salaryResult = calculateSalary(
          employee,
          attendanceData,
          employeeAdjustments[employee.id]
        )

        // Show printable report
        showPrintableReport(employee, salaryResult, `${year}-${month}`)
      }
    }, 'Print Report')

    // Create buttons container
    const buttons = el('div', { class: 'payroll-buttons' }, [
      adjustmentButton,
      printButton
    ])

    employeeSection.appendChild(buttons)

    // Initial salary display
    updateSalaryDisplay(employeeAdjustments[employee.id])

    container.appendChild(employeeSection)
  })
}

// Show printable report modal
const showPrintableReport = (employee, salaryResult, periodStr) => {
  const [year, month] = periodStr.split('-')
  const periodName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })

  // Create report container
  const report = el('div', { class: 'printable-report' }, [
    el('div', { class: 'report-header' }, [
      el('h2', {}, 'Salary Report'),
      el('div', { class: 'report-info' }, [
        el('div', {}, `Employee: ${employee.name}`),
        el('div', {}, `Period: ${periodName}`),
        el('div', {}, `Generated: ${new Date().toLocaleDateString()}`)
      ])
    ]),

    el('div', { class: 'report-body' }, [
      // Summary section
      el('div', { class: 'report-section' }, [
        el('h3', {}, 'Summary'),
        el('div', { class: 'report-line highlight' }, [
          el('span', {}, 'Total Salary:'),
          el('span', {}, formatCurrency(salaryResult.total))
        ]),
        el('div', { class: 'report-line' }, [
          el('span', {}, 'Period:'),
          el('span', {}, `${salaryResult.period.workdays} days / ${salaryResult.period.hours.toFixed(2)} hours`)
        ])
      ]),

      // Breakdown section
      el('div', { class: 'report-section' }, [
        el('h3', {}, 'Calculation Breakdown'),

        // Basic salary
        el('div', { class: 'report-line' }, [
          el('span', {}, 'Basic Salary:'),
          el('span', {}, formatCurrency(salaryResult.components.basicSalary))
        ]),

        // Bonuses
        el('div', { class: 'report-line' }, [
          el('span', {}, 'Bonus E (5 days):'),
          el('span', {}, formatCurrency(salaryResult.components.bonusE))
        ]),
        el('div', { class: 'report-line' }, [
          el('span', {}, 'Bonus S (2.5 days):'),
          el('span', {}, formatCurrency(salaryResult.components.bonusS))
        ]),
        el('div', { class: 'report-line' }, [
          el('span', {}, 'Bonus K (Fixed):'),
          el('span', {}, formatCurrency(salaryResult.components.bonusK))
        ]),
        el('div', { class: 'report-line' }, [
          el('span', {}, 'Bonus M (Fixed):'),
          el('span', {}, formatCurrency(salaryResult.components.bonusM))
        ]),

        employee.maritalStatus === 'married'
          ? el('div', { class: 'report-line' }, [
              el('span', {}, 'Bonus T (Married):'),
              el('span', {}, formatCurrency(salaryResult.components.bonusT))
            ])
          : null,

        // Adjustments
        salaryResult.components.adjustments.length > 0
          ? el('div', { class: 'adjustments-list' }, [
              el('div', { class: 'report-subheader' }, 'Adjustments:'),
              ...salaryResult.components.adjustments.map((adj, i) =>
                el('div', { class: 'report-line adjustment' }, [
                  el('span', {}, `${i + 1}. ${adj.comment || 'Adjustment'}:`),
                  el('span', {}, formatCurrency(adj.amount))
                ])
              ),
              el('div', { class: 'report-line' }, [
                el('span', {}, 'Total Adjustments:'),
                el('span', {}, formatCurrency(salaryResult.components.adjustmentTotal))
              ])
            ])
          : null,

        // Subtotal
        el('div', { class: 'report-line subtotal' }, [
          el('span', {}, 'Subtotal:'),
          el('span', {}, formatCurrency(salaryResult.subtotal))
        ]),

        // Deductions
        el('div', { class: 'report-line deduction' }, [
          el('span', {}, 'Insurance Deduction (7%):'),
          el('span', {}, formatCurrency(-salaryResult.components.insuranceDeduction))
        ]),

        // Total
        el('div', { class: 'report-line total' }, [
          el('span', {}, 'TOTAL SALARY:'),
          el('span', {}, formatCurrency(salaryResult.total))
        ])
      ])
    ]),

    // Footer
    el('div', { class: 'report-footer' }, [
      el('div', { class: 'signatures' }, [
        el('div', { class: 'signature' }, [
          el('div', { class: 'signature-line' }),
          el('div', {}, 'Employee')
        ]),
        el('div', { class: 'signature' }, [
          el('div', { class: 'signature-line' }),
          el('div', {}, 'Finance')
        ]),
        el('div', { class: 'signature' }, [
          el('div', { class: 'signature-line' }),
          el('div', {}, 'Director')
        ])
      ])
    ])
  ])

  // Create print button
  const printBtn = el('button', {
    class: 'btn primary',
    onclick: () => {
      const printWindow = window.open('', '_blank')
      printWindow.document.write(`
        <html>
          <head>
            <title>Salary Report - ${employee.name}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .printable-report { max-width: 800px; margin: 0 auto; }
              .report-header { text-align: center; margin-bottom: 20px; }
              .report-info { margin-top: 10px; }
              .report-section { margin-bottom: 20px; }
              .report-line { display: flex; justify-content: space-between; margin-bottom: 5px; }
              .highlight { font-size: 1.2em; font-weight: bold; }
              .subtotal, .total { font-weight: bold; border-top: 1px solid #ccc; padding-top: 5px; }
              .total { font-size: 1.2em; }
              .deduction { color: #d00; }
              .report-subheader { font-weight: bold; margin: 10px 0 5px; }
              .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
              .signature { text-align: center; width: 30%; }
              .signature-line { border-top: 1px solid #000; margin-bottom: 5px; }
              @media print {
                button { display: none; }
              }
            </style>
          </head>
          <body>
            ${report.outerHTML}
            <div style="text-align: center; margin-top: 20px;">
              <button onclick="window.print()">Print</button>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }, 'Print')

  // Create close button
  const closeBtn = el('button', {
    class: 'btn',
    onclick: () => modal.close()
  }, 'Close')

  // Create buttons container
  const buttons = el('div', { class: 'report-buttons' }, [closeBtn, printBtn])

  report.appendChild(buttons)

  modal.create('Salary Report', report)
}

// Initialize component
export const initPayrollComponent = () => {
  const payrollSection = el('section', { id: 'payroll-section', class: 'section' }, [
    el('h2', {}, 'Payroll Calculator'),
    el('div', { id: 'payroll-controls' }),
    el('div', { id: 'payroll-calculator' })
  ])

  // Add date selector after component is added to DOM
  setTimeout(() => {
    const controlsContainer = document.getElementById('payroll-controls')
    if (controlsContainer) {
      controlsContainer.appendChild(createDateSelector())
      renderPayrollCalculator()
    }
  }, 0)

  return payrollSection
}
