<script>
  import Icon from '@iconify/svelte'
  import Dialog from './Dialog.svelte'
  import { formatCurrency, formatHours } from '../core.js'
  import { buildCalculationSteps } from '../payroll.js'
  
  let { results = [], period = '' } = $props()
  
  let dialogOpen = $state(false)
  let selectedResult = $state(null)
  
  const openCalculationDialog = (result) => {
    selectedResult = result
    dialogOpen = true
  }
  
  // Helper function to get applied rules by category
  const getAppliedRules = (result) => {
    const applied = { bonuses: [], deductions: [], adjustments: [] }
    
    Object.entries(result.ruleResults).forEach(([category, rules]) => {
      if (category === 'bonuses' || category === 'deductions' || category === 'adjustments') {
        Object.entries(rules).forEach(([ruleId, ruleData]) => {
          // Handle percentage rules that store finalValue separately
          const value = ruleData.finalValue !== undefined ? ruleData.finalValue : ruleData.value
          if (value > 0) {
            applied[category].push({
              id: ruleId,
              label: ruleData.rule.label,
              value: value,
              type: ruleData.rule.type
            })
          }
        })
      }
    })
    
    return applied
  }
</script>

{#if results.length === 0}
  <div class="empty">
    <Icon icon="solar:document-text-bold-duotone" width="3rem" height="3rem" />
    <p>No employees to report</p>
  </div>
{:else}
  <div class="report-grid">
    {#each results as result}
      <div class="report-card">
        <header>
          <h3>{result.employee.name}</h3>
          <span>Payslip - {period}</span>
        </header>
        
        <div class="summary">
          <div class="line">
            <span>{formatHours(result.totalHours)}</span>
          </div>
          
          <div class="line">
            <span>{formatCurrency(result.baseSalary)}</span>
          </div>
          
          <!-- Dynamic Bonuses -->
          {#each getAppliedRules(result).bonuses as bonus}
            <div class="line">
              <span>{bonus.label}:</span>
              <span class="bonus">+{formatCurrency(bonus.value)}</span>
            </div>
          {/each}
          
          <!-- Dynamic Deductions -->
          {#each getAppliedRules(result).deductions as deduction}
            <div class="line">
              <span>{deduction.label}:</span>
              <span class="deduction">-{formatCurrency(deduction.value)}</span>
            </div>
          {/each}
          
          <!-- Manual Adjustments -->
          {#if result.adjustmentTotal !== 0}
            <div class="line">
              <span>Adjustments:</span>
              <span class={result.adjustmentTotal > 0 ? 'bonus' : 'deduction'}>
                {result.adjustmentTotal > 0 ? '+' : ''}{formatCurrency(result.adjustmentTotal)}
              </span>
            </div>
          {/if}
          
          <div class="line">
            <span>{formatCurrency(result.grossSalary)}</span>
          </div>
          
          <div class="line final">
            <span class="final-amount">{formatCurrency(result.finalSalary)}</span>
          </div>
        </div>

        <button class="view-details-btn" onclick={() => openCalculationDialog(result)}>
          <Icon icon="solar:calculator-bold" style="width: var(--icon-size); height: var(--icon-size)" />
          View Calculation Details
        </button>
      </div>
    {/each}
  </div>
{/if}

{#if selectedResult}
  <Dialog bind:open={dialogOpen} title="{selectedResult.employee.name} - Calculation Details" size="large">
    <div class="dialog-summary">
      <div class="summary-line">
        <span>Hours Worked:</span>
        <span>{formatHours(selectedResult.totalHours)}</span>
      </div>
      
      <div class="summary-line">
        <span>Base Salary:</span>
        <span>{formatCurrency(selectedResult.baseSalary)}</span>
      </div>
      
      {#each getAppliedRules(selectedResult).bonuses as bonus}
        <div class="summary-line">
          <span>{bonus.label}:</span>
          <span class="bonus">+{formatCurrency(bonus.value)}</span>
        </div>
      {/each}
      
      {#each getAppliedRules(selectedResult).deductions as deduction}
        <div class="summary-line">
          <span>{deduction.label}:</span>
          <span class="deduction">-{formatCurrency(deduction.value)}</span>
        </div>
      {/each}
      
      {#if selectedResult.adjustmentTotal !== 0}
        <div class="summary-line">
          <span>Adjustments:</span>
          <span class={selectedResult.adjustmentTotal > 0 ? 'bonus' : 'deduction'}>
            {selectedResult.adjustmentTotal > 0 ? '+' : ''}{formatCurrency(selectedResult.adjustmentTotal)}
          </span>
        </div>
      {/if}
      
      <div class="summary-line">
        <span>Gross Salary:</span>
        <span>{formatCurrency(selectedResult.grossSalary)}</span>
      </div>
      
      <div class="summary-line final">
        <span>Take-Home:</span>
        <span class="final-amount">{formatCurrency(selectedResult.finalSalary)}</span>
      </div>
    </div>
    
    <div class="calculation-steps">
      {#each buildCalculationSteps(selectedResult) as step, index}
        <div class="calculation-step" class:bonus={step.type === 'bonus'} class:deduction={step.type === 'deduction'} class:adjustment={step.type === 'adjustment'} class:summary={step.type === 'summary'} class:final={step.type === 'final'} class:base={step.type === 'base'}>
          <span class="step-number">{index + 1}</span>
          <div class="step-header">
            <span class="step-label">{step.label}</span>
            <span class="step-result">{formatCurrency(step.result)}</span>
          </div>
          <span class="formula-text">{step.formula}</span>
          <span class="calculation-text">{step.formulaWithValues}</span>
        </div>
      {/each}
    </div>
  </Dialog>
{/if}

<style lang="sass">
  @use "../styles.sass" as *
  
  .report-grid
    @include auto-grid(280px)
    gap: 2rem
    
  .report-card
    @extend %card-base
    --card-scale: 1.4
    
    header
      @extend %flex-between
      margin-bottom: 1.25rem
      padding-bottom: 1rem
      
      h3
        @include card-title(2.2rem)
        
      span
        @include card-text(1.3rem)
        
  .summary
    @extend %grid
    gap: 0.65rem
    
  .line
    @extend %flex-between
    padding: 0.5rem 0
    @include card-text(1.3rem)
    
    span:first-child
      font-weight: 600
      color: var(--fg)
      
      &.bonus
        color: var(--success)
        
      &.deduction
        color: var(--error)
        
      &.final-amount
        color: var(--success)
        font-size: calc(2.2rem * var(--card-scale, 1))
        
    &.final
      margin-top: 0.5rem
      padding-top: 1rem
      
  .empty
    @extend %grid
    place-items: center
    gap: 1rem
    padding: 3rem
    text-align: center
    color: var(--fg-muted)
    
    p
      margin: 0

  .view-details-btn
    @extend %flex
    align-items: center
    justify-content: center
    gap: 0.5rem
    width: 100%
    margin-top: 0.75rem
    padding: 0.6rem
    background: var(--primary)
    color: white
    border: none
    border-radius: var(--radius)
    font-weight: 600
    cursor: pointer
    font-size: 1.1rem
    @extend %transition

    &:hover
      background: color-mix(in oklab, var(--primary) 90%, black)

  .dialog-summary
    @extend %grid
    gap: 0.5rem
    margin-bottom: 2rem
    padding: 1rem
    background: var(--surface-secondary)
    border-radius: var(--radius)

  .summary-line
    @extend %flex-between
    padding: 0.35rem 0
    font-size: 1.1rem
    
    span:first-child
      color: var(--fg-muted)
      
    span:last-child
      font-weight: 600
      color: var(--fg)
      
      &.bonus
        color: var(--success)
        
      &.deduction
        color: var(--error)
        
      &.final-amount
        color: var(--success)
        font-size: 1.65rem
        
    &.final
      margin-top: 0.5rem
      padding-top: 1rem

  .calculation-steps
    @extend %grid
    gap: 0.4rem

  .calculation-step
    display: grid
    grid-template-columns: 1.25rem 1fr max-content max-content
    align-items: center
    gap: 0.5rem 1rem
    padding: 0.5rem 0.75rem
    background: var(--surface-secondary)
    border-radius: 0 var(--radius) var(--radius) 0
    border-left: 3px solid var(--border-muted)
    @extend %transition

    &.base
      border-left-color: var(--info)

    &.bonus
      border-left-color: var(--success)

    &.deduction
      border-left-color: var(--error)

    &.adjustment
      border-left-color: var(--warning)

    &.summary
      border-left-color: var(--primary)

    &.final
      border-left-color: var(--success)
      background: var(--success-bg)

  .step-number
    @extend %grid
    place-items: center
    width: 1.25rem
    height: 1.25rem
    background: var(--primary-bg)
    color: var(--primary)
    border-radius: 50%
    font-weight: 700
    font-size: 0.65rem
    flex-shrink: 0

  .step-header
    @extend %flex-between
    gap: 0.5rem
    grid-column: 2

    .step-label
      font-weight: 600
      color: var(--fg)
      font-size: 0.9rem

    .step-result
      font-weight: 700
      color: var(--primary)
      font-size: 0.9rem

  .formula-text
    grid-column: 3
    font-family: var(--font-mono)
    color: var(--fg-muted)
    font-size: 0.7rem
    background: var(--bg-muted)
    padding: 0.15rem 0.5rem
    border-radius: 4px
    border: 1px solid var(--border-muted)
    white-space: nowrap

  .calculation-text
    grid-column: 4
    font-family: var(--font-mono)
    color: var(--primary)
    font-size: 0.7rem
    background: var(--primary-bg)
    padding: 0.15rem 0.5rem
    border-radius: 4px
    border: 1px solid var(--primary)
    white-space: nowrap

</style>
