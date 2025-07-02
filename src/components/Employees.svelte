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

<div class="space-y-6">
  <!-- Header Section -->
  <div class="flex justify-between items-center">
    <div>
      <h2 class="h2 text-primary-500">Employee Management</h2>
      <p class="text-surface-600-400-token mt-1">Manage your workforce and employee information</p>
    </div>
          <button class="btn variant-filled-primary" onclick={() => showAddForm = true}>
        <span class="mr-2"><Icon icon="solar:user-plus-bold" width="1.2em" height="1.2em" /></span> Add Employee
      </button>
  </div>

  <!-- Add/Edit Form -->
  {#if showAddForm}
    <div class="card p-6 bg-gradient-to-br from-primary-50-900-token to-surface-50-900-token border border-primary-200-700-token">
      <header class="card-header mb-6">
        <h3 class="h3 text-primary-500">{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h3>
      </header>
      <section class="card-body">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <label class="label">
            <span class="text-surface-700-300-token font-medium">Full Name</span>
            <input 
              class="input"
              bind:value={formData.name}
              placeholder="Enter employee name"
              required
            />
          </label>
          
          <label class="label">
            <span class="text-surface-700-300-token font-medium">Gender</span>
            <select class="select" bind:value={formData.gender}>
              {#each EMPLOYEE_ATTRIBUTES.GENDER as gender}
                <option value={gender}>{gender.charAt(0).toUpperCase() + gender.slice(1)}</option>
              {/each}
            </select>
          </label>
          
          <label class="label">
            <span class="text-surface-700-300-token font-medium">Marital Status</span>
            <select class="select" bind:value={formData.maritalStatus}>
              {#each EMPLOYEE_ATTRIBUTES.MARITAL_STATUS as status}
                <option value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
              {/each}
            </select>
          </label>
          
          <label class="label">
            <span class="text-surface-700-300-token font-medium">Monthly Salary (IDR)</span>
            <input 
              class="input"
              type="number"
              bind:value={formData.monthlySalary}
              placeholder="Enter monthly salary"
              min="0"
              required
            />
          </label>
        </div>
        
        <div class="flex gap-3 mt-6">
          <button class="btn variant-filled-primary" onclick={editingEmployee ? updateEmployee : addEmployee}>
            <span class="mr-2"><Icon icon={editingEmployee ? 'solar:refresh-bold' : 'solar:user-plus-bold'} width="1.2em" height="1.2em" /></span>
            {editingEmployee ? 'Update' : 'Add'} Employee
          </button>
          <button class="btn variant-ghost" onclick={cancelForm}>
            Cancel
          </button>
        </div>
      </section>
    </div>
  {/if}

  <!-- Employee List -->
  <div class="card p-6">
    <header class="card-header mb-6">
      <h3 class="h3 text-primary-500">Employee Directory</h3>
      <p class="text-surface-600-400-token">Total: {$employees.length} employees</p>
    </header>
    <section class="card-body">
      {#if $employees.length === 0}
        <div class="text-center py-12">
          <div class="text-6xl mb-4 text-surface-400-600-token"><Icon icon="solar:users-group-rounded-bold" width="2.5em" height="2.5em" /></div>
          <h4 class="h4 text-surface-600-400-token mb-2">No employees yet</h4>
          <p class="text-surface-500-500-token mb-4">Get started by adding your first employee</p>
          <button class="btn variant-filled-primary" onclick={() => showAddForm = true}>
            <span class="mr-2"><Icon icon="solar:user-plus-bold" width="1.2em" height="1.2em" /></span> Add First Employee
          </button>
        </div>
      {:else}
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr class="bg-surface-100-800-token">
                <th class="text-left">Name</th>
                <th class="text-left">Gender</th>
                <th class="text-left">Marital Status</th>
                <th class="text-left">Monthly Salary</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each $employees as employee, index}
                <tr class="hover:bg-surface-100-800-token transition-colors duration-200 {index % 2 === 0 ? 'bg-surface-50-900-token' : ''}">
                  <td class="font-medium text-primary-500">{employee.name}</td>
                  <td>
                    <span class="badge variant-soft-{employee.gender === 'male' ? 'primary' : 'secondary'}">
                      {employee.gender.charAt(0).toUpperCase() + employee.gender.slice(1)}
                    </span>
                  </td>
                  <td>
                    <span class="badge variant-soft-{employee.maritalStatus === 'married' ? 'success' : 'warning'}">
                      {employee.maritalStatus.charAt(0).toUpperCase() + employee.maritalStatus.slice(1)}
                    </span>
                  </td>
                  <td class="font-mono font-bold text-success-500">{formatCurrency(employee.monthlySalary)}</td>
                  <td>
                    <div class="flex gap-2 justify-center">
                      <button class="btn btn-sm variant-filled-secondary" onclick={() => editEmployee(employee)}>
                        <Icon icon="solar:edit-bold" width="1.1em" height="1.1em" /> Edit
                      </button>
                      <button class="btn btn-sm variant-filled-error" onclick={() => deleteEmployee(employee.id)}>
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

 