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
  
  function resetForm() {
    formData = {
      name: '',
      gender: 'male',
      maritalStatus: 'single',
      monthlySalary: ''
    }
    formErrors = {}
    editingEmployee = null
  }
  
  function validateForm() {
    const errors = {}
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters'
    }
    
    if (!formData.monthlySalary || Number(formData.monthlySalary) <= 0) {
      errors.monthlySalary = 'Valid salary is required'
    }
    
    formErrors = errors
    return Object.keys(errors).length === 0
  }
  
  async function addEmployee() {
    if (!validateForm()) return
    
    isSubmitting = true
    
    const employee = {
      ...formData,
      id: Date.now().toString(),
      monthlySalary: Number(formData.monthlySalary)
    }
    
    const validation = validateEmployee(employee)
    if (!validation.isValid) {
      alert(`Validation errors:\n${validation.errors.join('\n')}`)
      isSubmitting = false
      return
    }
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 500))
    
    employees.update(list => [...list, employee])
    resetForm()
    showAddForm = false
    isSubmitting = false
  }
  
  function editEmployee(employee) {
    editingEmployee = employee
    formData = {
      name: employee.name,
      gender: employee.gender,
      maritalStatus: employee.maritalStatus,
      monthlySalary: employee.monthlySalary.toString()
    }
    formErrors = {}
    showAddForm = true
  }
  
  async function updateEmployee() {
    if (!validateForm()) return
    
    isSubmitting = true
    
    const updatedEmployee = {
      ...editingEmployee,
      ...formData,
      monthlySalary: Number(formData.monthlySalary)
    }
    
    const validation = validateEmployee(updatedEmployee)
    if (!validation.isValid) {
      alert(`Validation errors:\n${validation.errors.join('\n')}`)
      isSubmitting = false
      return
    }
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 500))
    
    employees.update(list => 
      list.map(emp => emp.id === editingEmployee.id ? updatedEmployee : emp)
    )
    resetForm()
    showAddForm = false
    isSubmitting = false
  }
  
  function deleteEmployee(id) {
    if (confirm('Are you sure you want to delete this employee?')) {
      employees.update(list => list.filter(emp => emp.id !== id))
    }
  }
  
  function cancelForm() {
    resetForm()
    showAddForm = false
  }
</script>

<h2>Employee Management</h2>
<p>Manage your workforce and employee information</p>

<button onclick={() => showAddForm = true} class="slide-up">
  <Icon icon="solar:user-plus-bold" width="1.2em" height="1.2em" /> Add Employee
</button>

{#if showAddForm}
  <section class="slide-up">
    <h3>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h3>
    
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
          <small class="text-muted">{formErrors['name']}</small>
        {/if}
      </div>
      
      <div class="form-group">
        <label for="employee-gender">Gender</label>
        <select id="employee-gender" bind:value={formData.gender}>
          {#each EMPLOYEE_ATTRIBUTES.GENDER as gender}
            <option value={gender}>{gender.charAt(0).toUpperCase() + gender.slice(1)}</option>
          {/each}
        </select>
      </div>
      
      <div class="form-group">
        <label for="employee-marital">Marital Status</label>
        <select id="employee-marital" bind:value={formData.maritalStatus}>
          {#each EMPLOYEE_ATTRIBUTES.MARITAL_STATUS as status}
            <option value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
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
          <small class="text-muted">{formErrors['monthlySalary']}</small>
        {/if}
      </div>
      
      <div class="button-group">
        <button 
          onclick={editingEmployee ? updateEmployee : addEmployee}
          disabled={isSubmitting}
        >
          <Icon 
            icon={isSubmitting ? 'solar:refresh-bold' : (editingEmployee ? 'solar:refresh-bold' : 'solar:user-plus-bold')} 
            width="1.2em" 
            height="1.2em" 
            class="spinning" 
            style={isSubmitting ? '' : 'animation: none;'} 
          />
          {#if isSubmitting}
            {editingEmployee ? 'Updating...' : 'Adding...'}
          {:else}
            {editingEmployee ? 'Update' : 'Add'} Employee
          {/if}
        </button>
        <button class="secondary" onclick={cancelForm} disabled={isSubmitting}>Cancel</button>
      </div>
    </form>
  </section>
{/if}

<section class="fade-in">
  <h3>Employee Directory</h3>
  <p class="text-muted">Total: {$employees.length} employees</p>
  
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
        {#each $employees as employee, index}
          <tr>
            <td><strong>{employee.name}</strong></td>
            <td>{employee.gender.charAt(0).toUpperCase() + employee.gender.slice(1)}</td>
            <td>{employee.maritalStatus.charAt(0).toUpperCase() + employee.maritalStatus.slice(1)}</td>
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
    color: var(--error);
    font-size: 0.75rem;
    margin-top: 0.25rem;
  }
</style>

 