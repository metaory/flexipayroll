<script>
  import Icon from '@iconify/svelte'
  import { addAttendanceItem, updateAttendanceItem, removeAttendanceItem, getAttendanceItems } from '../stores.js'
  import { stringToColor, round2 } from '../core.js'
  import { toasts } from '../lib/toast.js'
  import { confirmDialog } from '../lib/dialog.js'

  let { employees = [], period = '' } = $props()

  // Form state per employee
  let forms = $state({})
  let editing = $state({})

  // Initialize form state
  const initForms = () => employees.reduce((acc, emp) => {
    acc[emp.id] = { label: '', hours: '' }
    return acc
  }, {})

  // Load attendance items for all employees
  const loadItems = () => employees.reduce((acc, emp) => {
    acc[emp.id] = getAttendanceItems(period, emp.id)
    return acc
  }, {})

  let itemsData = $state(loadItems())
  
  $effect(() => { forms = initForms() })
  $effect(() => { itemsData = loadItems() })

  const handleAdd = (employeeId) => {
    const form = forms[employeeId]
    if (!form.label || !form.hours) return toasts.error('Label and hours required')

    const hours = parseFloat(form.hours)
    if (isNaN(hours)) return toasts.error('Invalid hours')

    addAttendanceItem(period, employeeId, { label: form.label, hours })
    toasts.success('Attendance item added')
    resetForm(employeeId)
    itemsData = loadItems()
  }

  const handleEdit = (employeeId, item) => {
    editing[employeeId] = item
    forms[employeeId] = { label: item.label, hours: item.hours.toString() }
  }

  const handleUpdate = (employeeId) => {
    const form = forms[employeeId]
    const item = editing[employeeId]
    
    if (!form.label || !form.hours) return toasts.error('Label and hours required')

    const hours = parseFloat(form.hours)
    if (isNaN(hours)) return toasts.error('Invalid hours')

    updateAttendanceItem(period, employeeId, item.id, { label: form.label, hours })
    toasts.success('Attendance item updated')
    resetForm(employeeId)
    itemsData = loadItems()
  }

  const handleDelete = async (employeeId, itemId) => {
    if (await confirmDialog('Delete this attendance item?')) {
      removeAttendanceItem(period, employeeId, itemId)
      toasts.success('Attendance item deleted')
      itemsData = loadItems()
    }
  }

  const resetForm = (employeeId) => {
    forms[employeeId] = { label: '', hours: '' }
    delete editing[employeeId]
  }

  const getTotal = (employeeId) => 
    (itemsData[employeeId] || []).reduce((sum, item) => sum + item.hours, 0)

  const formatHours = (hours) => {
    const sign = hours > 0 ? '+' : ''
    return `${sign}${round2(hours)} hrs`
  }
</script>

<div class="attendance-container">
  {#if employees.length === 0}
    <div class="empty">
      <Icon icon="tabler:clock" width="2.5rem" height="2.5rem" />
      <p>No employees</p>
      <p class="text-muted">Add employees first</p>
    </div>
  {:else}
    <div class="attendance-header">
      <h3>Attendance - {period}</h3>
      <div class="attendance-summary">
        <span>{employees.length} employees</span>
        <span>Hours deviation (negative = missed)</span>
      </div>
    </div>

    <div class="attendance-grid">
      {#each employees as employee}
        <div class="employee-attendance" style="--emp-color: {stringToColor(employee.name)}">
          <div class="employee-header">
            <h4>{employee.name}</h4>
            <div class="employee-meta">
              <span>{employee.gender} • {employee.maritalStatus}</span>
              <span class="total-hours" class:positive={getTotal(employee.id) > 0} class:negative={getTotal(employee.id) < 0}>
                Total: {formatHours(getTotal(employee.id))}
              </span>
            </div>
          </div>

          <div class="current-items">
            {#if (itemsData[employee.id] || []).length === 0}
              <div class="no-items">
                <Icon icon="tabler:check" width="1rem" height="1rem" />
                <span>Full attendance</span>
              </div>
            {:else}
              {#each (itemsData[employee.id] || []) as item}
                <div class="item" data-positive={item.hours > 0}>
                  <div class="item-info">
                    <span class="item-label">{item.label}</span>
                    <span class="item-hours" class:positive={item.hours > 0} class:negative={item.hours < 0}>
                      {formatHours(item.hours)}
                    </span>
                  </div>
                  <div class="item-actions">
                    <button class="edit-btn" onclick={() => handleEdit(employee.id, item)}>
                      <Icon icon="tabler:edit" width="1rem" height="1rem" /></button>
                    <button class="delete-btn" onclick={() => handleDelete(employee.id, item.id)}>
                      <Icon icon="tabler:trash" width="1rem" height="1rem" /></button>
                  </div>
                </div>
              {/each}
            {/if}
          </div>

          <div class="item-form">
            <div class="form-fields">
              <input
                type="text"
                placeholder="Label (e.g., Sick leave, Overtime)"
                value={forms[employee.id]?.label || ''}
                oninput={(e) => forms[employee.id] = { ...forms[employee.id], label: e.currentTarget.value }}
              />
              <input
                type="number"
                placeholder="Hours (+/-)"
                step="0.5"
                value={forms[employee.id]?.hours || ''}
                oninput={(e) => forms[employee.id] = { ...forms[employee.id], hours: e.currentTarget.value }}
              />
            </div>
            <div class="form-actions">
              {#if editing[employee.id]}
                <button class="secondary" onclick={() => resetForm(employee.id)}>
                  <Icon icon="tabler:x" width="1rem" height="1rem" />Cancel</button>
                <button class="primary" onclick={() => handleUpdate(employee.id)} disabled={!forms[employee.id]?.label || !forms[employee.id]?.hours}>
                  <Icon icon="tabler:check" width="1rem" height="1rem" />Update</button>
              {:else}
                <button class="primary" onclick={() => handleAdd(employee.id)} disabled={!forms[employee.id]?.label || !forms[employee.id]?.hours}>
                  <Icon icon="tabler:plus" width="1rem" height="1rem" />Add</button>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style lang="sass">
  @use "../styles.sass" as *

  .attendance-container
    @extend %grid
    gap: 1rem
    padding-top: 0.75rem

  .attendance-header
    @extend %flex-between

    h3
      margin: 0
      font-size: 1.5rem
      @extend %gradient-text

  .attendance-summary
    @extend %flex
    gap: 0.75rem
    color: var(--fg-muted)
    font-size: 0.8rem

    span
      padding: 0.5rem 1rem
      font-weight: 600
      font-size: 0.8rem
      cursor: default

      &:nth-child(1)
        color: var(--primary)

      &:nth-child(2)
        background: var(--info-bg)
        color: var(--info)

  .attendance-grid
    @include auto-grid(280px)
    gap: 0.75rem
    align-items: start

  .employee-attendance
    @extend %card-base
    @include card-accent
    padding: 0.75rem

    &:hover h4
      color: var(--emp-color)

  .employee-header
    @extend %flex-between
    margin-bottom: 0.75rem
    padding-bottom: 0.5rem

    h4
      @include card-title(1.15rem)
      @extend %transition

  .employee-meta
    @extend %flex
    flex-direction: column
    align-items: flex-end
    gap: 0.25rem

    span:first-child
      @include card-text(0.9rem)

    .total-hours
      font-weight: 600
      color: var(--fg)
      font-size: 1rem

      &.positive
        color: var(--success)

      &.negative
        color: var(--error)

  .current-items
    @extend %grid
    gap: 0.35rem
    margin-bottom: 0.75rem

  .no-items
    @extend %flex
    align-items: center
    gap: 0.35rem
    padding: 0.5rem
    color: var(--success)
    font-size: 0.85rem
    background: var(--surface-success)
    border-radius: var(--radius)

  .item
    @extend %flex-between
    padding: 0.5rem
    background: var(--surface-secondary)
    border-radius: 0.5rem
    border: 2px solid transparent
    @extend %transition

    &:hover
      border-color: var(--primary)
      transform: translateY(-2px)

    &[data-positive="true"]
      background: var(--surface-success)

      &:hover
        border-color: var(--success)

    &[data-positive="false"]
      background: color-mix(in oklab, var(--error) 12%, transparent)

      &:hover
        border-color: var(--error)

  .item-info
    @extend %flex
    flex-direction: column
    gap: 0.15rem

    .item-label
      font-weight: 600
      color: var(--fg)
      font-size: 0.9rem

    .item-hours
      font-weight: 600
      font-size: 1rem

      &.positive
        color: var(--success)

      &.negative
        color: var(--error)

  .item-actions
    @extend %flex
    gap: 0.35rem

  .edit-btn, .delete-btn
    @include card-action-btn
    --icon-btn-size: 1.75rem

    &:hover
      background: var(--surface-medium)

  .edit-btn:hover
    background: var(--primary-bg)
    color: var(--primary)

  .delete-btn:hover
    background: var(--error-bg)
    color: var(--error)

  .item-form
    @extend %grid
    gap: 0.5rem

  .form-fields
    @extend %grid
    grid-template-columns: 1fr
    gap: 0.5rem

    input
      @extend %input-base
      padding: 0.5rem 0.75rem
      font-size: 0.9rem

  .form-actions
    @extend %flex
    gap: 0.5rem
    justify-content: flex-end

    button
      @extend %button-base
      padding: 0.5rem 0.75rem
      font-size: 0.85rem

      &.primary
        @extend %button-primary

      &.secondary
        @extend %button-secondary

  .empty
    @extend %grid
    place-items: center
    gap: 1rem
    padding: 3rem
    text-align: center
    color: var(--fg-muted)

    p
      margin: 0

    .text-muted
      font-size: 0.875rem
      opacity: 0.7
</style>
