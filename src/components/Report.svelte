<script>
  import Icon from '@iconify/svelte'
  import Dialog from './Dialog.svelte'
  import { formatCurrency, formatHours } from '../core.js'
  import { buildCalculationSteps } from '../payroll.js'
  import { basicConfig } from '../stores.js'
  
  let { results = [], period = '' } = $props()
  
  let dialogOpen = $state(false)
  let selectedResult = $state(null)
  let expandedCards = $state({})
  
  const openCalculationDialog = (result) => {
    selectedResult = result
    dialogOpen = true
  }
  
  // Helper function to get applied rules by category
  const getAppliedRules = (result) => {
    const applied = { bonuses: [], deductions: [], adjustments: [] }
    
    Object.entries(result.ruleResults).forEach(([category, rules]) => {
      if (category === 'bonuses' || category === 'deductions') {
        Object.entries(rules).forEach(([ruleId, ruleData]) => {
          // Handle percentage rules that store finalValue separately
          const value = ruleData.finalValue !== undefined ? ruleData.finalValue : ruleData.value
          if (value > 0) {
            const rule = ruleData.rule
            const percentage = rule.type === 'percentage_monthly' || rule.type === 'percentage_base' 
              ? ` (${(rule.value * 100).toFixed(1)}%)` 
              : ''
            
            applied[category].push({
              id: ruleId,
              label: rule.label + percentage,
              value: value,
              type: rule.type
            })
          }
        })
      }
    })
    
    return applied
  }
  
  // Helper to format calculation breakdown
  const getCalculationBreakdown = (result) => {
    const breakdown = []
    const applied = getAppliedRules(result)
    
    // Base Salary
    breakdown.push({
      label: 'Base Salary',
      value: result.baseSalary,
      type: 'base',
      sign: '+'
    })
    
    // Bonuses
    applied.bonuses.forEach(bonus => {
      breakdown.push({
        label: bonus.label,
        value: bonus.value,
        type: 'bonus',
        sign: '+'
      })
    })
    
    // Adjustments
    if (result.adjustmentTotal !== 0) {
      breakdown.push({
        label: 'Adjustments',
        value: result.adjustmentTotal,
        type: 'adjustment',
        sign: result.adjustmentTotal > 0 ? '+' : ''
      })
    }
    
    // Gross Salary subtotal
    breakdown.push({
      label: 'Gross Salary',
      value: result.grossSalary,
      type: 'subtotal',
      sign: '='
    })
    
    // Deductions
    applied.deductions.forEach(deduction => {
      breakdown.push({
        label: deduction.label,
        value: deduction.value,
        type: 'deduction',
        sign: '-'
      })
    })
    
    // Final Salary
    breakdown.push({
      label: 'Take-Home Salary',
      value: result.finalSalary || 0,
      type: 'final',
      sign: '='
    })
    
    return breakdown
  }
</script>

{#if results.length === 0}
  <div class="empty">
    <Icon icon="tabler:file-text" width="2.5rem" height="2.5rem" />
    <p>No employees to report</p>
  </div>
{:else}
  <div class="report-grid">
    {#each results as result}
      {@const employeeId = result.employee.id}
      {@const isExpanded = expandedCards[employeeId]}
      <div class="report-card" class:collapsed={!isExpanded}>
        <button 
          class="card-header-btn"
          onclick={() => {
            expandedCards = { ...expandedCards, [employeeId]: !isExpanded }
          }}
        >
          <header>
            <div class="header-content">
              <Icon 
                icon={isExpanded ? "tabler:chevron-down" : "tabler:chevron-right"} 
                width="2.5rem" 
                height="2.5rem" 
                style="width: var(--icon-size); height: var(--icon-size)" 
              />
              <div class="header-text">
                <h3>{result.employee.name}</h3>
                <span>Payslip - {period}</span>
              </div>
            </div>
            {#if !isExpanded}
              <div class="collapsed-salary">
                <span class="collapsed-label">Take-Home:</span>
                <span class="collapsed-amount">
                  {formatCurrency(result.finalSalary || 0, 'id-ID', 'IDR', $basicConfig.currencySymbol)}
                </span>
              </div>
            {/if}
          </header>
        </button>
        
        {#if isExpanded}
          <div class="summary">
            <div class="line hours">
              <span>Hours Worked:</span>
              <span>{formatHours(result.totalHours)}</span>
            </div>
            
            {#each getCalculationBreakdown(result) as item}
              <div class="line" class:subtotal={item.type === 'subtotal'} class:final={item.type === 'final'}>
                <span>{item.label}:</span>
                <span class={item.type === 'bonus' ? 'bonus' : item.type === 'deduction' ? 'deduction' : item.type === 'final' ? 'final-amount' : ''}>
                  {item.sign}{formatCurrency(item.value, 'id-ID', 'IDR', $basicConfig.currencySymbol)}
                </span>
              </div>
            {/each}
          </div>

          <button class="view-details-btn" onclick={() => openCalculationDialog(result)}>
            <Icon icon="tabler:calculator" width="1rem" height="1rem" />
            View Calculation Details
          </button>
        {/if}
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
        <span>{formatCurrency(selectedResult.baseSalary, 'id-ID', 'IDR', $basicConfig.currencySymbol)}</span>
      </div>
      
      {#each getAppliedRules(selectedResult).bonuses as bonus}
        <div class="summary-line">
          <span>{bonus.label}:</span>
          <span class="bonus">+{formatCurrency(bonus.value, 'id-ID', 'IDR', $basicConfig.currencySymbol)}</span>
        </div>
      {/each}
      
      {#each getAppliedRules(selectedResult).deductions as deduction}
        <div class="summary-line">
          <span>{deduction.label}:</span>
          <span class="deduction">-{formatCurrency(deduction.value, 'id-ID', 'IDR', $basicConfig.currencySymbol)}</span>
        </div>
      {/each}
      
      {#if selectedResult.adjustmentTotal !== 0}
        <div class="summary-line">
          <span>Adjustments:</span>
          <span class={selectedResult.adjustmentTotal > 0 ? 'bonus' : 'deduction'}>
            {selectedResult.adjustmentTotal > 0 ? '+' : ''}{formatCurrency(selectedResult.adjustmentTotal, 'id-ID', 'IDR', $basicConfig.currencySymbol)}
          </span>
        </div>
      {/if}
      
      <div class="summary-line">
        <span>Gross Salary:</span>
        <span>{formatCurrency(selectedResult.grossSalary, 'id-ID', 'IDR', $basicConfig.currencySymbol)}</span>
      </div>
      
      <div class="summary-line final">
        <span>Take-Home:</span>
        <span class="final-amount">{formatCurrency(selectedResult.finalSalary, 'id-ID', 'IDR', $basicConfig.currencySymbol)}</span>
      </div>
    </div>
    
    <div class="calculation-steps">
      {#each buildCalculationSteps(selectedResult) as step, index}
        <div class="calculation-step" class:bonus={step.type === 'bonus'} class:deduction={step.type === 'deduction'} class:adjustment={step.type === 'adjustment'} class:summary={step.type === 'summary'} class:final={step.type === 'final'} class:base={step.type === 'base'}>
          <span class="step-number">{index + 1}</span>
          <div class="step-header">
            <span class="step-label">{step.label}</span>
            <span class="step-result">{formatCurrency(step.result, 'id-ID', 'IDR', $basicConfig.currencySymbol)}</span>
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
    @include auto-grid(260px)
    gap: 0.5rem
    
  .report-card
    @extend %card-base
    --card-scale: 1
    padding: 0.65rem
    border: 2px solid transparent
    @extend %transition
    
    &:hover
      border-color: var(--primary)
      box-shadow: 0 4px 16px color-mix(in oklab, var(--primary) 20%, transparent)
      transform: translateY(-2px)
    
    &.collapsed .card-header-btn
      margin-bottom: 0
        
    .card-header-btn
      width: 100%
      background: none
      border: none
      padding: 0
      margin: 0
      cursor: pointer
      text-align: left
      @extend %transition
      
      &:hover .header-text h3
        color: var(--secondary)
        
      header
        @extend %flex-between
        align-items: flex-start
        margin-bottom: 0
        padding-bottom: 0.5rem
        border-bottom: 2px solid var(--border-muted)
        
        .header-content
          @extend %flex
          align-items: center
          gap: 0.35rem
          flex: 1
          
          .header-text
            @extend %grid
            gap: 0.15rem
            
            h3
              @include card-title(1.1rem)
              margin: 0
              
            span
              @include card-text(0.85rem)
              
        .collapsed-salary
          @extend %grid
          gap: 0.15rem
          text-align: right
          margin-left: 0.75rem
          
          .collapsed-label
            @include card-text(0.75rem)
            color: var(--fg-muted)
            font-weight: 600
            
          .collapsed-amount
            @include card-title(1.15rem)
            color: var(--success)
            font-weight: 700
        
  .summary
    @extend %grid
    gap: 0.25rem
    margin-top: 0.5rem
    
  .line
    @extend %flex-between
    padding: 0.2rem 0
    @include card-text(0.9rem)
    
    &.hours
      border-bottom: 1px solid var(--border-muted)
      margin-bottom: 0.15rem
      padding-bottom: 0.35rem
      
      span:last-child
        font-weight: 600
        color: var(--info)
    
    span:first-child
      font-weight: 600
      color: var(--fg)
      font-size: 0.85rem
      
    span:last-child
      font-weight: 600
      font-size: 0.9rem
      
      &.bonus
        color: var(--success)
        
      &.deduction
        color: var(--error)
        
      &.final-amount
        color: var(--success)
        font-size: 1.25rem
    
    &.subtotal
      border-top: 1px solid var(--border-muted)
      margin-top: 0.25rem
      padding: 0.35rem 0.4rem
      background: var(--surface-muted)
      margin-left: -0.4rem
      margin-right: -0.4rem
      border-radius: 0.25rem
      
      span:last-child
        font-weight: 700
        color: var(--primary)
        
    &.final
      margin-top: 0.35rem
      padding-top: 0.5rem
      border-top: 2px solid var(--success)
      
      span:first-child
        font-weight: 700
        font-size: 0.9rem
      
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
    gap: 0.35rem
    width: 100%
    margin-top: 0.35rem
    padding: 0.35rem
    background: var(--primary)
    color: white
    border: none
    border-radius: 0.4rem
    font-weight: 600
    cursor: pointer
    font-size: 0.8rem
    @extend %transition

    &:hover
      background: var(--secondary)
      transform: translateY(-1px)

  .dialog-summary
    @extend %grid
    gap: 0.25rem
    margin-bottom: 1rem
    padding: 0.65rem
    background: var(--surface-secondary)
    border-radius: var(--radius)
    border: 2px solid var(--border-muted)

  .summary-line
    @extend %flex-between
    padding: 0.15rem 0
    font-size: 0.85rem
    
    span:first-child
      color: var(--fg-muted)
      font-size: 0.8rem
      
    span:last-child
      font-weight: 600
      color: var(--fg)
      
      &.bonus
        color: var(--success)
        
      &.deduction
        color: var(--error)
        
      &.final-amount
        color: var(--success)
        font-size: 1.1rem
        
    &.final
      margin-top: 0.25rem
      padding-top: 0.5rem
      border-top: 2px solid var(--success)

  .calculation-steps
    @extend %grid
    gap: 0.3rem

  .calculation-step
    display: grid
    grid-template-columns: 1.15rem 1fr
    align-items: start
    gap: 0.35rem 0.75rem
    padding: 0.4rem 0.65rem
    background: var(--surface-secondary)
    border-radius: 0.35rem
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
      background: var(--surface-muted)

    &.final
      border-left-color: var(--success)
      background: var(--success-bg)

  .step-number
    @extend %grid
    place-items: center
    width: 1.15rem
    height: 1.15rem
    background: var(--border-muted)
    color: var(--fg)
    border-radius: 50%
    font-weight: 700
    font-size: 0.6rem
    flex-shrink: 0

  .step-header
    @extend %flex-between
    gap: 0.5rem
    grid-column: 2

    .step-label
      font-weight: 600
      color: var(--fg)
      font-size: 0.85rem

    .step-result
      font-weight: 700
      color: var(--primary)
      font-size: 0.85rem

  .formula-text
    grid-column: 2
    font-family: 'JetBrains Mono', monospace
    color: var(--fg-muted)
    font-size: 0.7rem
    background: var(--bg-muted)
    padding: 0.2rem 0.4rem
    border-radius: 0.25rem
    line-height: 1.4
    margin-top: 0.15rem

  .calculation-text
    grid-column: 2
    font-family: 'JetBrains Mono', monospace
    color: var(--primary)
    font-size: 0.7rem
    background: var(--primary-bg)
    padding: 0.2rem 0.4rem
    border-radius: 0.25rem
    line-height: 1.4
    margin-top: 0.15rem

</style>
