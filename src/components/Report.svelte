<script>
  import Icon from '@iconify/svelte'
  import { formatCurrency, formatHours } from '../core.js'
  
  let { results = [], period = '' } = $props()
  
  // Helper function to get applied rules by category
  const getAppliedRules = (result) => {
    const applied = { bonuses: [], deductions: [], adjustments: [] }
    
    Object.entries(result.ruleResults).forEach(([category, rules]) => {
      if (category === 'bonuses' || category === 'deductions' || category === 'adjustments') {
        Object.entries(rules).forEach(([ruleId, ruleData]) => {
          if (ruleData.value > 0) {
            applied[category].push({
              id: ruleId,
              label: ruleData.rule.label,
              value: ruleData.value,
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
            <span>Hours Worked:</span>
            <span>{formatHours(result.totalHours)}</span>
          </div>
          
          <div class="line">
            <span>Base Salary:</span>
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
            <span>Gross Salary:</span>
            <span>{formatCurrency(result.grossSalary)}</span>
          </div>
          
          <div class="line final">
            <span>Take-Home:</span>
            <span class="final-amount">{formatCurrency(result.finalSalary)}</span>
          </div>
        </div>
      </div>
    {/each}
  </div>
{/if}

<style lang="sass">
  @use "../styles.sass" as *
  
  .report-grid
    @extend %grid
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr))
    gap: 2rem
    
  .report-card
    @extend %card-base
    padding: 1.5rem
    
    header
      @extend %flex-between
      margin-bottom: 1.5rem
      padding-bottom: 1rem
      border-bottom: 1px solid var(--border-muted)
      
      h3
        margin: 0
        color: var(--primary)
        
      span
        font-size: 0.875rem
        color: var(--fg-muted)
        
  .summary
    @extend %grid
    gap: 0.75rem
    
  .line
    @extend %flex-between
    padding: 0.5rem 0
    
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
        font-size: 1.1rem
        
    &.final
      border-top: 1px solid var(--border-muted)
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
</style>
