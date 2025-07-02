<script>
  import { employees, formatDate } from '../lib/stores.js'
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
  
  function resetForm() {
    formData = {
      name: '',
      gender: 'male',
      maritalStatus: 'single',
      monthlySalary: ''
    }
    editingEmployee = null
  }
  
  function addEmployee() {
    const employee = {
      ...formData,
      id: Date.now().toString(),
      monthlySalary: Number(formData.monthlySalary)
    }
    
    const validation = validateEmployee(employee)
    if (!validation.isValid) {
      alert(`Validation errors:\n${validation.errors.join('\n')}`)
      return
    }
    
    employees.update(list => [...list, employee])
    resetForm()
    showAddForm = false
  }
  
  function editEmployee(employee) {
    editingEmployee = employee
    formData = {
      name: employee.name,
      gender: employee.gender,
      maritalStatus: employee.maritalStatus,
      monthlySalary: employee.monthlySalary.toString()
    }
    showAddForm = true
  }
  
  function updateEmployee() {
    const updatedEmployee = {
      ...editingEmployee,
      ...formData,
      monthlySalary: Number(formData.monthlySalary)
    }
    
    const validation = validateEmployee(updatedEmployee)
    if (!validation.isValid) {
      alert(`Validation errors:\n${validation.errors.join('\n')}`)
      return
    }
    
    employees.update(list => 
      list.map(emp => emp.id === editingEmployee.id ? updatedEmployee : emp)
    )
    resetForm()
    showAddForm = false
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

<div>
  <div class="xpayroll-card">
    <div class="xpayroll-card__header">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h2>Employee Management</h2>
          <p>Manage your workforce and employee information</p>
        </div>
        <button class="xpayroll-btn xpayroll-btn--primary" onclick={() => showAddForm = true}>
          <Icon icon="solar:user-plus-bold" width="1.2em" height="1.2em" /> Add Employee
        </button>
      </div>
    </div>
  </div>

  {#if showAddForm}
    <div class="xpayroll-card" style="margin-top: 1rem;">
      <div class="xpayroll-card__header">
        <h3>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h3>
      </div>
      <div class="xpayroll-card__body">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
          <div class="xpayroll-form__group">
            <label class="xpayroll-form__label" for="employee-name">Full Name</label>
            <input 
              id="employee-name"
              class="xpayroll-form__input"
              bind:value={formData.name}
              placeholder="Enter employee name"
              required
            />
          </div>
          
          <div class="xpayroll-form__group">
            <label class="xpayroll-form__label" for="employee-gender">Gender</label>
            <select id="employee-gender" class="xpayroll-form__select" bind:value={formData.gender}>
              {#each EMPLOYEE_ATTRIBUTES.GENDER as gender}
                <option value={gender}>{gender.charAt(0).toUpperCase() + gender.slice(1)}</option>
              {/each}
            </select>
          </div>
          
          <div class="xpayroll-form__group">
            <label class="xpayroll-form__label" for="employee-marital">Marital Status</label>
            <select id="employee-marital" class="xpayroll-form__select" bind:value={formData.maritalStatus}>
              {#each EMPLOYEE_ATTRIBUTES.MARITAL_STATUS as status}
                <option value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
              {/each}
            </select>
          </div>
          
          <div class="xpayroll-form__group">
            <label class="xpayroll-form__label" for="employee-salary">Monthly Salary (IDR)</label>
            <input 
              id="employee-salary"
              class="xpayroll-form__input"
              type="number"
              bind:value={formData.monthlySalary}
              placeholder="Enter monthly salary"
              min="0"
              required
            />
          </div>
        </div>
        
        <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
          <button class="xpayroll-btn xpayroll-btn--primary" onclick={editingEmployee ? updateEmployee : addEmployee}>
            <Icon icon={editingEmployee ? 'solar:refresh-bold' : 'solar:user-plus-bold'} width="1.2em" height="1.2em" />
            {editingEmployee ? 'Update' : 'Add'} Employee
          </button>
          <button class="xpayroll-btn xpayroll-btn--secondary" onclick={cancelForm}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  {/if}

  <div class="xpayroll-card" style="margin-top: 1rem;">
    <div class="xpayroll-card__header">
      <h3>Employee Directory</h3>
      <p>Total: {$employees.length} employees</p>
    </div>
    <div class="xpayroll-card__body">
      {#if $employees.length === 0}
        <div class="xpayroll-empty-state">
          <Icon icon="solar:users-group-rounded-bold" width="2.5em" height="2.5em" />
          <h4>No employees yet</h4>
          <p>Get started by adding your first employee</p>
          <button class="xpayroll-btn xpayroll-btn--primary" onclick={() => showAddForm = true}>
            <Icon icon="solar:user-plus-bold" width="1.2em" height="1.2em" /> Add First Employee
          </button>
        </div>
      {:else}
        <div style="overflow-x: auto;">
          <table class="xpayroll-table">
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
                  <td>{employee.name}</td>
                  <td>
                    <span style="text-transform: capitalize;">
                      {employee.gender.charAt(0).toUpperCase() + employee.gender.slice(1)}
                    </span>
                  </td>
                  <td>
                    <span style="text-transform: capitalize;">
                      {employee.maritalStatus.charAt(0).toUpperCase() + employee.maritalStatus.slice(1)}
                    </span>
                  </td>
                  <td>{formatCurrency(employee.monthlySalary)}</td>
                  <td>
                    <div style="display: flex; gap: 0.5rem;">
                      <button class="xpayroll-btn xpayroll-btn--secondary" onclick={() => editEmployee(employee)}>
                        <Icon icon="solar:edit-bold" width="1.1em" height="1.1em" /> Edit
                      </button>
                      <button class="xpayroll-btn xpayroll-btn--danger" onclick={() => deleteEmployee(employee.id)}>
                        <Icon icon="solar:trash-bin-trash-bold" width="1.1em" height="1.1em" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
</div>

 