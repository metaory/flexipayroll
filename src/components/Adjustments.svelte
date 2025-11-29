<script>
  import Icon from '@iconify/svelte'
  import { formatCurrency } from '../core.js'
  import { addAdjustment, updateAdjustment, removeAdjustment, getAdjustments, basicConfig } from '../stores.js'
  import { toasts } from '../lib/toast.js'
  import { confirmDialog } from '../lib/dialog.js'

  let { employees = [], period = '' } = $props()

  // Form state - separate state per employee
  let adjustmentForms = $state({})
  let editingAdjustments = $state({})

  // Initialize form state for each employee
  const initializeForms = () => {
    const forms = {}
    employees.forEach(emp => {
      forms[emp.id] = { label: '', amount: '' }
    })
    return forms
  }

  // Load adjustments for all employees
  const loadAdjustments = () => {
    const adjustmentsData = {}
    employees.forEach(emp => {
      adjustmentsData[emp.id] = getAdjustments(period, emp.id)
    })
    return adjustmentsData
  }

  let adjustmentsData = $state(loadAdjustments())
  
  // Initialize forms when employees change
  $effect(() => {
    adjustmentForms = initializeForms()
  })

  // Reactive updates when employees or period change
  $effect(() => {
    adjustmentsData = loadAdjustments()
  })

  // Form handlers
  const handleAddAdjustment = (employeeId) => {
    const form = adjustmentForms[employeeId]
    if (!form.label || !form.amount) {
      toasts.error('Label and amount required')
      return
    }

    const amount = parseFloat(form.amount)
    if (isNaN(amount)) {
      toasts.error('Invalid amount')
      return
    }

    addAdjustment(period, employeeId, {
      label: form.label,
      amount: amount
    })

    toasts.success('Adjustment added')
    resetForm(employeeId)
    adjustmentsData = loadAdjustments()
  }

  const handleEditAdjustment = (employeeId, adjustment) => {
    editingAdjustments[employeeId] = adjustment
    adjustmentForms[employeeId] = { label: adjustment.label, amount: adjustment.amount.toString() }
  }

  const handleUpdateAdjustment = (employeeId) => {
    const form = adjustmentForms[employeeId]
    const editing = editingAdjustments[employeeId]
    
    if (!form.label || !form.amount) {
      toasts.error('Label and amount required')
      return
    }

    const amount = parseFloat(form.amount)
    if (isNaN(amount)) {
      toasts.error('Invalid amount')
      return
    }

    updateAdjustment(period, employeeId, editing.id, {
      label: form.label,
      amount: amount
    })

    toasts.success('Adjustment updated')
    resetForm(employeeId)
    adjustmentsData = loadAdjustments()
  }

  const handleDeleteAdjustment = async (employeeId, adjustmentId) => {
    if (await confirmDialog('Delete this adjustment?')) {
      removeAdjustment(period, employeeId, adjustmentId)
      toasts.success('Adjustment deleted')
      adjustmentsData = loadAdjustments()
    }
  }

  const resetForm = (employeeId) => {
    adjustmentForms[employeeId] = { label: '', amount: '' }
    delete editingAdjustments[employeeId]
  }

  const getTotalAdjustments = (employeeId) => {
    return (adjustmentsData[employeeId] || []).reduce((sum, adj) => sum + adj.amount, 0)
  }
</script>

<div class="adjustments-container">
  {#if employees.length === 0}
    <div class="empty">
      <Icon icon="tabler:settings" width="2.5rem" height="2.5rem" />
      <p>No employees</p>
      <p class="text-muted">Add employees first</p>
    </div>
  {:else}
    <div class="adjustments-header">
      <h3>Manual Adjustments - {period}</h3>
      <div class="adjustments-summary">
        <span>{employees.length} employees</span>
        <span>Add positive/negative amounts</span>
      </div>
    </div>

    <div class="adjustments-grid">
      {#each employees as employee}
        <div class="employee-adjustments">
          <div class="employee-header">
            <h4>{employee.name}</h4>
            <div class="employee-meta">
              <span>{employee.gender} • {employee.maritalStatus}</span>
              <span class="total-adjustments">
                Total: {formatCurrency(getTotalAdjustments(employee.id), 'id-ID', 'IDR', $basicConfig.currencySymbol)}
              </span>
            </div>
          </div>

          <!-- Current Adjustments -->
          <div class="current-adjustments">
            {#if (adjustmentsData[employee.id] || []).length === 0}
              <div class="no-adjustments">
                <Icon icon="tabler:circle-minus" width="1rem" height="1rem" />
                <span>No adjustments</span>
              </div>
            {:else}
              {#each (adjustmentsData[employee.id] || []) as adjustment}
                <div class="adjustment-item" data-positive={adjustment.amount > 0}>
                  <div class="adjustment-info">
                    <span class="adjustment-label">{adjustment.label}</span>
                    <span class="adjustment-amount" class:positive={adjustment.amount > 0} class:negative={adjustment.amount < 0}>
                      {adjustment.amount > 0 ? '+' : ''}{formatCurrency(adjustment.amount, 'id-ID', 'IDR', $basicConfig.currencySymbol)}
                    </span>
                  </div>
                  <div class="adjustment-actions">
                    <button class="edit-btn" onclick={() => handleEditAdjustment(employee.id, adjustment)}>
                      <Icon icon="tabler:edit" width="1rem" height="1rem" /></button>
                    <button class="delete-btn" onclick={() => handleDeleteAdjustment(employee.id, adjustment.id)}>
                      <Icon icon="tabler:trash" width="1rem" height="1rem" /></button>
                  </div>
                </div>
              {/each}
            {/if}
          </div>

          <!-- Add/Edit Form -->
          <div class="adjustment-form">
            <div class="form-fields">
              <input
                type="text"
                placeholder="Adjustment label (e.g., Gift, Loan)"
                value={adjustmentForms[employee.id]?.label || ''}
                oninput={(e) => adjustmentForms[employee.id] = { ...adjustmentForms[employee.id], label: e.currentTarget.value }}
              />
              <input
                type="number"
                placeholder="Amount (positive/negative)"
                step="0.01"
                value={adjustmentForms[employee.id]?.amount || ''}
                oninput={(e) => adjustmentForms[employee.id] = { ...adjustmentForms[employee.id], amount: e.currentTarget.value }}
              />
            </div>
            <div class="form-actions">
              {#if editingAdjustments[employee.id]}
                <button class="secondary" onclick={() => resetForm(employee.id)}>
                  <Icon icon="tabler:x" width="1rem" height="1rem" />Cancel</button>
                <button class="primary" onclick={() => handleUpdateAdjustment(employee.id)}>
                  <Icon icon="tabler:check" width="1rem" height="1rem" />Update</button>
              {:else}
                <button class="primary" onclick={() => handleAddAdjustment(employee.id)}>
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

  .adjustments-container
    @extend %grid
    gap: 1rem
    padding-top: 0.75rem

  .adjustments-header
    @extend %flex-between

    h3
      margin: 0
      font-size: 1.5rem
      @extend %gradient-text

  .adjustments-summary
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

  .adjustments-grid
    @include auto-grid(280px)
    gap: 0.75rem
    align-items: start

  .employee-adjustments
    @extend %card-base
    padding: 0.75rem
    border: 2px solid transparent
    @extend %transition

    &:hover
      border-color: var(--primary)
      box-shadow: 0 4px 16px color-mix(in oklab, var(--primary) 20%, transparent)
      transform: translateY(-2px)

  .employee-header
    @extend %flex-between
    margin-bottom: 0.75rem
    padding-bottom: 0.5rem

    h4
      @include card-title(1.15rem)

  .employee-meta
    @extend %flex
    flex-direction: column
    align-items: flex-end
    gap: 0.25rem

    span:first-child
      @include card-text(0.9rem)

    .total-adjustments
      font-weight: 600
      color: var(--fg)
      font-size: 1rem

  .current-adjustments
    @extend %grid
    gap: 0.35rem
    margin-bottom: 0.75rem

  .no-adjustments
    @extend %flex
    align-items: center
    gap: 0.35rem
    padding: 0.5rem
    color: var(--fg-muted)
    font-style: italic
    font-size: 0.85rem
    background: var(--surface-muted)
    border-radius: var(--radius)

  .adjustment-item
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

  .adjustment-info
    @extend %flex
    flex-direction: column
    gap: 0.15rem

    .adjustment-label
      font-weight: 600
      color: var(--fg)
      font-size: 0.9rem

    .adjustment-amount
      font-weight: 600
      font-size: 1rem

      &.positive
        color: var(--success)

      &.negative
        color: var(--error)

  .adjustment-actions
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

  .adjustment-form
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
