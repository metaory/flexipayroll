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

<div class="space-y-6">
  <!-- Header Section -->
  <div>
    <h2 class="h2 text-primary-500">Payroll Management</h2>
    <p class="text-surface-600-400-token mt-1">Calculate and manage employee salaries</p>
  </div>
  
  {#if $employees.length === 0}
    <div class="card p-6">
      <div class="text-center py-12">
        <div class="text-6xl mb-4 text-surface-400-600-token"><Icon icon="solar:wallet-bold" width="2.5em" height="2.5em" /></div>
        <p class="text-surface-600-400-token text-lg">No employees added yet.</p>
        <p class="text-surface-500-500-token">Add employees first to calculate payroll.</p>
      </div>
    </div>
  {:else}
    <!-- Salary Calculations -->
    <div class="space-y-6">
      {#each $employees as employee}
        {@const salaryBreakdown = getEmployeeSalary(employee)}
        {@const adjustmentTotal = getAdjustmentTotal(employee.id)}
        
        <div class="card p-6 transition-all duration-300 hover:shadow-lg">
          <header class="card-header">
            <h3 class="h3">{employee.name}</h3>
            <div class="text-right">
              <div class="text-2xl font-bold text-primary-500">
                {formatCurrency(salaryBreakdown.total)}
              </div>
              <div class="text-sm text-surface-600-400-token">Final Salary</div>
            </div>
          </header>
          <section class="card-body">
            <!-- Salary Breakdown -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
              <div class="card p-4 bg-surface-50-900-token">
                <h4 class="h4 mb-4 text-primary-500">Salary Components</h4>
                <div class="space-y-3">
                  <div class="flex justify-between items-center">
                    <span class="text-surface-600-400-token">Basic Salary:</span>
                    <span class="font-mono font-medium">{formatCurrency(salaryBreakdown.components.basicSalary)}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-surface-600-400-token">Bonus E:</span>
                    <span class="font-mono font-medium text-success-500">{formatCurrency(salaryBreakdown.components.bonusE)}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-surface-600-400-token">Bonus S:</span>
                    <span class="font-mono font-medium text-success-500">{formatCurrency(salaryBreakdown.components.bonusS)}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-surface-600-400-token">Bonus K:</span>
                    <span class="font-mono font-medium text-success-500">{formatCurrency(salaryBreakdown.components.bonusK)}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-surface-600-400-token">Bonus M:</span>
                    <span class="font-mono font-medium text-success-500">{formatCurrency(salaryBreakdown.components.bonusM)}</span>
                  </div>
                  {#if employee.maritalStatus === 'married'}
                    <div class="flex justify-between items-center">
                      <span class="text-surface-600-400-token">Bonus T:</span>
                      <span class="font-mono font-medium text-success-500">{formatCurrency(salaryBreakdown.components.bonusT)}</span>
                    </div>
                  {/if}
                  <div class="border-t pt-3 mt-3">
                    <div class="flex justify-between items-center font-bold">
                      <span>Subtotal:</span>
                      <span class="font-mono">{formatCurrency(salaryBreakdown.subtotal)}</span>
                    </div>
                    <div class="flex justify-between items-center text-error-500">
                      <span>Insurance (7%):</span>
                      <span class="font-mono">-{formatCurrency(salaryBreakdown.components.insuranceDeduction)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="card p-4 bg-surface-50-900-token">
                <h4 class="h4 mb-4 text-primary-500">Work Summary</h4>
                <div class="grid grid-cols-2 gap-4">
                  <div class="text-center p-3 bg-surface-100-800-token rounded-lg">
                    <div class="text-2xl font-bold text-primary-500">{salaryBreakdown.period.workdays}</div>
                    <div class="text-sm text-surface-600-400-token">Total Days</div>
                  </div>
                  <div class="text-center p-3 bg-surface-100-800-token rounded-lg">
                    <div class="text-2xl font-bold text-primary-500">{salaryBreakdown.period.hours}</div>
                    <div class="text-sm text-surface-600-400-token">Total Hours</div>
                  </div>
                  <div class="text-center p-3 bg-surface-100-800-token rounded-lg">
                    <div class="text-xl font-bold text-success-500">{salaryBreakdown.period?.regular || 0}</div>
                    <div class="text-sm text-surface-600-400-token">Regular Days</div>
                  </div>
                  <div class="text-center p-3 bg-surface-100-800-token rounded-lg">
                    <div class="text-xl font-bold text-warning-500">{salaryBreakdown.period?.holiday || 0}</div>
                    <div class="text-sm text-surface-600-400-token">Holidays</div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Adjustments -->
            <div class="border-t pt-6">
              <h4 class="h4 mb-4">Adjustments</h4>
              
              <!-- Add Adjustment Form -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <label class="label">
                  <span>Amount (IDR)</span>
                  <input 
                    class="input"
                    type="number"
                    bind:value={adjustmentAmount}
                    placeholder="Positive or negative amount"
                  />
                </label>
                <label class="label">
                  <span>Comment</span>
                  <input 
                    class="input"
                    type="text"
                    bind:value={adjustmentComment}
                    placeholder="Reason for adjustment"
                  />
                </label>
                <div class="flex items-end">
                  <button 
                    class="btn variant-filled-primary"
                    onclick={() => addAdjustment(employee.id)}
                  >
                    <Icon icon="solar:document-add-bold" width="1.1em" height="1.1em" /> Add Adjustment
                  </button>
                </div>
              </div>
              
              <!-- Adjustments List -->
              {#if adjustments[employee.id] && adjustments[employee.id].length > 0}
                <div class="table-wrap">
                  <table class="table">
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
                        <tr class="hover:bg-surface-100-800-token transition-colors duration-200">
                          <td>{new Date(adjustment.date).toLocaleDateString()}</td>
                          <td class={adjustment.amount >= 0 ? 'text-success-500 font-mono font-medium' : 'text-error-500 font-mono font-medium'}>
                            {adjustment.amount >= 0 ? '+' : ''}{formatCurrency(adjustment.amount)}
                          </td>
                          <td>{adjustment.comment}</td>
                          <td>
                            <button 
                              class="btn btn-sm variant-filled-error"
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
                
                <div class="text-right mt-4 p-4 bg-surface-50-900-token rounded-lg">
                  <div class="text-lg font-bold">
                    Adjustment Total: {adjustmentTotal >= 0 ? '+' : ''}{formatCurrency(adjustmentTotal)}
                  </div>
                </div>
              {:else}
                <div class="text-center py-8 text-surface-600-400-token">
                  <div class="text-4xl mb-2"><Icon icon="solar:document-bold" width="2em" height="2em" /></div>
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

 