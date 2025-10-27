<script>
  import Icon from '@iconify/svelte'
  import { createEventDispatcher } from 'svelte'
  import { EMPLOYEE_FIELDS } from '../payroll.js'

  let { employees = [], form = {}, isEditing = false } = $props()
  const dispatch = createEventDispatcher()

  const saveEmployee = () => dispatch('save')
  const editEmployee = (employee) => dispatch('edit', employee)
  const deleteEmployee = (id) => dispatch('delete', id)
  const updateForm = (field, value) => dispatch('update-form', { [field]: value })
  const resetForm = () => dispatch('reset-form')
</script>

<div class="employee-section">
  <div class="employee-form">
    <h3>{isEditing ? 'Edit Employee' : 'Add Employee'}</h3>

    <div class="form-grid">
      {#each EMPLOYEE_FIELDS as field}
        <label class="field">
          <span>{field.label}</span>
          {#if field.type === 'select'}
            <select
              value={form[field.key] || ''}
              onchange={(e) => updateForm(field.key, e.target.value)}
            >
              {#each field.options as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          {:else if field.type === 'number' && field.step === 0.1}
            <input
              {...field}
              value={form[field.key] || ''}
              oninput={(e) => {
                const value = parseFloat(e.target.value) || 0
                updateForm(field.key, Math.max(0, value))
              }}
            />
          {:else}
            <input
              {...field}
              value={form[field.key] || ''}
              oninput={(e) => updateForm(field.key, field.type === 'number' ? +e.target.value : e.target.value)}
            />
          {/if}
        </label>
      {/each}
    </div>

    <div class="form-actions">
      <button class="primary" onclick={saveEmployee}>
        <Icon icon="solar:check-circle-bold" width="1rem" height="1rem" />
        {isEditing ? 'Update' : 'Add'} Employee
      </button>

      {#if isEditing}
        <button class="secondary" onclick={resetForm}>
          <Icon icon="solar:close-circle-linear" width="1rem" height="1rem" />
          Cancel
        </button>
      {/if}
    </div>
  </div>

  {#if employees.length > 0}
    <div class="employee-list">
      <h3>Employees ({employees.length})</h3>

      <div class="employee-cards">
        {#each employees as employee}
          <div class="employee-card">
            <div class="employee-info">
              <h4>{employee.name}</h4>
              <p>{employee.gender} • {employee.maritalStatus}</p>
              <p class="salary">$ {employee.monthlySalary?.toLocaleString()}</p>
              {#if employee.hourlyRate}
                <p class="hourly-rate">$ {employee.hourlyRate.toLocaleString()}/hr</p>
              {/if}
            </div>

            <div class="employee-actions">
              <button class="icon-btn" onclick={() => editEmployee(employee)}>
                <Icon icon="line-md:edit-full-twotone" width="1rem" height="1rem" />
              </button>
              <button class="icon-btn danger" onclick={() => deleteEmployee(employee.id)}>
                <Icon icon="line-md:remove" width="1rem" height="1rem" />
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="empty">
      <Icon icon="solar:users-group-two-rounded-bold-duotone" width="3rem" height="3rem" />
      <p>No employees added yet</p>
    </div>
  {/if}
</div>

<style lang="sass">
  @use "../styles.sass" as *

  .employee-section
    @extend %grid
    gap: 3rem

  .employee-form
    @extend %card-base

    h3
      margin-bottom: 1.5rem

  .form-grid
    @extend %grid
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))
    gap: 1.5rem
    margin-bottom: 2rem

  .field
    @extend %grid
    gap: 0.5rem

    span
      font-weight: 600
      color: var(--fg)

    input, select
      @extend %input-base

  .form-actions
    @extend %flex
    gap: 1rem

    button
      @extend %button-base

      &.primary
        @extend %button-primary

      &.secondary
        @extend %button-secondary

  .employee-list
    h3
      margin-bottom: 1.5rem

  .employee-cards
    @extend %grid
    gap: 1rem

  .employee-card
    @extend %flex-between
    padding: 1.5rem
    background: var(--surface)
    border-radius: var(--radius)
    /* border: 6px solid var(--border-muted) */

  .employee-info
    h4
      margin: 0 0 0.5rem 0
      color: var(--primary)

    p
      margin: 0.25rem 0
      color: var(--fg-muted)
      font-size: 0.875rem

      &.salary
        font-weight: 600
        color: var(--fg)
        
      &.hourly-rate
        font-weight: 600
        color: var(--fg-muted)
        font-size: 0.8rem

  .employee-actions
    @extend %flex
    gap: 0.5rem

  .icon-btn
    width: 2.5rem
    height: 2.5rem
    border-radius: 50%
    border: 4px solid var(--border-muted)
    background: var(--border-muted)
    cursor: pointer
    @extend %transition
    @extend %grid
    place-items: center

    &:hover
      background: var(--surface-medium)

    &.danger:hover
      background: var(--surface-error)
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
