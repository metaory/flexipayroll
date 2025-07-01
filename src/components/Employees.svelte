<script>
  import { employees, formatDate } from '../lib/stores.js'
  import { validateEmployee, EMPLOYEE_ATTRIBUTES, formatCurrency } from '../lib/core.js'
  
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
      alert('Validation errors:\n' + validation.errors.join('\n'))
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
      alert('Validation errors:\n' + validation.errors.join('\n'))
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
  <div class="header">
    <h2>Employee Management</h2>
    <button class="btn btn-primary" on:click={() => showAddForm = true}>
      Add Employee
    </button>
  </div>

  {#if showAddForm}
    <div class="form-container">
      <h3>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h3>
      
      <div class="form-grid">
        <div class="form-group">
          <label for="name">Name</label>
          <input 
            id="name"
            type="text" 
            bind:value={formData.name}
            placeholder="Employee name"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="gender">Gender</label>
          <select id="gender" bind:value={formData.gender}>
            {#each EMPLOYEE_ATTRIBUTES.GENDER as gender}
              <option value={gender}>{gender.charAt(0).toUpperCase() + gender.slice(1)}</option>
            {/each}
          </select>
        </div>
        
        <div class="form-group">
          <label for="maritalStatus">Marital Status</label>
          <select id="maritalStatus" bind:value={formData.maritalStatus}>
            {#each EMPLOYEE_ATTRIBUTES.MARITAL_STATUS as status}
              <option value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
            {/each}
          </select>
        </div>
        
        <div class="form-group">
          <label for="monthlySalary">Monthly Salary (IDR)</label>
          <input 
            id="monthlySalary"
            type="number" 
            bind:value={formData.monthlySalary}
            placeholder="Monthly salary"
            min="0"
            required
          />
        </div>
      </div>
      
      <div class="form-actions">
        <button class="btn btn-primary" on:click={editingEmployee ? updateEmployee : addEmployee}>
          {editingEmployee ? 'Update' : 'Add'} Employee
        </button>
        <button class="btn btn-secondary" on:click={cancelForm}>
          Cancel
        </button>
      </div>
    </div>
  {/if}

  <div class="employees-list">
    {#if $employees.length === 0}
      <div class="empty-state">
        <p>No employees added yet. Click "Add Employee" to get started.</p>
      </div>
    {:else}
      <div class="table-container">
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
                <td>{employee.name}</td>
                <td>{employee.gender.charAt(0).toUpperCase() + employee.gender.slice(1)}</td>
                <td>{employee.maritalStatus.charAt(0).toUpperCase() + employee.maritalStatus.slice(1)}</td>
                <td>{formatCurrency(employee.monthlySalary)}</td>
                <td>
                  <button class="btn btn-small" on:click={() => editEmployee(employee)}>
                    Edit
                  </button>
                  <button class="btn btn-small btn-danger" on:click={() => deleteEmployee(employee.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

<style>
  .employees-container {
    max-width: 100%;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .header h2 {
    margin: 0;
    color: #333;
  }

  .form-container {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    border: 1px solid #e0e0e0;
  }

  .form-container h3 {
    margin: 0 0 20px 0;
    color: #333;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  .form-group label {
    margin-bottom: 5px;
    font-weight: 500;
    color: #555;
  }

  .form-group input,
  .form-group select {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }

  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: #ff6b35;
    box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.2);
  }

  .form-actions {
    display: flex;
    gap: 10px;
  }

  .btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .btn-primary {
    background: #ff6b35;
    color: white;
  }

  .btn-primary:hover {
    background: #e55a2b;
  }

  .btn-secondary {
    background: #6c757d;
    color: white;
  }

  .btn-secondary:hover {
    background: #5a6268;
  }

  .btn-danger {
    background: #dc3545;
    color: white;
  }

  .btn-danger:hover {
    background: #c82333;
  }

  .btn-small {
    padding: 4px 8px;
    font-size: 12px;
    margin-right: 5px;
  }

  .empty-state {
    text-align: center;
    padding: 40px;
    color: #666;
  }

  .table-container {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
  }

  th {
    background: #f8f9fa;
    font-weight: 600;
    color: #333;
  }

  tr:hover {
    background: #f8f9fa;
  }

  td:last-child {
    white-space: nowrap;
  }
</style> 