<script>
  import { employees, attendance, config, currentPeriod } from '../lib/stores.js'
  import { calculateSalary, formatCurrency } from '../lib/core.js'
  import Icon from '@iconify/svelte';
  
  let adjustments = $state({})
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
  <div>
    <h2>Payroll Management</h2>
    <p>Calculate and manage employee salaries</p>
  </div>
  
  {#if $employees.length === 0}
    <div>
      <div>
        <div><Icon icon="solar:wallet-bold" width="2.5em" height="2.5em" /></div>
        <p>No employees added yet.</p>
        <p>Add employees first to calculate payroll.</p>
      </div>
    </div>
  {:else}
    <div>
      {#each $employees as employee}
        {@const salaryBreakdown = getEmployeeSalary(employee)}
        {@const adjustmentTotal = getAdjustmentTotal(employee.id)}
        
        <div>
          <header>
            <h3>{employee.name}</h3>
            <div>
              <div>
                {formatCurrency(salaryBreakdown.total)}
              </div>
              <div>Final Salary</div>
            </div>
          </header>
          <section>
            <div>
              <div>
                <h4>Salary Components</h4>
                <div>
                  <div>
                    <span>Basic Salary:</span>
                    <span>{formatCurrency(salaryBreakdown.components.basicSalary)}</span>
                  </div>
                  <div>
                    <span>Bonus E:</span>
                    <span>{formatCurrency(salaryBreakdown.components.bonusE)}</span>
                  </div>
                  <div>
                    <span>Bonus S:</span>
                    <span>{formatCurrency(salaryBreakdown.components.bonusS)}</span>
                  </div>
                  <div>
                    <span>Bonus K:</span>
                    <span>{formatCurrency(salaryBreakdown.components.bonusK)}</span>
                  </div>
                  <div>
                    <span>Bonus M:</span>
                    <span>{formatCurrency(salaryBreakdown.components.bonusM)}</span>
                  </div>
                  {#if employee.maritalStatus === 'married'}
                    <div>
                      <span>Bonus T:</span>
                      <span>{formatCurrency(salaryBreakdown.components.bonusT)}</span>
                    </div>
                  {/if}
                  <div>
                    <div>
                      <span>Subtotal:</span>
                      <span>{formatCurrency(salaryBreakdown.subtotal)}</span>
                    </div>
                    <div>
                      <span>Insurance (7%):</span>
                      <span>-{formatCurrency(salaryBreakdown.components.insuranceDeduction)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4>Work Summary</h4>
                <div>
                  <div>
                    <div>{salaryBreakdown.period.workdays}</div>
                    <div>Total Days</div>
                  </div>
                  <div>
                    <div>{salaryBreakdown.period.hours}</div>
                    <div>Total Hours</div>
                  </div>
                  <div>
                    <div>{salaryBreakdown.period?.regular || 0}</div>
                    <div>Regular Days</div>
                  </div>
                  <div>
                    <div>{salaryBreakdown.period?.holiday || 0}</div>
                    <div>Holidays</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4>Adjustments</h4>
              
              <div>
                <label>
                  <span>Amount (IDR)</span>
                  <input 
                    type="number"
                    bind:value={adjustmentAmount}
                    placeholder="Positive or negative amount"
                  />
                </label>
                <label>
                  <span>Comment</span>
                  <input 
                    type="text"
                    bind:value={adjustmentComment}
                    placeholder="Reason for adjustment"
                  />
                </label>
                <div>
                  <button onclick={() => addAdjustment(employee.id)}>
                    <Icon icon="solar:document-add-bold" width="1.1em" height="1.1em" /> Add Adjustment
                  </button>
                </div>
              </div>
              
              {#if adjustments[employee.id] && adjustments[employee.id].length > 0}
                <div>
                  <table>
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
                            <button onclick={() => removeAdjustment(employee.id, adjustment.id)}>
                              <Icon icon="solar:trash-bin-trash-bold" width="1.1em" height="1.1em" /> Remove
                            </button>
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
                
                <div>
                  <div>
                    Adjustment Total: {adjustmentTotal >= 0 ? '+' : ''}{formatCurrency(adjustmentTotal)}
                  </div>
                </div>
              {:else}
                <div>
                  <div><Icon icon="solar:document-bold" width="2em" height="2em" /></div>
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



 