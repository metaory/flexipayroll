<script>
  import Icon from '@iconify/svelte'
  import { rules, basicConfig, addRule, updateRule, removeRule, toggleRule, reorderRules, resetRules, updateBasicConfig } from '../stores.js'
  import { RULE_TYPES, RULE_CATEGORIES, CRITERIA_TYPES } from '../rules.js'
  import { toasts } from '../lib/toast.js'
  import { confirmDialog } from '../lib/dialog.js'
  import Dialog from './Dialog.svelte'

  let { basicConfigData = $basicConfig } = $props()

  // Constants
  const EMPTY_RULE = { label: '', type: RULE_TYPES.FIXED, value: 0, criteria: { appliesTo: [] }, category: RULE_CATEGORIES.BONUS }
  const EMPTY_ERRORS = { label: false, value: false }
  const CRITERIA_OPTIONS = {
    gender: [{ value: CRITERIA_TYPES.MALE, label: 'Male' }, { value: CRITERIA_TYPES.FEMALE, label: 'Female' }],
    marital: [{ value: CRITERIA_TYPES.SINGLE, label: 'Single' }, { value: CRITERIA_TYPES.MARRIED, label: 'Married' }]
  }
  const CONFIG_FIELDS = [
    { key: 'workdayHours', label: 'Hours/Day', type: 'number', min: 1, max: 24, step: 0.5, fallback: 8 },
    { key: 'overtimeRate', label: 'OT Rate', type: 'number', min: 0, max: 10, step: 0.1, fallback: 1.5, hint: 'OT multiplier' },
    { key: 'undertimeRate', label: 'UT Rate', type: 'number', min: 0, max: 1, step: 0.1, fallback: 0.5, hint: 'UT multiplier' },
    { key: 'workingDaysPerMonth', label: 'Days/Month', type: 'number', min: 1, max: 31, fallback: 22 },
    { key: 'currencySymbol', label: 'Currency', type: 'text', fallback: '$' },
    { key: 'monthDays', label: 'Month Days', type: 'number', min: 28, max: 31, fallback: 30 },
    { key: 'firstDayWeekday', label: 'Week Start', type: 'select', fallback: 'Saturday', options: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }
  ]
  const RULE_TYPE_OPTIONS = [
    { value: RULE_TYPES.FIXED, label: 'Fixed' },
    { value: RULE_TYPES.DAYS_MULTIPLIER, label: 'Days ×' },
    { value: RULE_TYPES.PERCENTAGE_MONTHLY, label: '% Monthly' },
    { value: RULE_TYPES.PERCENTAGE_BASE, label: '% Base' },
    { value: RULE_TYPES.HOURLY_MULTIPLIER, label: 'Hourly ×' }
  ]

  // Form state
  let showRuleDialog = $state(false)
  let editingRule = $state(null)
  let errors = $state({ ...EMPTY_ERRORS })
  let newRule = $state({ ...EMPTY_RULE })
  let draggedRule = $state(null)

  // Criteria selection helpers
  const getCriteriaSelection = (types) => newRule.criteria.appliesTo.find(c => types.includes(c)) || ''
  const getGenderSelection = () => getCriteriaSelection([CRITERIA_TYPES.MALE, CRITERIA_TYPES.FEMALE])
  const getMaritalSelection = () => getCriteriaSelection([CRITERIA_TYPES.SINGLE, CRITERIA_TYPES.MARRIED])

  // Form reset
  const resetForm = () => {
    showRuleDialog = false
    editingRule = null
    errors = { ...EMPTY_ERRORS }
    newRule = { ...EMPTY_RULE }
  }

  // Basic config handler
  const updateBasicConfigField = (field, value) => {
    basicConfigData = { ...basicConfigData, [field]: value }
    updateBasicConfig({ [field]: value })
  }

  // Storage reset
  const resetAllStorage = async () => {
    if (!await confirmDialog('DANGEROUS: Clear ALL data? Cannot be undone.')) return
    localStorage.clear()
    toasts.success('All data cleared. Reloading...')
    setTimeout(() => window.location.reload(), 1000)
  }

  // Rule form handlers
  const startAddRule = () => { newRule = { ...EMPTY_RULE }; showRuleDialog = true }
  const startEditRule = (rule) => { editingRule = rule; newRule = { ...rule }; showRuleDialog = true }

  const saveRule = () => {
    const validations = [
      [!newRule.label?.trim(), 'label'],
      [!newRule.value && newRule.value !== 0, 'value']
    ]
    errors = validations.filter(([c]) => c).reduce((acc, [, f]) => ({ ...acc, [f]: true }), { ...EMPTY_ERRORS })
    
    if (Object.values(errors).some(Boolean)) return toasts.error('Fix errors below')
    
    try {
      editingRule ? updateRule(editingRule.id, newRule) : addRule(newRule)
      toasts.success(editingRule ? 'Rule updated' : 'Rule added')
      resetForm()
    } catch (e) { toasts.error(e.message) }
  }

  const deleteRule = async (id) => {
    if (await confirmDialog('Delete this rule?')) { removeRule(id); toasts.success('Rule deleted') }
  }

  const handleResetRules = async () => {
    if (await confirmDialog('Reset rules to defaults?')) { resetRules(); toasts.success('Rules reset') }
  }

  // Drag handlers
  const handleDragStart = (e, rule) => { draggedRule = rule; e.dataTransfer.effectAllowed = 'move' }
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }
  
  const handleDrop = (e, targetRule) => {
    e.preventDefault()
    if (!draggedRule || draggedRule.id === targetRule.id) return
    const reordered = [...$rules]
    const [dragged] = reordered.splice(reordered.findIndex(r => r.id === draggedRule.id), 1)
    reordered.splice(reordered.findIndex(r => r.id === targetRule.id), 0, dragged)
    reorderRules(reordered.map(r => r.id))
    draggedRule = null
  }

  // Event handler factory - consolidated
  const withStop = (fn) => (e, ...args) => { e?.stopPropagation(); fn(...args) }
  const handleToggleClick = withStop((id) => toggleRule(id))
  const handleEditClick = withStop(startEditRule)
  const handleDeleteClick = withStop(deleteRule)

  const handleRuleCardClick = (e, rule) => {
    if (e?.target?.closest('button, .wizard-footer')) return
    startEditRule(rule)
  }
</script>

<div class="rules-container">
  <section class="basic-config">
    <h3>Config</h3>
    <div class="config-grid">
      {#each CONFIG_FIELDS as f}
        <label class="field">
          <span>{f.label}</span>
          {#if f.type === 'select'}
            <select value={basicConfigData[f.key] || f.fallback} onchange={(e) => updateBasicConfigField(f.key, e.target.value || f.fallback)}>
              {#each f.options as opt}<option value={opt}>{opt}</option>{/each}
            </select>
          {:else}
            <input type={f.type} min={f.min} max={f.max} step={f.step}
              value={basicConfigData[f.key] ?? f.fallback}
              oninput={(e) => updateBasicConfigField(f.key, f.type === 'number' ? +e.target.value || f.fallback : e.target.value || f.fallback)} />
          {/if}
          {#if f.hint}<small>{f.hint}</small>{/if}
        </label>
      {/each}
    </div>
    <div class="config-actions">
      <button class="danger" onclick={resetAllStorage}>
        <Icon icon="tabler:alert-triangle" width="1rem" height="1rem" />
        Reset
      </button>
    </div>
  </section>

  <!-- Rules Management -->
  <section class="rules-management">
    <div class="rules-header">
      <h3>Calculation Rules</h3>
      <div class="rules-actions">
        <button class="secondary" onclick={handleResetRules}>
          <Icon icon="tabler:refresh" width="1rem" height="1rem" />
          Reset
        </button>
        <button class="primary" onclick={startAddRule}>
          <Icon icon="tabler:plus" width="1rem" height="1rem" />
          Add
        </button>
      </div>
    </div>

    <div class="rules-list">
      {#each $rules as rule (rule.id)}
        <div class="rule-card" class:disabled={!rule.enabled} data-category={rule.category} draggable="true" role="button" tabindex="0"
          onclick={(e) => handleRuleCardClick(e, rule)} onkeydown={(e) => e.key === 'Enter' && handleRuleCardClick(e, rule)}
          ondragstart={(e) => handleDragStart(e, rule)} ondragover={handleDragOver} ondrop={(e) => handleDrop(e, rule)}>
          <div class="rule-header">
            <h4>{rule.label}</h4>
            <span class="badge category-{rule.category}">{rule.category}</span>
            <span class="badge type-{rule.type}">{RULE_TYPE_OPTIONS.find(o => o.value === rule.type)?.label || rule.type}</span>
          </div>
          <div class="rule-details">
            <span class="rule-value">{rule.value}</span>
            {#each rule.criteria.appliesTo as c}
              <span class="criteria-badge">{[...CRITERIA_OPTIONS.gender, ...CRITERIA_OPTIONS.marital].find(o => o.value === c)?.label || c}</span>
            {/each}
            <span class="rule-order">{rule.order}</span>
          </div>
          <div class="rule-actions">
            <button class="toggle-btn" class:enabled={rule.enabled} onclick={(e) => handleToggleClick(e, rule.id)}>
              <Icon icon={rule.enabled ? "tabler:eye" : "tabler:eye-closed"} width="1rem" height="1rem" /></button>
            <button class="edit-btn" onclick={(e) => handleEditClick(e, rule)}>
              <Icon icon="tabler:edit" width="1rem" height="1rem" /></button>
            <button class="delete-btn" onclick={(e) => handleDeleteClick(e, rule.id)}>
              <Icon icon="tabler:trash" width="1rem" height="1rem" /></button>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <Dialog bind:open={showRuleDialog} title={editingRule ? 'Edit' : 'Add Rule'} size="medium">
    <div class="form-grid">
      <label class="field" class:error={errors.label}>
        <span>Label</span>
        <input type="text" value={newRule.label} placeholder="Rule name"
          oninput={(e) => { newRule.label = e.target.value; errors.label = false }} />
      </label>
      <label class="field">
        <span>Type</span>
        <select value={newRule.type} onchange={(e) => newRule.type = e.target.value}>
          {#each RULE_TYPE_OPTIONS as o}<option value={o.value}>{o.label}</option>{/each}
        </select>
      </label>
      <label class="field" class:error={errors.value}>
        <span>Value</span>
        <input type="number" min="0" step={newRule.type.includes('percentage') ? 0.01 : 1} value={newRule.value}
          oninput={(e) => { newRule.value = +e.target.value; errors.value = false }} />
      </label>
      <label class="field">
        <span>Category</span>
        <select value={newRule.category} onchange={(e) => newRule.category = e.target.value}>
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
              {#each CRITERIA_OPTIONS.gender as o}
                <label class="radio-label">
                  <input type="radio" name="gender" value={o.value} checked={getGenderSelection() === o.value}
                    onchange={() => newRule.criteria.appliesTo = [...newRule.criteria.appliesTo.filter(c => c !== CRITERIA_TYPES.MALE && c !== CRITERIA_TYPES.FEMALE), o.value]} />
                  <span>{o.label}</span>
                </label>
              {/each}
            </div>
          </div>
          <div class="radio-group">
            <span class="group-label">Marital</span>
            <div class="radio-options">
              {#each CRITERIA_OPTIONS.marital as o}
                <label class="radio-label">
                  <input type="radio" name="marital" value={o.value} checked={getMaritalSelection() === o.value}
                    onchange={() => newRule.criteria.appliesTo = [...newRule.criteria.appliesTo.filter(c => c !== CRITERIA_TYPES.SINGLE && c !== CRITERIA_TYPES.MARRIED), o.value]} />
                  <span>{o.label}</span>
                </label>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="form-actions">
      <button class="secondary" onclick={resetForm}><Icon icon="tabler:x" width="1rem" height="1rem" />Cancel</button>
      <button class="primary" onclick={saveRule}><Icon icon="tabler:check" width="1rem" height="1rem" />Save</button>
    </div>
  </Dialog>
</div>

<style lang="sass">
  @use "../styles.sass" as *

  .rules-container
    @extend %grid
    gap: 1.5rem

  .basic-config, .rules-management
    @extend %card-base
    padding: 0.875rem

    h3
      margin-bottom: 1rem
      font-size: 1.5rem
      color: var(--primary)

  .config-grid
    @include auto-grid(200px)
    gap: 1rem
    align-items: start

  .field
    @extend %grid
    gap: 0.35rem
    min-height: fit-content

    span
      font-weight: 600
      font-size: 0.9rem
      color: var(--fg)

    input, select
      @extend %input-base
      padding: 0.5rem 0.75rem
      font-size: 1rem

    small
      font-size: 0.85rem
      color: var(--fg-muted)
      opacity: 0.7
      margin-top: -0.15rem
      line-height: 1.3

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
    margin-top: 0.75rem

    button.danger
      @extend %button-base
      background: var(--error)
      color: white
      border: 2px solid var(--error)

      &:hover
        background: color-mix(in oklab, var(--error) 90%, black)

  .rules-header
    @extend %flex-between
    margin-bottom: 1rem

  .rules-actions
    @extend %flex
    gap: 0.5rem

    button
      @extend %button-base
      padding: 0.5rem 0.75rem
      font-size: 0.9rem

      &.primary
        @extend %button-primary

      &.secondary
        @extend %button-secondary

  .rules-list
    @include auto-grid(260px)
    gap: 0.5rem

  .rule-card
    @extend %card-base
    display: grid
    gap: 0.35rem
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

    &.disabled
      opacity: 0.6
      background: var(--surface-muted)

      &:hover
        transform: none
        box-shadow: none

    &[data-category="bonus"]
      background: var(--surface-success)

      &:hover
        border-color: var(--success)
        box-shadow: 0 4px 16px color-mix(in oklab, var(--success) 25%, transparent)

    &[data-category="deduction"]
      background: color-mix(in oklab, var(--error) 12%, transparent)

      &:hover
        border-color: var(--error)
        box-shadow: 0 4px 16px color-mix(in oklab, var(--error) 20%, transparent)

  .rule-header
    @extend %flex
    align-items: center
    gap: 0.35rem
    flex-wrap: wrap

    h4
      @include card-title(1.15rem)
      margin: 0
      line-height: 1.2

  .badge
    padding: 0.2rem 0.4rem
    border-radius: 0.4rem
    font-size: 0.85rem
    font-weight: 600

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
    @extend %flex
    align-items: center
    gap: 0.35rem
    flex-wrap: wrap

  .rule-value
    font-size: 1.75rem
    color: var(--fg)
    line-height: 1
    font-weight: 700

  .rule-order
    display: inline-flex
    align-items: center
    justify-content: center
    width: 1.5rem
    height: 1.5rem
    border-radius: 50%
    background: var(--primary-bg)
    color: var(--primary)
    font-size: 0.85rem
    font-weight: 700
    margin-left: auto
    flex-shrink: 0

  .rule-actions
    @extend %flex
    gap: 0.35rem
    flex-shrink: 0
    margin-top: auto
    padding-top: 0.5rem
    --icon-btn-size: 1.75rem

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
    @include auto-grid(180px)
    gap: 1rem
    margin-bottom: 1.25rem

  .form-actions
    @extend %flex
    gap: 0.75rem
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
    margin-top: 0.75rem
    display: grid
    grid-template-columns: repeat(2, 1fr)
    gap: 1rem

  .radio-group
    .group-label
      display: block
      font-size: 0.8rem
      font-weight: 600
      color: var(--fg)
      margin-bottom: 0.5rem

    &.error .group-label
      color: var(--error)

    &.error
      padding: 0.75rem
      border-radius: var(--radius)
      background: var(--error-bg)

  .radio-options
    display: flex
    gap: 0.35rem

  .radio-label
    display: flex
    align-items: center
    gap: 0.35rem
    cursor: pointer
    padding: 0.5rem 0.75rem
    border-radius: 0.5rem
    background: var(--surface-muted)
    @extend %transition

    &:hover
      background: var(--surface-medium)

    input[type="radio"]
      width: 1rem
      height: 1rem
      cursor: pointer
      accent-color: var(--primary)

    span
      font-size: 0.8rem
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
    padding: 0.2rem 0.4rem
    background: var(--primary-bg)
    color: var(--primary)
    border-radius: 0.35rem
    font-size: 0.9rem
    font-weight: 600
    white-space: nowrap
    flex-shrink: 0
</style>
