<script>
  import Icon from '@iconify/svelte'
  import { employees, attendance, config, currentPeriod, updateConfig, addEmployee, updateEmployee, removeEmployee } from '../stores.js'
  import { generateEmployeeId, formatCurrency, formatHours } from '../core.js'
  import { toasts } from '../lib/toast.js'
  import { STEPS, calculateEmployeePayroll, getStepValue, CONFIG_FIELDS, EMPLOYEE_FIELDS } from '../payroll.js'
  
  let currentStep = $state(0)
  let wizardConfig = $state({ ...$config })
  let adjustments = $state({})
  let employeeForm = $state({ name: '', gender: 'male', maritalStatus: 'single', monthlySalary: '' })
  let isEditing = $state(false)
  let editingId = $state(null)
  
  // Reactive calculations
  const results = $derived($employees.map(emp => calculateEmployeePayroll(
    emp, 
    $attendance[$currentPeriod]?.[emp.id] || {}, 
    adjustments[emp.id] || [], 
    wizardConfig
  )))
  
  const currentStepData = $derived(STEPS[currentStep])
  
  // Actions
  const nextStep = () => {
    if (currentStep === 0) updateConfig(wizardConfig)
    if (currentStep < STEPS.length - 1) currentStep++
  }
  
  const prevStep = () => {
    if (currentStep > 0) currentStep--
  }
  
  const saveEmployee = () => {
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
    
    employeeForm = { name: '', gender: 'male', maritalStatus: 'single', monthlySalary: '' }
    isEditing = false
    editingId = null
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
  
  const addAdjustment = (empId) => {
    adjustments[empId] = [...(adjustments[empId] || []), { id: Date.now(), description: '', amount: 0 }]
    adjustments = { ...adjustments }
  }
  
  const removeAdjustment = (empId, adjId) => {
    adjustments[empId] = adjustments[empId].filter(adj => adj.id !== adjId)
    adjustments = { ...adjustments }
  }
</script>

<main class="wizard">
  <header class="header">
    <div class="step-info">
      <Icon icon={currentStepData.icon} width="2.5rem" height="2.5rem" />
      <div>
        <h1>{currentStepData.title}</h1>
        <p>{currentStepData.formula || `Step ${currentStep + 1} of ${STEPS.length}`}</p>
      </div>
    </div>
    
    <div class="progress">
      <span>{currentStep + 1}/{STEPS.length}</span>
      <div class="progress-bar">
        <div class="fill" style="width: {((currentStep + 1) / STEPS.length) * 100}%"></div>
      </div>
    </div>
  </header>

  <section class="content" data-step={currentStepData.type}>
    
    {#if currentStepData.id === 'config'}
      <div class="config-grid">
        {#each CONFIG_FIELDS as field}
          <label class="field">
            <span>{field.label}</span>
            <input {...field} bind:value={wizardConfig[field.key]} />
          </label>
        {/each}
      </div>
    
    {:else if currentStepData.id === 'employees'}
      <div class="employee-grid">
        <div class="form">
          <h3>{isEditing ? 'Edit' : 'Add'} Employee</h3>
          {#each EMPLOYEE_FIELDS as field}
            <label class="field">
              <span>{field.label}</span>
              {#if field.type === 'select'}
                <select bind:value={employeeForm[field.key]}>
                  {#each field.options as option}
                    <option value={option.value}>{option.label}</option>
                  {/each}
                </select>
              {:else}
                <input type={field.type} bind:value={employeeForm[field.key]} required={field.required} />
              {/if}
            </label>
          {/each}
          
          <div class="actions">
            <button class="primary" onclick={saveEmployee}>
              <Icon icon="solar:check-circle-bold-duotone" width="1rem" height="1rem" />
              {isEditing ? 'Update' : 'Add'}
            </button>
            {#if isEditing}
              <button class="secondary" onclick={() => { isEditing = false; editingId = null; employeeForm = { name: '', gender: 'male', maritalStatus: 'single', monthlySalary: '' } }}>
                Cancel
              </button>
            {/if}
          </div>
        </div>
        
        <div class="list">
          <h3>Employees ({$employees.length})</h3>
          {#if $employees.length === 0}
            <div class="empty">
              <Icon icon="solar:users-group-rounded-bold-duotone" width="2rem" height="2rem" />
              <p>No employees yet</p>
            </div>
          {:else}
            <div class="employee-list">
              {#each $employees as emp}
                <div class="employee-card">
                  <div class="info">
                    <h4>{emp.name}</h4>
                    <p>{emp.gender} • {emp.maritalStatus}</p>
                    <span class="salary">{formatCurrency(emp.monthlySalary)}</span>
                  </div>
                  <div class="actions">
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
    
    {:else if currentStepData.type === 'calc'}
      {#if $employees.length === 0}
        <div class="empty">
          <Icon icon={currentStepData.icon} width="3rem" height="3rem" />
          <p>No employees to calculate</p>
        </div>
      {:else}
        <div class="calc-grid">
          {#each results as result}
            {@const stepData = getStepValue(currentStepData, result, wizardConfig)}
            <div class="calc-card">
              <h3>{result.employee.name}</h3>
              
              {#if currentStepData.formula}
                <div class="formula">{currentStepData.formula}</div>
              {/if}
              
              <div class="calc-steps">
                {#each Object.entries(stepData) as [key, value]}
                  {#if key !== 'output'}
                    <div class="step">
                      <span class="label">{key}:</span>
                      <span class="value">
                        {typeof value === 'number' ? formatCurrency(value) : value}
                      </span>
                    </div>
                  {/if}
                {/each}
                
                <div class="result">
                  <span class="label">Result:</span>
                  <span class="value">{formatCurrency(stepData.output || 0)}</span>
                </div>
              </div>
              
              {#if currentStepData.config}
                <div class="config-edit">
                  {#each Array.isArray(currentStepData.config) ? currentStepData.config : [currentStepData.config] as configKey}
                    <label>
                      <span>{configKey}:</span>
                      <input type="number" bind:value={wizardConfig[configKey]} />
                    </label>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    
    {:else if currentStepData.id === 'adjustments'}
      {#if $employees.length === 0}
        <div class="empty">
          <Icon icon="solar:tuning-2-bold-duotone" width="3rem" height="3rem" />
          <p>No employees to adjust</p>
        </div>
      {:else}
        <div class="adj-grid">
          {#each $employees as emp}
            <div class="adj-card">
              <h3>{emp.name}</h3>
              
              <div class="adjustments">
                {#if adjustments[emp.id]?.length}
                  {#each adjustments[emp.id] as adj}
                    <div class="adj-item">
                      <input type="text" bind:value={adj.description} placeholder="Description" />
                      <input type="number" bind:value={adj.amount} placeholder="Amount" />
                      <button onclick={() => removeAdjustment(emp.id, adj.id)}>
                        <Icon icon="solar:trash-bin-trash-bold-duotone" width="1rem" height="1rem" />
                      </button>
                    </div>
                  {/each}
                {:else}
                  <p class="no-adj">No adjustments</p>
                {/if}
                
                <button class="add-adj" onclick={() => addAdjustment(emp.id)}>
                  <Icon icon="solar:add-circle-bold-duotone" width="1rem" height="1rem" />
                  Add Adjustment
                </button>
              </div>
              
              <div class="total">
                Total: {formatCurrency((adjustments[emp.id] || []).reduce((sum, adj) => sum + (adj.amount || 0), 0))}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    
    {:else if currentStepData.id === 'report'}
      {#if $employees.length === 0}
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
                <span>Payslip - {$currentPeriod}</span>
              </header>
              
              <div class="summary">
                <div class="line">
                  <span>Hours Worked:</span>
                  <span>{formatHours(result.totalHours)}</span>
                </div>
                <div class="line">
                  <span>Gross Salary:</span>
                  <span>{formatCurrency(result.grossSalary)}</span>
                </div>
                <div class="line">
                  <span>Insurance:</span>
                  <span>-{formatCurrency(result.insuranceDeduction)}</span>
                </div>
                <div class="line final">
                  <span>Take-Home:</span>
                  <span>{formatCurrency(result.finalSalary)}</span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    
    {:else}
      <div class="empty">
        <Icon icon={currentStepData.icon} width="3rem" height="3rem" />
        <p>Attendance module coming soon</p>
      </div>
    {/if}
  </section>

  <footer class="footer">
    <button class="secondary" onclick={prevStep} disabled={currentStep === 0}>
      <Icon icon="solar:arrow-left-bold-duotone" width="1rem" height="1rem" />
      Previous
    </button>
    
    <span>{currentStep + 1} of {STEPS.length}</span>
    
    <button class="primary" onclick={nextStep} disabled={currentStep === STEPS.length - 1}>
      Next
      <Icon icon="solar:arrow-right-bold-duotone" width="1rem" height="1rem" />
    </button>
  </footer>
</main>

<style>
  .wizard {
    display: grid;
    grid-template-rows: auto 1fr auto;
    min-height: 100vh;
  }
  
  .header {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 2rem;
    padding: 2rem;
    background: color-mix(in oklab, var(--primary) 5%, transparent);
    border-bottom: 1px solid var(--border);
  }
  
  .step-info {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 1.5rem;
  }
  
  .step-info h1 {
    font-size: 2rem;
    margin: 0;
    color: var(--primary);
  }
  
  .step-info p {
    margin: 0;
    color: var(--fg-muted);
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
  
  .fill {
    height: 100%;
    background: var(--primary);
    transition: width 0.3s ease;
  }
  
  .content {
    padding: 3rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }
  
  .config-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
  }
  
  .employee-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
  }
  
  .form, .list {
    background: color-mix(in oklab, var(--bg-muted) 30%, transparent);
    padding: 2rem;
    border-radius: 1rem;
    border: 1px solid var(--border);
  }
  
  .form h3, .list h3 {
    margin: 0 0 1.5rem 0;
    color: var(--primary);
  }
  
  .field {
    display: grid;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .field span {
    font-weight: 500;
    color: var(--fg);
  }
  
  .field input, .field select {
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    font-size: 1rem;
  }
  
  .actions {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 1rem;
    margin-top: 1.5rem;
  }
  
  .employee-list {
    display: grid;
    gap: 1rem;
  }
  
  .employee-card {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    padding: 1rem;
    background: color-mix(in oklab, var(--secondary) 8%, transparent);
    border-radius: 0.75rem;
    border: 1px solid color-mix(in oklab, var(--secondary) 15%, transparent);
  }
  
  .employee-card .info h4 {
    margin: 0 0 0.5rem 0;
    color: var(--fg);
  }
  
  .employee-card .info p {
    margin: 0 0 0.5rem 0;
    font-size: 0.9rem;
    color: var(--fg-muted);
  }
  
  .salary {
    color: var(--success);
    font-weight: 500;
  }
  
  .employee-card .actions {
    display: grid;
    grid-template-columns: auto auto;
    gap: 0.5rem;
    margin: 0;
  }
  
  .employee-card .actions button {
    padding: 0.5rem;
    border-radius: 0.5rem;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .employee-card .actions button:first-child {
    background: color-mix(in oklab, var(--warning) 20%, transparent);
    color: var(--warning);
  }
  
  .employee-card .actions button:last-child {
    background: color-mix(in oklab, var(--error) 20%, transparent);
    color: var(--error);
  }
  
  .calc-grid, .adj-grid, .report-grid {
    display: grid;
    gap: 2rem;
  }
  
  .calc-card, .adj-card, .report-card {
    background: color-mix(in oklab, var(--bg-muted) 30%, transparent);
    padding: 2rem;
    border-radius: 1rem;
    border: 1px solid var(--border);
  }
  
  .calc-card h3, .adj-card h3, .report-card h3 {
    margin: 0 0 1rem 0;
    color: var(--primary);
  }
  
  .formula {
    font-family: monospace;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--primary);
    background: color-mix(in oklab, var(--primary) 10%, transparent);
    padding: 0.75rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .calc-steps {
    display: grid;
    gap: 0.75rem;
  }
  
  .step {
    display: grid;
    grid-template-columns: 1fr auto;
    padding: 0.5rem 0;
    border-bottom: 1px solid color-mix(in oklab, var(--border) 50%, transparent);
  }
  
  .result {
    display: grid;
    grid-template-columns: 1fr auto;
    font-weight: 600;
    color: var(--success);
    border-bottom: 2px solid var(--success);
    margin-top: 1rem;
    padding: 1rem 0;
  }
  
  .config-edit {
    display: grid;
    gap: 0.5rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border);
  }
  
  .config-edit label {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 1rem;
  }
  
  .config-edit input {
    width: 100px;
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--border);
    border-radius: 0.25rem;
  }
  
  .adjustments {
    display: grid;
    gap: 1rem;
  }
  
  .adj-item {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 1rem;
    align-items: center;
  }
  
  .adj-item input {
    padding: 0.5rem;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
  }
  
  .adj-item button {
    padding: 0.5rem;
    background: color-mix(in oklab, var(--error) 10%, transparent);
    color: var(--error);
    border: 1px solid color-mix(in oklab, var(--error) 30%, transparent);
    border-radius: 0.5rem;
    cursor: pointer;
  }
  
  .add-adj {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: color-mix(in oklab, var(--success) 10%, transparent);
    color: var(--success);
    border: 1px solid color-mix(in oklab, var(--success) 30%, transparent);
    border-radius: 0.5rem;
    cursor: pointer;
    width: fit-content;
  }
  
  .no-adj {
    color: var(--fg-muted);
    font-style: italic;
    text-align: center;
    padding: 2rem;
  }
  
  .total {
    font-weight: 600;
    color: var(--primary);
    text-align: right;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border);
  }
  
  .report-card header {
    margin-bottom: 1.5rem;
  }
  
  .report-card header h3 {
    margin: 0 0 0.25rem 0;
    font-size: 1.25rem;
  }
  
  .report-card header span {
    color: var(--fg-muted);
    font-size: 0.9rem;
  }
  
  .summary {
    display: grid;
    gap: 0.75rem;
  }
  
  .line {
    display: grid;
    grid-template-columns: 1fr auto;
    padding: 0.5rem 0;
    border-bottom: 1px solid color-mix(in oklab, var(--border) 50%, transparent);
  }
  
  .line.final {
    font-weight: 600;
    color: var(--primary);
    border-bottom: 2px solid var(--primary);
    margin-top: 1rem;
    padding-top: 1rem;
  }
  
  .empty {
    text-align: center;
    padding: 4rem 2rem;
    color: var(--fg-muted);
  }
  
  .empty p {
    margin: 1rem 0 0 0;
    font-size: 1.1rem;
  }
  
  .footer {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 2rem;
    padding: 1.5rem 2rem;
    background: color-mix(in oklab, var(--bg-muted) 30%, transparent);
    border-top: 1px solid var(--border);
  }
  
  .footer span {
    text-align: center;
    color: var(--fg-muted);
  }
  
  button {
    display: grid;
    grid-template-columns: auto auto;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  }
  
  .primary {
    background: var(--primary);
    color: white;
  }
  
  .primary:hover:not(:disabled) {
    background: color-mix(in oklab, var(--primary) 90%, black);
  }
  
  .secondary {
    background: color-mix(in oklab, var(--secondary) 10%, transparent);
    color: var(--fg);
    border: 1px solid var(--border);
  }
  
  .secondary:hover:not(:disabled) {
    background: color-mix(in oklab, var(--secondary) 20%, transparent);
  }
  
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    .header {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    
    .employee-grid {
      grid-template-columns: 1fr;
    }
    
    .config-grid {
      grid-template-columns: 1fr;
    }
    
    .footer {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    
    .adj-item {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }
    
    .actions {
      grid-template-columns: 1fr;
    }
  }
</style>