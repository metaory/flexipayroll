<script>
  import Icon from '@iconify/svelte/dist/OfflineIcon.svelte'
  import Dialog from './Dialog.svelte'
  import { formatCurrency, formatHours } from '../core.js'
  import { buildCalculationSteps, getProbationLabel, hasProbationRules, resolveProbation } from '../payroll.js'
  import { PROBATION_BG } from '../probation.js'
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
  const hasAttendanceHours = (result) =>
    (result.ruleResults?.rawOvertimeHours ?? 0) > 0 || (result.ruleResults?.rawUndertimeHours ?? 0) > 0
  const SECTION_LABELS = {
    inputs: 'Rates & inputs',
    attendance: 'Overtime / Undertime',
    base: 'Base salary',
    bonuses: 'Bonuses',
    deductions: 'Deductions',
    adjustment: 'Adjustments',
    summary: 'Gross salary',
    final: 'Take-home'
  }
  const groupStepsBySection = (steps) => {
    const groups = []
    let current = null
    for (const step of steps) {
      const sec = step.section ?? step.type
      if (current !== sec) {
        current = sec
        groups.push({ section: sec, label: SECTION_LABELS[sec] ?? sec, steps: [] })
      }
      groups[groups.length - 1].steps.push(step)
    }
    return groups
  }
  const getAppliedRules = (result) => {
    const applied = { bonuses: [], deductions: [] }
    Object.entries(result.ruleResults).map(([category, rules]) => {
      if (category !== 'bonuses' && category !== 'deductions') return null
      Object.entries(rules).map(([ruleId, ruleData]) => {
        const value = ruleData.finalValue !== undefined ? ruleData.finalValue : ruleData.value
        if (value > 0) {
          const rule = ruleData.rule
          const pct = rule.type === 'percentage_monthly' || rule.type === 'percentage_base'
            ? ` (${(rule.value * 100).toFixed(1)}%)` : ''
          applied[category].push({ id: ruleId, label: rule.label + pct, value, type: rule.type })
        }
        return null
      })
      return null
    })
    return applied
  }
  
  const getCalculationBreakdown = (result) => {
    const applied = getAppliedRules(result)
    return [
      { label: 'Base Salary', value: result.baseSalary, type: 'base', sign: '+' },
      ...(hasAttendanceHours(result) ? [{ label: 'Overtime / Undertime', value: result.attendanceAdjustment, type: 'attendance', sign: result.attendanceAdjustment >= 0 ? '+' : '-' }] : []),
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
      {@const probationKey = resolveProbation(result.employee)}
      <div class="card report-card" class:expanded={isExpanded} class:probation={!!probationKey} style:--probation-bg={probationKey ? PROBATION_BG[probationKey] : undefined} role="button" tabindex="0" onclick={() => { expandedCards = { ...expandedCards, [employeeId]: !isExpanded } }} onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (expandedCards = { ...expandedCards, [employeeId]: !isExpanded })}>
        <div class="top">
          <h3>{result.employee.name}</h3>
          <span class="top-center">
            {#if getProbationLabel(result.employee)}
              <span class="probation-badge" style:--probation-bg={PROBATION_BG[probationKey]} class:has-rules={hasProbationRules(result.employee, probationKey)}>
                {#if hasProbationRules(result.employee, probationKey)}
                  <Icon icon="tabler:list-check" width="0.75rem" height="0.75rem" />
                {/if}
                {getProbationLabel(result.employee)}
              </span>
            {/if}
          </span>
          <span class="period">{period}</span>
        </div>
        <div class="stats">
          <span><Icon icon="tabler:calendar-check" width="1.1rem" height="1.1rem" />{result.actualDays} days</span>
          <span><Icon icon="tabler:clock-hour-4" width="1.1rem" height="1.1rem" />{formatHours(result.totalHours)}</span>
        </div>
        <div class="amount">
          <span>Take-Home Salary</span>
          <b>{fmt(result.finalSalary || 0)}</b>
        </div>
        {#if !isExpanded}
          <button class="quick-print" onclick={(e) => { e.stopPropagation(); printEmployeeReport(result, period, $basicConfig.currencySymbol, $basicConfig.organizationName) }} title="Print">
            <Icon icon="tabler:printer" width="1.4rem" height="1.2rem" />
          </button>
        {/if}
        {#if isExpanded}
          <div class="breakdown">
            {#each getCalculationBreakdown(result) as item}
              <div class="row {item.type}">
                <span class="row-label">{item.label}</span>
                <span class="row-value">{item.sign}{fmt(Math.abs(item.value))}</span>
              </div>
            {/each}
          </div>
          <div class="actions">
            <button class="btn details" onclick={(e) => { e.stopPropagation(); openCalculationDialog(result) }}>
              <Icon icon="tabler:calculator" width="1.1rem" height="1.1rem" />
              View Details
            </button>
            <button class="btn print" onclick={(e) => { e.stopPropagation(); printEmployeeReport(result, period, $basicConfig.currencySymbol, $basicConfig.organizationName) }}>
              <Icon icon="tabler:printer" width="1.1rem" height="1.1rem" />
              Print
            </button>
          </div>
        {/if}
      </div>
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
        {#if hasAttendanceHours(selectedResult)}
          <div class="row attendance"><span>Overtime / Undertime</span><span>{selectedResult.attendanceAdjustment >= 0 ? '+' : '-'}{fmt(Math.abs(selectedResult.attendanceAdjustment))}</span></div>
        {/if}
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
      {#each groupStepsBySection(buildCalculationSteps(selectedResult)) as group}
        <div class="step-group">
          <h5 class="section-head">{group.label}</h5>
          <div class="section-steps">
            {#each group.steps as step, i}
              <div class="step {step.type}">
                <span class="num">{i + 1}</span>
                <div class="step-content">
                  <div class="step-head">
                    <span class="step-label">{step.label}</span>
                    <span class="step-result">{fmt(step.result)}</span>
                  </div>
                  <div class="step-formulas">
                    <span class="formula-label">Formula</span>
                    <span class="formula">{step.formula ?? '—'}</span>
                    <span class="calc-label">Calculation</span>
                    <span class="calc">{step.formulaWithValues ?? '—'}</span>
                  </div>
                  {#if step.explanation}
                    <p class="step-explanation">{step.explanation}</p>
                  {/if}
                </div>
              </div>
            {/each}
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
    gap: 0.75rem
    
  .report-card
    @extend %card-base
    @include card-accent
    position: relative
    display: block
    width: 100%
    text-align: left
    padding: 0.75rem
    cursor: pointer

    &.expanded
      border-color: var(--secondary)

    &.probation
      border-color: color-mix(in oklab, var(--probation-bg) 50%, var(--border-muted))
      background: color-mix(in oklab, var(--probation-bg) 12%, var(--surface))

      &:hover,
      &.expanded
        border-color: var(--probation-bg)
        box-shadow: 0 6px 20px color-mix(in oklab, var(--probation-bg) 28%, transparent)
      
    .top
      display: grid
      grid-template-columns: 1fr auto 1fr
      align-items: center
      gap: 0.5rem
      h3
        font-weight: 700
        font-size: 1.2rem
        margin: 0
        justify-self: start
        @extend %transition
      .top-center
        justify-self: center
      .probation-badge
        display: inline-flex
        align-items: center
        gap: 0.2rem
        padding: 0.1rem 0.35rem
        background: color-mix(in oklab, var(--probation-bg) 18%, var(--surface))
        border: 1px solid color-mix(in oklab, var(--probation-bg) 50%, transparent)
        color: color-mix(in oklab, var(--probation-bg) 80%, var(--fg))
        border-radius: 0.25rem
        font-size: 0.65rem
        font-weight: 600
        &.has-rules
          background: var(--probation-bg)
          border-color: var(--probation-bg)
          color: var(--bg)
      .period
        font-size: 0.85rem
        color: var(--fg-muted)
        justify-self: end
        
    .stats
      display: flex
      gap: 0.75rem
      margin: 0.5rem 0
      span
        display: flex
        align-items: center
        gap: 0.4rem
        font-size: 0.9rem
        font-weight: 500
        color: var(--fg-muted)
        
    .amount
      display: flex
      justify-content: space-between
      align-items: center
      padding: 0.5rem 0.75rem
      background: var(--success-bg)
      border-radius: 0 10px 10px 0;
      border-left: 4px solid var(--success)
      span
        font-size: 0.85rem
        color: var(--fg)
        font-weight: 600
      b
        font-family: 'JetBrains Mono', monospace
        font-weight: 700
        font-size: 1.25rem
        color: var(--success)
          
  .quick-print
    position: absolute
    top: 0.5rem
    right: 0.5rem
    opacity: 0
    padding: 0.65rem
    border: none
    border-radius: 0.5rem
    background: var(--neutral)
    color: white
    cursor: pointer
    @extend %transition
    &:hover
      background: color-mix(in oklab, var(--neutral) 80%, black)
      
  .report-card:hover .quick-print
    opacity: 1
        
  .breakdown
    display: grid
    gap: 0.4rem
    margin-top: 0.6rem
    padding-top: 0.6rem
    border-top: 2px solid var(--border-muted)
    
  .row
    display: flex
    justify-content: space-between
    align-items: center
    padding: 0.6rem 0.85rem
    border-radius: 0 10px 10px 0;
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

    &.attendance
      background: var(--info-bg)
      border-left: 4px solid var(--info)

      .row-value
        color: var(--info)
        
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
      background: var(--surface-medium)
      color: var(--fg)
      border-radius: 0.6rem
      margin-bottom: 1rem
      border: 1px solid var(--border-muted)
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
        border-radius: 0 0.4rem 0.4rem 0
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

        &.attendance
          background: var(--info-bg)
          border-left: 4px solid var(--info)
          span:last-child
            color: var(--info)
            
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
    display: flex
    flex-direction: column
    gap: 1rem
  .step-group
    display: flex
    flex-direction: column
    gap: 0.5rem
  .section-head
    font-size: 0.85rem
    font-weight: 700
    color: var(--fg)
    margin: 0
    padding: 0.35rem 0
    border-bottom: 2px solid var(--border-muted)
    text-transform: uppercase
    letter-spacing: 0.04em
  .section-steps
    display: grid
    gap: 0.5rem
  .step
    display: grid
    grid-template-columns: 1.5rem 1fr
    gap: 0.65rem
    padding: 0.75rem 1rem
    background: var(--surface-secondary)
    color: var(--fg)
    border-radius: 0.5rem
    border-left: 4px solid var(--primary)
    border: 1px solid var(--border-muted)
    border-left-width: 4px
    &.base
      border-left-color: var(--info)
    &.bonus
      border-left-color: var(--success)
      background: var(--success-bg)
      color: var(--fg)
    &.deduction
      border-left-color: var(--error)
      background: var(--error-bg)
      color: var(--fg)
    &.adjustment
      border-left-color: var(--warning)
      background: var(--warning-bg)
      color: var(--fg)
    &.attendance
      border-left-color: var(--info)
    &.summary
      border-left-color: var(--primary)
      background: var(--surface-medium)
      color: var(--fg)
    &.final
      border-left-color: var(--success)
      background: var(--success-bg)
      color: var(--fg)
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
    gap: 0.5rem
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
    grid-template-columns: auto 1fr
    gap: 0.3rem 0.75rem
    align-items: baseline
  .formula-label, .calc-label
    font-size: 0.7rem
    font-weight: 600
    color: var(--fg-muted)
    text-transform: uppercase
    letter-spacing: 0.03em
  .formula, .calc
    font-family: 'JetBrains Mono', monospace
    font-size: 0.8rem
    padding: 0.3rem 0.5rem
    border-radius: 0.3rem
    line-height: 1.45
  .formula
    color: var(--fg)
    background: var(--bg-muted)
  .calc
    color: var(--primary)
    background: var(--primary-bg)
  .step-explanation
    margin: 0
    font-size: 0.8rem
    color: var(--fg-muted)
    line-height: 1.4
</style>
