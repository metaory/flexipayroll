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
  <div>
    <div>
      <h2>Employee Management</h2>
      <p>Manage your workforce and employee information</p>
    </div>
    <button onclick={() => showAddForm = true}>
      <Icon icon="solar:user-plus-bold" width="1.2em" height="1.2em" /> Add Employee
    </button>
  </div>

  {#if showAddForm}
    <div>
      <header>
        <h3>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h3>
      </header>
      <section>
        <div>
          <label>
            <span>Full Name</span>
            <input 
              bind:value={formData.name}
              placeholder="Enter employee name"
              required
            />
          </label>
          
          <label>
            <span>Gender</span>
            <select bind:value={formData.gender}>
              {#each EMPLOYEE_ATTRIBUTES.GENDER as gender}
                <option value={gender}>{gender.charAt(0).toUpperCase() + gender.slice(1)}</option>
              {/each}
            </select>
          </label>
          
          <label>
            <span>Marital Status</span>
            <select bind:value={formData.maritalStatus}>
              {#each EMPLOYEE_ATTRIBUTES.MARITAL_STATUS as status}
                <option value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
              {/each}
            </select>
          </label>
          
          <label>
            <span>Monthly Salary (IDR)</span>
            <input 
              type="number"
              bind:value={formData.monthlySalary}
              placeholder="Enter monthly salary"
              min="0"
              required
            />
          </label>
        </div>
        
        <div>
          <button onclick={editingEmployee ? updateEmployee : addEmployee}>
            <Icon icon={editingEmployee ? 'solar:refresh-bold' : 'solar:user-plus-bold'} width="1.2em" height="1.2em" />
            {editingEmployee ? 'Update' : 'Add'} Employee
          </button>
          <button onclick={cancelForm}>
            Cancel
          </button>
        </div>
      </section>
    </div>
  {/if}

  <div>
    <header>
      <h3>Employee Directory</h3>
      <p>Total: {$employees.length} employees</p>
    </header>
    <section>
      {#if $employees.length === 0}
        <div>
          <div><Icon icon="solar:users-group-rounded-bold" width="2.5em" height="2.5em" /></div>
          <h4>No employees yet</h4>
          <p>Get started by adding your first employee</p>
          <button onclick={() => showAddForm = true}>
            <Icon icon="solar:user-plus-bold" width="1.2em" height="1.2em" /> Add First Employee
          </button>
        </div>
      {:else}
        <div>
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
                  <td>{employee.name}</td>
                  <td>
                    <span>
                      {employee.gender.charAt(0).toUpperCase() + employee.gender.slice(1)}
                    </span>
                  </td>
                  <td>
                    <span>
                      {employee.maritalStatus.charAt(0).toUpperCase() + employee.maritalStatus.slice(1)}
                    </span>
                  </td>
                  <td>{formatCurrency(employee.monthlySalary)}</td>
                  <td>
                    <div>
                      <button onclick={() => editEmployee(employee)}>
                        <Icon icon="solar:edit-bold" width="1.1em" height="1.1em" /> Edit
                      </button>
                      <button onclick={() => deleteEmployee(employee.id)}>
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
    </section>
  </div>
</div>

 