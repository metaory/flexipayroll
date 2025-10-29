<script>
  import Icon from '@iconify/svelte'
  import { formatCurrency } from '../core.js'
  import { addAdjustment, updateAdjustment, removeAdjustment, getAdjustments } from '../stores.js'
  import { toasts } from '../lib/toast.js'
  import { confirmDialog } from '../lib/dialog.js'

  let { employees = [], period = '' } = $props()

  // Form state
  let adjustmentForm = $state({ label: '', amount: '' })
  let editingAdjustment = $state(null)
  let editingEmployeeId = $state(null)

  // Load adjustments for all employees
  const loadAdjustments = () => {
    const adjustmentsData = {}
    employees.forEach(emp => {
      adjustmentsData[emp.id] = getAdjustments(period, emp.id)
    })
    return adjustmentsData
  }

  let adjustmentsData = $state(loadAdjustments())

  // Reactive updates when employees or period change
  $effect(() => {
    adjustmentsData = loadAdjustments()
  })

  // Form handlers
  const handleAddAdjustment = (employeeId) => {
    if (!adjustmentForm.label || !adjustmentForm.amount) {
      toasts.error('Label and amount required')
      return
    }

    const amount = parseFloat(adjustmentForm.amount)
    if (isNaN(amount)) {
      toasts.error('Invalid amount')
      return
    }

    addAdjustment(period, employeeId, {
      label: adjustmentForm.label,
      amount: amount
    })

    toasts.success('Adjustment added')
    resetForm()
    adjustmentsData = loadAdjustments()
  }

  const handleEditAdjustment = (employeeId, adjustment) => {
    editingAdjustment = adjustment
    editingEmployeeId = employeeId
    adjustmentForm = { label: adjustment.label, amount: adjustment.amount.toString() }
  }

  const handleUpdateAdjustment = () => {
    if (!adjustmentForm.label || !adjustmentForm.amount) {
      toasts.error('Label and amount required')
      return
    }

    const amount = parseFloat(adjustmentForm.amount)
    if (isNaN(amount)) {
      toasts.error('Invalid amount')
      return
    }

    updateAdjustment(period, editingEmployeeId, editingAdjustment.id, {
      label: adjustmentForm.label,
      amount: amount
    })

    toasts.success('Adjustment updated')
    resetForm()
    adjustmentsData = loadAdjustments()
  }

  const handleDeleteAdjustment = async (employeeId, adjustmentId) => {
    if (await confirmDialog('Delete this adjustment?')) {
      removeAdjustment(period, employeeId, adjustmentId)
      toasts.success('Adjustment deleted')
      adjustmentsData = loadAdjustments()
    }
  }

  const resetForm = () => {
    adjustmentForm = { label: '', amount: '' }
    editingAdjustment = null
    editingEmployeeId = null
  }

  const getTotalAdjustments = (employeeId) => {
    return (adjustmentsData[employeeId] || []).reduce((sum, adj) => sum + adj.amount, 0)
  }
</script>

<div class="adjustments-container">
  {#if employees.length === 0}
    <div class="empty">
      <Icon icon="solar:settings-bold-duotone" width="3rem" height="3rem" />
      <p>No employees to add adjustments for</p>
      <p class="text-muted">Add employees first to manage adjustments</p>
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
                Total: {formatCurrency(getTotalAdjustments(employee.id))}
              </span>
            </div>
          </div>

          <!-- Current Adjustments -->
          <div class="current-adjustments">
            {#if (adjustmentsData[employee.id] || []).length === 0}
              <div class="no-adjustments">
                <Icon icon="solar:minus-circle-bold" width="1.5rem" height="1.5rem" />
                <span>No adjustments</span>
              </div>
            {:else}
              {#each (adjustmentsData[employee.id] || []) as adjustment}
                <div class="adjustment-item" data-positive={adjustment.amount > 0}>
                  <div class="adjustment-info">
                    <span class="adjustment-label">{adjustment.label}</span>
                    <span class="adjustment-amount" class:positive={adjustment.amount > 0} class:negative={adjustment.amount < 0}>
                      {adjustment.amount > 0 ? '+' : ''}{formatCurrency(adjustment.amount)}
                    </span>
                  </div>
                  <div class="adjustment-actions">
                    <button class="edit-btn" onclick={() => handleEditAdjustment(employee.id, adjustment)}>
                      <Icon icon="solar:pen-bold" width="1rem" height="1rem" />
                    </button>
                    <button class="delete-btn" onclick={() => handleDeleteAdjustment(employee.id, adjustment.id)}>
                      <Icon icon="solar:trash-bin-trash-bold" width="1rem" height="1rem" />
                    </button>
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
                value={adjustmentForm.label}
                oninput={(e) => adjustmentForm.label = e.target.value}
              />
              <input
                type="number"
                placeholder="Amount (positive/negative)"
                step="0.01"
                value={adjustmentForm.amount}
                oninput={(e) => adjustmentForm.amount = e.target.value}
              />
            </div>
            <div class="form-actions">
              {#if editingAdjustment && editingEmployeeId === employee.id}
                <button class="secondary" onclick={resetForm}>
                  <Icon icon="solar:close-circle-bold" width="1rem" height="1rem" />
                  Cancel
                </button>
                <button class="primary" onclick={handleUpdateAdjustment}>
                  <Icon icon="solar:check-circle-bold" width="1rem" height="1rem" />
                  Update
                </button>
              {:else}
                <button class="primary" onclick={() => handleAddAdjustment(employee.id)}>
                  <Icon icon="solar:add-circle-bold" width="1rem" height="1rem" />
                  Add Adjustment
                </button>
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
    gap: 2rem
    padding-top: 2rem

  .adjustments-header
    @extend %flex-between
    padding-top: 0.2rem

    h3
      margin: 0
      @extend %gradient-text

  .adjustments-summary
    @extend %flex
    gap: 1rem
    color: var(--fg-muted)
    font-size: 0.875rem

    span
      padding: 0.75rem 1.5rem
      font-weight: 700
      font-size: 0.875rem
      cursor: default

      &:nth-child(1)
        color: var(--primary)

      &:nth-child(2)
        background: linear-gradient(135deg, var(--info-bg) 0%, var(--info) 20%)
        color: var(--info)

  .adjustments-grid
    @include auto-grid(280px)
    gap: 1.5rem

  .employee-adjustments
    @extend %card-base
    padding: 1rem

  .employee-header
    @extend %flex-between
    margin-bottom: 1.5rem
    padding-bottom: 1rem
    border-bottom: 1px solid var(--border-muted)

    h4
      margin: 0
      color: var(--primary)
      font-size: 1.5rem

  .employee-meta
    @extend %flex
    flex-direction: column
    align-items: flex-end
    gap: 0.5rem

    span:first-child
      color: var(--fg-muted)
      font-size: 1.1rem

    .total-adjustments
      font-weight: 600
      color: var(--fg)
      font-size: 1.1rem

  .current-adjustments
    @extend %grid
    gap: 0.75rem
    margin-bottom: 1.5rem

  .no-adjustments
    @extend %flex
    align-items: center
    gap: 0.5rem
    padding: 1rem
    color: var(--fg-muted)
    font-style: italic
    text-align: center
    background: var(--surface-muted)
    border-radius: var(--radius)

  .adjustment-item
    @extend %flex-between
    padding: 1rem
    background: var(--surface-secondary)
    border-radius: var(--radius)
    border: 1px solid var(--border-muted)

    &[data-positive="true"]
      background: var(--surface-success)

    &[data-positive="false"]
      background: color-mix(in oklab, var(--error) 12%, transparent)

  .adjustment-info
    @extend %flex
    flex-direction: column
    gap: 0.25rem

    .adjustment-label
      font-weight: 600
      color: var(--fg)
      font-size: 1.1rem

    .adjustment-amount
      font-weight: 600
      font-size: 1.1rem

      &.positive
        color: var(--success)

      &.negative
        color: var(--error)

  .adjustment-actions
    @extend %flex
    gap: 0.5rem

  .edit-btn, .delete-btn
    width: 2rem
    height: 2rem
    border-radius: 50%
    border: 1px solid var(--border-muted)
    background: var(--surface)
    cursor: pointer
    @extend %transition
    @extend %grid
    place-items: center

    &:hover
      background: var(--surface-medium)

  .edit-btn:hover
    background: var(--primary-bg)
    color: var(--primary)
    border-color: var(--primary)

  .delete-btn:hover
    background: var(--error-bg)
    color: var(--error)
    border-color: var(--error)

  .adjustment-form
    @extend %grid
    gap: 1rem

  .form-fields
    @extend %grid
    grid-template-columns: 2fr 1fr
    gap: 1rem

    input
      @extend %input-base

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
