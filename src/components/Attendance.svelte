<script>
  import Icon from '@iconify/svelte/dist/OfflineIcon.svelte'
  import { addAttendanceItem, updateAttendanceItem, removeAttendanceItem, setAbsentDays, attendanceItems } from '../stores.js'
  import { normalizeAttendance } from '../core.js'
  import { ICONS } from '../lib/icons.js'
  import { toasts } from '../lib/toast.js'
  import { confirmDialog } from '../lib/dialog.js'

  let { employees = [], period = '' } = $props()

  // Form state per employee
  let forms = $state({})
  let editing = $state({})

  // Initialize form state
  const initForms = () => employees.reduce((acc, emp) => {
    acc[emp.id] = { label: '', hours: '', minutes: '', isUnder: false }
    return acc
  }, {})

  // Convert hour+minute+sign to decimal hours
  const toDecimalHours = (h, m, isUnder) => {
    const decimal = (parseInt(h) || 0) + (parseInt(m) || 0) / 60
    return isUnder ? -decimal : decimal
  }

  // Split decimal hours back to hour/minute/sign for editing
  const fromDecimalHours = (decimal) => {
    const isUnder = decimal < 0
    const abs = Math.abs(decimal)
    const hours = Math.floor(abs)
    const minutes = Math.round((abs - hours) * 60)
    return { hours: hours.toString(), minutes: minutes.toString(), isUnder }
  }

  // Clamp inputs
  const clampHour = (v) => Math.max(0, Math.min(99, parseInt(v) || 0))
  const clampMinute = (v) => Math.max(0, Math.min(60, parseInt(v) || 0))

  const recordFor = (employeeId) =>
    normalizeAttendance($attendanceItems?.[period]?.[employeeId])
  const itemsFor = (employeeId) => recordFor(employeeId).items
  const absentFor = (employeeId) => recordFor(employeeId).absent
  
  $effect(() => { forms = initForms() })

  const handleAbsentChange = (employeeId, value) => {
    const absent = Math.max(0, Math.floor(Number(value) || 0))
    setAbsentDays(period, employeeId, absent)
  }

  const handleAdd = (employeeId) => {
    const form = forms[employeeId]
    if (!form.label) return toasts.error('Label required')
    
    const h = parseInt(form.hours) || 0
    const m = parseInt(form.minutes) || 0
    if (h === 0 && m === 0) return toasts.error('Duration required')

    const hours = toDecimalHours(clampHour(form.hours), clampMinute(form.minutes), form.isUnder)
    addAttendanceItem(period, employeeId, { label: form.label, hours })
    toasts.success('Attendance item added')
    resetForm(employeeId)
  }

  const handleEdit = (employeeId, item) => {
    editing[employeeId] = item
    const { hours, minutes, isUnder } = fromDecimalHours(item.hours)
    forms[employeeId] = { label: item.label, hours, minutes, isUnder }
  }

  const handleUpdate = (employeeId) => {
    const form = forms[employeeId]
    const item = editing[employeeId]
    
    if (!form.label) return toasts.error('Label required')

    const h = parseInt(form.hours) || 0
    const m = parseInt(form.minutes) || 0
    if (h === 0 && m === 0) return toasts.error('Duration required')

    const hours = toDecimalHours(clampHour(form.hours), clampMinute(form.minutes), form.isUnder)
    updateAttendanceItem(period, employeeId, item.id, { label: form.label, hours })
    toasts.success('Attendance item updated')
    resetForm(employeeId)
  }

  const handleDelete = async (employeeId, itemId) => {
    if (await confirmDialog('Delete this attendance item?')) {
      removeAttendanceItem(period, employeeId, itemId)
      toasts.success('Attendance item deleted')
    }
  }

  const resetForm = (employeeId) => {
    forms[employeeId] = { label: '', hours: '', minutes: '', isUnder: false }
    delete editing[employeeId]
  }

  const getTotal = (employeeId) =>
    itemsFor(employeeId).reduce((sum, item) => sum + item.hours, 0)

  const formatHours = (hours) => {
    const sign = hours > 0 ? '+' : hours < 0 ? '-' : ''
    const abs = Math.abs(hours)
    const h = Math.floor(abs)
    const m = Math.round((abs - h) * 60)
    return m === 0 ? `${sign}${h}h` : `${sign}${h}h ${m}m`
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
        <div class="card employee-attendance">
          <div class="employee-header">
            <h4>{employee.name}</h4>
            <div class="employee-meta">
              <span>{employee.gender} • {employee.maritalStatus} • {employee.childrenStatus === 'has_children' ? 'Has children' : 'No children'}</span>
              <label class="absent-field">
                <span>Absent</span>
                <input
                  type="number"
                  lang="en"
                  min="0"
                  max="31"
                  step="1"
                  value={absentFor(employee.id)}
                  oninput={(e) => handleAbsentChange(employee.id, e.currentTarget.value)}
                />
              </label>
              <span class="total-hours" class:positive={getTotal(employee.id) > 0} class:negative={getTotal(employee.id) < 0}>
                Total: {formatHours(getTotal(employee.id))}
              </span>
            </div>
          </div>

          <div class="current-items">
            {#if itemsFor(employee.id).length === 0}
              <div class="no-items">
                <Icon icon="tabler:check" width="1rem" height="1rem" />
                <span>Full attendance</span>
              </div>
            {:else}
              {#each itemsFor(employee.id) as item}
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
              <div class="time-inputs">
                <input
                  type="number"
                  lang="en"
                  placeholder="Hr"
                  min="0"
                  max="99"
                  step="1"
                  value={forms[employee.id]?.hours || ''}
                  oninput={(e) => { const v = Math.max(0, Math.min(99, Math.floor(+e.currentTarget.value) || 0)); e.currentTarget.value = String(v); forms[employee.id] = { ...forms[employee.id], hours: String(v) } }}
                />
                <input
                  type="number"
                  lang="en"
                  placeholder="Min"
                  min="0"
                  max="60"
                  step="1"
                  value={forms[employee.id]?.minutes || ''}
                  oninput={(e) => { const v = Math.max(0, Math.min(60, Math.floor(+e.currentTarget.value) || 0)); e.currentTarget.value = String(v); forms[employee.id] = { ...forms[employee.id], minutes: String(v) } }}
                />
                <label class="under-toggle" class:active={forms[employee.id]?.isUnder}>
                  <input
                    type="checkbox"
                    checked={forms[employee.id]?.isUnder || false}
                    onchange={(e) => forms[employee.id] = { ...forms[employee.id], isUnder: e.currentTarget.checked }}
                  />
                  <span>{forms[employee.id]?.isUnder ? 'Under' : 'Over'}</span>
                </label>
              </div>
            </div>
            <div class="form-actions">
              {#if editing[employee.id]}
                <button class="secondary" onclick={() => resetForm(employee.id)}>
                  <Icon icon="tabler:x" width="1rem" height="1rem" />Cancel</button>
                <button class="primary" onclick={() => handleUpdate(employee.id)} disabled={!forms[employee.id]?.label || (!(parseInt(forms[employee.id]?.hours) || 0) && !(parseInt(forms[employee.id]?.minutes) || 0))}>
                  <Icon icon="tabler:check" width="1rem" height="1rem" />Update</button>
              {:else}
                <button class="primary" onclick={() => handleAdd(employee.id)} disabled={!forms[employee.id]?.label || (!(parseInt(forms[employee.id]?.hours) || 0) && !(parseInt(forms[employee.id]?.minutes) || 0))}>
                  <Icon icon={ICONS.add} width="1rem" height="1rem" />Add</button>
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
        border-radius: var(--radius)

  .attendance-grid
    @include auto-grid(280px)
    gap: 0.75rem
    align-items: start

  .employee-attendance
    @extend %card-base
    @include card-accent
    padding: 0.6rem

  .employee-header
    @extend %flex-between
    margin-bottom: 0.5rem
    padding-bottom: 0.35rem

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

    .absent-field
      @extend %flex
      align-items: center
      gap: 0.35rem
      font-size: 0.85rem
      font-weight: 600

      span
        color: var(--fg-muted)

      input
        @extend %input-base
        width: 3.5rem
        padding: 0.25rem 0.4rem
        text-align: center
        font-size: 0.85rem

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
    gap: 0.3rem
    margin-bottom: 0.5rem

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
    padding: 0.4rem
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

  .time-inputs
    display: grid
    grid-template-columns: 1fr 1fr 50px
    gap: 0.35rem
    align-items: center

    input
      text-align: center

  .under-toggle
    @extend %flex
    align-items: center
    justify-content: center
    gap: 0.35rem
    padding: 0.5rem 0.75rem
    border-radius: var(--radius)
    background: var(--surface-success)
    color: var(--success)
    font-size: 0.8rem
    font-weight: 600
    cursor: pointer
    user-select: none
    @extend %transition

    &.active
      background: color-mix(in oklab, var(--error) 12%, transparent)
      color: var(--error)

    input
      display: none

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
    @extend %empty-state
</style>
