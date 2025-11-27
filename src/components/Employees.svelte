<script>
  import Icon from '@iconify/svelte'
  import { EMPLOYEE_FIELDS } from '../payroll.js'
  import { addEmployee, updateEmployee, removeEmployee, basicConfig } from '../stores.js'
  import { generateEmployeeId, formatCurrency, calculateHourlyRate } from '../core.js'
  import { toasts } from '../lib/toast.js'
  import { confirmDialog } from '../lib/dialog.js'
  import Dialog from './Dialog.svelte'

  let { employees = [] } = $props()

  // Constants
  const EMPTY_EMPLOYEE = {
    name: '',
    gender: 'male',
    maritalStatus: 'single',
    dailySalary: '',
    yearsOfExperience: '',
    jadid: false
  }

  const EMPTY_ERRORS = {
    name: false,
    gender: false,
    maritalStatus: false,
    dailySalary: false,
    yearsOfExperience: false
  }

  // Form state
  let showEmployeeDialog = $state(false)
  let editingEmployee = $state(null)
  let errors = $state({ ...EMPTY_ERRORS })
  let newEmployee = $state({ ...EMPTY_EMPLOYEE })

  // Handle dialog close
  const handleDialogClose = () => {
    showEmployeeDialog = false
    editingEmployee = null
    errors = { ...EMPTY_ERRORS }
    newEmployee = { ...EMPTY_EMPLOYEE }
  }

  // Employee form handlers
  const startAddEmployee = () => {
    newEmployee = { ...EMPTY_EMPLOYEE }
    showEmployeeDialog = true
  }

  const startEditEmployee = (employee) => {
    editingEmployee = employee
    newEmployee = { ...employee, jadid: Boolean(employee.jadid) }
    showEmployeeDialog = true
  }

  const saveEmployee = () => {
    const validations = [
      [!newEmployee.name || newEmployee.name.trim() === '', 'name'],
      [!newEmployee.gender, 'gender'],
      [!newEmployee.maritalStatus, 'maritalStatus'],
      [!newEmployee.dailySalary || newEmployee.dailySalary === '' || Number(newEmployee.dailySalary) <= 0, 'dailySalary'],
      [!newEmployee.yearsOfExperience || newEmployee.yearsOfExperience === '' || Number(newEmployee.yearsOfExperience) < 0, 'yearsOfExperience']
    ]
    
    errors = validations
      .filter(([condition]) => condition)
      .reduce((acc, [, field]) => ({ ...acc, [field]: true }), { ...EMPTY_ERRORS })
    
    if (Object.values(errors).some(Boolean)) {
      toasts.error('Please fix the errors below')
      return
    }
    
    try {
      const data = { 
        ...newEmployee, 
        dailySalary: parseInt(newEmployee.dailySalary),
        yearsOfExperience: parseFloat(newEmployee.yearsOfExperience),
        jadid: Boolean(newEmployee.jadid)
      }
      
      if (editingEmployee) {
        updateEmployee(editingEmployee.id, data)
        toasts.success('Employee updated')
      } else {
        addEmployee({ id: generateEmployeeId(), ...data })
        toasts.success('Employee added')
      }
      cancelEmployeeForm()
      errors = { ...EMPTY_ERRORS }
    } catch (error) {
      toasts.error(error.message)
    }
  }

  const cancelEmployeeForm = () => {
    showEmployeeDialog = false
    editingEmployee = null
    errors = { ...EMPTY_ERRORS }
    newEmployee = { ...EMPTY_EMPLOYEE }
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
          <Icon icon="tabler:plus" width="1rem" height="1rem" />
          Add
        </button>
      </div>
    </div>

    <!-- Employee List -->
    <div class="employee-list">
      {#if employees.length > 0}
        <div class="employee-cards">
          {#each employees as employee}
            <div class="employee-card" role="button" tabindex="0" onclick={() => startEditEmployee(employee)} onkeydown={(e) => e.key === 'Enter' && startEditEmployee(employee)}>
              <div class="employee-info">
                <h4>{employee.name}</h4>
                <p>{employee.gender} • {employee.maritalStatus}{#if employee.jadid} • <span class="jadid-badge">Jadid (New)</span>{/if}</p>
                <p class="salary">{formatCurrency(employee.dailySalary || 0, 'id-ID', 'IDR', $basicConfig.currencySymbol)}/day</p>
                {#if employee.dailySalary}
                  <p class="monthly-ref">({formatCurrency((employee.dailySalary || 0) * 30, 'id-ID', 'IDR', $basicConfig.currencySymbol)}/month)</p>
                {/if}
                {#if employee.dailySalary}
                  {@const hourlyRate = calculateHourlyRate(employee.dailySalary, $basicConfig.workdayHours || 8)}
                  <p class="hourly-rate">{formatCurrency(hourlyRate, 'id-ID', 'IDR', $basicConfig.currencySymbol)}/hr</p>
                {/if}
                {#if employee.yearsOfExperience}
                  <p class="experience">{employee.yearsOfExperience} years experience</p>
                {/if}
              </div>

              <div class="employee-actions">
                <button class="edit-btn" onclick={(e) => { e.stopPropagation(); startEditEmployee(employee) }} aria-label="Edit">
                  <Icon icon="tabler:edit" width="1rem" height="1rem" />
                </button>
                <button class="delete-btn" onclick={(e) => { e.stopPropagation(); deleteEmployee(employee.id) }} aria-label="Delete">
                  <Icon icon="tabler:trash" width="1rem" height="1rem" />
                </button>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="empty">
          <Icon icon="tabler:users" width="2.5rem" height="2.5rem" />
          <p>No employees yet</p>
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
        {#if field.type === 'checkbox'}
          <label class="field checkbox-field" class:error={errors[field.key]}>
            <input
              type="checkbox"
              checked={Boolean(newEmployee[field.key])}
              onchange={(e) => {
                newEmployee = { ...newEmployee, [field.key]: e.currentTarget.checked }
                if (errors[field.key]) errors[field.key] = false
              }}
            />
            <span>{field.label}</span>
          </label>
        {:else}
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
        {/if}
      {/each}
    </div>

    <div class="form-actions">
      <button class="secondary" onclick={cancelEmployeeForm}>
        <Icon icon="tabler:x" width="1rem" height="1rem" />
        Cancel
      </button>
      <button class="primary" onclick={saveEmployee}>
        <Icon icon="tabler:check" width="1rem" height="1rem" />
        {editingEmployee ? 'Update' : 'Add'}
      </button>
    </div>
  </Dialog>
</div>

<style lang="sass">
  @use "../styles.sass" as *

  .employee-section
    @extend %grid
    gap: 1.5rem

  .employee-management
    @extend %card-base
    padding: 0.875rem

    h3
      margin-bottom: 1rem
      font-size: 1.5rem
      color: var(--primary)

  .employee-header
    @extend %flex-between
    margin-bottom: 1rem

  .employee-actions
    @extend %flex
    gap: 0.5rem

    button
      @extend %button-base
      padding: 0.5rem 0.75rem
      font-size: 0.9rem

      &.primary
        @extend %button-primary

  .employee-list
    @extend %grid
    gap: 0.5rem

  .employee-cards
    @include auto-grid(240px)
    gap: 0.5rem

  .employee-card
    @include card-interactive(0.5rem)
    --card-scale: 1
    cursor: pointer
    padding: 0.65rem
    border: 2px solid transparent

    &:hover
      background: var(--surface-medium)
      border-color: var(--primary)
      box-shadow: 0 4px 16px color-mix(in oklab, var(--primary) 20%, transparent)
      transform: translateY(-2px)

      h4
        color: var(--secondary)

  .employee-info
    @include card-content

    h4
      @include card-title(1.2rem)
      margin-bottom: 0.25rem

    p
      @include card-text(0.95rem)
      margin: 0.15rem 0

      &.salary
        font-weight: 600
        color: var(--fg)
        font-size: 1.1rem
        
      &.hourly-rate
        font-weight: 600
        color: var(--fg-muted)
        font-size: 0.85rem
        
      &.monthly-ref
        font-size: 0.8rem

    .jadid-badge
      display: inline-block
      padding: 0.15rem 0.4rem
      background: var(--accent)
      color: var(--bg)
      border-radius: 0.3rem
      font-size: 0.75rem
      font-weight: 600
      margin-left: 0.35rem

    .experience
      font-size: 0.85rem

  .employee-actions
    @extend %flex
    gap: 0.35rem
    flex-shrink: 0

  .edit-btn, .delete-btn
    width: 2rem
    height: 2rem
    border-radius: 50%
    background: var(--border-muted)
    border: none
    padding: 0
    display: flex
    align-items: center
    justify-content: center
    color: var(--fg-muted)
    cursor: pointer
    transition: all 0.2s ease
    flex-shrink: 0

    :global(svg)
      display: block
      width: 1.25rem !important
      height: 1.25rem !important
      color: inherit

    &:hover
      background: var(--surface-medium)

  .edit-btn:hover
    background: var(--primary-bg)
    color: var(--primary)

  .delete-btn:hover
    background: var(--error-bg)
    color: var(--error)

  .form-grid
    @include auto-grid(180px)
    gap: 1rem
    margin-bottom: 1.25rem

  .form-actions
    @extend %flex
    gap: 0.75rem
    justify-content: flex-end

    button
      @extend %button-base
      padding: 0.5rem 0.75rem
      font-size: 0.9rem

      &.primary
        @extend %button-primary

      &.secondary
        @extend %button-secondary

  .field
    @extend %grid
    gap: 0.35rem

    span
      font-weight: 600
      font-size: 0.9rem
      color: var(--fg)

    input, select
      @extend %input-base
      padding: 0.5rem 0.75rem
      font-size: 1rem

    &.error input, &.error select
      background: var(--error-bg)
      border-color: var(--error)
      color: var(--error)

      &:focus
        border-color: var(--error)
        box-shadow: 0 0 0 2px var(--error-bg)

  .checkbox-field
    display: flex
    flex-direction: row
    align-items: center
    gap: 0.75rem
    cursor: pointer
    padding: 0.75rem
    border-radius: var(--radius)
    background: var(--surface-muted)
    transition: all 0.2s ease

    &:hover
      background: var(--surface-medium)

    input[type="checkbox"]
      width: 2rem
      height: 2rem
      cursor: pointer
      margin: 0
      flex-shrink: 0
      appearance: none
      border: 3px solid var(--border)
      border-radius: 0.5rem
      background: var(--surface)
      transition: all 0.2s ease
      position: relative

      &:checked
        background: var(--primary)
        border-color: var(--primary)

        &::after
          content: '✓'
          position: absolute
          top: 50%
          left: 50%
          transform: translate(-50%, -50%)
          color: white
          font-size: 1.4rem
          font-weight: bold
          line-height: 1

      &:hover
        border-color: var(--primary)

    span
      font-weight: 600
      color: var(--fg)
      user-select: none
      margin: 0

    &.error
      background: var(--error-bg)
      border: 1px solid var(--error)

      span
        color: var(--error)

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
