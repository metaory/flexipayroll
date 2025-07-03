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

<h2>Payroll Management</h2>
<p>Calculate and manage employee salaries</p>

{#if $employees.length === 0}
  <div>
    <Icon icon="solar:wallet-bold" width="2.5em" height="2.5em" />
    <p>No employees added yet.</p>
    <p>Add employees first to calculate payroll.</p>
  </div>
{:else}
  {#each $employees as employee}
    {@const salaryBreakdown = getEmployeeSalary(employee)}
    {@const adjustmentTotal = getAdjustmentTotal(employee.id)}
    
    <section>
      <h3>{employee.name}</h3>
      <p>Final Salary: {formatCurrency(salaryBreakdown.total)}</p>
      
      <h4>Salary Components</h4>
      <dl>
        <dt>Basic Salary:</dt>
        <dd>{formatCurrency(salaryBreakdown.components.basicSalary)}</dd>
        <dt>Bonus E:</dt>
        <dd>{formatCurrency(salaryBreakdown.components.bonusE)}</dd>
        <dt>Bonus S:</dt>
        <dd>{formatCurrency(salaryBreakdown.components.bonusS)}</dd>
        <dt>Bonus K:</dt>
        <dd>{formatCurrency(salaryBreakdown.components.bonusK)}</dd>
        <dt>Bonus M:</dt>
        <dd>{formatCurrency(salaryBreakdown.components.bonusM)}</dd>
        {#if employee.maritalStatus === 'married'}
          <dt>Bonus T:</dt>
          <dd>{formatCurrency(salaryBreakdown.components.bonusT)}</dd>
        {/if}
      </dl>
      <hr />
      <dl>
        <dt>Subtotal:</dt>
        <dd>{formatCurrency(salaryBreakdown.subtotal)}</dd>
        <dt>Insurance (7%):</dt>
        <dd>-{formatCurrency(salaryBreakdown.components.insuranceDeduction)}</dd>
      </dl>
      
      <h4>Work Summary</h4>
      <dl>
        <dt>Total Days:</dt>
        <dd>{salaryBreakdown.period.workdays}</dd>
        <dt>Total Hours:</dt>
        <dd>{salaryBreakdown.period.hours}</dd>
        <dt>Regular Days:</dt>
        <dd>{salaryBreakdown.period['byType']?.['regular'] || 0}</dd>
        <dt>Holidays:</dt>
        <dd>{salaryBreakdown.period['byType']?.['holiday'] || 0}</dd>
      </dl>
      
      <h4>Adjustments</h4>
      
      <label for="adjustment-amount">Amount (IDR)</label>
      <input 
        id="adjustment-amount"
        type="number"
        bind:value={adjustmentAmount}
        placeholder="Positive or negative amount"
      />
      
      <label for="adjustment-comment">Comment</label>
      <input 
        id="adjustment-comment"
        type="text"
        bind:value={adjustmentComment}
        placeholder="Reason for adjustment"
      />
      
      <button onclick={() => addAdjustment(employee.id)}>
        <Icon icon="solar:document-add-bold" width="1.1em" height="1.2em" /> Add Adjustment
      </button>
        
        {#if adjustments[employee.id] && adjustments[employee.id].length > 0}
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
                  <td>{adjustment.amount >= 0 ? '+' : ''}{formatCurrency(adjustment.amount)}</td>
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
          
          <div>
            Adjustment Total: {adjustmentTotal >= 0 ? '+' : ''}{formatCurrency(adjustmentTotal)}
          </div>
        {:else}
          <div>
            <Icon icon="solar:document-bold" width="2em" height="2em" />
            <p>No adjustments added yet.</p>
          </div>
        {/if}
    </section>
  {/each}
{/if}



 