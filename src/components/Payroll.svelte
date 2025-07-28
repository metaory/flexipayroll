<script>
  import { employees, attendance, config, currentPeriod } from '../lib/stores.js';
  import { calculateSalary, calculateAttendanceSummary, formatCurrency } from '../lib/core.js';
  import Icon from '@iconify/svelte';
  
  let selectedEmployee = $state('');
  let adjustmentAmount = $state('');
  let adjustmentComment = $state('');
  
  const createAdjustment = (employeeId) => ({
    id: Date.now().toString(),
    amount: Number(adjustmentAmount),
    comment: adjustmentComment.trim(),
    employeeId
  })
  
  const addAdjustment = (employeeId) => {
    if (!adjustmentAmount || Number(adjustmentAmount) === 0) {
      alert('Please enter a valid adjustment amount');
      return;
    }
    
    const adjustment = createAdjustment(employeeId);
    
    // Get current adjustments for this employee
    let currentAdjustments = JSON.parse(localStorage.getItem(`xpayroll_adjustments_${employeeId}`) || '[]');
    currentAdjustments.push(adjustment);
    localStorage.setItem(`xpayroll_adjustments_${employeeId}`, JSON.stringify(currentAdjustments));
    
    adjustmentAmount = '';
    adjustmentComment = '';
    alert('Adjustment added successfully!');
  }
  
  const removeAdjustment = (employeeId, adjustmentId) => {
    if (confirm('Are you sure you want to remove this adjustment?')) {
      let currentAdjustments = JSON.parse(localStorage.getItem(`xpayroll_adjustments_${employeeId}`) || '[]');
      currentAdjustments = currentAdjustments.filter(adj => adj.id !== adjustmentId);
      localStorage.setItem(`xpayroll_adjustments_${employeeId}`, JSON.stringify(currentAdjustments));
    }
  }
  
  const getAdjustments = (employeeId) => {
    return JSON.parse(localStorage.getItem(`xpayroll_adjustments_${employeeId}`) || '[]');
  }
  
  const getMonthAttendance = (employeeId) => {
    const monthStr = `${$currentPeriod.year}-${$currentPeriod.month.toString().padStart(2, '0')}`;
    const empAttendance = $attendance[employeeId] || {};
    const results = {};
    
    for (const [date, data] of Object.entries(empAttendance)) {
      if (date.startsWith(monthStr)) {
        results[date] = data;
      }
    }
    return results;
  }
  
  const hasEmployees = $derived($employees.length > 0)
  const isMarried = $derived(selectedEmployee ? $employees.find(emp => emp.id === selectedEmployee)?.maritalStatus === 'married' : false)
  
  const totalPayroll = $derived(
    $employees.reduce((total, emp) => {
      const salaryBreakdown = calculateSalary(emp, getMonthAttendance(emp.id), $config, getAdjustments(emp.id));
      return total + salaryBreakdown.finalSalary;
    }, 0)
  )
  
  const totalAdjustments = $derived(
    $employees.reduce((total, emp) => {
      const adjustments = getAdjustments(emp.id);
      return total + adjustments.reduce((sum, adj) => sum + adj.amount, 0);
    }, 0)
  )
</script>

<h2>Payroll Calculation</h2>
<p>Calculate and review employee salaries for the current period. Salaries include basic pay, bonuses, adjustments, and deductions.</p>

<div class="stats-grid">
  <div class="stat-card">
    <Icon icon="solar:calendar-bold" width="2em" height="2em" />
    <div>
      <strong>{$currentPeriod.month}/{$currentPeriod.year}</strong>
      <span>Payroll Period</span>
    </div>
  </div>
  <div class="stat-card">
    <Icon icon="solar:wallet-bold" width="2em" height="2em" />
    <div>
      <strong>{formatCurrency(totalPayroll)}</strong>
      <span>Total Payroll</span>
    </div>
  </div>
  <div class="stat-card">
    <Icon icon="solar:chart-bold" width="2em" height="2em" />
    <div>
      <strong>{formatCurrency(totalAdjustments)}</strong>
      <span>Total Adjustments</span>
    </div>
  </div>
</div>

<section>
  <h3><Icon icon="solar:calculator-bold" width="1.2em" height="1.2em" /> Salary Adjustments</h3>
      <p class="text-muted">Add positive or negative adjustments to employee salaries with optional comments</p>
  
  <form>
    <div class="form-group-horizontal">
      <div class="form-group-stacked">
        <label for="employee-select">
          <Icon icon="solar:user-bold" width="1em" height="1em" />
          Select Employee
        </label>
        <select id="employee-select" bind:value={selectedEmployee}>
          <option value="">Choose an employee...</option>
          {#each $employees as employee}
            <option value={employee.id}>{employee.name}</option>
          {/each}
        </select>
      </div>
      
      <div class="form-group-stacked">
        <label for="adjustment-amount">
          <Icon icon="solar:wallet-bold" width="1em" height="1em" />
          Adjustment Amount (IDR)
        </label>
        <input 
          id="adjustment-amount"
          type="number"
          bind:value={adjustmentAmount}
          placeholder="Enter positive or negative amount"
        />
        <small class="text-muted">Positive for bonus, negative for deduction</small>
      </div>
      
      <div class="form-group-stacked">
        <label for="adjustment-comment">
          <Icon icon="solar:document-text-bold" width="1em" height="1em" />
          Comment (Optional)
        </label>
        <input 
          id="adjustment-comment"
          type="text"
          bind:value={adjustmentComment}
          placeholder="Reason for adjustment"
        />
      </div>
      
      <div class="form-group-stacked">
        <button onclick={() => addAdjustment(selectedEmployee)} disabled={!selectedEmployee || !adjustmentAmount}>
          <Icon icon="solar:plus-bold" width="1.2em" height="1.2em" /> Add Adjustment
        </button>
      </div>
    </div>
  </form>
</section>

<section>
  <h3><Icon icon="solar:chart-bold" width="1.2em" height="1.2em" /> Salary Breakdown</h3>
      <p class="text-muted">Detailed salary calculations for each employee including bonuses, adjustments, and deductions</p>
  
  {#if !hasEmployees}
    <div>
      <Icon icon="solar:users-group-rounded-bold" width="2.5em" height="2.5em" />
      <h4>No employees added yet</h4>
      <p>Add employees first to calculate payroll</p>
    </div>
  {:else}
    {#each $employees as employee}
      {@const monthAttendance = getMonthAttendance(employee.id)}
      {@const adjustments = getAdjustments(employee.id)}
      {@const salaryBreakdown = calculateSalary(employee, monthAttendance, $config, adjustments)}
      {@const attendanceSummary = calculateAttendanceSummary(monthAttendance, $config)}
      
      <section>
        <h4><Icon icon="solar:user-bold" width="1em" height="1em" /> {employee.name}</h4>
        <p class="text-muted">
          <Icon icon="solar:heart-bold" width="1em" height="1em" />
          {employee.maritalStatus === 'married' ? 'Married' : 'Single'} • 
          <Icon icon="solar:wallet-bold" width="1em" height="1em" />
          Base: {formatCurrency(employee.monthlySalary)}/month
        </p>
        
        <div class="salary-grid">
                     <div class="salary-section">
             <h5><Icon icon="solar:clock-circle-bold" width="1em" height="1em" /> Attendance Summary</h5>
             <dl>
               <dt>Total Hours:</dt>
               <dd>{attendanceSummary.hours.toFixed(1)} hours</dd>
               <dt>Total Days:</dt>
               <dd>{attendanceSummary.days} days</dd>
               <dt>Regular Days:</dt>
               <dd>{attendanceSummary.byType['regular'] || 0} days</dd>
               <dt>Holidays:</dt>
               <dd>{attendanceSummary.byType['holiday'] || 0} days</dd>
               <dt>Paid Leave:</dt>
               <dd>{attendanceSummary.byType['paid_leave'] || 0} days</dd>
               <dt>Unpaid Leave:</dt>
               <dd>{attendanceSummary.byType['unpaid_leave'] || 0} days</dd>
             </dl>
           </div>
          
          <div class="salary-section">
            <h5><Icon icon="solar:calculator-bold" width="1em" height="1em" /> Salary Components</h5>
            <dl>
              <dt>Basic Salary:</dt>
              <dd>{formatCurrency(salaryBreakdown.components.basicSalary)}</dd>
              <dt>Bonus E:</dt>
              <dd>{formatCurrency(salaryBreakdown.components['bonusE'] || 0)}</dd>
              <dt>Bonus S:</dt>
              <dd>{formatCurrency(salaryBreakdown.components['bonusS'] || 0)}</dd>
              <dt>Bonus K:</dt>
              <dd>{formatCurrency(salaryBreakdown.components['bonusK'] || 0)}</dd>
              <dt>Bonus M:</dt>
              <dd>{formatCurrency(salaryBreakdown.components['bonusM'] || 0)}</dd>
              {#if isMarried}
                <dt>Bonus T:</dt>
                <dd>{formatCurrency(salaryBreakdown.components['bonusT'] || 0)}</dd>
              {/if}
            </dl>
          </div>
          
          <div class="salary-section">
            <h5><Icon icon="solar:chart-bold" width="1em" height="1em" /> Adjustments & Deductions</h5>
            <dl>
              <dt>Adjustments:</dt>
              <dd>{formatCurrency(salaryBreakdown.adjustmentTotal)}</dd>
              <dt>Insurance Deduction:</dt>
              <dd>-{formatCurrency(salaryBreakdown.insuranceDeduction)}</dd>
              <dt><strong>Final Salary:</strong></dt>
              <dd><strong>{formatCurrency(salaryBreakdown.finalSalary)}</strong></dd>
            </dl>
          </div>
        </div>
        
        {#if adjustments.length > 0}
          <div class="adjustments-section">
            <h5><Icon icon="solar:list-bold" width="1em" height="1em" /> Adjustments Applied</h5>
            <table>
              <thead>
                <tr>
                  <th><Icon icon="solar:wallet-bold" width="1em" height="1em" /> Amount</th>
                  <th><Icon icon="solar:document-text-bold" width="1em" height="1em" /> Comment</th>
                  <th><Icon icon="solar:settings-bold" width="1em" height="1em" /> Actions</th>
                </tr>
              </thead>
              <tbody>
                {#each adjustments as adjustment}
                  <tr>
                    <td class={adjustment.amount >= 0 ? 'text-success' : 'text-error'}>
                      {adjustment.amount >= 0 ? '+' : ''}{formatCurrency(adjustment.amount)}
                    </td>
                    <td>{adjustment.comment || '-'}</td>
                    <td>
                      <button class="danger" onclick={() => removeAdjustment(employee.id, adjustment.id)}>
                        <Icon icon="solar:trash-bin-trash-bold" width="1.1em" height="1.1em" /> Remove
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </section>
    {/each}
  {/if}
</section>

<style>
  /* Using global .stats-grid and .salary-grid classes */
  
  .stat-card {
    background: color-mix(in oklab, var(--secondary) 12%, transparent);
    border-radius: 1.5rem;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 8px 32px color-mix(in oklab, var(--secondary) 20%, transparent);
  }
  
  .stat-card > div {
    display: flex;
    flex-direction: column;
  }
  
  .stat-card strong {
    font-size: 1.5rem;
    color: var(--primary);
  }
  
  .stat-card span {
    font-size: 0.875rem;
    color: var(--fg-muted);
  }
  
  .salary-section {
    background: color-mix(in oklab, var(--primary) 10%, transparent);
    border-radius: 1.5rem;
    padding: 1.5rem;
    box-shadow: 0 8px 32px color-mix(in oklab, var(--primary) 18%, transparent);
  }
  
  .salary-section h5 {
    margin-bottom: 1rem;
    color: var(--primary);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .adjustments-section {
    margin-top: 1.5rem;
  }
  
  .adjustments-section h5 {
    margin-bottom: 1rem;
    color: var(--primary);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  small {
    font-size: 0.75rem;
    margin-top: 0.25rem;
  }
</style>



 