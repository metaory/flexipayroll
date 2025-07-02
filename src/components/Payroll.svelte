<script>
  import { employees, attendance, config, currentPeriod } from '../lib/stores.js'
  import { calculateSalary, formatCurrency } from '../lib/core.js'
  import Icon from '@iconify/svelte';
  
  let adjustments = {}
  let adjustmentAmount = ''
  let adjustmentComment = ''
  
  function getMonthAttendance(employeeId, year, month) {
    const monthStr = `${year}-${month.toString().padStart(2, '0')}`
    const empAttendance = $attendance[employeeId] || {}
    const results = {}
    
    for (const [date, data] of Object.entries(empAttendance)) {
      if (date.startsWith(monthStr)) {
        results[date] = data
      }
    }
    return results
  }
  
  function addAdjustment(employeeId) {
    if (!adjustmentAmount || adjustmentAmount === '0') {
      alert('Please enter a valid adjustment amount')
      return
    }
    
    const amount = Number(adjustmentAmount)
    if (!adjustments[employeeId]) {
      adjustments[employeeId] = []
    }
    
    adjustments[employeeId].push({
      id: Date.now().toString(),
      amount,
      comment: adjustmentComment,
      date: new Date().toISOString().split('T')[0]
    })
    
    adjustmentAmount = ''
    adjustmentComment = ''
  }
  
  function removeAdjustment(employeeId, adjustmentId) {
    if (confirm('Are you sure you want to remove this adjustment?')) {
      adjustments[employeeId] = adjustments[employeeId].filter(adj => adj.id !== adjustmentId)
    }
  }
  
  function getEmployeeSalary(employee) {
    const empAttendance = $attendance[employee.id] || {}
    const empAdjustments = adjustments[employee.id] || []
    return calculateSalary(employee, empAttendance, empAdjustments, $config)
  }
  
  function getAdjustmentTotal(employeeId) {
    const empAdjustments = adjustments[employeeId] || []
    return empAdjustments.reduce((sum, adj) => sum + adj.amount, 0)
  }
</script>

<div class="payroll-container">
  <!-- Header Section -->
  <div>
    <h2 class="section-title">Payroll Management</h2>
    <p class="section-desc">Calculate and manage employee salaries</p>
  </div>
  
  {#if $employees.length === 0}
    <div class="empty-card">
      <div class="empty-state">
        <div class="empty-icon"><Icon icon="solar:wallet-bold" width="2.5em" height="2.5em" /></div>
        <p class="empty-title">No employees added yet.</p>
        <p class="empty-desc">Add employees first to calculate payroll.</p>
      </div>
    </div>
  {:else}
    <!-- Salary Calculations -->
    <div class="salary-list">
      {#each $employees as employee}
        {@const salaryBreakdown = getEmployeeSalary(employee)}
        {@const adjustmentTotal = getAdjustmentTotal(employee.id)}
        
        <div class="salary-card">
          <header class="salary-header">
            <h3 class="employee-name">{employee.name}</h3>
            <div class="salary-summary">
              <div class="final-salary">
                {formatCurrency(salaryBreakdown.total)}
              </div>
              <div class="salary-label">Final Salary</div>
            </div>
          </header>
          <section class="salary-body">
            <!-- Salary Breakdown -->
            <div class="breakdown-grid">
              <div class="breakdown-card">
                <h4 class="breakdown-title">Salary Components</h4>
                <div class="breakdown-list">
                  <div class="breakdown-item">
                    <span class="item-label">Basic Salary:</span>
                    <span class="item-value">{formatCurrency(salaryBreakdown.components.basicSalary)}</span>
                  </div>
                  <div class="breakdown-item">
                    <span class="item-label">Bonus E:</span>
                    <span class="item-value bonus">{formatCurrency(salaryBreakdown.components.bonusE)}</span>
                  </div>
                  <div class="breakdown-item">
                    <span class="item-label">Bonus S:</span>
                    <span class="item-value bonus">{formatCurrency(salaryBreakdown.components.bonusS)}</span>
                  </div>
                  <div class="breakdown-item">
                    <span class="item-label">Bonus K:</span>
                    <span class="item-value bonus">{formatCurrency(salaryBreakdown.components.bonusK)}</span>
                  </div>
                  <div class="breakdown-item">
                    <span class="item-label">Bonus M:</span>
                    <span class="item-value bonus">{formatCurrency(salaryBreakdown.components.bonusM)}</span>
                  </div>
                  {#if employee.maritalStatus === 'married'}
                    <div class="breakdown-item">
                      <span class="item-label">Bonus T:</span>
                      <span class="item-value bonus">{formatCurrency(salaryBreakdown.components.bonusT)}</span>
                    </div>
                  {/if}
                  <div class="breakdown-divider">
                    <div class="breakdown-item total">
                      <span class="item-label">Subtotal:</span>
                      <span class="item-value">{formatCurrency(salaryBreakdown.subtotal)}</span>
                    </div>
                    <div class="breakdown-item deduction">
                      <span class="item-label">Insurance (7%):</span>
                      <span class="item-value">-{formatCurrency(salaryBreakdown.components.insuranceDeduction)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="breakdown-card">
                <h4 class="breakdown-title">Work Summary</h4>
                <div class="summary-grid">
                  <div class="summary-item">
                    <div class="summary-number">{salaryBreakdown.period.workdays}</div>
                    <div class="summary-label">Total Days</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-number">{salaryBreakdown.period.hours}</div>
                    <div class="summary-label">Total Hours</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-number regular">{salaryBreakdown.period?.regular || 0}</div>
                    <div class="summary-label">Regular Days</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-number holiday">{salaryBreakdown.period?.holiday || 0}</div>
                    <div class="summary-label">Holidays</div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Adjustments -->
            <div class="adjustments-section">
              <h4 class="adjustments-title">Adjustments</h4>
              
              <!-- Add Adjustment Form -->
              <div class="adjustment-form">
                <label class="form-label">
                  <span class="label-text">Amount (IDR)</span>
                  <input 
                    class="form-input"
                    type="number"
                    bind:value={adjustmentAmount}
                    placeholder="Positive or negative amount"
                  />
                </label>
                <label class="form-label">
                  <span class="label-text">Comment</span>
                  <input 
                    class="form-input"
                    type="text"
                    bind:value={adjustmentComment}
                    placeholder="Reason for adjustment"
                  />
                </label>
                <div class="form-action">
                  <button 
                    class="btn btn-primary"
                    onclick={() => addAdjustment(employee.id)}
                  >
                    <Icon icon="solar:document-add-bold" width="1.1em" height="1.1em" /> Add Adjustment
                  </button>
                </div>
              </div>
              
              <!-- Adjustments List -->
              {#if adjustments[employee.id] && adjustments[employee.id].length > 0}
                <div class="table-container">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Comment</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each adjustments[employee.id] as adjustment}
                        <tr>
                          <td>{new Date(adjustment.date).toLocaleDateString()}</td>
                          <td class={adjustment.amount >= 0 ? 'amount-positive' : 'amount-negative'}>
                            {adjustment.amount >= 0 ? '+' : ''}{formatCurrency(adjustment.amount)}
                          </td>
                          <td>{adjustment.comment}</td>
                          <td>
                            <button 
                              class="btn btn-sm btn-danger"
                              onclick={() => removeAdjustment(employee.id, adjustment.id)}
                            >
                              <Icon icon="solar:trash-bin-trash-bold" width="1.1em" height="1.1em" /> Remove
                            </button>
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
                
                <div class="adjustment-total">
                  <div class="total-label">
                    Adjustment Total: {adjustmentTotal >= 0 ? '+' : ''}{formatCurrency(adjustmentTotal)}
                  </div>
                </div>
              {:else}
                <div class="empty-adjustments">
                  <div class="empty-icon-small"><Icon icon="solar:document-bold" width="2em" height="2em" /></div>
                  <p>No adjustments added yet.</p>
                </div>
              {/if}
            </div>
          </section>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
.payroll-container {
  padding: 1rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0 0 0.5rem 0;
  color: #1976d2;
}

.section-desc {
  color: #666;
  margin: 0 0 2rem 0;
}

.empty-card {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
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
  margin: 0;
}

.salary-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.salary-card {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.salary-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.salary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: #fafafa;
  border-bottom: 1px solid #e0e0e0;
}

.employee-name {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: #1976d2;
}

.salary-summary {
  text-align: right;
}

.final-salary {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1976d2;
}

.salary-label {
  font-size: 0.875rem;
  color: #666;
}

.salary-body {
  padding: 1.5rem;
}

.breakdown-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.breakdown-card {
  background: #fafafa;
  padding: 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid #e0e0e0;
}

.breakdown-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: #1976d2;
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-label {
  color: #666;
}

.item-value {
  font-family: monospace;
  font-weight: 500;
}

.item-value.bonus {
  color: #2e7d32;
}

.breakdown-divider {
  border-top: 1px solid #e0e0e0;
  padding-top: 0.75rem;
  margin-top: 0.75rem;
}

.breakdown-item.total {
  font-weight: bold;
}

.breakdown-item.deduction {
  color: #d32f2f;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.summary-item {
  text-align: center;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 0.375rem;
}

.summary-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1976d2;
}

.summary-number.regular {
  color: #2e7d32;
}

.summary-number.holiday {
  color: #f57c00;
}

.summary-label {
  font-size: 0.875rem;
  color: #666;
  margin-top: 0.25rem;
}

.adjustments-section {
  border-top: 1px solid #e0e0e0;
  padding-top: 1.5rem;
}

.adjustments-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
}

.adjustment-form {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: end;
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

.form-input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.form-input:focus {
  outline: none;
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}

.form-action {
  display: flex;
  align-items: end;
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

.table-container {
  overflow-x: auto;
  margin-bottom: 1rem;
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

.data-table tr:hover {
  background: #f0f0f0;
}

.amount-positive {
  color: #2e7d32;
  font-family: monospace;
  font-weight: 500;
}

.amount-negative {
  color: #d32f2f;
  font-family: monospace;
  font-weight: 500;
}

.adjustment-total {
  text-align: right;
  padding: 1rem;
  background: #fafafa;
  border-radius: 0.375rem;
}

.total-label {
  font-size: 1.125rem;
  font-weight: bold;
}

.empty-adjustments {
  text-align: center;
  padding: 2rem 1rem;
  color: #666;
}

.empty-icon-small {
  font-size: 2rem;
  color: #ccc;
  margin-bottom: 0.5rem;
}

@media (max-width: 768px) {
  .breakdown-grid {
    grid-template-columns: 1fr;
  }
  
  .adjustment-form {
    grid-template-columns: 1fr;
  }
}
</style>

 