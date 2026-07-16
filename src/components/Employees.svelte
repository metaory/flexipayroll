<script>
  import Icon from '@iconify/svelte/dist/OfflineIcon.svelte'
  import { EMPLOYEE_FIELDS, getProbationLabel, hasProbationRules, probationRulesKey, resolveProbation } from '../payroll.js'
  import { addEmployee, updateEmployee, removeEmployee, basicConfig, rules } from '../stores.js'
  import { RULE_CATEGORIES } from '../rules.js'
  import { normalizeProbationFields, PROBATION_BG, PROBATION_LABELS } from '../probation.js'
  import { generateEmployeeId, formatCurrency, calculateHourlyRate } from '../core.js'
  import { toasts } from '../lib/toast.js'
  import { ICONS } from '../lib/icons.js'
  import { confirmDialog } from '../lib/dialog.js'
  import Dialog from './Dialog.svelte'

  let { employees = [] } = $props()

  const EMPTY_EMPLOYEE = {
    name: '',
    gender: 'male',
    maritalStatus: 'single',
    childrenStatus: 'no_children',
    dailySalary: '',
    yearsOfExperience: '',
    probation: null,
    probationRulesA: [],
    probationRulesB: []
  }

  const PROBATION_OPTIONS = Object.entries(PROBATION_LABELS).map(([key, label]) => ({ key, label }))

  const RULE_GROUPS = [
    { category: RULE_CATEGORIES.BONUS, label: 'Bonuses' },
    { category: RULE_CATEGORIES.DEDUCTION, label: 'Deductions' }
  ]

  const enabledRules = $derived(
    [...$rules].filter(r => r.enabled).sort((a, b) => a.order - b.order)
  )

  const rulesByCategory = (category) =>
    enabledRules.filter(r => r.category === category)

  const setProbationFromRules = (rulesA, rulesB) =>
    rulesA.length > 0 ? 'a' : rulesB.length > 0 ? 'b' : null

  const toggleProbationRule = (key, ruleId, checked) => {
    const field = probationRulesKey(key)
    const otherKey = key === 'a' ? 'b' : 'a'
    const otherField = probationRulesKey(otherKey)
    const current = newEmployee[field] ?? []
    const nextRules = checked ? [...current, ruleId] : current.filter(id => id !== ruleId)
    const otherRules = checked ? [] : (newEmployee[otherField] ?? [])
    newEmployee = {
      ...newEmployee,
      [field]: nextRules,
      [otherField]: otherRules,
      probation: setProbationFromRules(
        key === 'a' ? nextRules : otherRules,
        key === 'b' ? nextRules : otherRules
      )
    }
  }

  const EMPTY_ERRORS = {
    name: false,
    gender: false,
    maritalStatus: false,
    childrenStatus: false,
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
    newEmployee = {
      ...employee,
      childrenStatus: employee.childrenStatus || 'no_children',
      probation: employee.probation ?? null,
      probationRulesA: employee.probationRulesA ?? [],
      probationRulesB: employee.probationRulesB ?? []
    }
    showEmployeeDialog = true
  }

  const saveEmployee = () => {
    const validations = [
      [!newEmployee.name || newEmployee.name.trim() === '', 'name'],
      [!newEmployee.gender, 'gender'],
      [!newEmployee.maritalStatus, 'maritalStatus'],
      [!newEmployee.childrenStatus, 'childrenStatus'],
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
      const probation = normalizeProbationFields({
        ...newEmployee,
        dailySalary: parseInt(newEmployee.dailySalary),
        yearsOfExperience: parseFloat(newEmployee.yearsOfExperience)
      })
      const data = {
        name: probation.name,
        gender: probation.gender,
        maritalStatus: probation.maritalStatus,
        childrenStatus: probation.childrenStatus,
        dailySalary: probation.dailySalary,
        yearsOfExperience: probation.yearsOfExperience,
        probation: probation.probation,
        probationRulesA: [...probation.probationRulesA],
        probationRulesB: [...probation.probationRulesB]
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
          <Icon icon={ICONS.add} width="1rem" height="1rem" />
          Add
        </button>
      </div>
    </div>

    <!-- Employee List -->
    <div class="employee-list">
      {#if employees.length > 0}
        <div class="employee-cards">
          {#each employees as employee}
            <div class="card employee-card" role="button" tabindex="0" onclick={() => startEditEmployee(employee)} onkeydown={(e) => e.key === 'Enter' && startEditEmployee(employee)}>
              <div class="employee-info">
                <h4>{employee.name}</h4>
                <p>{employee.gender} • {employee.maritalStatus} • <label class="children-check" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={employee.childrenStatus === 'has_children'} onchange={() => updateEmployee(employee.id, { childrenStatus: employee.childrenStatus === 'has_children' ? 'no_children' : 'has_children' })} />
                  <span>Has children</span>
                </label>{#if getProbationLabel(employee)} • <span class="probationary-badge" style:--probation-bg={PROBATION_BG[resolveProbation(employee)]} class:has-rules={hasProbationRules(employee, resolveProbation(employee))}>{#if hasProbationRules(employee, resolveProbation(employee))}<Icon icon="tabler:list-check" width="0.85rem" height="0.85rem" />{/if}{getProbationLabel(employee)}</span>{/if}</p>
                <p class="salary">{formatCurrency(employee.dailySalary || 0, 'id-ID', 'IDR', $basicConfig.currencySymbol)}/day</p>
                {#if employee.dailySalary}
                  <p class="monthly-ref">({formatCurrency((employee.dailySalary || 0) * ($basicConfig.workingDaysPerMonth || 22), 'id-ID', 'IDR', $basicConfig.currencySymbol)} expected/month base)</p>
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
    size="large"
    on:close={handleDialogClose}
  >
    <div class="form-grid">
      {#each EMPLOYEE_FIELDS as field}
        {#if field.type === 'checkbox'}
          <label class="field checkbox-field" class:error={errors[field.key]}>
            <input
              type="checkbox"
              checked={field.key === 'childrenStatus' ? newEmployee.childrenStatus === 'has_children' : Boolean(newEmployee[field.key])}
              onchange={(e) => {
                const checked = e.currentTarget.checked
                newEmployee = field.key === 'childrenStatus'
                  ? { ...newEmployee, childrenStatus: checked ? 'has_children' : 'no_children' }
                  : { ...newEmployee, [field.key]: checked }
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
                lang="en"
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
                lang={field.type === 'number' ? 'en' : undefined}
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

    <div class="probation-section">
      {#each PROBATION_OPTIONS as opt}
        <div class="probation-col" style:--probation-bg={PROBATION_BG[opt.key]}>
          <p class="probation-title">
            {opt.label}
            {#if hasProbationRules(newEmployee, opt.key)}
              <Icon icon="tabler:ban" width="1rem" height="1rem" />
            {/if}
          </p>
          <div class="rule-list">
            {#each RULE_GROUPS as group}
              {#each rulesByCategory(group.category) as rule}
                <label class="field checkbox-field rule-check">
                  <input
                    type="checkbox"
                    checked={(newEmployee[probationRulesKey(opt.key)] ?? []).includes(rule.id)}
                    onchange={(e) => toggleProbationRule(opt.key, rule.id, e.currentTarget.checked)}
                  />
                  <span>{rule.label}</span>
                </label>
              {/each}
            {/each}
          </div>
        </div>
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
    gap: 1rem

  .employee-management
    @extend %card-base
    padding: 0.65rem

    h3
      margin-bottom: 0.6rem
      font-size: 1.5rem
      color: var(--primary)

  .employee-header
    @extend %flex-between
    margin-bottom: 0.6rem

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
    @include card-interactive(0.4rem)
    @include card-accent
    --card-scale: 1
    cursor: pointer
    padding: 0.5rem

    &:hover
      background: var(--surface-medium)

  .employee-info
    @include card-content

    h4
      @include card-title(1.2rem)
      margin-bottom: 0.15rem
      @extend %transition

    p
      @include card-text(0.95rem)
      margin: 0.1rem 0

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

    .children-check
      display: inline-flex
      align-items: center
      gap: 0.35rem
      cursor: pointer
      user-select: none

    .probationary-badge
      display: inline-flex
      align-items: center
      gap: 0.25rem
      padding: 0.15rem 0.4rem
      background: color-mix(in oklab, var(--probation-bg) 18%, var(--surface))
      border: 2px solid color-mix(in oklab, var(--probation-bg) 50%, var(--border-muted))
      color: color-mix(in oklab, var(--probation-bg) 80%, var(--fg))
      border-radius: 0.3rem
      font-size: 0.75rem
      font-weight: 600
      margin-left: 0.35rem
      &.has-rules
        background: var(--probation-bg)
        border-color: var(--probation-bg)
        color: var(--bg)

    .experience
      font-size: 0.85rem

  .employee-actions
    @extend %flex
    gap: 0.35rem
    flex-shrink: 0

  .edit-btn, .delete-btn
    @include card-action-btn
    --icon-btn-size: 2.5rem
    flex-shrink: 0
    color: var(--fg-muted)

    :global(svg)
      width: 1.25rem !important
      height: 1.25rem !important

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

  .probation-section
    display: grid
    grid-template-columns: 1fr 1fr
    gap: 1rem
    margin-bottom: 1.25rem

  .probation-col
    @extend %grid
    gap: 0.5rem
    padding: 0.75rem
    border-radius: var(--radius)
    background: color-mix(in oklab, var(--probation-bg) 12%, var(--surface-muted))
    border: 2px solid color-mix(in oklab, var(--probation-bg) 35%, var(--border-muted))

    .probation-title
      display: flex
      align-items: center
      gap: 0.4rem
      font-weight: 700
      font-size: 0.95rem
      color: var(--probation-bg)
      margin: 0 0 0.25rem

    .rule-list
      display: grid
      gap: 0
      overflow: hidden

      .rule-check
        padding: 0.5rem 0.75rem
        border-radius: 0
        margin: 0

        &:first-child
          border-radius: var(--radius) var(--radius) 0 0

        &:last-child
          border-radius: 0 0 var(--radius) var(--radius)

        &:only-child
          border-radius: var(--radius)

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
    @extend %empty-state
</style>
