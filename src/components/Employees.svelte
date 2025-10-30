<script>
  import Icon from '@iconify/svelte'
  import { createEventDispatcher } from 'svelte'
  import { EMPLOYEE_FIELDS } from '../payroll.js'
  import { addEmployee, updateEmployee, removeEmployee, basicConfig } from '../stores.js'
  import { generateEmployeeId } from '../core.js'
  import { toasts } from '../lib/toast.js'
  import { confirmDialog } from '../lib/dialog.js'
  import Dialog from './Dialog.svelte'

  let { employees = [] } = $props()
  const dispatch = createEventDispatcher()

  // Form state
  let showEmployeeDialog = $state(false)
  let editingEmployee = $state(null)
  let errors = $state({ name: false, gender: false, maritalStatus: false, monthlySalary: false, yearsOfExperience: false })
  let newEmployee = $state({
    name: '',
    gender: 'male',
    maritalStatus: 'single',
    monthlySalary: '',
    yearsOfExperience: ''
  })

  // Handle dialog close
  const handleDialogClose = () => {
    showEmployeeDialog = false
    editingEmployee = null
    errors = { name: false, gender: false, maritalStatus: false, monthlySalary: false, yearsOfExperience: false }
    newEmployee = {
      name: '',
      gender: 'male',
      maritalStatus: 'single',
      monthlySalary: '',
      yearsOfExperience: ''
    }
  }

  // Employee form handlers
  const startAddEmployee = () => {
    newEmployee = {
      name: '',
      gender: 'male',
      maritalStatus: 'single',
      monthlySalary: '',
      yearsOfExperience: ''
    }
    showEmployeeDialog = true
  }

  const startEditEmployee = (employee) => {
    editingEmployee = employee
    newEmployee = { ...employee }
    showEmployeeDialog = true
  }

  const saveEmployee = () => {
    errors = { name: false, gender: false, maritalStatus: false, monthlySalary: false, yearsOfExperience: false }
    
    if (!newEmployee.name || newEmployee.name.trim() === '') {
      errors.name = true
    }
    
    if (!newEmployee.gender) {
      errors.gender = true
    }
    
    if (!newEmployee.maritalStatus) {
      errors.maritalStatus = true
    }
    
    if (!newEmployee.monthlySalary || newEmployee.monthlySalary === '' || Number(newEmployee.monthlySalary) <= 0) {
      errors.monthlySalary = true
    }
    
    if (!newEmployee.yearsOfExperience || newEmployee.yearsOfExperience === '' || Number(newEmployee.yearsOfExperience) < 0) {
      errors.yearsOfExperience = true
    }
    
    if (errors.name || errors.gender || errors.maritalStatus || errors.monthlySalary || errors.yearsOfExperience) {
      toasts.error('Please fix the errors below')
      return
    }
    
    try {
      // Calculate hourly rate using current basicConfig
      const monthlySalaryNum = Number(newEmployee.monthlySalary)
      const dailyRate = monthlySalaryNum / ($basicConfig.workingDaysPerMonth || 22)
      const hourlyRate = dailyRate / ($basicConfig.workdayHours || 8)
      
      const data = { 
        ...newEmployee, 
        monthlySalary: parseInt(newEmployee.monthlySalary),
        hourlyRate: hourlyRate,
        yearsOfExperience: parseFloat(newEmployee.yearsOfExperience)
      }
      
      if (editingEmployee) {
        updateEmployee(editingEmployee.id, data)
        toasts.success('Employee updated')
      } else {
        addEmployee({ id: generateEmployeeId(), ...data })
        toasts.success('Employee added')
      }
      cancelEmployeeForm()
      errors = { name: false, gender: false, maritalStatus: false, monthlySalary: false, yearsOfExperience: false }
    } catch (error) {
      toasts.error(error.message)
    }
  }

  const cancelEmployeeForm = () => {
    showEmployeeDialog = false
    editingEmployee = null
    errors = { name: false, gender: false, maritalStatus: false, monthlySalary: false, yearsOfExperience: false }
    newEmployee = {
      name: '',
      gender: 'male',
      maritalStatus: 'single',
      monthlySalary: '',
      yearsOfExperience: ''
    }
  }

  const deleteEmployee = async (id) => {
    if (await confirmDialog('Delete this employee?')) {
      removeEmployee(id)
      toasts.success('Employee deleted')
    }
  }
</script>

<div class="employee-section">
  <!-- Employee Management -->
  <section class="employee-management">
    <div class="employee-header">
      <h3>Employees ({employees.length})</h3>
      <div class="employee-actions">
        <button class="primary" onclick={startAddEmployee}>
          <Icon icon="solar:add-circle-bold" style="width: var(--icon-size); height: var(--icon-size)" />
          Add Employee
        </button>
      </div>
    </div>

    <!-- Employee List -->
    <div class="employee-list">
      {#if employees.length > 0}
        <div class="employee-cards">
          {#each employees as employee}
            <div class="employee-card" onclick={() => startEditEmployee(employee)}>
              <div class="employee-info">
                <h4>{employee.name}</h4>
                <p>{employee.gender} • {employee.maritalStatus}</p>
                <p class="salary">$ {employee.monthlySalary?.toLocaleString()}</p>
                {#if employee.hourlyRate}
                  <p class="hourly-rate">$ {employee.hourlyRate.toLocaleString()}/hr</p>
                {/if}
                {#if employee.yearsOfExperience}
                  <p class="experience">{employee.yearsOfExperience} years experience</p>
                {/if}
              </div>

              <div class="employee-actions">
                <button class="edit-btn" onclick={(e) => { e.stopPropagation(); startEditEmployee(employee) }}>
                  <Icon icon="solar:pen-bold" style="width: var(--icon-size); height: var(--icon-size)" />
                </button>
                <button class="delete-btn" onclick={(e) => { e.stopPropagation(); deleteEmployee(employee.id) }}>
                  <Icon icon="solar:trash-bin-trash-bold" style="width: var(--icon-size); height: var(--icon-size)" />
                </button>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="empty">
          <Icon icon="solar:users-group-two-rounded-bold-duotone" width="3rem" height="3rem" />
          <p>No employees added yet</p>
        </div>
      {/if}
    </div>
  </section>

  <!-- Add/Edit Employee Form -->
  <Dialog
    bind:open={showEmployeeDialog}
    title={editingEmployee ? 'Edit Employee' : 'Add New Employee'}
    size="medium"
  >
    <div class="form-grid">
      {#each EMPLOYEE_FIELDS as field}
        <label class="field" class:error={errors[field.key]}>
          <span>{field.label}</span>
          {#if field.type === 'select'}
            <select
              value={newEmployee[field.key] || ''}
              onchange={(e) => {
                newEmployee[field.key] = e.currentTarget.value
                if (errors[field.key]) errors[field.key] = false
              }}
            >
              {#each field.options as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          {:else if field.type === 'number' && field.step === 0.1}
            <input
              {...field}
              value={newEmployee[field.key] || ''}
              oninput={(e) => {
                const value = parseFloat(e.currentTarget.value) || 0
                newEmployee[field.key] = Math.max(0, value)
                if (errors[field.key]) errors[field.key] = false
              }}
            />
          {:else}
            <input
              {...field}
              value={newEmployee[field.key] || ''}
              oninput={(e) => {
                const target = e.currentTarget
                newEmployee[field.key] = field.type === 'number' ? +target.value : target.value
                if (errors[field.key]) errors[field.key] = false
              }}
            />
          {/if}
        </label>
      {/each}
    </div>

    <div class="form-actions">
      <button class="secondary" onclick={cancelEmployeeForm}>
        <Icon icon="solar:close-circle-bold" style="width: var(--icon-size); height: var(--icon-size)" />
        Cancel
      </button>
      <button class="primary" onclick={saveEmployee}>
        <Icon icon="solar:check-circle-bold" style="width: var(--icon-size); height: var(--icon-size)" />
        {editingEmployee ? 'Update' : 'Add'} Employee
      </button>
    </div>
  </Dialog>
</div>

<style lang="sass">
  @use "../styles.sass" as *

  .employee-section
    @extend %grid
    gap: 3rem

  .employee-management
    @extend %card-base

    h3
      margin-bottom: 1.5rem
      color: var(--primary)

  .employee-header
    @extend %flex-between
    margin-bottom: 2rem

  .employee-actions
    @extend %flex
    gap: 1rem

    button
      @extend %button-base

      &.primary
        @extend %button-primary

  .employee-list
    @extend %grid
    gap: 1rem

  .employee-cards
    @include auto-grid(280px)
    gap: 1rem

  .employee-card
    @include card-interactive(1rem)
    --card-scale: 1.2
    cursor: pointer

    &:hover
      background: var(--surface-medium)

  .employee-info
    @include card-content

    h4
      @include card-title(1.85rem)

    p
      @include card-text(1.3rem)

      &.salary
        font-weight: 600
        color: var(--fg)
        font-size: 1.4rem
        
      &.hourly-rate
        font-weight: 600
        color: var(--fg-muted)
        @include card-subtext(1.15rem)

      &.experience
        @include card-subtext(1.15rem)

  .employee-actions
    @extend %flex
    gap: 0.5rem
    flex-shrink: 0
    --icon-btn-size: 1.75rem

  .edit-btn, .delete-btn
    @include card-action-btn

    &:hover
      background: var(--surface-medium)

  .edit-btn:hover
    background: var(--primary-bg)
    color: var(--primary)

  .delete-btn:hover
    background: var(--error-bg)
    color: var(--error)

  .form-grid
    @include auto-grid(200px)
    gap: 1.5rem
    margin-bottom: 2rem

  .form-actions
    @extend %flex
    gap: 1rem
    justify-content: flex-end

    button
      @extend %button-base

      &.primary
        @extend %button-primary

      &.secondary
        @extend %button-secondary

  .field
    @extend %grid
    gap: 0.5rem

    span
      font-weight: 600
      color: var(--fg)

    input, select
      @extend %input-base

    &.error input, &.error select
      background: var(--error-bg)
      border-color: var(--error)
      color: var(--error)

      &:focus
        border-color: var(--error)
        box-shadow: 0 0 0 2px var(--error-bg)

  .empty
    @extend %grid
    place-items: center
    gap: 1rem
    padding: 3rem
    text-align: center
    color: var(--fg-muted)

    p
      margin: 0
</style>
