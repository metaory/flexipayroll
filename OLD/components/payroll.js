/**
 * Payroll calculation component
 * Handles salary calculation and reporting
 */

import { employees, attendance, config } from '../store.js'
import { el, formGroup, modal, notify, formatCurrency } from '../ui.js'
import { calculateSalary, calculateAttendanceSummary } from '../core.js'

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const createMonthSelector = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

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

const createAdjustmentForm = (onSubmit) => {
  const form = el('form', {
    onsubmit: (e) => {
      e.preventDefault()
      const formData = new FormData(e.target)
      onSubmit({
        amount: Number(formData.get('amount')),
        comment: formData.get('comment') || ''
      })
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

  form.appendChild(el('div', { class: 'form-actions' }, [
    el('button', { type: 'button', class: 'btn', onclick: () => modal.close() }, 'Cancel'),
    el('button', { type: 'submit', class: 'btn primary' }, 'Add Adjustment')
  ]))

  return form
}

// ============================================================================
// SALARY CALCULATION DISPLAY
// ============================================================================

const createSalaryDisplay = (employee, attendanceData, adjustments, updateAdjustments) => {
  const salaryResult = calculateSalary(employee, attendanceData, adjustments)
  const salaryCalc = el('div', { class: 'salary-calculation' })

  const addLine = (label, value, isSubtotal = false) => {
    salaryCalc.appendChild(el('div', { class: `calc-line${isSubtotal ? ' subtotal' : ''}` }, [
      el('span', { class: 'calc-label' }, label),
      el('span', { class: 'calc-value' }, formatCurrency(value))
    ]))
  }

  // Basic salary and bonuses
  addLine('Basic Salary', salaryResult.components.basicSalary)
  addLine('Bonus E (5 days)', salaryResult.components.bonusE)
  addLine('Bonus S (2.5 days)', salaryResult.components.bonusS)
  addLine('Bonus K (Fixed)', salaryResult.components.bonusK)
  addLine('Bonus M (Fixed)', salaryResult.components.bonusM)

  if (employee.maritalStatus === 'married') {
    addLine('Bonus T (Married)', salaryResult.components.bonusT)
  }

  // Adjustments
  if (adjustments.length > 0) {
    salaryCalc.appendChild(el('div', { class: 'adjustments-header' }, 'Adjustments:'))

    for (let i = 0; i < adjustments.length; i++) {
      const adj = adjustments[i]
      salaryCalc.appendChild(el('div', { class: 'adjustment-item' }, [
        el('div', { class: 'calc-line' }, [
          el('span', { class: 'calc-label' }, `${i + 1}. ${adj.comment || 'Adjustment'}`),
          el('span', { class: 'calc-value' }, formatCurrency(adj.amount))
        ]),
        el('button', {
          class: 'btn small remove-btn',
          onclick: () => {
            adjustments.splice(i, 1)
            updateAdjustments(adjustments)
          }
        }, '×')
      ]))
    }

    addLine('Total Adjustments', salaryResult.components.adjustmentTotal)
  }

  addLine('Subtotal', salaryResult.subtotal, true)
  addLine('Insurance (7%)', -salaryResult.components.insuranceDeduction)

  salaryCalc.appendChild(el('div', { class: 'calc-line total' }, [
    el('span', { class: 'calc-label' }, 'TOTAL'),
    el('span', { class: 'calc-value' }, formatCurrency(salaryResult.total))
  ]))

  return salaryCalc
}

// ============================================================================
// EMPLOYEE PAYROLL SECTION
// ============================================================================

const createEmployeePayrollSection = (employee, year, month, employeeAdjustments) => {
  const attendanceData = attendance.getForMonth(employee.id, year, month)
  const workStats = calculateAttendanceSummary(attendanceData)
  
  const employeeSection = el('div', { class: 'employee-payroll' })
  employeeSection.appendChild(el('h3', {}, employee.name))

  // Work summary
  const totalDays = el('div', { class: 'stat' }, [
    el('span', { class: 'stat-label' }, 'Total Days:'),
    el('span', { class: 'stat-value' }, Object.keys(attendanceData).length)
  ])
  const regularDays = el('div', { class: 'stat' }, [
    el('span', { class: 'stat-label' }, 'Regular Days:'),
    el('span', { class: 'stat-value' }, workStats.byType.regular || 0)
  ])
  const holidays = el('div', { class: 'stat' }, [
    el('span', { class: 'stat-label' }, 'Holidays:'),
    el('span', { class: 'stat-value' }, workStats.byType.holiday || 0)
  ])
  const paidLeave = el('div', { class: 'stat' }, [
    el('span', { class: 'stat-label' }, 'Paid Leave:'),
    el('span', { class: 'stat-value' }, workStats.byType.paid_leave || 0)
  ])
  const unpaidLeave = el('div', { class: 'stat' }, [
    el('span', { class: 'stat-label' }, 'Unpaid Leave:'),
    el('span', { class: 'stat-value' }, workStats.byType.unpaid_leave || 0)
  ])
  const totalHours = el('div', { class: 'stat' }, [
    el('span', { class: 'stat-label' }, 'Total Hours:'),
    el('span', { class: 'stat-value' }, workStats.hours.toFixed(2))
  ])
  
  const workSummary = el('div', { class: 'work-summary' }, [
    totalDays, regularDays, holidays, paidLeave, unpaidLeave, totalHours
  ])

  employeeSection.appendChild(workSummary)

  // Salary calculation with update function
  const updateSalaryDisplay = (adjustments) => {
    const existingCalc = employeeSection.querySelector('.salary-calculation')
    if (existingCalc) existingCalc.remove()
    employeeSection.appendChild(createSalaryDisplay(employee, attendanceData, adjustments, updateSalaryDisplay))
  }

  // Buttons
  const buttons = el('div', { class: 'payroll-buttons' }, [
    el('button', {
      class: 'btn add-adjustment',
      onclick: () => {
        const emp = employees.getById(employee.id)
        if (!emp) return notify('Employee not found', 'error')
        
        const form = createAdjustmentForm((adjustment) => {
          employeeAdjustments[employee.id].push(adjustment)
          updateSalaryDisplay(employeeAdjustments[employee.id])
          modal.close()
        })
        modal.create(`Add Adjustment for ${emp.name}`, form)
      }
    }, 'Add Adjustment'),
    el('button', {
      class: 'btn print-btn',
      onclick: () => {
        const salaryResult = calculateSalary(employee, attendanceData, employeeAdjustments[employee.id])
        showPrintableReport(employee, salaryResult, `${year}-${month}`)
      }
    }, 'Print Report')
  ])

  employeeSection.appendChild(buttons)
  updateSalaryDisplay(employeeAdjustments[employee.id])

  return employeeSection
}

// ============================================================================
// PRINTABLE REPORT
// ============================================================================

const showPrintableReport = (employee, salaryResult, periodStr) => {
  const [year, month] = periodStr.split('-')
  const periodName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })

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
      el('div', { class: 'report-section' }, [
        el('h3', {}, 'Calculation Breakdown'),
        el('div', { class: 'report-line' }, [el('span', {}, 'Basic Salary:'), el('span', {}, formatCurrency(salaryResult.components.basicSalary))]),
        el('div', { class: 'report-line' }, [el('span', {}, 'Bonus E (5 days):'), el('span', {}, formatCurrency(salaryResult.components.bonusE))]),
        el('div', { class: 'report-line' }, [el('span', {}, 'Bonus S (2.5 days):'), el('span', {}, formatCurrency(salaryResult.components.bonusS))]),
        el('div', { class: 'report-line' }, [el('span', {}, 'Bonus K (Fixed):'), el('span', {}, formatCurrency(salaryResult.components.bonusK))]),
        el('div', { class: 'report-line' }, [el('span', {}, 'Bonus M (Fixed):'), el('span', {}, formatCurrency(salaryResult.components.bonusM))]),
        employee.maritalStatus === 'married' ? el('div', { class: 'report-line' }, [el('span', {}, 'Bonus T (Married):'), el('span', {}, formatCurrency(salaryResult.components.bonusT))]) : null,
        salaryResult.components.adjustments.length > 0 ? el('div', { class: 'adjustments-list' }, [
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
        ]) : null,
        el('div', { class: 'report-line subtotal' }, [el('span', {}, 'Subtotal:'), el('span', {}, formatCurrency(salaryResult.subtotal))]),
        el('div', { class: 'report-line deduction' }, [el('span', {}, 'Insurance Deduction (7%):'), el('span', {}, formatCurrency(-salaryResult.components.insuranceDeduction))]),
        el('div', { class: 'report-line total' }, [el('span', {}, 'TOTAL SALARY:'), el('span', {}, formatCurrency(salaryResult.total))])
      ])
    ]),
    el('div', { class: 'report-footer' }, [
      el('div', { class: 'signatures' }, [
        el('div', { class: 'signature' }, [el('div', { class: 'signature-line' }), el('div', {}, 'Employee')]),
        el('div', { class: 'signature' }, [el('div', { class: 'signature-line' }), el('div', {}, 'Finance')]),
        el('div', { class: 'signature' }, [el('div', { class: 'signature-line' }), el('div', {}, 'Director')])
      ])
    ])
  ])

  report.appendChild(el('div', { class: 'report-buttons' }, [
    el('button', { class: 'btn', onclick: () => modal.close() }, 'Close'),
    el('button', {
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
                @media print { button { display: none; } }
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
  ]))

  modal.create('Salary Report', report)
}

// ============================================================================
// MAIN RENDER FUNCTION
// ============================================================================

const renderPayrollCalculator = () => {
  const container = document.getElementById('payroll-calculator')
  if (!container) return

  container.innerHTML = ''

  if (employees.getAll().length === 0) {
    container.appendChild(el('div', { class: 'empty-state' }, 'No employees found.'))
    return
  }

  const monthSelect = document.getElementById('payroll-month')
  if (!monthSelect) return

  const [year, month] = monthSelect.value.split('-').map(Number)
  const employeeAdjustments = {}

  for (const employee of employees.getAll()) {
    employeeAdjustments[employee.id] = []
    container.appendChild(createEmployeePayrollSection(employee, year, month, employeeAdjustments))
  }
}

// ============================================================================
// COMPONENT INITIALIZATION
// ============================================================================

export const initPayrollComponent = () => {
  const payrollSection = el('section', { id: 'payroll-section', class: 'section' }, [
    el('h2', {}, 'Payroll Calculator'),
    el('div', { id: 'payroll-controls' }),
    el('div', { id: 'payroll-calculator' })
  ])

  setTimeout(() => {
    const controlsContainer = document.getElementById('payroll-controls')
    if (controlsContainer) {
      controlsContainer.appendChild(createMonthSelector())
      renderPayrollCalculator()
    }
  }, 0)

  return payrollSection
}
