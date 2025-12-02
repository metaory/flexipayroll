<script>
  import Wizard from './Wizard.svelte'
  import Rules from './Rules.svelte'
  import Employees from './Employees.svelte'
  import Attendance from './Attendance.svelte'
  import Adjustments from './Adjustments.svelte'
  import Report from './Report.svelte'
  import Icon from '@iconify/svelte'
  
  import { employees, rules, basicConfig, currentPeriod, attendanceItems, adjustments, wizardStep } from '../stores.js'
  import { STEPS, calculateEmployeePayroll } from '../payroll.js'
  
  // Reactive calculations
  const currentStepData = $derived(STEPS[$wizardStep])
  
  const results = $derived($employees.map(emp => calculateEmployeePayroll(
    emp, 
    $attendanceItems[$currentPeriod]?.[emp.id] || [],
    $adjustments[$currentPeriod]?.[emp.id] || [],
    $rules,
    $basicConfig
  )))
  
  // Wizard navigation
  const handleNext = () => {
    if ($wizardStep < STEPS.length - 1) wizardStep.update(s => s + 1)
  }
  
  const handlePrev = () => {
    if ($wizardStep > 0) wizardStep.update(s => s - 1)
  }

  const KEYMAP = {
    ' ': handleNext,
    ArrowRight: handleNext,
    ArrowLeft: handlePrev,
    '1': () => wizardStep.set(0),
    '2': () => wizardStep.set(1),
    '3': () => wizardStep.set(2),
    '4': () => wizardStep.set(3),
    '5': () => wizardStep.set(4)
  }

  const handleKey = (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
    KEYMAP[e.key]?.()
  }
</script>

<svelte:window onkeydown={handleKey} />

<Wizard currentStep={$wizardStep} onNext={handleNext} onPrev={handlePrev}>
  
  {#if currentStepData.id === 'config'}
    <Rules basicConfigData={$basicConfig} />
  
  {:else if currentStepData.id === 'employees'}
    <Employees employees={$employees} />
  
  {:else if currentStepData.id === 'attendance'}
    <Attendance 
      employees={$employees} 
      period={$currentPeriod}
    />
  
  {:else if currentStepData.id === 'adjustments'}
    <Adjustments 
      employees={$employees} 
      period={$currentPeriod}
    />
  
  {:else if currentStepData.id === 'report'}
    <Report {results} period={$currentPeriod} />
    
  {:else}
    <div class="coming-soon">
      <Icon icon={currentStepData.icon} width="3rem" height="3rem" />
      <p>Feature coming soon</p>
    </div>
  {/if}
  
</Wizard>

<style lang="sass">
  @use "../styles.sass" as *
  
  .coming-soon
    @extend %grid
    place-items: center
    gap: 1rem
    padding: 3rem
    text-align: center
    color: var(--fg-muted)
    
    p
      margin: 0
</style>