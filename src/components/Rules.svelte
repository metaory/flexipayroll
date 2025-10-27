<script>
  import Icon from '@iconify/svelte'
  import { createEventDispatcher, tick } from 'svelte'
  import { rules, basicConfig, addRule, updateRule, removeRule, toggleRule, reorderRules, resetRules, updateBasicConfig } from '../stores.js'
  import { RULE_TYPES, RULE_CATEGORIES, CRITERIA_TYPES, createRule, validateRule } from '../rules.js'
  import { toasts } from '../lib/toast.js'
  import { confirmDialog } from '../lib/dialog.js'
  import BitGrid from 'bit-grid-component'
  import Dialog from './Dialog.svelte'

  const dispatch = createEventDispatcher()

  let { basicConfigData = $basicConfig } = $props()

  // Form state
  let showRuleDialog = $state(false)
  let editingRule = $state(null)
  let newRule = $state({
    label: '',
    type: RULE_TYPES.FIXED,
    value: 0,
    criteria: { appliesTo: [CRITERIA_TYPES.ALL] },
    category: RULE_CATEGORIES.BONUS
  })

  // Criteria options for BitGrid
  const criteriaOptions = [
    { value: CRITERIA_TYPES.ALL, label: 'All' },
    { value: CRITERIA_TYPES.MARRIED, label: 'Married' },
    { value: CRITERIA_TYPES.SINGLE, label: 'Single' },
    { value: CRITERIA_TYPES.MALE, label: 'Male' },
    { value: CRITERIA_TYPES.FEMALE, label: 'Female' }
  ]

  // BitGrid reference
  let criteriaGrid = $state(null)

  // Watch for dialog opening and initialize BitGrid
  $effect(() => {
    if (showRuleDialog) {
      tick().then(() => {
        initializeCriteriaGrid()
      })
    }
  })

  // Handle dialog close
  const handleDialogClose = () => {
    showRuleDialog = false
    editingRule = null
    newRule = {
      label: '',
      type: RULE_TYPES.FIXED,
      value: 0,
      criteria: { appliesTo: [CRITERIA_TYPES.ALL] },
      category: RULE_CATEGORIES.BONUS
    }
    // Clean up BitGrid
    if (criteriaGrid) {
      criteriaGrid.remove()
      criteriaGrid = null
    }
  }

  // Basic config handlers
  const updateBasicConfigField = (field, value) => {
    basicConfigData = { ...basicConfigData, [field]: value }
    updateBasicConfig({ [field]: value })
  }

  // Clear all storage data
  const resetAllStorage = async () => {
    if (!await confirmDialog('DANGEROUS: This will clear ALL data (employees, attendance, payroll, rules, config). This cannot be undone. Continue?')) {
      return
    }
    
    // Clear all local storage
    localStorage.clear()
    toasts.success('All data cleared. Page will reload.')
    
    // Reload page after short delay
    setTimeout(() => window.location.reload(), 1000)
  }

  // Rule form handlers
  const startAddRule = () => {
    newRule = {
      label: '',
      type: RULE_TYPES.FIXED,
      value: 0,
      criteria: { appliesTo: [CRITERIA_TYPES.ALL] },
      category: RULE_CATEGORIES.BONUS
    }
    showRuleDialog = true
  }

  const startEditRule = (rule) => {
    editingRule = rule
    newRule = { ...rule }
    showRuleDialog = true
  }

  const saveRule = () => {
    try {
      if (editingRule) {
        updateRule(editingRule.id, newRule)
        toasts.success('Rule updated')
      } else {
        addRule(newRule)
        toasts.success('Rule added')
      }
      cancelRuleForm()
    } catch (error) {
      toasts.error(error.message)
    }
  }

  const cancelRuleForm = () => {
    showRuleDialog = false
    editingRule = null
    newRule = {
      label: '',
      type: RULE_TYPES.FIXED,
      value: 0,
      criteria: { appliesTo: [CRITERIA_TYPES.ALL] },
      category: RULE_CATEGORIES.BONUS
    }
    // Clean up BitGrid
    if (criteriaGrid) {
      criteriaGrid.remove()
      criteriaGrid = null
    }
  }

  const deleteRule = async (id) => {
    if (await confirmDialog('Delete this rule?')) {
      removeRule(id)
      toasts.success('Rule deleted')
    }
  }

  const toggleRuleEnabled = (id) => {
    toggleRule(id)
  }

  const handleResetRules = async () => {
    if (await confirmDialog('Reset all rules to defaults? This will remove any custom rules.')) {
      resetRules()
      toasts.success('Rules reset to defaults')
    }
  }

  // BitGrid initialization
  const initializeCriteriaGrid = () => {
    const container = document.getElementById('criteria-grid-container')
    if (!container) return

    // Clean up existing grid
    if (criteriaGrid) {
      criteriaGrid.remove()
    }

    // Create data array - single row with columns for each criteria option
    const data = [criteriaOptions.map(option =>
      newRule.criteria.appliesTo.includes(option.value)
    )]

    // Create BitGrid with rule name as row, criteria options as columns
    criteriaGrid = new BitGrid({
      data: data,
      rowLabels: [newRule.label || 'Rule'],
      colLabels: criteriaOptions.map(opt => opt.label),
      onChange: (newData) => {
        // Update criteria based on grid selection
        newRule.criteria.appliesTo = criteriaOptions
          .filter((_, index) => newData[0][index])
          .map(opt => opt.value)
      }
    })

    container.appendChild(criteriaGrid)
  }

  // Sortable rules list
  let draggedRule = $state(null)

  const handleDragStart = (event, rule) => {
    draggedRule = rule
    event.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (event, targetRule) => {
    event.preventDefault()
    if (!draggedRule || draggedRule.id === targetRule.id) return

    const currentRules = $rules
    const draggedIndex = currentRules.findIndex(r => r.id === draggedRule.id)
    const targetIndex = currentRules.findIndex(r => r.id === targetRule.id)

    const reordered = [...currentRules]
    const [dragged] = reordered.splice(draggedIndex, 1)
    reordered.splice(targetIndex, 0, dragged)

    const ruleIds = reordered.map(r => r.id)
    reorderRules(ruleIds)

    draggedRule = null
  }
</script>

<div class="rules-container">
  <!-- Basic Configuration -->
  <section class="basic-config">
    <h3>Basic Configuration</h3>
    <div class="config-grid">
      <label class="field">
        <span>Working Hours/Day</span>
            <input
              type="number"
              min="1"
              max="24"
              step="0.5"
              value={basicConfigData.workdayHours}
              oninput={(e) => updateBasicConfigField('workdayHours', +e.target.value || 8)}
            />
      </label>
      <label class="field">
        <span>Working Days/Month</span>
        <input
          type="number"
          min="1"
          max="31"
          value={basicConfigData.workingDaysPerMonth}
          oninput={(e) => updateBasicConfigField('workingDaysPerMonth', +e.target.value || 22)}
        />
      </label>
      <label class="field">
        <span>Currency Symbol</span>
        <input
          type="text"
          value={basicConfigData.currencySymbol || '$'}
          oninput={(e) => updateBasicConfigField('currencySymbol', e.target.value || '$')}
        />
      </label>
      <label class="field">
        <span>Days in Month</span>
        <input
          type="number"
          min="28"
          max="31"
          value={basicConfigData.monthDays || 30}
          oninput={(e) => updateBasicConfigField('monthDays', +e.target.value || 30)}
        />
      </label>
      <label class="field">
        <span>First Day Weekday</span>
        <select
          value={basicConfigData.firstDayWeekday || 'Saturday'}
          onchange={(e) => updateBasicConfigField('firstDayWeekday', e.target.value || 'Saturday')}
        >
          <option value="Saturday">Saturday</option>
          <option value="Sunday">Sunday</option>
          <option value="Monday">Monday</option>
          <option value="Tuesday">Tuesday</option>
          <option value="Wednesday">Wednesday</option>
          <option value="Thursday">Thursday</option>
          <option value="Friday">Friday</option>
        </select>
      </label>
    </div>
    
    <div class="config-actions">
      <button class="danger" onclick={resetAllStorage}>
        <Icon icon="solar:danger-triangle-bold" width="1rem" height="1rem" />
        Reset Storage (DANGEROUS)
      </button>
    </div>
  </section>

  <!-- Rules Management -->
  <section class="rules-management">
    <div class="rules-header">
      <h3>Calculation Rules</h3>
      <div class="rules-actions">
        <button class="secondary" onclick={handleResetRules}>
          <Icon icon="solar:refresh-bold" width="1rem" height="1rem" />
          Reset to Defaults
        </button>
        <button class="primary" onclick={startAddRule}>
          <Icon icon="solar:add-circle-bold" width="1rem" height="1rem" />
          Add Rule
        </button>
      </div>
    </div>

    <!-- Rules List -->
    <div class="rules-list">
      {#each $rules as rule (rule.id)}
        <div
          class="rule-card"
          class:disabled={!rule.enabled}
          draggable="true"
          role="listitem"
          ondragstart={(e) => handleDragStart(e, rule)}
          ondragover={handleDragOver}
          ondrop={(e) => handleDrop(e, rule)}
        >
          <div class="rule-info">
            <div class="rule-header">
              <h4>{rule.label}</h4>
              <div class="rule-badges">
                <span class="badge category-{rule.category}">{rule.category}</span>
                <span class="badge type-{rule.type}">{rule.type.replace('_', ' ')}</span>
              </div>
            </div>
            <div class="rule-details">
              <p><strong>Value:</strong> {rule.value}</p>
              <p><strong>Applies to:</strong>
                {#each rule.criteria.appliesTo as criteria}
                  <span class="criteria-badge">{criteriaOptions.find(opt => opt.value === criteria)?.label || criteria}</span>
                {/each}
              </p>
              <p><strong>Order:</strong> {rule.order}</p>
            </div>
          </div>

          <div class="rule-actions">
            <button
              class="toggle-btn"
              class:enabled={rule.enabled}
              onclick={() => toggleRuleEnabled(rule.id)}
            >
              <Icon icon={rule.enabled ? "solar:eye-bold" : "solar:eye-closed-bold"} width="1rem" height="1rem" />
            </button>
            <button class="edit-btn" onclick={() => startEditRule(rule)}>
              <Icon icon="solar:pen-bold" width="1rem" height="1rem" />
            </button>
            <button class="delete-btn" onclick={() => deleteRule(rule.id)}>
              <Icon icon="solar:trash-bin-trash-bold" width="1rem" height="1rem" />
            </button>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <!-- Add/Edit Rule Form -->
  <Dialog
    bind:open={showRuleDialog}
    title={editingRule ? 'Edit Rule' : 'Add New Rule'}
    size="medium"
  >

        <div class="form-grid">
          <label class="field">
            <span>Rule Label</span>
            <input
              type="text"
              value={newRule.label}
              oninput={(e) => newRule.label = e.target.value}
              placeholder="e.g., Performance Bonus"
            />
          </label>

          <label class="field">
            <span>Type</span>
            <select
              value={newRule.type}
              onchange={(e) => newRule.type = e.target.value}
            >
              <option value={RULE_TYPES.FIXED}>Fixed Amount</option>
              <option value={RULE_TYPES.DAYS_MULTIPLIER}>Days Multiplier</option>
              <option value={RULE_TYPES.PERCENTAGE_MONTHLY}>Percentage of Monthly Salary</option>
              <option value={RULE_TYPES.PERCENTAGE_BASE}>Percentage of Base Salary</option>
              <option value={RULE_TYPES.HOURLY_MULTIPLIER}>Hourly Multiplier</option>
            </select>
          </label>

          <label class="field">
            <span>Value</span>
            <input
              type="number"
              min="0"
              step={newRule.type === RULE_TYPES.PERCENTAGE_MONTHLY || newRule.type === RULE_TYPES.PERCENTAGE_BASE ? "0.01" : "1"}
              value={newRule.value}
              oninput={(e) => newRule.value = +e.target.value}
            />
          </label>

          <label class="field">
            <span>Category</span>
            <select
              value={newRule.category}
              onchange={(e) => newRule.category = e.target.value}
            >
              <option value={RULE_CATEGORIES.BONUS}>Bonus</option>
              <option value={RULE_CATEGORIES.DEDUCTION}>Deduction</option>
            </select>
          </label>

          <div class="field criteria-field">
            <span>Applies To (Select all that apply)</span>
            <div id="criteria-grid-container" class="criteria-grid-container"></div>
          </div>
        </div>

        <div class="form-actions">
          <button class="secondary" onclick={cancelRuleForm}>
            <Icon icon="solar:close-circle-bold" width="1rem" height="1rem" />
            Cancel
          </button>
          <button class="primary" onclick={saveRule}>
            <Icon icon="solar:check-circle-bold" width="1rem" height="1rem" />
            {editingRule ? 'Update' : 'Add'} Rule
          </button>
        </div>
  </Dialog>
</div>

<style lang="sass">
  @use "../styles.sass" as *

  .rules-container
    @extend %grid
    gap: 3rem

  .basic-config, .rules-management
    @extend %card-base

    h3
      margin-bottom: 1.5rem
      color: var(--primary)

  .config-grid
    @extend %grid
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))
    gap: 1.5rem

  .field
    @extend %grid
    gap: 0.5rem

    span
      font-weight: 600
      color: var(--fg)

    input, select
      @extend %input-base

  .config-actions
    @extend %flex
    justify-content: flex-end
    margin-top: 1rem

    button.danger
      @extend %button-base
      background: var(--error)
      color: white
      border: 2px solid var(--error)

      &:hover
        background: color-mix(in oklab, var(--error) 90%, black)

  .rules-header
    @extend %flex-between
    margin-bottom: 2rem

  .rules-actions
    @extend %flex
    gap: 1rem

    button
      @extend %button-base

      &.primary
        @extend %button-primary

      &.secondary
        @extend %button-secondary

  .rules-list
    @extend %grid
    gap: 1rem

  .rule-card
    @extend %flex-between
    padding: 1.5rem
    background: var(--surface)
    border-radius: var(--radius)
    border: 2px solid var(--border-muted)
    cursor: move
    @extend %transition

    &:hover
      border-color: var(--primary)

    &.disabled
      opacity: 0.6
      background: var(--surface-muted)

  .rule-info
    flex: 1

    .rule-header
      @extend %flex-between
      margin-bottom: 0.5rem

      h4
        margin: 0
        color: var(--primary)

    .rule-badges
      @extend %flex
      gap: 0.5rem

    .badge
      padding: 0.25rem 0.5rem
      border-radius: var(--radius-sm)
      font-size: 0.75rem
      font-weight: 600

      &.category-bonus
        background: var(--success-bg)
        color: var(--success)

      &.category-deduction
        background: var(--error-bg)
        color: var(--error)


    .rule-details
      p
        margin: 0.25rem 0
        font-size: 0.875rem
        color: var(--fg-muted)
        display: flex
        flex-wrap: wrap
        align-items: center
        gap: 0.25rem

  .rule-actions
    @extend %flex
    gap: 0.5rem

  .toggle-btn, .edit-btn, .delete-btn
    width: 2.5rem
    height: 2.5rem
    border-radius: 50%
    border: 2px solid var(--border-muted)
    background: var(--border-muted)
    cursor: pointer
    @extend %transition
    @extend %grid
    place-items: center

    &:hover
      background: var(--surface-medium)

    &.enabled
      background: var(--success-bg)
      color: var(--success)
      border-color: var(--success)

  .edit-btn:hover
    background: var(--primary-bg)
    color: var(--primary)
    border-color: var(--primary)

  .delete-btn:hover
    background: var(--error-bg)
    color: var(--error)
    border-color: var(--error)

  .form-grid
    @extend %grid
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))
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

  .criteria-field
    grid-column: 1 / -1

    .criteria-grid-container
      margin-top: 0.5rem
      border: 2px solid var(--border-muted)
      border-radius: var(--radius)
      padding: 1rem
      padding-right: 50px
      background: var(--surface)
      height: 200px
      overflow: auto

  .criteria-badge
    display: inline-block
    padding: 0.25rem 0.5rem
    margin: 0.125rem
    background: var(--primary-bg)
    color: var(--primary)
    border-radius: var(--radius-sm)
    font-size: 0.75rem
    font-weight: 600
    white-space: nowrap
    word-break: keep-all
    flex-shrink: 0
</style>
