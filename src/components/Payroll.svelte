<script>
  import Wizard from './Wizard.svelte'
  import Rules from './Rules.svelte'
  import Employees from './Employees.svelte'
  import Report from './Report.svelte'
  import Icon from '@iconify/svelte'
  
  import { employees, rules, basicConfig, currentPeriod, attendance, addEmployee, updateEmployee, removeEmployee } from '../stores.js'
  import { generateEmployeeId } from '../core.js'
  import { toasts } from '../lib/toast.js'
  import { confirmDialog } from '../lib/dialog.js'
  import { STEPS, calculateEmployeePayroll } from '../payroll.js'
  
  let currentStep = $state(0)
  let employeeForm = $state({ name: '', gender: 'male', maritalStatus: 'single', monthlySalary: '' })
  let isEditing = $state(false)
  let editingId = $state(null)
  
  // Reactive calculations
  const currentStepData = $derived(STEPS[currentStep])
  
  const results = $derived($employees.map(emp => calculateEmployeePayroll(
    emp, 
    $attendance[$currentPeriod]?.[emp.id] || {}, 
    [], 
    $rules,
    $basicConfig
  )))
  
  // Wizard navigation
  const handleNext = () => {
    if (currentStep < STEPS.length - 1) currentStep++
  }
  
  const handlePrev = () => {
    if (currentStep > 0) currentStep--
  }
  
  // Employee handlers
  const handleEmployeeSave = () => {
    if (!employeeForm.name || !employeeForm.monthlySalary) {
      toasts.error('Name and salary required')
      return
    }
    
    const data = { ...employeeForm, monthlySalary: parseInt(employeeForm.monthlySalary) }
    
    if (isEditing) {
      updateEmployee(editingId, data)
      toasts.success('Employee updated')
    } else {
      addEmployee({ id: generateEmployeeId(), ...data })
      toasts.success('Employee added')
    }
    
    resetEmployeeForm()
  }
  
  const handleEmployeeEdit = (event) => {
    const emp = event.detail
    employeeForm = { ...emp }
    isEditing = true
    editingId = emp.id
  }
  
  const handleEmployeeDelete = async (event) => {
    const id = event.detail
    if (await confirmDialog('Delete employee?')) {
      removeEmployee(id)
      toasts.success('Employee deleted')
    }
  }
  
  const handleEmployeeFormUpdate = (event) => {
    employeeForm = { ...employeeForm, ...event.detail }
  }
  
  const resetEmployeeForm = () => {
    employeeForm = { name: '', gender: 'male', maritalStatus: 'single', monthlySalary: '' }
    isEditing = false
    editingId = null
  }
  
</script>

<Wizard {currentStep} on:next={handleNext} on:prev={handlePrev}>
  
  {#if currentStepData.id === 'config'}
    <Rules basicConfigData={$basicConfig} />
  
  {:else if currentStepData.id === 'employees'}
    <Employees 
      employees={$employees} 
      form={employeeForm} 
      {isEditing}
      on:save={handleEmployeeSave}
      on:edit={handleEmployeeEdit}
      on:delete={handleEmployeeDelete}
      on:update-form={handleEmployeeFormUpdate}
      on:reset-form={resetEmployeeForm}
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