<script>
  import { employees } from '../lib/stores.js'
  import { settings } from '../lib/settings.js'
  import { validateEmployee, EMPLOYEE_ATTRIBUTES, formatCurrency } from '../lib/core.js'
  import { toasts } from '../lib/toast.js'
  import Modal from './Modal.svelte'
  import ToastContainer from './ToastContainer.svelte'
  import Icon from '@iconify/svelte';
  import { ICONS } from '../lib/icons.js';
  
  let showForm = $state(false)
  let editingEmployee = $state(null)
  let showDeleteModal = $state(false)
  let employeeToDelete = $state(null)
  
  const defaultFormData = {
    name: '',
    gender: 'male',
    maritalStatus: 'single',
    monthlySalary: ''
  }
  
  let formData = $state({ ...defaultFormData })
  let formErrors = $state({})
  let isSubmitting = $state(false)
  
  const validateForm = () => {
    const errors = {}
    
    if (!formData.name?.trim() || formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters'
    }
    if (!formData.monthlySalary || Number(formData.monthlySalary) <= 0) {
      errors.monthlySalary = 'Monthly salary must be greater than 0'
    }
    
    return { isValid: Object.keys(errors).length === 0, errors }
  }
  
  const resetForm = () => {
    formData = { ...defaultFormData }
    formErrors = {}
    isSubmitting = false
    editingEmployee = null
    showForm = false
  }
  
  const createEmployee = () => ({
    ...formData,
    id: Date.now().toString(),
    monthlySalary: Number(formData.monthlySalary)
  })
  
  const handleSubmit = () => {
    const validation = validateForm()
    if (!validation.isValid) {
      formErrors = validation.errors
      return
    }
    
    isSubmitting = true
    
    const employee = createEmployee()
    const employeeValidation = validateEmployee(employee)
    
    if (!employeeValidation.isValid) {
      formErrors = { submit: employeeValidation.errors.join(', ') }
      isSubmitting = false
      return
    }
    
    const updateList = list => editingEmployee 
      ? list.map(emp => emp.id === editingEmployee.id ? employee : emp)
      : [...list, employee]
    
    employees.update(updateList)
    
    resetForm()
    
    const message = editingEmployee ? 'Employee updated successfully!' : 'Employee added successfully!'
    toasts.success(message)
  }
  
  const editEmployee = (employee) => {
    editingEmployee = employee
    showForm = true
    formData = {
      name: employee.name,
      gender: employee.gender,
      maritalStatus: employee.maritalStatus,
      monthlySalary: employee.monthlySalary.toString()
    }
    formErrors = {}
  }
  
  const deleteEmployee = (id) => {
    employeeToDelete = $employees.find(emp => emp.id === id)
    showDeleteModal = true
  }

  const confirmDelete = () => {
    employees.update(list => list.filter(emp => emp.id !== employeeToDelete.id))
    toasts.success('Employee deleted successfully!')
    showDeleteModal = false
    employeeToDelete = null
  }
  
  const cancelForm = () => {
    resetForm()
  }
  
  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1)
  
  const buttonText = $derived(editingEmployee ? 'Update' : 'Add')
  const buttonIcon = $derived(isSubmitting ? 'solar:refresh-bold' : (editingEmployee ? 'solar:refresh-bold' : 'solar:user-plus-bold'))
  const loadingText = $derived(isSubmitting ? (editingEmployee ? 'Updating...' : 'Adding...') : `${buttonText} Employee`)
  
  const totalSalary = $derived($employees.reduce((sum, emp) => sum + emp.monthlySalary, 0))
  const marriedCount = $derived($employees.filter(emp => emp.maritalStatus === 'married').length)
</script>

<h2><Icon icon={ICONS.navEmployees} width="1.5em" height="1.5em" /> Employee Management</h2>
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
              <strong>{formatCurrency(totalSalary, $settings.currency)}</strong>
      <span>Total Monthly Salary</span>
    </div>
  </div>
</div>

<button onclick={() => { editingEmployee = null; showForm = true }} class="slide-up">
  <Icon icon="solar:user-plus-bold" width="1.2em" height="1.2em" /> Add Employee
</button>

{#if showForm}
  <section class="slide-up">
    <h3><Icon icon={editingEmployee ? ICONS.edit : ICONS.userAdd} width="1.2em" height="1.2em" /> {editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h3>
          <p class="text-muted">Employee information affects salary calculations including bonuses and deductions</p>
    
    {#if formErrors.submit}
      <div class="error-message">
        <Icon icon="solar:info-circle-bold" width="1em" height="1em" />
        {formErrors.submit}
      </div>
    {/if}
    
    <form>
      <div class="form-group">
        <label for="employee-name">
          <Icon icon={ICONS.user} width="1em" height="1em" />
          Full Name
        </label>
        <input 
          id="employee-name"
          class={formErrors.name ? 'error' : ''}
          bind:value={formData.name}
          placeholder="Enter employee full name"
          required
        />
        {#if formErrors.name}
          <small class="text-error">{formErrors.name}</small>
        {/if}
      </div>
      
      <div class="form-group">
        <label for="employee-gender">
          <Icon icon={ICONS.male} width="1em" height="1em" />
          Gender
        </label>
        <select id="employee-gender" bind:value={formData.gender}>
          {#each EMPLOYEE_ATTRIBUTES.GENDER as gender}
            <option value={gender}>{capitalize(gender)}</option>
          {/each}
        </select>
        <small class="text-muted">Used for reporting and identification</small>
      </div>
      
      <div class="form-group">
        <label for="employee-marital">
          <Icon icon={ICONS.heart} width="1em" height="1em" />
          Marital Status
        </label>
        <select id="employee-marital" bind:value={formData.maritalStatus}>
          {#each EMPLOYEE_ATTRIBUTES.MARITAL_STATUS as status}
            <option value={status}>{capitalize(status)}</option>
          {/each}
        </select>
        <small class="text-muted">Married employees receive Bonus T automatically</small>
      </div>
      
      <div class="form-group">
        <label for="employee-salary">
          <Icon icon={ICONS.wallet} width="1em" height="1em" />
          Monthly Base Salary (IDR)
        </label>
        <input 
          id="employee-salary"
          type="number"
          class={formErrors.monthlySalary ? 'error' : ''}
          bind:value={formData.monthlySalary}
          placeholder="Enter monthly base salary"
          min="0"
          required
        />
        {#if formErrors.monthlySalary}
          <small class="text-error">{formErrors.monthlySalary}</small>
        {/if}
        <small class="text-muted">Used to calculate daily and hourly rates for salary calculations</small>
      </div>
      
      <div class="button-group">
        <button onclick={handleSubmit} disabled={isSubmitting}>
          <Icon 
            icon={isSubmitting ? ICONS.loading : (editingEmployee ? ICONS.save : ICONS.userAdd)}
            width="1.2em" 
            height="1.2em" 
            class={isSubmitting ? 'spinning' : ''} 
          />
          {isSubmitting ? 'Saving...' : (editingEmployee ? 'Update Employee' : 'Add Employee')}
        </button>
        <button class="secondary" onclick={cancelForm} disabled={isSubmitting}>Cancel</button>
      </div>
    </form>
  </section>
{/if}

<section class="fade-in">
  <h3><Icon icon={ICONS.users} width="1.2em" height="1.2em" /> Employee Directory</h3>
      <p class="text-muted">Manage your workforce. Employee data can be updated monthly and affects all salary calculations.</p>
  
  {#if $employees.length === 0}
    <div>
      <Icon icon={ICONS.users} width="2.5em" height="2.5em" />
      <h4>No employees yet</h4>
      <p>Get started by adding your first employee to begin payroll management</p>
      <button onclick={() => { editingEmployee = null; showForm = true }}>
        <Icon icon={ICONS.userAdd} width="1.2em" height="1.2em" /> Add First Employee
      </button>
    </div>
  {:else}
    <table>
      <thead>
        <tr>
          <th><Icon icon={ICONS.user} width="1em" height="1em" /> Name</th>
          <th><Icon icon={ICONS.male} width="1em" height="1em" /> Gender</th>
          <th><Icon icon={ICONS.heart} width="1em" height="1em" /> Marital Status</th>
          <th><Icon icon={ICONS.wallet} width="1em" height="1em" /> Monthly Salary</th>
          <th><Icon icon={ICONS.settings} width="1em" height="1em" /> Actions</th>
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
                            <td><strong>{formatCurrency(employee.monthlySalary, $settings.currency)}</strong></td>
            <td>
              <div class="button-group">
                <button class="secondary" onclick={() => editEmployee(employee)}>
                  <Icon icon={ICONS.edit} width="1.1em" height="1.1em" /> Edit
                </button>
                <button class="danger" onclick={() => deleteEmployee(employee.id)}>
                  <Icon icon={ICONS.delete} width="1.1em" height="1.1em" /> Delete
                </button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</section>

<Modal 
  show={showDeleteModal}
  type="warning"
  title="Delete Employee"
  message={employeeToDelete ? `Are you sure you want to delete ${employeeToDelete.name}? This will also remove all their attendance records.` : ''}
  confirmText="Delete"
  cancelText="Cancel"
  on:confirm={confirmDelete}
  on:cancel={() => { showDeleteModal = false; employeeToDelete = null }}
/>

<ToastContainer />

<style>
  
  small {
    grid-column: 2;
    font-size: 0.75rem;
    margin-top: 0.25rem;
  }
  
  .error-message {
    background: color-mix(in oklab, var(--error) 90%, transparent);
    padding: 1rem;
    border-radius: 1rem;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: white;
    box-shadow: 0 4px 16px color-mix(in oklab, var(--error) 30%, transparent);
  }
  
  /* Using global .stats-grid class */
  
  .stat-card {
    background: color-mix(in oklab, var(--secondary) 12%, transparent);
    border-radius: 1.5rem;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 8px 32px color-mix(in oklab, var(--secondary) 20%, transparent);
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
    background: color-mix(in oklab, var(--bg-muted) 80%, transparent);
    color: var(--fg-muted);
    box-shadow: 0 2px 8px color-mix(in oklab, var(--bg-muted) 30%, transparent);
  }
  
  .status-badge.married {
    background: var(--success);
    color: white;
  }
</style>

 