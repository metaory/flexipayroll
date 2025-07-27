<script>
  import { employees } from '../lib/stores.js'
  import { validateEmployee, EMPLOYEE_ATTRIBUTES, formatCurrency } from '../lib/core.js'
  import Icon from '@iconify/svelte';
  
  let showAddForm = $state(false)
  let editingEmployee = $state(null)
  let formData = $state({
    name: '',
    gender: 'male',
    maritalStatus: 'single',
    monthlySalary: ''
  })
  let formErrors = $state({})
  let isSubmitting = $state(false)
  let submitError = $state('')
  
  const defaultFormData = {
    name: '',
    gender: 'male',
    maritalStatus: 'single',
    monthlySalary: ''
  }
  
  const resetForm = () => {
    formData = { ...defaultFormData }
    formErrors = {}
    submitError = ''
    editingEmployee = null
  }
  
  const validateForm = () => {
    const errors = {}
    
    if (!formData.name.trim()) errors.name = 'Name is required'
    else if (formData.name.trim().length < 2) errors.name = 'Name must be at least 2 characters'
    
    if (!formData.monthlySalary || Number(formData.monthlySalary) <= 0) {
      errors.monthlySalary = 'Valid salary is required'
    }
    
    formErrors = errors
    return Object.keys(errors).length === 0
  }
  
  const createEmployee = () => ({
    ...formData,
    id: Date.now().toString(),
    monthlySalary: Number(formData.monthlySalary)
  })
  
  const handleSubmit = () => {
    if (!validateForm()) return
    
    isSubmitting = true
    submitError = ''
    
    const employee = createEmployee()
    const validation = validateEmployee(employee)
    
    if (!validation.isValid) {
      submitError = validation.errors.join(', ')
      isSubmitting = false
      return
    }
    
    employees.update(list => editingEmployee 
      ? list.map(emp => emp.id === editingEmployee.id ? employee : emp)
      : [...list, employee]
    )
    
    resetForm()
    showAddForm = false
    isSubmitting = false
  }
  
  const editEmployee = (employee) => {
    editingEmployee = employee
    formData = {
      name: employee.name,
      gender: employee.gender,
      maritalStatus: employee.maritalStatus,
      monthlySalary: employee.monthlySalary.toString()
    }
    formErrors = {}
    submitError = ''
    showAddForm = true
  }
  
  const deleteEmployee = (id) => {
    if (confirm('Are you sure you want to delete this employee? This will also remove all their attendance records.')) {
      employees.update(list => list.filter(emp => emp.id !== id))
    }
  }
  
  const cancelForm = () => {
    resetForm()
    showAddForm = false
  }
  
  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1)
  
  const buttonText = $derived(editingEmployee ? 'Update' : 'Add')
  const buttonIcon = $derived(isSubmitting ? 'solar:refresh-bold' : (editingEmployee ? 'solar:refresh-bold' : 'solar:user-plus-bold'))
  const loadingText = $derived(isSubmitting ? (editingEmployee ? 'Updating...' : 'Adding...') : `${buttonText} Employee`)
  
  const totalSalary = $derived($employees.reduce((sum, emp) => sum + emp.monthlySalary, 0))
  const marriedCount = $derived($employees.filter(emp => emp.maritalStatus === 'married').length)
</script>

<h2>Employee Management</h2>
<p>Manage your workforce and employee information. Employee data can be updated monthly and affects salary calculations.</p>

<div class="stats-grid">
  <div class="stat-card">
    <Icon icon="solar:users-group-rounded-bold" width="2em" height="2em" />
    <div>
      <strong>{$employees.length}</strong>
      <span>Total Employees</span>
    </div>
  </div>
  <div class="stat-card">
    <Icon icon="solar:heart-bold" width="2em" height="2em" />
    <div>
      <strong>{marriedCount}</strong>
      <span>Married Employees</span>
    </div>
  </div>
  <div class="stat-card">
    <Icon icon="solar:wallet-bold" width="2em" height="2em" />
    <div>
      <strong>{formatCurrency(totalSalary)}</strong>
      <span>Total Monthly Salary</span>
    </div>
  </div>
</div>

<button onclick={() => showAddForm = true} class="slide-up">
  <Icon icon="solar:user-plus-bold" width="1.2em" height="1.2em" /> Add Employee
</button>

{#if showAddForm}
  <section class="slide-up">
    <h3><Icon icon={editingEmployee ? 'solar:edit-bold' : 'solar:user-plus-bold'} width="1.2em" height="1.2em" /> {editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h3>
    <p style="color: var(--fg-muted);">Employee information affects salary calculations including bonuses and deductions</p>
    
    {#if submitError}
      <div class="error-message">
        <Icon icon="solar:info-circle-bold" width="1em" height="1em" />
        {submitError}
      </div>
    {/if}
    
    <form>
      <div class="form-group">
        <label for="employee-name">
          <Icon icon="solar:user-bold" width="1em" height="1em" />
          Full Name
        </label>
        <input 
          id="employee-name"
          class={formErrors['name'] ? 'error' : ''}
          bind:value={formData.name}
          placeholder="Enter employee full name"
          required
        />
        {#if formErrors['name']}
          <small style="color: var(--error);">{formErrors['name']}</small>
        {/if}
      </div>
      
      <div class="form-group">
        <label for="employee-gender">
          <Icon icon="solar:user-id-bold" width="1em" height="1em" />
          Gender
        </label>
        <select id="employee-gender" bind:value={formData.gender}>
          {#each EMPLOYEE_ATTRIBUTES.GENDER as gender}
            <option value={gender}>{capitalize(gender)}</option>
          {/each}
        </select>
        <small style="color: var(--fg-muted);">Used for reporting and identification</small>
      </div>
      
      <div class="form-group">
        <label for="employee-marital">
          <Icon icon="solar:heart-bold" width="1em" height="1em" />
          Marital Status
        </label>
        <select id="employee-marital" bind:value={formData.maritalStatus}>
          {#each EMPLOYEE_ATTRIBUTES.MARITAL_STATUS as status}
            <option value={status}>{capitalize(status)}</option>
          {/each}
        </select>
        <small style="color: var(--fg-muted);">Married employees receive Bonus T automatically</small>
      </div>
      
      <div class="form-group">
        <label for="employee-salary">
          <Icon icon="solar:wallet-bold" width="1em" height="1em" />
          Monthly Base Salary (IDR)
        </label>
        <input 
          id="employee-salary"
          type="number"
          class={formErrors['monthlySalary'] ? 'error' : ''}
          bind:value={formData.monthlySalary}
          placeholder="Enter monthly base salary"
          min="0"
          required
        />
        {#if formErrors['monthlySalary']}
          <small style="color: var(--error);">{formErrors['monthlySalary']}</small>
        {/if}
        <small style="color: var(--fg-muted);">Used to calculate daily and hourly rates for salary calculations</small>
      </div>
      
      <div class="button-group">
        <button onclick={handleSubmit} disabled={isSubmitting}>
          <Icon 
            icon={buttonIcon}
            width="1.2em" 
            height="1.2em" 
            class="spinning" 
            style={isSubmitting ? '' : 'animation: none;'} 
          />
          {loadingText}
        </button>
        <button class="secondary" onclick={cancelForm} disabled={isSubmitting}>Cancel</button>
      </div>
    </form>
  </section>
{/if}

<section class="fade-in">
  <h3><Icon icon="solar:users-group-rounded-bold" width="1.2em" height="1.2em" /> Employee Directory</h3>
  <p style="color: var(--fg-muted);">Manage your workforce. Employee data can be updated monthly and affects all salary calculations.</p>
  
  {#if $employees.length === 0}
    <div>
      <Icon icon="solar:users-group-rounded-bold" width="2.5em" height="2.5em" />
      <h4>No employees yet</h4>
      <p>Get started by adding your first employee to begin payroll management</p>
      <button onclick={() => showAddForm = true}>
        <Icon icon="solar:user-plus-bold" width="1.2em" height="1.2em" /> Add First Employee
      </button>
    </div>
  {:else}
    <table>
      <thead>
        <tr>
          <th><Icon icon="solar:user-bold" width="1em" height="1em" /> Name</th>
          <th><Icon icon="solar:user-id-bold" width="1em" height="1em" /> Gender</th>
          <th><Icon icon="solar:heart-bold" width="1em" height="1em" /> Marital Status</th>
          <th><Icon icon="solar:wallet-bold" width="1em" height="1em" /> Monthly Salary</th>
          <th><Icon icon="solar:settings-bold" width="1em" height="1em" /> Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each $employees as employee}
          <tr>
            <td><strong>{employee.name}</strong></td>
            <td>{capitalize(employee.gender)}</td>
            <td>
              <span class="status-badge" class:married={employee.maritalStatus === 'married'}>
                {capitalize(employee.maritalStatus)}
              </span>
            </td>
            <td><strong>{formatCurrency(employee.monthlySalary)}</strong></td>
            <td>
              <div class="button-group">
                <button class="secondary" onclick={() => editEmployee(employee)}>
                  <Icon icon="solar:edit-bold" width="1.1em" height="1.1em" /> Edit
                </button>
                <button class="danger" onclick={() => deleteEmployee(employee.id)}>
                  <Icon icon="solar:trash-bin-trash-bold" width="1.1em" height="1.1em" /> Delete
                </button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</section>

<style>
  .spinning {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  small {
    grid-column: 2;
    font-size: 0.75rem;
    margin-top: 0.25rem;
  }
  
  .error-message {
    background: var(--error);
    border: 1px solid var(--error);
    padding: 1rem;
    border-radius: var(--radius);
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: white;
  }
  
  /* Using global .stats-grid class */
  
  .stat-card {
    background: var(--bg-muted);
    border: 1px solid var(--border-muted);
    border-radius: var(--radius);
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .stat-card > div {
    display: flex;
    flex-direction: column;
  }
  
  .stat-card strong {
    font-size: 1.5rem;
    color: var(--primary);
  }
  
  .stat-card span {
    font-size: 0.875rem;
    color: var(--fg-muted);
  }
  
  .status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 500;
    background: var(--bg-muted);
    color: var(--fg-muted);
  }
  
  .status-badge.married {
    background: var(--success);
    color: white;
  }
</style>

 