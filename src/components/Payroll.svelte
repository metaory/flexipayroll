<script>
  import { employees, attendance, config, currentPeriod } from '../lib/stores.js'
  import { calculateSalary, formatCurrency } from '../lib/core.js'
  
  let selectedEmployee = ''
  let adjustments = []
  let newAdjustment = { amount: '', comment: '' }
  
  $: selectedEmployeeData = $employees.find(emp => emp.id === selectedEmployee)
  $: monthAttendance = selectedEmployee ? getMonthAttendance(selectedEmployee, $currentPeriod.year, $currentPeriod.month) : {}
  $: salaryBreakdown = selectedEmployeeData && monthAttendance ? 
    calculateSalary(selectedEmployeeData, monthAttendance, adjustments, $config) : null
  
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
  
  function addAdjustment() {
    if (!newAdjustment.amount || isNaN(newAdjustment.amount)) {
      alert('Please enter a valid adjustment amount')
      return
    }
    
    adjustments = [...adjustments, {
      id: Date.now().toString(),
      amount: Number(newAdjustment.amount),
      comment: newAdjustment.comment
    }]
    
    newAdjustment = { amount: '', comment: '' }
  }
  
  function removeAdjustment(id) {
    adjustments = adjustments.filter(adj => adj.id !== id)
  }
  
  function exportPayroll() {
    if (!salaryBreakdown) return
    
    const data = {
      employee: selectedEmployeeData,
      period: `${$currentPeriod.year}-${$currentPeriod.month.toString().padStart(2, '0')}`,
      breakdown: salaryBreakdown,
      adjustments: adjustments
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payroll-${selectedEmployeeData.name}-${data.period}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  function printPayroll() {
    window.print()
  }
</script>

<div class="payroll-container">
  <div class="header">
    <h2>Payroll Calculation</h2>
  </div>

  <div class="controls">
    <div class="form-group">
      <label for="employee">Employee</label>
      <select id="employee" bind:value={selectedEmployee}>
        <option value="">Select Employee</option>
        {#each $employees as employee}
          <option value={employee.id}>{employee.name}</option>
        {/each}
      </select>
    </div>
    
    <div class="form-group">
      <label for="year">Year</label>
      <select id="year" bind:value={$currentPeriod.year}>
        {#each Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i) as year}
          <option value={year}>{year}</option>
        {/each}
      </select>
    </div>
    
    <div class="form-group">
      <label for="month">Month</label>
      <select id="month" bind:value={$currentPeriod.month}>
        {#each Array.from({length: 12}, (_, i) => i + 1) as month}
          <option value={month}>{new Date(2024, month - 1).toLocaleDateString('en-US', { month: 'long' })}</option>
        {/each}
      </select>
    </div>
  </div>

  {#if selectedEmployee && selectedEmployeeData}
    <div class="payroll-content">
      <div class="employee-info">
        <h3>{selectedEmployeeData.name}</h3>
        <p>Period: {$currentPeriod.year}-{$currentPeriod.month.toString().padStart(2, '0')}</p>
        <p>Marital Status: {selectedEmployeeData.maritalStatus.charAt(0).toUpperCase() + selectedEmployeeData.maritalStatus.slice(1)}</p>
      </div>

      {#if salaryBreakdown}
        <div class="salary-breakdown">
          <h3>Salary Breakdown</h3>
          
          <div class="breakdown-grid">
            <div class="breakdown-section">
              <h4>Basic Salary</h4>
              <div class="amount">{formatCurrency(salaryBreakdown.components.basicSalary)}</div>
              <div class="details">
                <div>Hours: {salaryBreakdown.period.hours}</div>
                <div>Days: {salaryBreakdown.period.workdays}</div>
              </div>
            </div>
            
            <div class="breakdown-section">
              <h4>Bonuses</h4>
              <div class="bonus-item">
                <span>Bonus E:</span>
                <span>{formatCurrency(salaryBreakdown.components.bonusE)}</span>
              </div>
              <div class="bonus-item">
                <span>Bonus S:</span>
                <span>{formatCurrency(salaryBreakdown.components.bonusS)}</span>
              </div>
              <div class="bonus-item">
                <span>Bonus K:</span>
                <span>{formatCurrency(salaryBreakdown.components.bonusK)}</span>
              </div>
              <div class="bonus-item">
                <span>Bonus M:</span>
                <span>{formatCurrency(salaryBreakdown.components.bonusM)}</span>
              </div>
              <div class="bonus-item">
                <span>Bonus T:</span>
                <span>{formatCurrency(salaryBreakdown.components.bonusT)}</span>
              </div>
            </div>
            
            <div class="breakdown-section">
              <h4>Adjustments</h4>
              {#if adjustments.length > 0}
                {#each adjustments as adjustment}
                  <div class="adjustment-item">
                    <span>{adjustment.comment || 'Adjustment'}:</span>
                    <span class="{adjustment.amount >= 0 ? 'positive' : 'negative'}">
                      {formatCurrency(adjustment.amount)}
                    </span>
                  </div>
                {/each}
              {:else}
                <div class="no-adjustments">No adjustments</div>
              {/if}
            </div>
            
            <div class="breakdown-section">
              <h4>Deductions</h4>
              <div class="deduction-item">
                <span>Insurance (7%):</span>
                <span class="negative">{formatCurrency(salaryBreakdown.components.insuranceDeduction)}</span>
              </div>
            </div>
          </div>
          
          <div class="total-section">
            <div class="subtotal">
              <span>Subtotal:</span>
              <span>{formatCurrency(salaryBreakdown.subtotal)}</span>
            </div>
            <div class="final-total">
              <span>Final Total:</span>
              <span>{formatCurrency(salaryBreakdown.total)}</span>
            </div>
          </div>
        </div>

        <div class="adjustments-section">
          <h3>Add Adjustments</h3>
          <div class="adjustment-form">
            <div class="form-group">
              <label for="amount">Amount (IDR)</label>
              <input 
                id="amount"
                type="number" 
                bind:value={newAdjustment.amount}
                placeholder="Enter amount (positive or negative)"
              />
            </div>
            <div class="form-group">
              <label for="comment">Comment (optional)</label>
              <input 
                id="comment"
                type="text" 
                bind:value={newAdjustment.comment}
                placeholder="Reason for adjustment"
              />
            </div>
            <button class="btn btn-primary" on:click={addAdjustment}>
              Add Adjustment
            </button>
          </div>
        </div>

        <div class="actions">
          <button class="btn btn-primary" on:click={exportPayroll}>
            Export Payroll
          </button>
          <button class="btn btn-secondary" on:click={printPayroll}>
            Print Payroll
          </button>
        </div>
      {:else}
        <div class="no-data">
          <p>No attendance data found for this employee in the selected period.</p>
        </div>
      {/if}
    </div>
  {:else}
    <div class="empty-state">
      <p>Please select an employee to calculate payroll.</p>
    </div>
  {/if}
</div>

<style>
  .payroll-container {
    max-width: 100%;
  }

  .header {
    margin-bottom: 20px;
  }

  .header h2 {
    margin: 0;
    color: #333;
  }

  .controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
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

  .payroll-content {
    background: white;
    border-radius: 8px;
    padding: 30px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .employee-info {
    text-align: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 2px solid #e0e0e0;
  }

  .employee-info h3 {
    margin: 0 0 10px 0;
    color: #333;
    font-size: 1.5rem;
  }

  .employee-info p {
    margin: 5px 0;
    color: #666;
  }

  .salary-breakdown {
    margin-bottom: 30px;
  }

  .salary-breakdown h3 {
    margin: 0 0 20px 0;
    color: #333;
  }

  .breakdown-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }

  .breakdown-section {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
  }

  .breakdown-section h4 {
    margin: 0 0 15px 0;
    color: #333;
    font-size: 1.1rem;
  }

  .amount {
    font-size: 1.5rem;
    font-weight: 600;
    color: #28a745;
    margin-bottom: 10px;
  }

  .details {
    font-size: 0.9rem;
    color: #666;
  }

  .bonus-item,
  .adjustment-item,
  .deduction-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 0.9rem;
  }

  .positive {
    color: #28a745;
    font-weight: 600;
  }

  .negative {
    color: #dc3545;
    font-weight: 600;
  }

  .no-adjustments {
    color: #666;
    font-style: italic;
  }

  .total-section {
    background: #e9ecef;
    padding: 20px;
    border-radius: 8px;
    border: 2px solid #dee2e6;
  }

  .subtotal {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    font-size: 1.1rem;
    font-weight: 500;
  }

  .final-total {
    display: flex;
    justify-content: space-between;
    font-size: 1.3rem;
    font-weight: 600;
    color: #333;
    border-top: 1px solid #dee2e6;
    padding-top: 10px;
  }

  .adjustments-section {
    margin-bottom: 30px;
  }

  .adjustments-section h3 {
    margin: 0 0 20px 0;
    color: #333;
  }

  .adjustment-form {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: 15px;
    align-items: end;
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
  }

  .actions {
    display: flex;
    gap: 15px;
    justify-content: center;
  }

  .btn {
    padding: 12px 24px;
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

  .empty-state,
  .no-data {
    text-align: center;
    padding: 40px;
    color: #666;
  }

  @media print {
    .controls,
    .adjustments-section,
    .actions {
      display: none;
    }
    
    .payroll-content {
      box-shadow: none;
      padding: 0;
    }
  }

  @media (max-width: 768px) {
    .breakdown-grid {
      grid-template-columns: 1fr;
    }
    
    .adjustment-form {
      grid-template-columns: 1fr;
    }
    
    .actions {
      flex-direction: column;
    }
  }
</style> 