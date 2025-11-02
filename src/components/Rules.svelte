<script>
  import Icon from '@iconify/svelte'
  import { rules, basicConfig, addRule, updateRule, removeRule, toggleRule, reorderRules, resetRules, updateBasicConfig } from '../stores.js'
  import { RULE_TYPES, RULE_CATEGORIES, CRITERIA_TYPES, createRule, validateRule } from '../rules.js'
  import { toasts } from '../lib/toast.js'
  import { confirmDialog } from '../lib/dialog.js'
  import Dialog from './Dialog.svelte'

  let { basicConfigData = $basicConfig } = $props()

  // Form state
  let showRuleDialog = $state(false)
  let editingRule = $state(null)
  let errors = $state({ label: false, value: false, gender: false, marital: false })
  let newRule = $state({
    label: '',
    type: RULE_TYPES.FIXED,
    value: 0,
    criteria: { appliesTo: [] },
    category: RULE_CATEGORIES.BONUS
  })

  // Gender options
  const genderOptions = [
    { value: CRITERIA_TYPES.MALE, label: 'Male' },
    { value: CRITERIA_TYPES.FEMALE, label: 'Female' }
  ]

  // Marital status options
  const maritalStatusOptions = [
    { value: CRITERIA_TYPES.SINGLE, label: 'Single' },
    { value: CRITERIA_TYPES.MARRIED, label: 'Married' }
  ]

  // Helper to get current selection
  const getGenderSelection = () => {
    return newRule.criteria.appliesTo.find(c => c === CRITERIA_TYPES.MALE || c === CRITERIA_TYPES.FEMALE) || ''
  }

  const getMaritalSelection = () => {
    return newRule.criteria.appliesTo.find(c => c === CRITERIA_TYPES.SINGLE || c === CRITERIA_TYPES.MARRIED) || ''
  }

  // Handle dialog close
  const handleDialogClose = () => {
    showRuleDialog = false
    editingRule = null
    newRule = {
      label: '',
      type: RULE_TYPES.FIXED,
      value: 0,
      criteria: { appliesTo: [] },
      category: RULE_CATEGORIES.BONUS
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
      criteria: { appliesTo: [] },
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
    errors = { label: false, value: false, gender: false, marital: false }
    
    if (!newRule.label || newRule.label.trim() === '') {
      errors.label = true
    }
    
    if (!newRule.value || newRule.value === 0) {
      errors.value = true
    }
    
    if (errors.label || errors.value) {
      toasts.error('Please fix the errors below')
      return
    }
    
    try {
      if (editingRule) {
        updateRule(editingRule.id, newRule)
        toasts.success('Rule updated')
      } else {
        addRule(newRule)
        toasts.success('Rule added')
      }
      cancelRuleForm()
      errors = { label: false, value: false, gender: false, marital: false }
    } catch (error) {
      toasts.error(error.message)
    }
  }

  const cancelRuleForm = () => {
    showRuleDialog = false
    editingRule = null
    errors = { label: false, value: false, gender: false, marital: false }
    newRule = {
      label: '',
      type: RULE_TYPES.FIXED,
      value: 0,
      criteria: { appliesTo: [] },
      category: RULE_CATEGORIES.BONUS
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

  const handleRuleCardClick = (e, rule) => {
    if (!e || !e.target) return
    const button = e.target.closest('button')
    if (button) return
    const footer = e.target.closest('.wizard-footer')
    if (footer) return
    startEditRule(rule)
  }

  const handleToggleClick = (e, id) => {
    if (!e) return
    e.stopPropagation()
    toggleRuleEnabled(id)
  }

  const handleEditClick = (e, rule) => {
    if (!e) return
    e.stopPropagation()
    startEditRule(rule)
  }

  const handleDeleteClick = (e, id) => {
    if (!e) return
    e.stopPropagation()
    deleteRule(id)
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
        <Icon icon="solar:danger-triangle-bold" style="width: var(--icon-size); height: var(--icon-size)" />
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
          <Icon icon="solar:refresh-bold" style="width: var(--icon-size); height: var(--icon-size)" />
          Reset to Defaults
        </button>
        <button class="primary" onclick={startAddRule}>
          <Icon icon="solar:add-circle-bold" style="width: var(--icon-size); height: var(--icon-size)" />
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
          data-category={rule.category}
          draggable="true"
          role="listitem"
          onclick={(e) => handleRuleCardClick(e, rule)}
          ondragstart={(e) => handleDragStart(e, rule)}
          ondragover={(e) => handleDragOver(e)}
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
              <p class="rule-value">{rule.value}</p>
              {#if rule.criteria.appliesTo.length > 0}
                <p class="rule-applies">
                  {#each rule.criteria.appliesTo as criteria}
                    <span class="criteria-badge">
                      {[genderOptions, maritalStatusOptions].flat().find(opt => opt.value === criteria)?.label || criteria}
                    </span>
                  {/each}
                </p>
              {/if}
              <p class="rule-order">{rule.order}</p>
            </div>
          </div>

          <div class="rule-actions">
            <button
              class="toggle-btn"
              class:enabled={rule.enabled}
              onclick={(e) => handleToggleClick(e, rule.id)}
            >
              <Icon icon={rule.enabled ? "solar:eye-bold" : "solar:eye-closed-bold"} style="width: var(--icon-size); height: var(--icon-size)" />
            </button>
            <button class="edit-btn" onclick={(e) => handleEditClick(e, rule)}>
              <Icon icon="solar:pen-bold" style="width: var(--icon-size); height: var(--icon-size)" />
            </button>
            <button class="delete-btn" onclick={(e) => handleDeleteClick(e, rule.id)}>
              <Icon icon="solar:trash-bin-trash-bold" style="width: var(--icon-size); height: var(--icon-size)" />
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
          <label class="field" class:error={errors.label}>
            <span>Rule Label</span>
            <input
              type="text"
              value={newRule.label}
              oninput={(e) => {
                newRule.label = e.target.value
                if (errors.label) errors.label = false
              }}
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

          <label class="field" class:error={errors.value}>
            <span>Value</span>
            <input
              type="number"
              min="0"
              step={newRule.type === RULE_TYPES.PERCENTAGE_MONTHLY || newRule.type === RULE_TYPES.PERCENTAGE_BASE ? "0.01" : "1"}
              value={newRule.value}
              oninput={(e) => {
                newRule.value = +e.target.value
                if (errors.value) errors.value = false
              }}
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
            <span>Applies To</span>
            
            <div class="radio-groups-grid">
              <div class="radio-group">
                <span class="group-label">Gender</span>
                <div class="radio-options">
                  {#each genderOptions as option}
                    <label class="radio-label">
                      <input
                        type="radio"
                        name="gender"
                        value={option.value}
                        checked={getGenderSelection() === option.value}
                        onchange={() => {
                          const filtered = newRule.criteria.appliesTo.filter(c => 
                            c !== CRITERIA_TYPES.MALE && c !== CRITERIA_TYPES.FEMALE
                          )
                          newRule.criteria.appliesTo = [...filtered, option.value]
                          // No validation required; empty selection means applies to all
                        }}
                      />
                      <span>{option.label}</span>
                    </label>
                  {/each}
                </div>
              </div>

              <div class="radio-group">
                <span class="group-label">Marital Status</span>
                <div class="radio-options">
                  {#each maritalStatusOptions as option}
                    <label class="radio-label">
                      <input
                        type="radio"
                        name="marital"
                        value={option.value}
                        checked={getMaritalSelection() === option.value}
                        onchange={() => {
                          const filtered = newRule.criteria.appliesTo.filter(c => 
                            c !== CRITERIA_TYPES.SINGLE && c !== CRITERIA_TYPES.MARRIED
                          )
                          newRule.criteria.appliesTo = [...filtered, option.value]
                          // No validation required; empty selection means applies to all
                        }}
                      />
                      <span>{option.label}</span>
                    </label>
                  {/each}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button class="secondary" onclick={cancelRuleForm}>
            <Icon icon="solar:close-circle-bold" style="width: var(--icon-size); height: var(--icon-size)" />
            Cancel
          </button>
          <button class="primary" onclick={saveRule}>
            <Icon icon="solar:check-circle-bold" style="width: var(--icon-size); height: var(--icon-size)" />
            Save
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
    @include auto-grid(200px)
    gap: 1.5rem

  .field
    @extend %grid
    gap: 0.5rem

    span
      font-weight: 600
      color: var(--fg)

    input, select
      @extend %input-base

    &.error input
      background: var(--error-bg)
      border-color: var(--error)
      color: var(--error)

      &:focus
        border-color: var(--error)
        box-shadow: 0 0 0 2px var(--error-bg)

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
    @include auto-grid(380px)
    gap: 1rem

  .rule-card
    @include card-draggable(1rem)
    cursor: pointer
    flex-direction: column
    padding: 1.25rem

    &:hover
      background: var(--surface-medium)

    &.disabled
      opacity: 0.6
      background: var(--surface-muted)

    &[data-category="bonus"]
      background: var(--surface-success)

    &[data-category="deduction"]
      background: color-mix(in oklab, var(--error) 12%, transparent)

  .rule-info
    @include card-content
    width: 100%

    .rule-header
      margin-bottom: 0.75rem

      h4
        @include card-title(1.6rem)
        margin-bottom: 0.5rem
        line-height: 1.3

    .rule-badges
      @extend %flex
      gap: 0.5rem
      margin-bottom: 0.75rem
      flex-wrap: wrap

    .badge
      padding: 0.5rem 0.75rem
      border-radius: var(--radius)
      font-size: 1.8rem
      font-weight: 700

      &.category-bonus
        background: var(--success-bg)
        color: var(--success)

      &.category-deduction
        background: var(--error-bg)
        color: var(--error)

      &.type-fixed, &.type-days_multiplier, &.type-percentage_monthly, &.type-percentage_base, &.type-hourly_multiplier
        background: var(--primary-bg)
        color: var(--primary)

    .rule-details
      display: grid
      gap: 0.75rem

      .rule-value
        font-size: 4.5rem
        color: var(--fg)
        margin: 0
        line-height: 1.2
        font-weight: 700

      .rule-applies
        display: flex
        flex-wrap: wrap
        gap: 0.5rem
        align-items: center
        margin: 0

      .rule-order
        display: inline-flex
        align-items: center
        justify-content: center
        width: 4.5rem
        height: 4.5rem
        border-radius: 50%
        background: var(--primary-bg)
        color: var(--primary)
        font-size: 2.8rem
        font-weight: 700
        margin: 0
        flex-shrink: 0

  .rule-actions
    @extend %flex
    gap: 0.5rem
    flex-shrink: 0
    margin-top: auto
    padding-top: 0.75rem
    --icon-btn-size: 2.25rem

  .toggle-btn, .edit-btn, .delete-btn
    @include card-action-btn

    &:hover
      background: var(--surface-medium)

    &.enabled
      background: var(--success-bg)
      color: var(--success)

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

  .criteria-field
    grid-column: 1 / -1

  .radio-groups-grid
    margin-top: 1rem
    display: grid
    grid-template-columns: repeat(2, 1fr)
    gap: 1.5rem

  .radio-group
    .group-label
      display: block
      font-size: 0.875rem
      font-weight: 600
      color: var(--fg)
      margin-bottom: 0.75rem

    &.error .group-label
      color: var(--error)

    &.error
      padding: 1rem
      border-radius: var(--radius)
      background: var(--error-bg)

  .radio-options
    display: flex
    gap: 0.5rem

  .radio-label
    display: flex
    align-items: center
    gap: 0.5rem
    cursor: pointer
    padding: 0.75rem 1rem
    border-radius: var(--radius)
    background: var(--surface-muted)
    @extend %transition

    &:hover
      background: var(--surface-medium)

    input[type="radio"]
      width: 1.25rem
      height: 1.25rem
      cursor: pointer
      accent-color: var(--primary)

    span
      font-size: 0.875rem
      color: var(--fg)
      user-select: none

  .radio-label:has(input:checked)
    background: var(--primary)
    border: none

    span
      color: white
      font-weight: 600

  .criteria-badge
    display: inline-block
    padding: 0.5rem 0.75rem
    background: var(--primary-bg)
    color: var(--primary)
    border-radius: var(--radius)
    font-size: 1.9rem
    font-weight: 700
    white-space: nowrap
    word-break: keep-all
    flex-shrink: 0
</style>
