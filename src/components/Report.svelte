<script>
  import Icon from '@iconify/svelte'
  import Dialog from './Dialog.svelte'
  import { formatCurrency, formatHours } from '../core.js'
  import { buildCalculationSteps } from '../payroll.js'
  import { basicConfig } from '../stores.js'
  import { printEmployeeReport } from '../lib/print.js'
  
  let { results = [], period = '' } = $props()
  
  let dialogOpen = $state(false)
  let selectedResult = $state(null)
  let expandedCards = $state({})
  
  const openCalculationDialog = (result) => {
    selectedResult = result
    dialogOpen = true
  }
  
  const fmt = (v) => formatCurrency(v, 'id-ID', 'IDR', $basicConfig.currencySymbol)
  
  const getAppliedRules = (result) => {
    const applied = { bonuses: [], deductions: [] }
    Object.entries(result.ruleResults).map(([category, rules]) => {
      if (category !== 'bonuses' && category !== 'deductions') return
      Object.entries(rules).map(([ruleId, ruleData]) => {
        const value = ruleData.finalValue !== undefined ? ruleData.finalValue : ruleData.value
        if (value > 0) {
          const rule = ruleData.rule
          const pct = rule.type === 'percentage_monthly' || rule.type === 'percentage_base' 
            ? ` (${(rule.value * 100).toFixed(1)}%)` : ''
          applied[category].push({ id: ruleId, label: rule.label + pct, value, type: rule.type })
        }
      })
    })
    return applied
  }
  
  const getCalculationBreakdown = (result) => {
    const applied = getAppliedRules(result)
    return [
      { label: 'Base Salary', value: result.baseSalary, type: 'base', sign: '+' },
      ...applied.bonuses.map(b => ({ label: b.label, value: b.value, type: 'bonus', sign: '+' })),
      ...(result.adjustmentTotal !== 0 ? [{ label: 'Adjustments', value: result.adjustmentTotal, type: 'adjustment', sign: result.adjustmentTotal > 0 ? '+' : '-' }] : []),
      { label: 'Gross Salary', value: result.grossSalary, type: 'subtotal', sign: '=' },
      ...applied.deductions.map(d => ({ label: d.label, value: d.value, type: 'deduction', sign: '-' })),
      { label: 'Take-Home', value: result.finalSalary || 0, type: 'final', sign: '=' }
    ]
  }
</script>

{#if results.length === 0}
  <div class="empty">
    <Icon icon="tabler:file-text" width="3rem" height="3rem" />
    <p>No employees to report</p>
  </div>
{:else}
  <div class="report-grid">
    {#each results as result}
      {@const employeeId = result.employee.id}
      {@const isExpanded = expandedCards[employeeId]}
      <button class="report-card" class:expanded={isExpanded} onclick={() => { expandedCards = { ...expandedCards, [employeeId]: !isExpanded } }}>
        <header>
          <div class="header-top">
            <h3 class="name">{result.employee.name}</h3>
            <span class="period">{period}</span>
          </div>
          <div class="header-stats">
            <div class="stat">
              <Icon icon="tabler:calendar-check" width="1.1rem" height="1.1rem" />
              <span>{result.actualDays} days</span>
            </div>
            <div class="stat">
              <Icon icon="tabler:clock-hour-4" width="1.1rem" height="1.1rem" />
              <span>{formatHours(result.totalHours)}</span>
            </div>
          </div>
          <div class="header-amount">
            <span class="label">Take-Home Salary</span>
            <span class="amount">{fmt(result.finalSalary || 0)}</span>
          </div>
        </header>
        
        {#if isExpanded}
          <div class="breakdown">
            {#each getCalculationBreakdown(result) as item}
              <div class="row {item.type}">
                <span class="row-label">{item.label}</span>
                <span class="row-value">{item.sign}{fmt(Math.abs(item.value))}</span>
              </div>
            {/each}
          </div>
          <div class="actions" onclick={(e) => e.stopPropagation()}>
            <button class="btn details" onclick={() => openCalculationDialog(result)}>
              <Icon icon="tabler:calculator" width="1.1rem" height="1.1rem" />
              View Details
            </button>
            <button class="btn print" onclick={() => printEmployeeReport(result, period, $basicConfig.currencySymbol)}>
              <Icon icon="tabler:printer" width="1.1rem" height="1.1rem" />
              Print
            </button>
          </div>
        {/if}
      </button>
    {/each}
  </div>
{/if}

{#if selectedResult}
  <Dialog bind:open={dialogOpen} title="{selectedResult.employee.name} - Calculation Details" size="large">
    <div class="dialog-summary">
      <div class="summary-header">
        <div class="summary-stat">
          <Icon icon="tabler:clock-hour-4" width="1.2rem" height="1.2rem" />
          <span>{formatHours(selectedResult.totalHours)}</span>
        </div>
        <div class="summary-stat">
          <Icon icon="tabler:calendar-check" width="1.2rem" height="1.2rem" />
          <span>{selectedResult.actualDays} days</span>
        </div>
      </div>
      
      <div class="summary-rows">
        <div class="row base"><span>Base Salary</span><span>{fmt(selectedResult.baseSalary)}</span></div>
        {#each getAppliedRules(selectedResult).bonuses as bonus}
          <div class="row bonus"><span>{bonus.label}</span><span>+{fmt(bonus.value)}</span></div>
        {/each}
        {#if selectedResult.adjustmentTotal !== 0}
          <div class="row adjustment"><span>Adjustments</span><span>{selectedResult.adjustmentTotal > 0 ? '+' : '-'}{fmt(Math.abs(selectedResult.adjustmentTotal))}</span></div>
        {/if}
        <div class="row subtotal"><span>Gross Salary</span><span>{fmt(selectedResult.grossSalary)}</span></div>
        {#each getAppliedRules(selectedResult).deductions as ded}
          <div class="row deduction"><span>{ded.label}</span><span>-{fmt(ded.value)}</span></div>
        {/each}
        <div class="row final"><span>Take-Home</span><span>{fmt(selectedResult.finalSalary)}</span></div>
      </div>
    </div>
    
    <h4 class="steps-title">Calculation Steps</h4>
    <div class="steps">
      {#each buildCalculationSteps(selectedResult) as step, i}
        <div class="step {step.type}">
          <span class="num">{i + 1}</span>
          <div class="step-content">
            <div class="step-head">
              <span class="step-label">{step.label}</span>
              <span class="step-result">{fmt(step.result)}</span>
            </div>
            <div class="step-formulas">
              <span class="formula">{step.formula}</span>
              <span class="calc">{step.formulaWithValues}</span>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </Dialog>
{/if}

<style lang="sass">
  @use "../styles.sass" as *
  
  .report-grid
    @include auto-grid(300px)
    gap: 1rem
    
  .report-card
    @extend %card-base
    display: block
    width: 100%
    text-align: left
    padding: 1rem
    border: 2px solid transparent
    cursor: pointer
    @extend %transition
    
    &:hover
      border-color: var(--primary)
      transform: translateY(-2px)
      box-shadow: 0 6px 20px color-mix(in oklab, var(--primary) 20%, transparent)
      
    &.expanded
      border-color: var(--secondary)
      
    header
      display: grid
      gap: 0.85rem
      
      .header-top
        display: flex
        justify-content: space-between
        align-items: baseline
        gap: 0.75rem
        
        .name
          font-weight: 700
          color: var(--primary)
          font-size: 1.2rem
          margin: 0
          
        .period
          font-size: 0.85rem
          color: var(--fg-muted)
          
      .header-stats
        display: flex
        gap: 1.25rem
        
        .stat
          display: flex
          align-items: center
          gap: 0.4rem
          font-size: 0.9rem
          color: var(--fg-muted)
          
          span
            font-weight: 500
          
      .header-amount
        display: flex
        justify-content: space-between
        align-items: center
        padding: 0.75rem 1rem
        background: var(--success-bg)
        border-radius: 0.6rem
        border-left: 4px solid var(--success)
        
        .label
          font-size: 0.85rem
          color: var(--fg)
          font-weight: 600
          
        .amount
          font-family: 'JetBrains Mono', monospace
          font-weight: 700
          font-size: 1.25rem
          color: var(--success)
        
  .breakdown
    display: grid
    gap: 0.5rem
    margin-top: 1rem
    padding-top: 1rem
    border-top: 2px solid var(--border-muted)
    
  .row
    display: flex
    justify-content: space-between
    align-items: center
    padding: 0.6rem 0.85rem
    border-radius: 0.5rem
    @extend %transition
    
    .row-label
      font-size: 0.9rem
      color: var(--fg)
      font-weight: 500
      
    .row-value
      font-family: 'JetBrains Mono', monospace
      font-weight: 600
      font-size: 0.95rem
      
    &.base
      background: var(--success-bg)
      border-left: 4px solid var(--success)
      
      .row-value
        color: var(--success)
        
    &.bonus
      background: var(--success-bg)
      border-left: 4px solid var(--success)
      
      .row-value
        color: var(--success)
        
    &.deduction
      background: var(--error-bg)
      border-left: 4px solid var(--error)
      
      .row-value
        color: var(--error)
        
    &.adjustment
      background: var(--warning-bg)
      border-left: 4px solid var(--warning)
      
      .row-value
        color: var(--warning)
        
    &.subtotal
      background: var(--surface-medium)
      border-left: 4px solid var(--primary)
      margin-top: 0.35rem
      
      .row-label
        font-weight: 700
        
      .row-value
        font-weight: 700
        color: var(--primary)
        
    &.final
      background: var(--success-bg)
      border: 2px solid var(--success)
      margin-top: 0.5rem
      padding: 0.75rem 1rem
      
      .row-label
        font-weight: 700
        font-size: 1rem
        
      .row-value
        color: var(--success)
        font-size: 1.25rem
        font-weight: 700
      
  .actions
    display: flex
    gap: 0.65rem
    margin-top: 1rem
    
  .btn
    flex: 1
    display: flex
    align-items: center
    justify-content: center
    gap: 0.5rem
    padding: 0.65rem 1rem
    border: none
    border-radius: 0.6rem
    font-weight: 600
    font-size: 0.9rem
    cursor: pointer
    color: white
    @extend %transition
    
    &:hover
      transform: translateY(-2px)
      box-shadow: 0 4px 12px color-mix(in oklab, var(--primary) 25%, transparent)
    
    &.details
      background: var(--primary)
      &:hover
        background: var(--secondary)
        
    &.print
      background: var(--neutral)
      &:hover
        background: color-mix(in oklab, var(--neutral) 80%, black)
        box-shadow: 0 4px 12px color-mix(in oklab, var(--neutral) 25%, transparent)
        
  .empty
    @extend %grid
    place-items: center
    gap: 1.25rem
    padding: 4rem
    color: var(--fg-muted)
    
    p
      margin: 0
      font-size: 1.1rem
      
  .dialog-summary
    margin-bottom: 1.25rem
    
    .summary-header
      display: flex
      gap: 2rem
      padding: 1rem 1.25rem
      background: var(--surface-secondary)
      border-radius: 0.6rem
      margin-bottom: 1rem
      
      .summary-stat
        display: flex
        align-items: center
        gap: 0.5rem
        font-size: 1rem
        color: var(--fg)
        font-weight: 600
        
    .summary-rows
      display: grid
      gap: 0.4rem
      
      .row
        display: flex
        justify-content: space-between
        align-items: center
        padding: 0.5rem 0.85rem
        border-radius: 0.45rem
        font-size: 0.9rem
        
        span:first-child
          color: var(--fg)
          font-weight: 500
          
        span:last-child
          font-family: 'JetBrains Mono', monospace
          font-weight: 600
          
        &.base, &.bonus
          background: var(--success-bg)
          border-left: 4px solid var(--success)
          span:last-child
            color: var(--success)
            
        &.deduction
          background: var(--error-bg)
          border-left: 4px solid var(--error)
          span:last-child
            color: var(--error)
            
        &.adjustment
          background: var(--warning-bg)
          border-left: 4px solid var(--warning)
          span:last-child
            color: var(--warning)
            
        &.subtotal
          background: var(--surface-medium)
          border-left: 4px solid var(--primary)
          margin-top: 0.3rem
          span:first-child
            font-weight: 700
          span:last-child
            color: var(--primary)
            font-weight: 700
            
        &.final
          background: var(--success-bg)
          border: 2px solid var(--success)
          margin-top: 0.4rem
          padding: 0.65rem 0.85rem
          span:first-child
            font-weight: 700
          span:last-child
            color: var(--success)
            font-size: 1.1rem
            font-weight: 700

  .steps-title
    font-size: 1rem
    color: var(--fg)
    margin: 0 0 0.75rem 0
    font-weight: 700

  .steps
    display: grid
    gap: 0.5rem

  .step
    display: grid
    grid-template-columns: 1.5rem 1fr
    gap: 0.65rem
    padding: 0.65rem 0.85rem
    background: var(--surface-secondary)
    border-radius: 0.5rem
    border-left: 4px solid var(--border-muted)
    
    &.base
      border-left-color: var(--info)
      
    &.bonus
      border-left-color: var(--success)
      background: var(--success-bg)
      
    &.deduction
      border-left-color: var(--error)
      background: var(--error-bg)
      
    &.adjustment
      border-left-color: var(--warning)
      background: var(--warning-bg)
      
    &.summary
      border-left-color: var(--primary)
      background: var(--surface-muted)
      
    &.final
      border-left-color: var(--success)
      background: var(--success-bg)
      border: 2px solid var(--success)
      border-left-width: 4px

  .num
    display: grid
    place-items: center
    width: 1.5rem
    height: 1.5rem
    background: var(--border-muted)
    color: var(--fg)
    border-radius: 50%
    font-weight: 700
    font-size: 0.75rem

  .step-content
    display: grid
    gap: 0.45rem
    
  .step-head
    display: flex
    justify-content: space-between
    align-items: center
    gap: 0.65rem
    
    .step-label
      font-weight: 600
      color: var(--fg)
      font-size: 0.9rem
      
    .step-result
      font-family: 'JetBrains Mono', monospace
      font-weight: 700
      color: var(--primary)
      font-size: 0.95rem

  .step-formulas
    display: grid
    gap: 0.3rem

  .formula, .calc
    font-family: 'JetBrains Mono', monospace
    font-size: 0.75rem
    padding: 0.3rem 0.5rem
    border-radius: 0.3rem
    line-height: 1.45

  .formula
    color: var(--fg-muted)
    background: var(--bg-muted)
    
  .calc
    color: var(--primary)
    background: var(--primary-bg)
</style>
