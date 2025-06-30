/**
 * Attendance management component
 * Handles recording and viewing employee attendance
 */

import { employees, storeUtils } from '../store.js'
import { el, formGroup, modal, notify, createTable, formatDate } from '../ui.js'
import { DAY_TYPES } from '../calc.js'

// Create attendance form
const createAttendanceForm = (employeeId, date, onSubmit, existingData = {}) => {
  const form = el('form', {
    onsubmit: (e) => {
      e.preventDefault()

      const formData = new FormData(e.target)
      const dayType = formData.get('dayType')

      const attendanceData = {
        type: dayType,
        notes: formData.get('notes') || ''
      }

      // Only collect time entries for regular work days
      if (dayType === DAY_TYPES.REGULAR) {
        attendanceData.entryTime = formData.get('entryTime')
        attendanceData.exitTime = formData.get('exitTime')
      }

      onSubmit(attendanceData)
    }
  })

  // Date display (read-only)
  const dateDisplay = el('div', { class: 'date-display' }, formatDate(new Date(date)))
  form.appendChild(formGroup('Date', dateDisplay))

  // Day type selection
  const dayTypeSelect = el('select', {
    name: 'dayType',
    required: 'required',
    onchange: (e) => {
      // Show/hide time fields based on day type
      const isRegular = e.target.value === DAY_TYPES.REGULAR
      document.getElementById('time-fields').style.display = isRegular ? 'block' : 'none'
    }
  }, [
    el('option', { value: DAY_TYPES.REGULAR, selected: existingData.type === DAY_TYPES.REGULAR }, 'Regular Work Day'),
    el('option', { value: DAY_TYPES.HOLIDAY, selected: existingData.type === DAY_TYPES.HOLIDAY }, 'Holiday'),
    el('option', { value: DAY_TYPES.PAID_LEAVE, selected: existingData.type === DAY_TYPES.PAID_LEAVE }, 'Paid Leave'),
    el('option', { value: DAY_TYPES.UNPAID_LEAVE, selected: existingData.type === DAY_TYPES.UNPAID_LEAVE }, 'Unpaid Leave')
  ])
  form.appendChild(formGroup('Day Type', dayTypeSelect))

  // Time entry fields (only for regular work days)
  const timeFields = el('div', { id: 'time-fields', style: existingData.type !== DAY_TYPES.REGULAR ? 'display: none;' : '' })

  // Entry time field
  timeFields.appendChild(formGroup('Entry Time', el('input', {
    type: 'time',
    name: 'entryTime',
    value: existingData.entryTime || '',
    required: existingData.type === DAY_TYPES.REGULAR ? 'required' : false
  })))

  // Exit time field
  timeFields.appendChild(formGroup('Exit Time', el('input', {
    type: 'time',
    name: 'exitTime',
    value: existingData.exitTime || '',
    required: existingData.type === DAY_TYPES.REGULAR ? 'required' : false
  })))

  form.appendChild(timeFields)

  // Notes field
  form.appendChild(formGroup('Notes', el('textarea', {
    name: 'notes',
    rows: '3'
  }, existingData.notes || '')))

  // Submit button
  const submitBtn = el('button', { type: 'submit', class: 'btn primary' },
    existingData.type ? 'Update Attendance' : 'Add Attendance'
  )

  // Cancel button
  const cancelBtn = el('button', {
    type: 'button',
    class: 'btn',
    onclick: () => modal.close()
  }, 'Cancel')

  form.appendChild(el('div', { class: 'form-actions' }, [cancelBtn, submitBtn]))

  return form
}

// Show attendance form modal
const showAttendanceModal = (employeeId, date, existingData) => {
  const employee = employees.find(emp => emp.id === employeeId)
  if (!employee) {
    notify('Employee not found', 'error')
    return
  }

  const form = createAttendanceForm(employeeId, date, (attendanceData) => {
    storeUtils.recordAttendance(employeeId, date, attendanceData)
    modal.close()
    notify('Attendance recorded successfully', 'success')
    renderAttendanceList() // Re-render the list
  }, existingData)

  modal.create(`Record Attendance: ${employee.name}`, form)
}

// Create date selector for attendance
const createDateSelector = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

  // Create month selector
  const monthSelect = el('select', {
    id: 'attendance-month',
    onchange: renderAttendanceList
  })

  // Add options for last 3 months and current month
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

  // Create employee selector
  const employeeSelect = el('select', {
    id: 'attendance-employee',
    onchange: renderAttendanceList
  })

  // Add options for all employees
  employeeSelect.appendChild(el('option', { value: '' }, 'All Employees'))

  employees.forEach(emp => {
    employeeSelect.appendChild(el('option', { value: emp.id }, emp.name))
  })

  // Create selector container
  return el('div', { class: 'attendance-selector' }, [
    el('div', { class: 'selector-group' }, [
      el('label', {}, 'Month:'),
      monthSelect
    ]),
    el('div', { class: 'selector-group' }, [
      el('label', {}, 'Employee:'),
      employeeSelect
    ])
  ])
}

// Get days in month
const getDaysInMonth = (year, month) => {
  // Month is 1-based in our selector but 0-based in Date
  return new Date(year, month, 0).getDate()
}

// Render attendance list for selected month/employee
const renderAttendanceList = () => {
  const container = document.getElementById('attendance-list')
  if (!container) return

  container.innerHTML = ''

  // Get selected month and employee
  const monthSelect = document.getElementById('attendance-month')
  const employeeSelect = document.getElementById('attendance-employee')

  if (!monthSelect || !employeeSelect) return

  const [year, month] = monthSelect.value.split('-').map(Number)
  const selectedEmployeeId = employeeSelect.value

  // Determine which employees to display
  const employeesToDisplay = selectedEmployeeId
    ? employees.filter(emp => emp.id === selectedEmployeeId)
    : employees

  if (employeesToDisplay.length === 0) {
    container.appendChild(el('div', { class: 'empty-state' }, 'No employees found.'))
    return
  }

  // Get days in the selected month
  const daysInMonth = getDaysInMonth(year, month)

  // For each employee, create an attendance table
  employeesToDisplay.forEach(employee => {
    // Create table headers with day numbers
    const headers = ['Day', 'Date', 'Type', 'Entry', 'Exit', 'Notes', 'Actions']
    const rows = []

    // Generate a row for each day in the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`

      // Check if attendance is recorded for this day
      const attendance = employee.attendance?.[date] || {}

      // Create row data
      const typeDisplay = attendance.type
        ? {
            [DAY_TYPES.REGULAR]: 'Regular',
            [DAY_TYPES.HOLIDAY]: 'Holiday',
            [DAY_TYPES.PAID_LEAVE]: 'Paid Leave',
            [DAY_TYPES.UNPAID_LEAVE]: 'Unpaid Leave'
          }[attendance.type]
        : '-'

      rows.push([
        day,
        formatDate(new Date(date)),
        typeDisplay,
        attendance.entryTime || '-',
        attendance.exitTime || '-',
        attendance.notes || '-',
        el('button', {
          class: 'btn small',
          onclick: () => showAttendanceModal(employee.id, date, attendance)
        }, attendance.type ? 'Edit' : 'Record')
      ])
    }

    // Create the table for this employee
    const table = createTable(headers, rows, { tableClass: 'attendance-table' })

    // Create a section for this employee
    const employeeSection = el('div', { class: 'employee-attendance' }, [
      el('h3', {}, employee.name),
      table
    ])

    container.appendChild(employeeSection)
  })
}

// Initialize component
export const initAttendanceComponent = () => {
  const attendanceSection = el('section', { id: 'attendance-section', class: 'section' }, [
    el('h2', {}, 'Attendance Management'),
    el('div', { id: 'attendance-controls' }),
    el('div', { id: 'attendance-list' })
  ])

  // Add date/employee selector after component is added to DOM
  setTimeout(() => {
    const controlsContainer = document.getElementById('attendance-controls')
    if (controlsContainer) {
      controlsContainer.appendChild(createDateSelector())
      renderAttendanceList()
    }
  }, 0)

  return attendanceSection
}
