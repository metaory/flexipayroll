<!--
  Employees Wizard - Clean employee management workflow
  Step-by-step employee data entry and management
-->
<script>
  import { employees } from '../stores.js';
  import { validateEmployee, formatCurrency, calculateDailyRate, calculateHourlyRate } from '../core.js';
  import { config } from '../stores.js';
  import { toasts } from '../lib/toast.js';
  import Wizard from './Wizard.svelte';
  import Modal from './Modal.svelte';
  import Icon from '@iconify/svelte';
  import { ICONS } from '../lib/icons.js';
  
  let currentStep = $state(0);
  let selectedEmployee = $state(null);
  let viewMode = $state('list'); // 'list' | 'add' | 'edit'
  let showDeleteModal = $state(false);
  let employeeToDelete = $state(null);
  
  // Form state
  const defaultFormData = {
    name: '',
    gender: 'male',
    maritalStatus: 'single',
    monthlySalary: ''
  };
  
  let formData = $state({ ...defaultFormData });
  let formErrors = $state({});
  let isSubmitting = $state(false);
  
  // Wizard steps
  const getSteps = () => {
    if (viewMode === 'list') {
      return [
        {
          title: 'Employee Overview',
          description: 'View and manage all employees',
          icon: ICONS.users
        }
      ];
    } else {
      return [
        {
          title: 'Basic Information',
          description: 'Employee name and demographics',
          icon: ICONS.user
        },
        {
          title: 'Salary Details',
          description: 'Monthly salary and calculations',
          icon: ICONS.money
        },
        {
          title: 'Review & Save',
          description: 'Confirm employee information',
          icon: ICONS.check
        }
      ];
    }
  };
  
  const steps = $derived(getSteps());
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name?.trim() || formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    if (!formData.monthlySalary || Number(formData.monthlySalary) <= 0) {
      errors.monthlySalary = 'Monthly salary must be greater than 0';
    }
    
    return { isValid: Object.keys(errors).length === 0, errors };
  };
  
  const canProceedToNext = $derived(() => {
    if (viewMode === 'list') return true;
    
    if (currentStep === 0) {
      return formData.name?.trim().length >= 2;
    } else if (currentStep === 1) {
      return formData.monthlySalary && Number(formData.monthlySalary) > 0;
    }
    
    return true;
  });
  
  const resetForm = () => {
    formData = { ...defaultFormData };
    formErrors = {};
    isSubmitting = false;
    selectedEmployee = null;
    currentStep = 0;
  };
  
  const startAddEmployee = () => {
    resetForm();
    viewMode = 'add';
    currentStep = 0;
  };
  
  const startEditEmployee = (employee) => {
    selectedEmployee = employee;
    viewMode = 'edit';
    currentStep = 0;
    formData = {
      name: employee.name,
      gender: employee.gender,
      maritalStatus: employee.maritalStatus,
      monthlySalary: employee.monthlySalary.toString()
    };
    formErrors = {};
  };
  
  const backToList = () => {
    viewMode = 'list';
    currentStep = 0;
    resetForm();
  };
  
  const saveEmployee = () => {
    const validation = validateForm();
    if (!validation.isValid) {
      formErrors = validation.errors;
      return;
    }
    
    isSubmitting = true;
    
    const employee = {
      ...formData,
      id: selectedEmployee?.id || Date.now().toString(),
      monthlySalary: Number(formData.monthlySalary)
    };
    
    const employeeValidation = validateEmployee(employee);
    
    if (!employeeValidation.isValid) {
      formErrors = { submit: employeeValidation.errors.join(', ') };
      isSubmitting = false;
      return;
    }
    
    const updateList = list => selectedEmployee 
      ? list.map(emp => emp.id === selectedEmployee.id ? employee : emp)
      : [...list, employee];
    
    employees.update(updateList);
    
    const message = selectedEmployee ? 'Employee updated successfully!' : 'Employee added successfully!';
    toasts.success(message);
    
    backToList();
  };
  
  const confirmDelete = (employee) => {
    employeeToDelete = employee;
    showDeleteModal = true;
  };
  
  const deleteEmployee = () => {
    if (employeeToDelete) {
      employees.update(list => list.filter(emp => emp.id !== employeeToDelete.id));
      toasts.success('Employee deleted successfully!');
      showDeleteModal = false;
      employeeToDelete = null;
    }
  };
  
  // Calculate derived salary information
  const getDerivedInfo = (salary) => {
    const dailyRate = calculateDailyRate(salary, $config.workingDaysPerMonth);
    const hourlyRate = calculateHourlyRate(salary, $config);
    
    return { dailyRate, hourlyRate };
  };
</script>

<Wizard 
  {steps}
  bind:currentStep
  title={viewMode === 'list' ? 'Employee Management' : (selectedEmployee ? 'Edit Employee' : 'Add Employee')}
  description={viewMode === 'list' ? 'Manage your workforce' : 'Enter employee information step by step'}
  canGoNext={canProceedToNext}
  onComplete={viewMode === 'list' ? () => {} : saveEmployee}
>
  {#snippet children(stepIndex, stepData)}
    
    <!-- List View -->
    {#if viewMode === 'list'}
      <div class="employees-overview">
        <div class="overview-header">
          <div class="stats-grid">
            <div class="stat-card">
              <Icon icon={ICONS.users} width="2.5rem" height="2.5rem" />
              <div>
                <strong>{$employees.length}</strong>
                <span>Total Employees</span>
              </div>
            </div>
            
            <div class="stat-card">
              <Icon icon={ICONS.money} width="2.5rem" height="2.5rem" />
              <div>
                <strong>{formatCurrency($employees.reduce((sum, emp) => sum + emp.monthlySalary, 0))}</strong>
                <span>Total Monthly Payroll</span>
              </div>
            </div>
            
            <div class="stat-card">
              <Icon icon={ICONS.heart} width="2.5rem" height="2.5rem" />
              <div>
                <strong>{$employees.filter(emp => emp.maritalStatus === 'married').length}</strong>
                <span>Married Employees</span>
              </div>
            </div>
          </div>
          
          <button class="primary" onclick={startAddEmployee}>
            <Icon icon={ICONS.userAdd} width="1.25rem" height="1.25rem" />
            Add New Employee
          </button>
        </div>
        
        {#if $employees.length === 0}
          <div class="empty-state">
            <Icon icon={ICONS.users} width="4rem" height="4rem" />
            <h4>No Employees Added</h4>
            <p>Start by adding your first employee to manage payroll.</p>
            <button class="primary" onclick={startAddEmployee}>
              <Icon icon={ICONS.userAdd} width="1.25rem" height="1.25rem" />
              Add First Employee
            </button>
          </div>
        {:else}
          <div class="employees-grid">
            {#each $employees as employee (employee.id)}
              {@const { dailyRate, hourlyRate } = getDerivedInfo(employee.monthlySalary)}
              <div class="employee-card">
                <div class="employee-header">
                  <div class="employee-info">
                    <Icon icon={employee.gender === 'male' ? ICONS.male : ICONS.female} width="2rem" height="2rem" />
                    <div>
                      <h4>{employee.name}</h4>
                      <div class="employee-tags">
                        <span class="tag gender-tag">
                          <Icon icon={employee.gender === 'male' ? ICONS.male : ICONS.female} width="1rem" height="1rem" />
                          {employee.gender}
                        </span>
                        <span class="tag marital-tag">
                          <Icon icon={employee.maritalStatus === 'married' ? ICONS.heart : ICONS.user} width="1rem" height="1rem" />
                          {employee.maritalStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="employee-actions">
                    <button class="secondary" onclick={() => startEditEmployee(employee)}>
                      <Icon icon={ICONS.edit} width="1rem" height="1rem" />
                    </button>
                    <button class="danger" onclick={() => confirmDelete(employee)}>
                      <Icon icon={ICONS.delete} width="1rem" height="1rem" />
                    </button>
                  </div>
                </div>
                
                <div class="salary-breakdown">
                  <div class="salary-item">
                    <span class="label">Monthly Salary</span>
                    <span class="value primary">{formatCurrency(employee.monthlySalary)}</span>
                  </div>
                  <div class="salary-item">
                    <span class="label">Daily Rate</span>
                    <span class="value">{formatCurrency(dailyRate)}</span>
                  </div>
                  <div class="salary-item">
                    <span class="label">Hourly Rate</span>
                    <span class="value">{formatCurrency(hourlyRate)}</span>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    
    <!-- Add/Edit Form Steps -->
    {:else}
      
      <!-- Step 1: Basic Information -->
      {#if stepIndex === 0}
        <div class="form-step">
          <div class="form-explanation">
            <h3>
              <Icon icon={ICONS.info} width="1.5rem" height="1.5rem" />
              Employee Demographics
            </h3>
            <p>
              Basic employee information is used for bonus calculations and reporting. 
              Marital status determines eligibility for Bonus T (married employees only).
            </p>
          </div>
          
          <div class="config-section">
            <div class="form-group-stacked">
              <label for="employeeName">
                <Icon icon={ICONS.user} width="1.25rem" height="1.25rem" />
                Full Name
              </label>
              <input 
                id="employeeName"
                type="text" 
                bind:value={formData.name}
                class:error={formErrors.name}
                placeholder="Enter employee's full name"
                autofocus
              />
              {#if formErrors.name}
                <span class="error-text">{formErrors.name}</span>
              {/if}
            </div>
            
            <div class="form-group-horizontal">
              <div class="form-group-stacked">
                <label for="employeeGender">
                  <Icon icon={ICONS.user} width="1.25rem" height="1.25rem" />
                  Gender
                </label>
                <select id="employeeGender" bind:value={formData.gender}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              
              <div class="form-group-stacked">
                <label for="employeeMaritalStatus">
                  <Icon icon={ICONS.heart} width="1.25rem" height="1.25rem" />
                  Marital Status
                </label>
                <select id="employeeMaritalStatus" bind:value={formData.maritalStatus}>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                </select>
                <small>Married employees receive additional Bonus T</small>
              </div>
            </div>
          </div>
        </div>
      
      <!-- Step 2: Salary Details -->
      {:else if stepIndex === 1}
        <div class="form-step">
          <div class="form-explanation">
            <h3>
              <Icon icon={ICONS.info} width="1.5rem" height="1.5rem" />
              Salary Calculations
            </h3>
            <p>
              The monthly salary is the base for all payroll calculations. Daily and hourly rates are automatically calculated based on your business configuration.
            </p>
          </div>
          
          <div class="config-section">
            <div class="form-group-stacked">
              <label for="employeeSalary">
                <Icon icon={ICONS.money} width="1.25rem" height="1.25rem" />
                Monthly Salary
              </label>
              <input 
                id="employeeSalary"
                type="number" 
                step="100000"
                min="0"
                bind:value={formData.monthlySalary}
                class:error={formErrors.monthlySalary}
                placeholder="Enter monthly salary amount"
              />
              {#if formErrors.monthlySalary}
                <span class="error-text">{formErrors.monthlySalary}</span>
              {/if}
            </div>
            
            {#if formData.monthlySalary && Number(formData.monthlySalary) > 0}
              {@const { dailyRate, hourlyRate } = getDerivedInfo(Number(formData.monthlySalary))}
              <div class="calculation-preview">
                <h4>Calculated Rates</h4>
                <div class="rates-grid">
                  <div class="rate-card">
                    <Icon icon={ICONS.calendar} width="1.5rem" height="1.5rem" />
                    <div>
                      <span class="label">Daily Rate</span>
                      <span class="value">{formatCurrency(dailyRate)}</span>
                      <small>Monthly ÷ {$config.workingDaysPerMonth} working days</small>
                    </div>
                  </div>
                  
                  <div class="rate-card">
                    <Icon icon={ICONS.clock} width="1.5rem" height="1.5rem" />
                    <div>
                      <span class="label">Hourly Rate</span>
                      <span class="value">{formatCurrency(hourlyRate)}</span>
                      <small>Daily ÷ {$config.workdayHours} working hours</small>
                    </div>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        </div>
      
      <!-- Step 3: Review & Save -->
      {:else if stepIndex === 2}
        <div class="form-step">
          <div class="review-summary">
            <h3>
              <Icon icon={ICONS.check} width="1.5rem" height="1.5rem" />
              Employee Summary
            </h3>
            
            {@const { dailyRate, hourlyRate } = getDerivedInfo(Number(formData.monthlySalary))}
            
            <div class="summary-card">
              <div class="employee-preview">
                <div class="preview-header">
                  <Icon icon={formData.gender === 'male' ? ICONS.male : ICONS.female} width="3rem" height="3rem" />
                  <div>
                    <h4>{formData.name}</h4>
                    <div class="employee-tags">
                      <span class="tag gender-tag">
                        <Icon icon={formData.gender === 'male' ? ICONS.male : ICONS.female} width="1rem" height="1rem" />
                        {formData.gender}
                      </span>
                      <span class="tag marital-tag">
                        <Icon icon={formData.maritalStatus === 'married' ? ICONS.heart : ICONS.user} width="1rem" height="1rem" />
                        {formData.maritalStatus}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div class="salary-breakdown">
                  <div class="salary-item">
                    <span class="label">Monthly Salary</span>
                    <span class="value primary">{formatCurrency(Number(formData.monthlySalary))}</span>
                  </div>
                  <div class="salary-item">
                    <span class="label">Daily Rate</span>
                    <span class="value">{formatCurrency(dailyRate)}</span>
                  </div>
                  <div class="salary-item">
                    <span class="label">Hourly Rate</span>
                    <span class="value">{formatCurrency(hourlyRate)}</span>
                  </div>
                </div>
                
                {#if formData.maritalStatus === 'married'}
                  <div class="bonus-notice">
                    <Icon icon={ICONS.gift} width="1.25rem" height="1.25rem" />
                    <span>This employee is eligible for Bonus T ({formatCurrency($config.bonuses.T.value)})</span>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </div>
      {/if}
    {/if}
  {/snippet}
</Wizard>

<!-- Back to List Button for Add/Edit Mode -->
{#if viewMode !== 'list'}
  <button class="back-to-list" onclick={backToList}>
    <Icon icon={ICONS.back} width="1.25rem" height="1.25rem" />
    Back to Employee List
  </button>
{/if}

<!-- Delete Confirmation Modal -->
<Modal show={showDeleteModal} onClose={() => showDeleteModal = false}>
  {#snippet children()}
    <div class="modal-header">
      <h3>Confirm Delete</h3>
    </div>
    
    <div class="modal-body">
      <p>Are you sure you want to delete <strong>{employeeToDelete?.name}</strong>?</p>
      <p class="warning-text">This action cannot be undone and will remove all attendance records for this employee.</p>
    </div>
    
    <div class="modal-actions">
      <button class="secondary" onclick={() => showDeleteModal = false}>
        Cancel
      </button>
      <button class="danger" onclick={deleteEmployee}>
        <Icon icon={ICONS.delete} width="1rem" height="1rem" />
        Delete Employee
      </button>
    </div>
  {/snippet}
</Modal>

<style lang="sass">
  .employees-overview
    display: grid
    gap: 2rem
    
  .overview-header
    @extend %flex-between
    align-items: flex-start
    gap: 2rem
    
    @media (max-width: 768px)
      flex-direction: column
      align-items: stretch
      
  .stats-grid
    display: grid
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))
    gap: 1rem
    flex: 1
    
  .employees-grid
    display: grid
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr))
    gap: 1.5rem
    
  .employee-card
    @extend %card
    border: 1px solid color-mix(in oklab, var(--primary) 15%, transparent)
    
    .employee-header
      @extend %flex-between
      margin-bottom: 1.5rem
      
      .employee-info
        @extend %flex
        gap: 1rem
        min-width: 0
        
        svg
          color: var(--primary)
          flex-shrink: 0
          
        h4
          margin: 0 0 0.5rem 0
          @extend %font-weight-bold
          color: var(--fg)
          
        .employee-tags
          @extend %flex
          gap: 0.5rem
          flex-wrap: wrap
          
          .tag
            @extend %flex
            gap: 0.25rem
            padding: 0.25rem 0.5rem
            border-radius: 0.5rem
            font-size: 0.75rem
            @extend %font-weight-medium
            
            &.gender-tag
              background: color-mix(in oklab, var(--secondary) 15%, transparent)
              color: var(--secondary)
              
            &.marital-tag
              background: color-mix(in oklab, var(--primary) 15%, transparent)
              color: var(--primary)
              
      .employee-actions
        @extend %flex
        gap: 0.5rem
        flex-shrink: 0
        
        button
          @extend %button-small
          width: 2.5rem
          height: 2.5rem
          padding: 0
          border-radius: 50%
          @extend %flex
          justify-content: center
          align-items: center
          
    .salary-breakdown
      display: grid
      gap: 0.75rem
      
      .salary-item
        @extend %flex-between
        padding: 0.75rem 0
        border-bottom: 1px solid color-mix(in oklab, var(--primary) 10%, transparent)
        
        &:last-child
          border-bottom: none
          
        .label
          @extend %font-weight-medium
          color: var(--fg-muted)
          
        .value
          @extend %font-weight-bold
          color: var(--fg)
          font-family: 'JetBrains Mono', monospace
          
          &.primary
            color: var(--primary)
            font-size: 1.1rem
            
  .empty-state
    @extend %grid
    place-items: center
    text-align: center
    gap: 1.5rem
    padding: 4rem 2rem
    
    svg
      @extend %opacity-subtle
      color: var(--fg-muted)
      
    h4
      margin: 0
      color: var(--fg-muted)
      
    p
      @extend %text-muted
      margin: 0
      
  .form-step
    display: grid
    gap: 2rem
    
  .form-explanation
    @extend %card
    border: 2px solid color-mix(in oklab, var(--info) 30%, transparent)
    background: color-mix(in oklab, var(--info) 8%, transparent)
    
    h3
      @extend %flex
      gap: 0.75rem
      color: var(--info)
      margin-bottom: 1rem
      
      svg
        color: var(--info)
        
    p
      margin: 0
      @extend %text-muted
      line-height: 1.6
      
  .calculation-preview
    margin-top: 1.5rem
    padding: 1.5rem
    background: color-mix(in oklab, var(--success) 8%, transparent)
    border-radius: 1rem
    border: 1px solid color-mix(in oklab, var(--success) 15%, transparent)
    
    h4
      color: var(--success)
      margin-bottom: 1rem
      
    .rates-grid
      display: grid
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))
      gap: 1rem
      
    .rate-card
      @extend %flex
      gap: 1rem
      padding: 1rem
      background: color-mix(in oklab, var(--success) 4%, transparent)
      border-radius: 0.75rem
      
      svg
        color: var(--success)
        flex-shrink: 0
        
      .label
        display: block
        @extend %font-weight-medium
        color: var(--fg-muted)
        margin-bottom: 0.25rem
        
      .value
        display: block
        @extend %font-weight-bold
        color: var(--success)
        font-size: 1.1rem
        font-family: 'JetBrains Mono', monospace
        margin-bottom: 0.25rem
        
      small
        display: block
        color: var(--fg-muted)
        font-size: 0.75rem
        
  .review-summary
    h3
      @extend %flex
      gap: 0.75rem
      color: var(--success)
      margin-bottom: 2rem
      
      svg
        color: var(--success)
        
  .employee-preview
    .preview-header
      @extend %flex
      gap: 1.5rem
      margin-bottom: 1.5rem
      
      svg
        color: var(--primary)
        
      h4
        margin: 0 0 0.5rem 0
        @extend %font-weight-bold
        color: var(--fg)
        font-size: 1.5rem
        
    .bonus-notice
      @extend %flex
      gap: 0.75rem
      padding: 1rem
      background: color-mix(in oklab, var(--warning) 10%, transparent)
      border-radius: 0.75rem
      color: var(--warning)
      @extend %font-weight-medium
      margin-top: 1rem
      
      svg
        color: var(--warning)
        
  .back-to-list
    position: fixed
    top: 6rem
    left: 2rem
    @extend %button-secondary
    z-index: 100
    @extend %shadow-lg
    
    @media (max-width: 768px)
      top: 5rem
      left: 1rem
      
  .error-text
    color: var(--error)
    font-size: 0.875rem
    margin-top: 0.25rem
    
  .warning-text
    color: var(--warning)
    @extend %font-weight-medium
</style>
