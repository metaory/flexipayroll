<script>
  import Icon from '@iconify/svelte'
  import { employees, attendance, config, currentPeriod } from '../stores.js'
  import { addEmployee, updateEmployee, removeEmployee, setAttendance } from '../stores.js'
  import { formatCurrency, calculateSalaryRecord, generateEmployeeId } from '../core.js'
  import { toasts } from '../lib/toast.js'
  
  let currentStep = $state(0)
  let selectedPeriod = $state($currentPeriod)
  let selectedEmployee = $state(null)
  
  const steps = [
    { title: 'Employees', icon: 'solar:users-group-rounded-bold-duotone', description: 'Manage employee information' },
    { title: 'Attendance', icon: 'solar:calendar-mark-bold-duotone', description: 'Record daily attendance' },
    { title: 'Calculations', icon: 'solar:calculator-bold-duotone', description: 'Calculate salaries' }
  ]
  
  // Employee form
  let employeeForm = $state({
    name: '',
    gender: 'male',
    maritalStatus: 'single',
    monthlySalary: ''
  })
  
  let isEditing = $state(false)
  let editingId = $state(null)
  
  const resetForm = () => {
    employeeForm = { name: '', gender: 'male', maritalStatus: 'single', monthlySalary: '' }
    isEditing = false
    editingId = null
  }
  
  const saveEmployee = () => {
    if (!employeeForm.name || !employeeForm.monthlySalary) {
      toasts.error('Please fill required fields')
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
    
    resetForm()
  }
  
  const editEmployee = (emp) => {
    employeeForm = { ...emp }
    isEditing = true
    editingId = emp.id
  }
  
  const deleteEmployee = (id) => {
    if (confirm('Delete employee?')) {
      removeEmployee(id)
      toasts.success('Employee deleted')
    }
  }
  
  const nextStep = () => {
    if (currentStep < steps.length - 1) currentStep++
  }
  
  const prevStep = () => {
    if (currentStep > 0) currentStep--
  }
</script>

<div class="wizard">
  <header class="wizard-header">
    <div class="step-info">
      <Icon icon={steps[currentStep].icon} width="2.5rem" height="2.5rem" />
      <div>
        <h1>{steps[currentStep].title}</h1>
        <p>{steps[currentStep].description}</p>
      </div>
    </div>
    
    <div class="progress">
      <span>Step {currentStep + 1} of {steps.length}</span>
      <div class="progress-bar">
        <div class="progress-fill" style="width: {((currentStep + 1) / steps.length) * 100}%"></div>
      </div>
    </div>
  </header>
  
  <main class="wizard-content">
    
    {#if currentStep === 0}
      <section class="step-section">
        <h2>Employee Management</h2>
        
        <div class="content-grid">
          <div class="form-panel">
            <h3>{isEditing ? 'Edit' : 'Add'} Employee</h3>
            
            <div class="form-fields">
              <div class="field">
                <label>Name</label>
                <input type="text" bind:value={employeeForm.name} />
              </div>
              
              <div class="field">
                <label>Gender</label>
                <select bind:value={employeeForm.gender}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              
              <div class="field">
                <label>Marital Status</label>
                <select bind:value={employeeForm.maritalStatus}>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                </select>
              </div>
              
              <div class="field">
                <label>Monthly Salary</label>
                <input type="number" bind:value={employeeForm.monthlySalary} />
              </div>
            </div>
            
            <div class="form-actions">
              <button class="btn-primary" onclick={saveEmployee}>
                <Icon icon="solar:check-circle-bold-duotone" width="1rem" height="1rem" />
                {isEditing ? 'Update' : 'Add'}
              </button>
              {#if isEditing}
                <button class="btn-secondary" onclick={resetForm}>Cancel</button>
              {/if}
            </div>
          </div>
          
          <div class="list-panel">
            <h3>Employees ({$employees.length})</h3>
            
            {#if $employees.length === 0}
              <div class="empty-state">
                <Icon icon="solar:users-group-rounded-bold-duotone" width="2rem" height="2rem" />
                <p>No employees yet</p>
              </div>
            {:else}
              <div class="employee-list">
                {#each $employees as emp}
                  <div class="employee-card">
                    <div class="emp-info">
                      <h4>{emp.name}</h4>
                      <p>{emp.gender} • {emp.maritalStatus}</p>
                      <span class="salary">{formatCurrency(emp.monthlySalary)}</span>
                    </div>
                    <div class="emp-actions">
                      <button onclick={() => editEmployee(emp)}>
                        <Icon icon="solar:pen-bold-duotone" width="1rem" height="1rem" />
                      </button>
                      <button onclick={() => deleteEmployee(emp.id)}>
                        <Icon icon="solar:trash-bin-trash-bold-duotone" width="1rem" height="1rem" />
                      </button>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      </section>
      
    {:else if currentStep === 1}
      <section class="step-section">
        <h2>Attendance Recording</h2>
        <p>Simple attendance tracking for {selectedPeriod}</p>
        
        <div class="attendance-info">
          <Icon icon="solar:calendar-mark-bold-duotone" width="3rem" height="3rem" />
          <div>
            <h3>Attendance Module</h3>
            <p>This step will allow recording daily attendance for each employee.</p>
            <p>Implementation includes entry/exit times, holidays, sick days, and leave tracking.</p>
          </div>
        </div>
      </section>
      
    {:else if currentStep === 2}
      <section class="step-section">
        <h2>Salary Calculations</h2>
        
        {#if $employees.length === 0}
          <div class="empty-state">
            <Icon icon="solar:calculator-bold-duotone" width="2rem" height="2rem" />
            <p>No employees to calculate</p>
          </div>
        {:else}
          <div class="calculations-grid">
            {#each $employees as emp}
              <div class="salary-card">
                <div class="emp-header">
                  <h3>{emp.name}</h3>
                  <span>{emp.maritalStatus} • {formatCurrency(emp.monthlySalary)}/month</span>
                </div>
                
                <div class="salary-preview">
                  <div class="calc-line">
                    <span>Base Salary:</span>
                    <span>{formatCurrency(emp.monthlySalary)}</span>
                  </div>
                  <div class="calc-line">
                    <span>Daily Rate:</span>
                    <span>{formatCurrency(emp.monthlySalary / $config.workingDaysPerMonth)}</span>
                  </div>
                  <div class="calc-line">
                    <span>Hourly Rate:</span>
                    <span>{formatCurrency((emp.monthlySalary / $config.workingDaysPerMonth) / $config.workdayHours)}</span>
                  </div>
                  <div class="calc-line final">
                    <span>Estimated Final:</span>
                    <span>{formatCurrency(emp.monthlySalary * 1.3)}</span>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </section>
    {/if}
    
  </main>
  
  <footer class="wizard-footer">
    <button 
      class="btn-secondary" 
      onclick={prevStep}
      disabled={currentStep === 0}
    >
      <Icon icon="solar:arrow-left-bold-duotone" width="1rem" height="1rem" />
      Previous
    </button>
    
    <span>Step {currentStep + 1} of {steps.length}</span>
    
    <button 
      class="btn-primary" 
      onclick={nextStep}
      disabled={currentStep === steps.length - 1}
    >
      Next
      <Icon icon="solar:arrow-right-bold-duotone" width="1rem" height="1rem" />
    </button>
  </footer>
</div>

<style>
  .wizard {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  
  .wizard-header {
    background: color-mix(in oklab, var(--primary) 5%, transparent);
    border-bottom: 1px solid color-mix(in oklab, var(--primary) 15%, transparent);
    padding: 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .step-info {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }
  
  .step-info h1 {
    font-size: 2rem;
    font-weight: 600;
    margin: 0;
    color: var(--primary);
  }
  
  .step-info p {
    margin: 0;
    color: var(--fg-muted);
    font-size: 1.1rem;
  }
  
  .progress {
    text-align: right;
  }
  
  .progress span {
    display: block;
    font-size: 0.9rem;
    color: var(--fg-muted);
    margin-bottom: 0.5rem;
  }
  
  .progress-bar {
    width: 200px;
    height: 8px;
    background: color-mix(in oklab, var(--primary) 20%, transparent);
    border-radius: 4px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: var(--primary);
    transition: width 0.3s ease;
  }
  
  .wizard-content {
    flex: 1;
    max-width: 1200px;
    margin: 0 auto;
    padding: 3rem 2rem;
    width: 100%;
  }
  
  .step-section h2 {
    font-size: 1.8rem;
    margin-bottom: 2rem;
    color: var(--primary);
  }
  
  .content-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
  }
  
  .form-panel,
  .list-panel {
    background: color-mix(in oklab, var(--bg-muted) 30%, transparent);
    padding: 2rem;
    border-radius: 1rem;
    border: 1px solid var(--border);
  }
  
  .form-panel h3,
  .list-panel h3 {
    margin-bottom: 1.5rem;
    color: var(--primary);
  }
  
  .form-fields {
    display: grid;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .field label {
    font-weight: 500;
    color: var(--fg);
  }
  
  .field input,
  .field select {
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    font-size: 1rem;
  }
  
  .form-actions {
    display: flex;
    gap: 1rem;
  }
  
  .employee-list {
    display: grid;
    gap: 1rem;
  }
  
  .employee-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: color-mix(in oklab, var(--secondary) 8%, transparent);
    border-radius: 0.75rem;
    border: 1px solid color-mix(in oklab, var(--secondary) 15%, transparent);
  }
  
  .emp-info h4 {
    margin: 0 0 0.5rem 0;
    color: var(--fg);
  }
  
  .emp-info p {
    margin: 0 0 0.5rem 0;
    font-size: 0.9rem;
    color: var(--fg-muted);
  }
  
  .salary {
    color: var(--success);
    font-weight: 500;
  }
  
  .emp-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .emp-actions button {
    padding: 0.5rem;
    border-radius: 0.5rem;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .emp-actions button:first-child {
    background: color-mix(in oklab, var(--warning) 20%, transparent);
    color: var(--warning);
  }
  
  .emp-actions button:last-child {
    background: color-mix(in oklab, var(--error) 20%, transparent);
    color: var(--error);
  }
  
  .attendance-info {
    display: flex;
    align-items: center;
    gap: 2rem;
    padding: 3rem;
    background: color-mix(in oklab, var(--bg-muted) 30%, transparent);
    border-radius: 1rem;
    border: 1px solid var(--border);
  }
  
  .attendance-info h3 {
    margin: 0 0 1rem 0;
    color: var(--primary);
  }
  
  .attendance-info p {
    margin: 0 0 0.5rem 0;
    color: var(--fg-muted);
    line-height: 1.5;
  }
  
  .calculations-grid {
    display: grid;
    gap: 2rem;
  }
  
  .salary-card {
    background: color-mix(in oklab, var(--bg-muted) 30%, transparent);
    padding: 2rem;
    border-radius: 1rem;
    border: 1px solid var(--border);
  }
  
  .emp-header h3 {
    margin: 0 0 0.5rem 0;
    color: var(--primary);
  }
  
  .emp-header span {
    color: var(--fg-muted);
    font-size: 0.9rem;
  }
  
  .salary-preview {
    margin-top: 1.5rem;
    display: grid;
    gap: 0.75rem;
  }
  
  .calc-line {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid color-mix(in oklab, var(--border) 50%, transparent);
  }
  
  .calc-line.final {
    font-weight: 600;
    color: var(--success);
    border-bottom: 2px solid var(--success);
    margin-top: 1rem;
    padding-top: 1rem;
  }
  
  .empty-state {
    text-align: center;
    padding: 3rem;
    color: var(--fg-muted);
  }
  
  .empty-state p {
    margin: 1rem 0 0 0;
    font-size: 1.1rem;
  }
  
  .wizard-footer {
    background: color-mix(in oklab, var(--bg-muted) 30%, transparent);
    border-top: 1px solid var(--border);
    padding: 1.5rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .btn-primary,
  .btn-secondary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 500;
    transition: all 0.2s ease;
    cursor: pointer;
  }
  
  .btn-primary {
    background: var(--primary);
    color: white;
    border: none;
  }
  
  .btn-primary:hover {
    background: color-mix(in oklab, var(--primary) 90%, black);
  }
  
  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn-secondary {
    background: color-mix(in oklab, var(--secondary) 10%, transparent);
    color: var(--fg);
    border: 1px solid var(--border);
  }
  
  .btn-secondary:hover {
    background: color-mix(in oklab, var(--secondary) 20%, transparent);
  }
  
  .btn-secondary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    .wizard-header {
      flex-direction: column;
      gap: 1rem;
    }
    
    .content-grid {
      grid-template-columns: 1fr;
    }
    
    .wizard-footer {
      flex-direction: column;
      gap: 1rem;
    }
  }
</style>
