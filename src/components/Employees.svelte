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
    if (confirm('Are you sure you want to delete this employee?')) {
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
</script>

<h2>Employee Management</h2>
<p>Manage your workforce and employee information</p>

<button onclick={() => showAddForm = true} class="slide-up">
  <Icon icon="solar:user-plus-bold" width="1.2em" height="1.2em" /> Add Employee
</button>

{#if showAddForm}
  <section class="slide-up">
    <h3>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h3>
    
    {#if submitError}
      <div class="error-message">
        <Icon icon="solar:info-circle-bold" width="1em" height="1em" />
        {submitError}
      </div>
    {/if}
    
    <form>
      <div class="form-group">
        <label for="employee-name">Full Name</label>
        <input 
          id="employee-name"
          class={formErrors['name'] ? 'error' : ''}
          bind:value={formData.name}
          placeholder="Enter employee name"
          required
        />
        {#if formErrors['name']}
          <small style="color: var(--error);">{formErrors['name']}</small>
        {/if}
      </div>
      
      <div class="form-group">
        <label for="employee-gender">Gender</label>
        <select id="employee-gender" bind:value={formData.gender}>
          {#each EMPLOYEE_ATTRIBUTES.GENDER as gender}
            <option value={gender}>{capitalize(gender)}</option>
          {/each}
        </select>
      </div>
      
      <div class="form-group">
        <label for="employee-marital">Marital Status</label>
        <select id="employee-marital" bind:value={formData.maritalStatus}>
          {#each EMPLOYEE_ATTRIBUTES.MARITAL_STATUS as status}
            <option value={status}>{capitalize(status)}</option>
          {/each}
        </select>
      </div>
      
      <div class="form-group">
        <label for="employee-salary">Monthly Salary (IDR)</label>
        <input 
          id="employee-salary"
          type="number"
          class={formErrors['monthlySalary'] ? 'error' : ''}
          bind:value={formData.monthlySalary}
          placeholder="Enter monthly salary"
          min="0"
          required
        />
        {#if formErrors['monthlySalary']}
          <small style="color: var(--error);">{formErrors['monthlySalary']}</small>
        {/if}
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
  <h3>Employee Directory</h3>
  <p style="color: var(--fg-muted);">Total: {$employees.length} employees</p>
  
  {#if $employees.length === 0}
    <div>
      <Icon icon="solar:users-group-rounded-bold" width="2.5em" height="2.5em" />
      <h4>No employees yet</h4>
      <p>Get started by adding your first employee</p>
      <button onclick={() => showAddForm = true}>
        <Icon icon="solar:user-plus-bold" width="1.2em" height="1.2em" /> Add First Employee
      </button>
    </div>
  {:else}
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Gender</th>
          <th>Marital Status</th>
          <th>Monthly Salary</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each $employees as employee}
          <tr>
            <td><strong>{employee.name}</strong></td>
            <td>{capitalize(employee.gender)}</td>
            <td>{capitalize(employee.maritalStatus)}</td>
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
</style>

 