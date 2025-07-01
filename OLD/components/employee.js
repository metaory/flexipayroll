/**
 * Employee management component
 * Handles CRUD operations for employees
 */

import { employees } from '../store.js'
import { el, formGroup, modal, notify, createTable } from '../ui.js'
import { validateEmployee, EMPLOYEE_ATTRIBUTES } from '../core.js'

// Create employee form
const createEmployeeForm = (employee, onSubmit) => {
  const form = el('form', {
    onsubmit: (e) => {
      e.preventDefault()

      const formData = new FormData(e.target)
      const employeeData = {
        name: formData.get('name'),
        gender: formData.get('gender'),
        maritalStatus: formData.get('maritalStatus'),
        monthlySalary: Number(formData.get('monthlySalary')),
      }

      if (employee.id) {
        employeeData.id = employee.id
      }

      // Validate employee data
      const validation = validateEmployee(employeeData)
      if (!validation.isValid) {
        notify(validation.errors.join(', '), 'error')
        return
      }

      onSubmit(employeeData)
    }
  })

  // Name field
  form.appendChild(formGroup('Name', el('input', {
    type: 'text',
    name: 'name',
    value: employee.name || '',
    required: 'required'
  })))

  // Gender field
  const genderSelect = el('select', { name: 'gender', required: 'required' }, [
    el('option', { value: '' }, 'Select Gender'),
    ...EMPLOYEE_ATTRIBUTES.GENDER.map(gender => 
      el('option', { 
        value: gender, 
        selected: employee.gender === gender 
      }, gender.charAt(0).toUpperCase() + gender.slice(1))
    )
  ])
  form.appendChild(formGroup('Gender', genderSelect))

  // Marital status field
  const maritalStatusSelect = el('select', { name: 'maritalStatus', required: 'required' }, [
    el('option', { value: '' }, 'Select Marital Status'),
    ...EMPLOYEE_ATTRIBUTES.MARITAL_STATUS.map(status => 
      el('option', { 
        value: status, 
        selected: employee.maritalStatus === status 
      }, status.charAt(0).toUpperCase() + status.slice(1))
    )
  ])
  form.appendChild(formGroup('Marital Status', maritalStatusSelect))

  // Monthly salary field
  form.appendChild(formGroup('Monthly Salary', el('input', {
    type: 'number',
    name: 'monthlySalary',
    value: employee.monthlySalary || '',
    min: '0',
    step: '1',
    required: 'required'
  })))

  // Submit button
  const submitBtn = el('button', { type: 'submit', class: 'btn primary' },
    employee.id ? 'Update Employee' : 'Add Employee'
  )

  // Cancel button for edit mode
  if (employee.id) {
    const cancelBtn = el('button', {
      type: 'button',
      class: 'btn',
      onclick: () => modal.close()
    }, 'Cancel')

    form.appendChild(el('div', { class: 'form-actions' }, [cancelBtn, submitBtn]))
  } else {
    form.appendChild(el('div', { class: 'form-actions' }, [submitBtn]))
  }

  return form
}

// Create a new employee modal
const showAddEmployeeModal = () => {
  const form = createEmployeeForm({}, (employeeData) => {
    employees.add(employeeData)
    modal.close()
    notify('Employee added successfully', 'success')
    renderEmployeeList() // Re-render the list
  })

  modal.create('Add New Employee', form)
}

// Edit employee modal
const showEditEmployeeModal = (employee) => {
  const form = createEmployeeForm(employee, (employeeData) => {
    employees.update(employee.id, employeeData)
    modal.close()
    notify('Employee updated successfully', 'success')
    renderEmployeeList() // Re-render the list
  })

  modal.create('Edit Employee', form)
}

// Delete employee confirmation
const showDeleteConfirmation = (employee) => {
  const content = el('div', {}, [
    el('p', {}, `Are you sure you want to delete ${employee.name}?`),
    el('div', { class: 'form-actions' }, [
      el('button', {
        class: 'btn',
        onclick: () => modal.close()
      }, 'Cancel'),
      el('button', {
        class: 'btn danger',
        onclick: () => {
          employees.delete(employee.id)
          modal.close()
          notify('Employee deleted successfully', 'success')
          renderEmployeeList() // Re-render the list
        }
      }, 'Delete')
    ])
  ])

  modal.create('Confirm Delete', content)
}

// Render employee list
const renderEmployeeList = () => {
  const container = document.getElementById('employee-list')
  if (!container) return

  container.innerHTML = ''

  if (employees.getAll().length === 0) {
    container.appendChild(el('div', { class: 'empty-state' }, [
      el('p', {}, 'No employees found.'),
      el('button', {
        class: 'btn primary',
        onclick: showAddEmployeeModal
      }, 'Add Employee')
    ]))
    return
  }

  // Create employee table
  const headers = ['Name', 'Gender', 'Marital Status', 'Monthly Salary', 'Actions']

  const rows = employees.getAll().map(employee => [
    employee.name,
    employee.gender,
    employee.maritalStatus,
    new Intl.NumberFormat('id-ID').format(employee.monthlySalary),
    el('div', { class: 'action-buttons' }, [
      el('button', {
        class: 'btn small',
        onclick: () => showEditEmployeeModal(employee)
      }, 'Edit'),
      el('button', {
        class: 'btn small danger',
        onclick: () => showDeleteConfirmation(employee)
      }, 'Delete')
    ])
  ])

  const table = createTable(headers, rows, { tableClass: 'employee-table' })

  const addButton = el('button', {
    class: 'btn primary',
    onclick: showAddEmployeeModal
  }, 'Add Employee')

  container.appendChild(el('div', { class: 'table-actions' }, addButton))
  container.appendChild(table)
}

// Initialize component
export const initEmployeeComponent = () => {
  const employeeSection = el('section', { id: 'employee-section', class: 'section' }, [
    el('h2', {}, 'Employee Management'),
    el('div', { id: 'employee-list' })
  ])

  // Render initial list after component is added to DOM
  setTimeout(renderEmployeeList, 0)

  return employeeSection
}
