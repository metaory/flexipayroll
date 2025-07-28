<script>
  import { employees, attendance, config, currentPeriod, salaryRecords } from '../lib/stores.js';
  import { calculateSalaryRecord, calculateAttendanceSummary, formatCurrency } from '../lib/core.js';
  import { storage, storeSalaryRecord, getSalaryRecord, clearPeriodSalaryRecords, getPeriodSalaryRecords } from '../lib/stores.js';
  import { toasts } from '../lib/toast.js';
  import ToastContainer from './ToastContainer.svelte';
  import Icon from '@iconify/svelte';
  import { ICONS } from '../lib/icons.js';

  let selectedEmployee = $state('');
  let adjustmentAmount = $state('');
  let adjustmentComment = $state('');
  let selectedPeriod = $state({ year: $currentPeriod.year, month: $currentPeriod.month });
  let showHistoricalView = $state(false);

  // Generate available periods (last 12 months)
  const availablePeriods = (() => {
    const periods = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      periods.push({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        label: `${date.getMonth() + 1}/${date.getFullYear()}`
      });
    }
    return periods;
  })();

  const getMonthAttendance = (employeeId) => {
    const monthKey = `${selectedPeriod.year}-${String(selectedPeriod.month).padStart(2, '0')}`;
    return $attendance[employeeId]?.[monthKey] || {};
  };

  const getAdjustments = (employeeId) => {
    return storage.getAdjustments(employeeId) || [];
  };

  const addAdjustment = (employeeId) => {
    if (!adjustmentAmount || !employeeId) return;
    
    const adjustments = getAdjustments(employeeId);
    const newAdjustment = {
      id: Date.now().toString(),
      amount: Number(adjustmentAmount),
      comment: adjustmentComment.trim(),
      addedAt: Date.now()
    };
    
    storage.setAdjustments(employeeId, [...adjustments, newAdjustment]);
    
    // Clear form
    adjustmentAmount = '';
    adjustmentComment = '';
    selectedEmployee = '';
    
    toasts.success('Adjustment added successfully!');
  };

  const removeAdjustment = (employeeId, adjustmentId) => {
    const adjustments = getAdjustments(employeeId);
    const filtered = adjustments.filter(adj => adj.id !== adjustmentId);
    storage.setAdjustments(employeeId, filtered);
    toasts.success('Adjustment removed successfully!');
  };

  const calculateAndStoreSalary = (employee) => {
    const monthAttendance = getMonthAttendance(employee.id);
    const adjustments = getAdjustments(employee.id);
    
    // Check if we already have a salary record for this period
    const existingRecord = getSalaryRecord(employee.id, selectedPeriod.year, selectedPeriod.month);
    
    // Only calculate and store if we don't have a record or if data has changed
    if (!existingRecord) {
      const salaryRecord = calculateSalaryRecord(employee, monthAttendance, adjustments, $config);
      storeSalaryRecord(employee.id, selectedPeriod.year, selectedPeriod.month, salaryRecord);
      return salaryRecord;
    }
    
    return existingRecord;
  };

  const recalculateAllSalaries = () => {
    // Clear existing salary records for current period
    clearPeriodSalaryRecords(selectedPeriod.year, selectedPeriod.month);
    
    // Recalculate all salaries for current period
    $employees.forEach(employee => {
      calculateAndStoreSalary(employee);
    });
    
    toasts.success('All salaries recalculated with current configuration!');
  };

  const getSalaryRecordForDisplay = (employee) => {
    return calculateAndStoreSalary(employee);
  };

  const hasEmployees = $derived($employees.length > 0);
  const isMarried = $derived(selectedEmployee ? $employees.find(emp => emp.id === selectedEmployee)?.maritalStatus === 'married' : false);
  
  const totalPayroll = $derived(
    $employees.reduce((total, emp) => {
      const salaryRecord = getSalaryRecordForDisplay(emp);
      return total + salaryRecord.finalSalary;
    }, 0)
  );
  
  const totalAdjustments = $derived(
    $employees.reduce((total, emp) => {
      const adjustments = getAdjustments(emp.id);
      return total + adjustments.reduce((sum, adj) => sum + adj.amount, 0);
    }, 0)
  );

  // Check if any salary records exist for selected period
  const hasSalaryRecords = $derived(
    $employees.some(emp => getSalaryRecord(emp.id, selectedPeriod.year, selectedPeriod.month))
  );

  // Check if viewing current period
  const isCurrentPeriod = $derived(
    selectedPeriod.year === $currentPeriod.year && selectedPeriod.month === $currentPeriod.month
  );

  // Get config differences if viewing historical data
  const getConfigDifferences = (salaryRecord) => {
    if (!salaryRecord?.configSnapshot) return null;
    
    const historical = salaryRecord.configSnapshot;
    const current = $config;
    
    const differences = [];
    
    if (historical.workdayHours !== current.workdayHours) {
      differences.push(`Workday hours: ${historical.workdayHours}h → ${current.workdayHours}h`);
    }
    if (historical.workingDaysPerMonth !== current.workingDaysPerMonth) {
      differences.push(`Working days: ${historical.workingDaysPerMonth} → ${current.workingDaysPerMonth}`);
    }
    if (historical.bonuses.E.value !== current.bonuses.E.value) {
      differences.push(`Bonus E: ${historical.bonuses.E.value}× → ${current.bonuses.E.value}×`);
    }
    if (historical.bonuses.S.value !== current.bonuses.S.value) {
      differences.push(`Bonus S: ${historical.bonuses.S.value}× → ${current.bonuses.S.value}×`);
    }
    if (historical.deductions.insurance.value !== current.deductions.insurance.value) {
      differences.push(`Insurance: ${(historical.deductions.insurance.value * 100).toFixed(1)}% → ${(current.deductions.insurance.value * 100).toFixed(1)}%`);
    }
    
    return differences;
  };

  const formatConfigTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
</script>

<h2>Payroll Calculation</h2>
<p>Calculate and review employee salaries for the selected period. Salaries include basic pay, bonuses, adjustments, and deductions.</p>

<!-- Period Selection -->
<section class="config-section">
  <h3><Icon icon="solar:calendar-bold" width="1.2em" height="1.2em" /> Period Selection</h3>
  <p class="text-muted">Select a period to view or calculate salary reports</p>
  
  <div class="form-group-horizontal">
    <div class="form-group-stacked">
      <label for="period-select">
        <Icon icon="solar:calendar-bold" width="1em" height="1em" />
        Select Period
      </label>
      <select id="period-select" bind:value={selectedPeriod} onchange={() => showHistoricalView = !isCurrentPeriod}>
        {#each availablePeriods as period}
          <option value={period}>{period.label}</option>
        {/each}
      </select>
    </div>
    
    <div class="form-group-stacked">
      <label>
        <Icon icon="solar:eye-bold" width="1em" height="1em" />
        View Mode
      </label>
      <div class="button-group">
        <button class={isCurrentPeriod ? 'active' : ''} onclick={() => { selectedPeriod = $currentPeriod; showHistoricalView = false; }}>
          <Icon icon="solar:edit-bold" width="1em" height="1em" />
          Current Period (Editable)
        </button>
        <button class={showHistoricalView ? 'active' : ''} onclick={() => showHistoricalView = true}>
          <Icon icon="solar:history-bold" width="1em" height="1em" />
          Historical View
        </button>
      </div>
    </div>
  </div>
</section>

<div class="stats-grid">
  <div class="stat-card">
    <Icon icon="solar:calendar-bold" width="2em" height="2em" />
    <div>
      <strong>{selectedPeriod.month}/{selectedPeriod.year}</strong>
      <span>Selected Period</span>
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

{#if hasSalaryRecords}
  <div class="config-notice">
    <Icon icon="solar:info-circle-bold" width="1em" height="1em" />
    <span>Salaries calculated with configuration from {formatConfigTimestamp($employees[0] ? getSalaryRecord($employees[0].id, selectedPeriod.year, selectedPeriod.month)?.configSnapshot?.timestamp : Date.now())}</span>
    {#if isCurrentPeriod}
      <button class="secondary" onclick={recalculateAllSalaries}>
        <Icon icon="solar:refresh-bold" width="1.2em" height="1.2em" />
        Recalculate with Current Config
      </button>
    {/if}
  </div>
{/if}

{#if !showHistoricalView}
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
            disabled={!selectedEmployee}
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
            disabled={!selectedEmployee}
          />
        </div>
        
        <div class="form-group-stacked">
          <label>&nbsp;</label>
          <button 
            type="button"
            onclick={() => addAdjustment(selectedEmployee)}
            disabled={!selectedEmployee || !adjustmentAmount}
          >
            <Icon icon="solar:add-circle-bold" width="1.2em" height="1.2em" />
            Add Adjustment
          </button>
        </div>
      </div>
    </form>
  </section>
{/if}

<section>
  <h3><Icon icon="solar:document-text-bold" width="1.2em" height="1.2em" /> Salary Reports</h3>
      <p class="text-muted">Detailed salary calculations for each employee including bonuses, adjustments, and deductions</p>
  
  {#if !hasEmployees}
    <div>
      <Icon icon="solar:users-group-rounded-bold" width="2.5em" height="2.5em" />
      <h4>No employees added yet</h4>
      <p>Add employees first to calculate payroll</p>
    </div>
  {:else}
    {#each $employees as employee}
      {@const salaryRecord = getSalaryRecordForDisplay(employee)}
      {@const attendanceSummary = calculateAttendanceSummary(getMonthAttendance(employee.id), salaryRecord.configSnapshot)}
      {@const adjustments = getAdjustments(employee.id)}
      {@const configDifferences = getConfigDifferences(salaryRecord)}
      
      <section>
        <h4><Icon icon="solar:user-bold" width="1em" height="1em" /> {employee.name}</h4>
        <p class="text-muted">
          <Icon icon="solar:heart-bold" width="1em" height="1em" />
          {employee.maritalStatus === 'married' ? 'Married' : 'Single'} • 
          <Icon icon="solar:wallet-bold" width="1em" height="1em" />
          Base: {formatCurrency(employee.monthlySalary)}/month
        </p>
        
        <!-- Enhanced Config Version Info -->
        <div class="config-version">
          <Icon icon="solar:settings-bold" width="1em" height="1em" />
          <div>
            <div>Calculated with config: {salaryRecord.configSummary.workdayHours}h/day, {salaryRecord.configSummary.workingDaysPerMonth} days/month, {salaryRecord.configSummary.insuranceRate}% insurance</div>
            <small class="text-muted">Calculated on {formatConfigTimestamp(salaryRecord.configSnapshot.timestamp)}</small>
          </div>
        </div>

        <!-- Config Differences (Historical View) -->
        {#if showHistoricalView && configDifferences && configDifferences.length > 0}
          <div class="config-differences">
            <Icon icon="solar:warning-bold" width="1em" height="1em" />
            <div>
              <div><strong>Config has changed since this calculation:</strong></div>
              <ul>
                {#each configDifferences as difference}
                  <li>{difference}</li>
                {/each}
              </ul>
            </div>
          </div>
        {/if}
        
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
                <dd>{formatCurrency(salaryRecord.components.basicSalary)}</dd>
                <dt>Bonus E ({salaryRecord.configSummary.bonusE}×):</dt>
                <dd>{formatCurrency(salaryRecord.components['bonusE'] || 0)}</dd>
                <dt>Bonus S ({salaryRecord.configSummary.bonusS}×):</dt>
                <dd>{formatCurrency(salaryRecord.components['bonusS'] || 0)}</dd>
                <dt>Bonus K:</dt>
                <dd>{formatCurrency(salaryRecord.components['bonusK'] || 0)}</dd>
                <dt>Bonus M:</dt>
                <dd>{formatCurrency(salaryRecord.components['bonusM'] || 0)}</dd>
                {#if employee.maritalStatus === 'married'}
                  <dt>Bonus T:</dt>
                  <dd>{formatCurrency(salaryRecord.components['bonusT'] || 0)}</dd>
                {/if}
              </dl>
            </div>
            
            <div class="salary-section">
              <h5><Icon icon="solar:chart-bold" width="1em" height="1em" /> Adjustments & Deductions</h5>
              <dl>
                <dt>Adjustments:</dt>
                <dd>{formatCurrency(salaryRecord.adjustmentTotal)}</dd>
                <dt>Insurance Deduction ({salaryRecord.configSummary.insuranceRate}%):</dt>
                <dd>-{formatCurrency(salaryRecord.components.insuranceDeduction)}</dd>
                <dt><strong>Final Salary:</strong></dt>
                <dd><strong>{formatCurrency(salaryRecord.finalSalary)}</strong></dd>
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
                    {#if !showHistoricalView}
                      <th><Icon icon="solar:settings-bold" width="1em" height="1em" /> Actions</th>
                    {/if}
                  </tr>
                </thead>
                <tbody>
                  {#each adjustments as adjustment}
                    <tr>
                      <td class={adjustment.amount >= 0 ? 'text-success' : 'text-error'}>
                        {adjustment.amount >= 0 ? '+' : ''}{formatCurrency(adjustment.amount)}
                      </td>
                      <td>{adjustment.comment || '-'}</td>
                      {#if !showHistoricalView}
                        <td>
                          <button class="danger" onclick={() => removeAdjustment(employee.id, adjustment.id)}>
                            <Icon icon="solar:trash-bin-trash-bold" width="1em" height="1em" />
                          </button>
                        </td>
                      {/if}
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

<ToastContainer />

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

  .config-notice {
    background: color-mix(in oklab, var(--info) 10%, transparent);
    border-radius: 1rem;
    padding: 1rem;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--info);
    font-size: 0.9rem;
    font-weight: 500;
  }

  .config-notice .secondary {
    background: color-mix(in oklab, var(--info) 20%, transparent);
    color: var(--info);
    border: 1px solid color-mix(in oklab, var(--info) 30%, transparent);
    padding: 0.5rem 1rem;
    border-radius: 0.75rem;
    font-size: 0.8rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: background-color 0.2s ease;
  }

  .config-notice .secondary:hover {
    background: color-mix(in oklab, var(--info) 30%, transparent);
  }

  .config-version {
    background: color-mix(in oklab, var(--info) 5%, transparent);
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--info);
    font-size: 0.85rem;
    font-weight: 500;
  }


</style>



 