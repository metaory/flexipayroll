<!--
  Setup Component - Business configuration wizard
  Clean, functional, dynamic approach
-->
<script>
  import Wizard from './Wizard.svelte'
  import Icon from '@iconify/svelte'
  import { ICONS } from '../lib/icons.js'
  import { t } from '../lib/i18n.js'
  import { config, updateConfig } from '../stores.js'
  import { toasts } from '../lib/toast.js'
  
  let currentStep = $state(0)
  let formData = $state({ ...$config })
  let hasChanges = $state(false)
  
  const steps = [
    {
      title: t.workingTime,
      description: t.workingTimeDescription,
      icon: ICONS.clock
    },
    {
      title: t.bonusStructure, 
      description: t.bonusStructureDescription,
      icon: ICONS.star
    },
    {
      title: t.deductions,
      description: t.deductionsDescription,
      icon: ICONS.shield
    },
    {
      title: t.reviewSave,
      description: t.reviewSaveDescription,
      icon: ICONS.check
    }
  ]
  
  // Track changes
  $effect(() => {
    hasChanges = JSON.stringify(formData) !== JSON.stringify($config)
  })
  
  const handleComplete = () => {
    updateConfig(formData)
    toasts.success(t.configurationSaved)
    hasChanges = false
  }
  
  const resetToDefaults = () => {
    formData = {
      workdayHours: 8,
      workingDaysPerMonth: 22,
      bonusE: 5,
      bonusS: 2.5,
      bonusK: 100000,
      bonusM: 200000,
      bonusT: 150000,
      insuranceRate: 0.07
    }
  }
</script>

<Wizard 
  {steps}
  bind:currentStep
  canGoNext={true}
  title={t.businessConfiguration}
  description={t.setupDescription}
  onComplete={handleComplete}
>
  {#snippet children(step, stepData)}
    
    <!-- Working Time Configuration -->
    {#if step === 0}
      <div class="config-section">
        <h3>
          <Icon icon={ICONS.clock} width="1.5rem" height="1.5rem" />
          {t.workingTime}
        </h3>
        
        <div class="form-group-horizontal">
          <div class="form-group-stacked">
            <label for="workdayHours">
              <Icon icon={ICONS.clock} width="1rem" height="1rem" />
              {t.workdayHours}
            </label>
            <input 
              id="workdayHours"
              type="number" 
              bind:value={formData.workdayHours}
              min="1" 
              max="24"
            />
            <small>{t.workdayHoursDescription}</small>
          </div>
          
          <div class="form-group-stacked">
            <label for="workingDays">
              <Icon icon={ICONS.calendar} width="1rem" height="1rem" />
              {t.workingDaysPerMonth}
            </label>
            <input 
              id="workingDays"
              type="number" 
              bind:value={formData.workingDaysPerMonth}
              min="1" 
              max="31"
            />
            <small>{t.workingDaysPerMonthDescription}</small>
          </div>
        </div>
        
        <div class="calculation-example">
          <h4>{t.howWorkingTimeAffectsSalary}</h4>
          <dl>
            <dt>{t.dailyRateCalculation}</dt>
            <dd>{t.dailyRateFormula}</dd>
            <dt>{t.hourlyRateCalculation}</dt>
            <dd>{t.hourlyRateFormula}</dd>
          </dl>
        </div>
      </div>
    
    <!-- Bonus Configuration -->
    {:else if step === 1}
      <div class="config-section">
        <h3>
          <Icon icon={ICONS.star} width="1.5rem" height="1.5rem" />
          {t.bonusStructure}
        </h3>
        
        <div class="bonus-grid">
          <!-- Daily Rate Bonuses -->
          <div class="bonus-group">
            <h4>{t.dailyRateBonuses}</h4>
            <div class="form-group-stacked">
              <label for="bonusE">
                <Icon icon={ICONS.star} width="1rem" height="1rem" />
                {t.bonusE}
              </label>
              <input 
                id="bonusE"
                type="number" 
                bind:value={formData.bonusE}
                min="0" 
                step="0.5"
              />
              <small>{t.bonusEDescription}</small>
            </div>
            
            <div class="form-group-stacked">
              <label for="bonusS">
                <Icon icon={ICONS.star} width="1rem" height="1rem" />
                {t.bonusS}
              </label>
              <input 
                id="bonusS"
                type="number" 
                bind:value={formData.bonusS}
                min="0" 
                step="0.5"
              />
              <small>{t.bonusSDescription}</small>
            </div>
          </div>
          
          <!-- Fixed Amount Bonuses -->
          <div class="bonus-group">
            <h4>{t.fixedAmountBonuses}</h4>
            <div class="form-group-stacked">
              <label for="bonusK">
                <Icon icon={ICONS.wadMoney} width="1rem" height="1rem" />
                {t.bonusK}
              </label>
              <input 
                id="bonusK"
                type="number" 
                bind:value={formData.bonusK}
                min="0"
              />
              <small>{t.bonusKDescription}</small>
            </div>
            
            <div class="form-group-stacked">
              <label for="bonusM">
                <Icon icon={ICONS.wadMoney} width="1rem" height="1rem" />
                {t.bonusM}
              </label>
              <input 
                id="bonusM"
                type="number" 
                bind:value={formData.bonusM}
                min="0"
              />
              <small>{t.bonusMDescription}</small>
            </div>
            
            <div class="form-group-stacked">
              <label for="bonusT">
                <Icon icon={ICONS.heart} width="1rem" height="1rem" />
                {t.bonusT}
              </label>
              <input 
                id="bonusT"
                type="number" 
                bind:value={formData.bonusT}
                min="0"
              />
              <small>{t.bonusTDescription}</small>
            </div>
          </div>
        </div>
      </div>
    
    <!-- Deductions Configuration -->
    {:else if step === 2}
      <div class="config-section">
        <h3>
          <Icon icon={ICONS.shield} width="1.5rem" height="1.5rem" />
          {t.deductions}
        </h3>
        
        <div class="form-group-stacked">
          <label for="insuranceRate">
            <Icon icon={ICONS.shield} width="1rem" height="1rem" />
            {t.insuranceDeductionRate}
          </label>
          <input 
            id="insuranceRate"
            type="number" 
            bind:value={formData.insuranceRate}
            min="0" 
            max="1"
            step="0.01"
          />
          <small>{t.insuranceDeductionRateDescription}</small>
        </div>
        
        <div class="calculation-example">
          <h4>{t.howDeductionsAreApplied}</h4>
          <dl>
            <dt>{t.insuranceDeductionProcess}</dt>
            <dd>{t.insuranceDeductionFormula}</dd>
            <dt>{t.finalSalaryCalculation}</dt>
            <dd>{t.finalSalaryFormula}</dd>
          </dl>
        </div>
      </div>
    
    <!-- Review & Save -->
    {:else if step === 3}
      <div class="config-section">
        <h3>
          <Icon icon={ICONS.check} width="1.5rem" height="1.5rem" />
          {t.configurationSummary}
        </h3>
        
        {#if hasChanges}
          <div class="unsaved-changes">
            <div class="warning-message">
              <Icon icon={ICONS.warning} width="1.25rem" height="1.25rem" />
              <span>{t.unsavedChanges}</span>
            </div>
            <div class="save-actions">
              <button type="button" class="secondary" onclick={resetToDefaults}>
                <Icon icon={ICONS.refresh} width="1rem" height="1rem" />
                {t.reset}
              </button>
            </div>
          </div>
        {:else}
          <div class="save-status success">
            <Icon icon={ICONS.check} width="1.25rem" height="1.25rem" />
            <span>{t.configurationUpToDate}</span>
          </div>
        {/if}
        
        <div class="summary-grid">
          <dl>
            <dt>{t.workingTimeSummary}</dt>
            <dd>{formData.workdayHours}h/day, {formData.workingDaysPerMonth} days/month</dd>
            
            <dt>{t.bonusesSummary}</dt>
            <dd>E: {formData.bonusE}x, S: {formData.bonusS}x, K: {formData.bonusK}, M: {formData.bonusM}, T: {formData.bonusT}</dd>
            
            <dt>{t.deductionsSummary}</dt>
            <dd>{(formData.insuranceRate * 100).toFixed(1)}% insurance</dd>
          </dl>
        </div>
      </div>
    {/if}
    
  {/snippet}
</Wizard>

<style>
  .config-section {
    background: color-mix(in oklab, var(--primary) 4%, transparent);
    border: 1px solid color-mix(in oklab, var(--primary) 10%, transparent);
    border-radius: 1rem;
    padding: 2rem;
  }
  
  .config-section h3 {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid color-mix(in oklab, var(--primary) 15%, transparent);
    color: var(--primary);
  }
  
  .form-group-horizontal {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .form-group-stacked {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    background: color-mix(in oklab, var(--bg-muted) 20%, transparent);
    border-radius: 0.75rem;
    border: 1px solid color-mix(in oklab, var(--primary) 8%, transparent);
    transition: all 0.2s ease;
  }
  
  .form-group-stacked:hover {
    background: color-mix(in oklab, var(--bg-muted) 30%, transparent);
    border-color: color-mix(in oklab, var(--primary) 15%, transparent);
  }
  
  .form-group-stacked label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    color: var(--fg);
    margin-bottom: 0.25rem;
  }
  
  .form-group-stacked input {
    padding: 0.75rem;
    background: color-mix(in oklab, var(--secondary) 12%, transparent);
    border: 1px solid color-mix(in oklab, var(--primary) 8%, transparent);
    border-radius: 0.5rem;
    transition: all 0.2s ease;
  }
  
  .form-group-stacked input:focus {
    background: color-mix(in oklab, var(--primary) 20%, transparent);
    border-color: color-mix(in oklab, var(--primary) 30%, transparent);
    outline: none;
  }
  
  .form-group-stacked small {
    color: var(--fg-muted);
    font-size: 0.8rem;
    line-height: 1.4;
  }
  
  .bonus-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
  }
  
  .bonus-group {
    padding: 1.5rem;
    background: color-mix(in oklab, var(--secondary) 8%, transparent);
    border-radius: 1rem;
    border: 1px solid color-mix(in oklab, var(--secondary) 15%, transparent);
  }
  
  .bonus-group h4 {
    margin-bottom: 1rem;
    color: var(--secondary);
  }
  
  .calculation-example {
    margin-top: 2rem;
    padding: 1.5rem;
    background: color-mix(in oklab, var(--info) 10%, transparent);
    border-radius: 1rem;
    border: 1px solid color-mix(in oklab, var(--info) 20%, transparent);
  }
  
  .calculation-example h4 {
    margin-bottom: 1rem;
    color: var(--info);
  }
  
  .calculation-example dl {
    display: grid;
    gap: 0.75rem;
  }
  
  .calculation-example dt {
    font-weight: 600;
    color: var(--fg);
  }
  
  .calculation-example dd {
    color: var(--fg-muted);
    margin-left: 1rem;
  }
  
  .summary-grid {
    margin-top: 1.5rem;
  }
  
  .summary-grid dl {
    display: grid;
    gap: 1rem;
  }
  
  .summary-grid dt {
    font-weight: 600;
    color: var(--primary);
  }
  
  .summary-grid dd {
    color: var(--fg);
    margin-left: 1rem;
  }
  
  .unsaved-changes {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background: color-mix(in oklab, var(--warning) 15%, transparent);
    color: var(--warning);
    border-radius: 0.75rem;
    margin-bottom: 1.5rem;
    border: 1px solid color-mix(in oklab, var(--warning) 25%, transparent);
  }
  
  .warning-message {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 500;
  }
  
  .save-actions {
    display: flex;
    gap: 0.75rem;
  }
  
  .save-status {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-radius: 0.75rem;
    margin-bottom: 1.5rem;
    font-weight: 500;
    border: 1px solid;
  }
  
  .save-status.success {
    background: color-mix(in oklab, var(--success) 15%, transparent);
    color: var(--success);
    border-color: color-mix(in oklab, var(--success) 25%, transparent);
  }
  
  @media (max-width: 768px) {
    .form-group-horizontal {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    
    .bonus-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    
    .unsaved-changes {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }
  }
</style>