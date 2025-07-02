<script>
  import { employees, formatDate } from '../lib/stores.js'
  import { validateEmployee, EMPLOYEE_ATTRIBUTES, formatCurrency } from '../lib/core.js'
  import Icon from '@iconify/svelte';
  
  let showAddForm = false
  let editingEmployee = null
  let formData = {
    name: '',
    gender: 'male',
    maritalStatus: 'single',
    monthlySalary: ''
  }
  
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

<div class="employees-container">
  <!-- Header Section -->
  <div class="header-section">
    <div>
      <h2 class="section-title">Employee Management</h2>
      <p class="section-desc">Manage your workforce and employee information</p>
    </div>
    <button class="btn btn-primary" onclick={() => showAddForm = true}>
      <span class="btn-icon"><Icon icon="solar:user-plus-bold" width="1.2em" height="1.2em" /></span> Add Employee
    </button>
  </div>

  <!-- Add/Edit Form -->
  {#if showAddForm}
    <div class="form-card">
      <header class="form-header">
        <h3 class="form-title">{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h3>
      </header>
      <section class="form-body">
        <div class="form-grid">
          <label class="form-label">
            <span class="label-text">Full Name</span>
            <input 
              class="form-input"
              bind:value={formData.name}
              placeholder="Enter employee name"
              required
            />
          </label>
          
          <label class="form-label">
            <span class="label-text">Gender</span>
            <select class="form-select" bind:value={formData.gender}>
              {#each EMPLOYEE_ATTRIBUTES.GENDER as gender}
                <option value={gender}>{gender.charAt(0).toUpperCase() + gender.slice(1)}</option>
              {/each}
            </select>
          </label>
          
          <label class="form-label">
            <span class="label-text">Marital Status</span>
            <select class="form-select" bind:value={formData.maritalStatus}>
              {#each EMPLOYEE_ATTRIBUTES.MARITAL_STATUS as status}
                <option value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
              {/each}
            </select>
          </label>
          
          <label class="form-label">
            <span class="label-text">Monthly Salary (IDR)</span>
            <input 
              class="form-input"
              type="number"
              bind:value={formData.monthlySalary}
              placeholder="Enter monthly salary"
              min="0"
              required
            />
          </label>
        </div>
        
        <div class="form-actions">
          <button class="btn btn-primary" onclick={editingEmployee ? updateEmployee : addEmployee}>
            <span class="btn-icon"><Icon icon={editingEmployee ? 'solar:refresh-bold' : 'solar:user-plus-bold'} width="1.2em" height="1.2em" /></span>
            {editingEmployee ? 'Update' : 'Add'} Employee
          </button>
          <button class="btn btn-secondary" onclick={cancelForm}>
            Cancel
          </button>
        </div>
      </section>
    </div>
  {/if}

  <!-- Employee List -->
  <div class="list-card">
    <header class="list-header">
      <h3 class="list-title">Employee Directory</h3>
      <p class="list-desc">Total: {$employees.length} employees</p>
    </header>
    <section class="list-body">
      {#if $employees.length === 0}
        <div class="empty-state">
          <div class="empty-icon"><Icon icon="solar:users-group-rounded-bold" width="2.5em" height="2.5em" /></div>
          <h4 class="empty-title">No employees yet</h4>
          <p class="empty-desc">Get started by adding your first employee</p>
          <button class="btn btn-primary" onclick={() => showAddForm = true}>
            <span class="btn-icon"><Icon icon="solar:user-plus-bold" width="1.2em" height="1.2em" /></span> Add First Employee
          </button>
        </div>
      {:else}
        <div class="table-container">
          <table class="data-table">
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
                <tr class={index % 2 === 0 ? 'row-even' : 'row-odd'}>
                  <td class="employee-name">{employee.name}</td>
                  <td>
                    <span class="badge badge-{employee.gender === 'male' ? 'primary' : 'secondary'}">
                      {employee.gender.charAt(0).toUpperCase() + employee.gender.slice(1)}
                    </span>
                  </td>
                  <td>
                    <span class="badge badge-{employee.maritalStatus === 'married' ? 'success' : 'warning'}">
                      {employee.maritalStatus.charAt(0).toUpperCase() + employee.maritalStatus.slice(1)}
                    </span>
                  </td>
                  <td class="salary">{formatCurrency(employee.monthlySalary)}</td>
                  <td>
                    <div class="action-buttons">
                      <button class="btn btn-sm btn-secondary" onclick={() => editEmployee(employee)}>
                        <Icon icon="solar:edit-bold" width="1.1em" height="1.1em" /> Edit
                      </button>
                      <button class="btn btn-sm btn-danger" onclick={() => deleteEmployee(employee.id)}>
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

<style>
.employees-container {
  padding: 1rem;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0 0 0.5rem 0;
  color: #1976d2;
}

.section-desc {
  color: #666;
  margin: 0;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-primary {
  background: #1976d2;
  color: white;
}

.btn-primary:hover {
  background: #1565c0;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-danger {
  background: #d32f2f;
  color: white;
}

.btn-danger:hover {
  background: #c62828;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.btn-icon {
  display: flex;
  align-items: center;
}

.form-card, .list-card {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  overflow: hidden;
}

.form-header, .list-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
}

.form-title, .list-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: #1976d2;
}

.list-desc {
  color: #666;
  margin: 0.5rem 0 0 0;
}

.form-body, .list-body {
  padding: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label-text {
  font-weight: 500;
  color: #333;
}

.form-input, .form-select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}

.form-actions {
  display: flex;
  gap: 1rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
}

.empty-icon {
  font-size: 4rem;
  color: #ccc;
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1.25rem;
  color: #666;
  margin: 0 0 0.5rem 0;
}

.empty-desc {
  color: #999;
  margin: 0 0 1.5rem 0;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background: #f5f5f5;
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #e0e0e0;
}

.data-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #f0f0f0;
}

.row-even {
  background: #fafafa;
}

.row-odd {
  background: white;
}

.data-table tr:hover {
  background: #f0f0f0;
}

.employee-name {
  font-weight: 600;
  color: #1976d2;
}

.salary {
  font-family: monospace;
  font-weight: bold;
  color: #2e7d32;
}

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-primary {
  background: #e3f2fd;
  color: #1976d2;
}

.badge-secondary {
  background: #f3e5f5;
  color: #7b1fa2;
}

.badge-success {
  background: #e8f5e8;
  color: #2e7d32;
}

.badge-warning {
  background: #fff3e0;
  color: #f57c00;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}
</style>

 