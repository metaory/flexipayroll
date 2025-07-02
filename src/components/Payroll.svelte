<script>
  import { employees, attendance, config, currentPeriod } from '../lib/stores.js'
  import { calculateSalary, formatCurrency } from '../lib/core.js'
  import Icon from '@iconify/svelte';
  
  const adjustments = $state({})
  let adjustmentAmount = $state('')
  let adjustmentComment = $state('')
  
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

<div>
  <div class="xpayroll-card">
    <div class="xpayroll-card__header">
      <h2>Payroll Management</h2>
      <p>Calculate and manage employee salaries</p>
    </div>
  </div>
  
  {#if $employees.length === 0}
    <div class="xpayroll-card" style="margin-top: 1rem;">
      <div class="xpayroll-card__body">
        <div class="xpayroll-empty-state">
          <Icon icon="solar:wallet-bold" width="2.5em" height="2.5em" />
          <p>No employees added yet.</p>
          <p>Add employees first to calculate payroll.</p>
        </div>
      </div>
    </div>
  {:else}
    <div>
      {#each $employees as employee}
        {@const salaryBreakdown = getEmployeeSalary(employee)}
        {@const adjustmentTotal = getAdjustmentTotal(employee.id)}
        
        <div class="xpayroll-card" style="margin-top: 1rem;">
          <div class="xpayroll-card__header">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h3>{employee.name}</h3>
              <div style="text-align: center;">
                <div style="font-size: 1.5rem; font-weight: bold; color: color('success', 'xpayroll');">
                  {formatCurrency(salaryBreakdown.total)}
                </div>
                <div style="font-size: 0.875rem; color: color('text-muted', 'xpayroll');">Final Salary</div>
              </div>
            </div>
          </div>
          <div class="xpayroll-card__body">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
              <div>
                <h4>Salary Components</h4>
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                  <div style="display: flex; justify-content: space-between;">
                    <span>Basic Salary:</span>
                    <span>{formatCurrency(salaryBreakdown.components.basicSalary)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span>Bonus E:</span>
                    <span>{formatCurrency(salaryBreakdown.components.bonusE)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span>Bonus S:</span>
                    <span>{formatCurrency(salaryBreakdown.components.bonusS)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span>Bonus K:</span>
                    <span>{formatCurrency(salaryBreakdown.components.bonusK)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span>Bonus M:</span>
                    <span>{formatCurrency(salaryBreakdown.components.bonusM)}</span>
                  </div>
                  {#if employee.maritalStatus === 'married'}
                    <div style="display: flex; justify-content: space-between;">
                      <span>Bonus T:</span>
                      <span>{formatCurrency(salaryBreakdown.components.bonusT)}</span>
                    </div>
                  {/if}
                  <hr style="margin: 0.5rem 0; border: none; border-top: 1px solid color('border', 'xpayroll');" />
                  <div style="display: flex; justify-content: space-between; font-weight: bold;">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(salaryBreakdown.subtotal)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; color: color('danger', 'xpayroll');">
                    <span>Insurance (7%):</span>
                    <span>-{formatCurrency(salaryBreakdown.components.insuranceDeduction)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4>Work Summary</h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                  <div style="text-align: center; padding: 1rem; background: color('surface-alt', 'xpayroll'); border-radius: 0.5rem;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: color('primary', 'xpayroll');">{salaryBreakdown.period.workdays}</div>
                    <div style="font-size: 0.875rem; color: color('text-muted', 'xpayroll');">Total Days</div>
                  </div>
                  <div style="text-align: center; padding: 1rem; background: color('surface-alt', 'xpayroll'); border-radius: 0.5rem;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: color('primary', 'xpayroll');">{salaryBreakdown.period.hours}</div>
                    <div style="font-size: 0.875rem; color: color('text-muted', 'xpayroll');">Total Hours</div>
                  </div>
                  <div style="text-align: center; padding: 1rem; background: color('surface-alt', 'xpayroll'); border-radius: 0.5rem;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: color('success', 'xpayroll');">{salaryBreakdown.period['byType']?.['regular'] || 0}</div>
                    <div style="font-size: 0.875rem; color: color('text-muted', 'xpayroll');">Regular Days</div>
                  </div>
                  <div style="text-align: center; padding: 1rem; background: color('surface-alt', 'xpayroll'); border-radius: 0.5rem;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: color('warning', 'xpayroll');">{salaryBreakdown.period['byType']?.['holiday'] || 0}</div>
                    <div style="font-size: 0.875rem; color: color('text-muted', 'xpayroll');">Holidays</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div style="margin-top: 2rem;">
              <h4>Adjustments</h4>
              
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                <div class="xpayroll-form__group">
                  <label class="xpayroll-form__label" for="adjustment-amount">Amount (IDR)</label>
                  <input 
                    id="adjustment-amount"
                    class="xpayroll-form__input"
                    type="number"
                    bind:value={adjustmentAmount}
                    placeholder="Positive or negative amount"
                  />
                </div>
                <div class="xpayroll-form__group">
                  <label class="xpayroll-form__label" for="adjustment-comment">Comment</label>
                  <input 
                    id="adjustment-comment"
                    class="xpayroll-form__input"
                    type="text"
                    bind:value={adjustmentComment}
                    placeholder="Reason for adjustment"
                  />
                </div>
                <div class="xpayroll-form__group" style="display: flex; align-items: end;">
                  <button class="xpayroll-btn xpayroll-btn--primary" onclick={() => addAdjustment(employee.id)}>
                    <Icon icon="solar:document-add-bold" width="1.1em" height="1.1em" /> Add Adjustment
                  </button>
                </div>
              </div>
              
              {#if adjustments[employee.id] && adjustments[employee.id].length > 0}
                <div style="overflow-x: auto;">
                  <table class="xpayroll-table">
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
                          <td>
                            {adjustment.amount >= 0 ? '+' : ''}{formatCurrency(adjustment.amount)}
                          </td>
                          <td>{adjustment.comment}</td>
                          <td>
                            <button class="xpayroll-btn xpayroll-btn--danger" onclick={() => removeAdjustment(employee.id, adjustment.id)}>
                              <Icon icon="solar:trash-bin-trash-bold" width="1.1em" height="1.1em" /> Remove
                            </button>
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
                
                <div style="margin-top: 1rem; padding: 1rem; background: color('surface-alt', 'xpayroll'); border-radius: 0.5rem; text-align: center;">
                  <div style="font-weight: bold; font-size: 1.1rem;">
                    Adjustment Total: {adjustmentTotal >= 0 ? '+' : ''}{formatCurrency(adjustmentTotal)}
                  </div>
                </div>
              {:else}
                <div class="xpayroll-empty-state">
                  <Icon icon="solar:document-bold" width="2em" height="2em" />
                  <p>No adjustments added yet.</p>
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>



 