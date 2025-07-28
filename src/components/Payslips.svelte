<script>
  import { employees, attendance, config, currentPeriod, salaryRecords } from '../lib/stores.js';
  import { calculateSalaryRecord, calculateAttendanceSummary, formatCurrency } from '../lib/core.js';
  import { storage, getSalaryRecord, getPeriodSalaryRecords } from '../lib/stores.js';
  import { toasts } from '../lib/toast.js';
  import ToastContainer from './ToastContainer.svelte';
  import Icon from '@iconify/svelte';
  import { ICONS } from '../lib/icons.js';

  let selectedPeriod = $state({ year: $currentPeriod.year, month: $currentPeriod.month });
  let selectedPayslip = $state(null);
  let showPrintView = $state(false);

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

  // Get payslips for selected period
  const payslips = (() => {
    const records = getPeriodSalaryRecords(selectedPeriod.year, selectedPeriod.month);
    return records.map(record => {
      const employee = $employees.find(emp => emp.id === record.employeeId);
      return {
        ...record,
        employee,
        periodLabel: `${selectedPeriod.month}/${selectedPeriod.year}`
      };
    }).filter(payslip => payslip.employee); // Only show payslips for existing employees
  })();

  const formatConfigTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPeriodLabel = (year, month) => {
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long'
    });
  };

  const printPayslip = (payslip) => {
    selectedPayslip = payslip;
    showPrintView = true;
    
    // Wait for DOM update then print
    setTimeout(() => {
      window.print();
      showPrintView = false;
      selectedPayslip = null;
    }, 100);
  };

  const downloadPayslip = (payslip) => {
    selectedPayslip = payslip;
    showPrintView = true;
    
    setTimeout(() => {
      // Create PDF-like experience
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Payslip - ${payslip.employee.name} - ${payslip.periodLabel}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              .payslip { max-width: 800px; margin: 0 auto; border: 1px solid #ccc; padding: 20px; }
              .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
              .employee-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
              .section { margin-bottom: 20px; }
              .section h3 { border-bottom: 1px solid #ccc; padding-bottom: 5px; }
              .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
              .total { font-weight: bold; border-top: 1px solid #333; padding-top: 10px; margin-top: 10px; }
              .config-info { background: #f5f5f5; padding: 10px; border-radius: 5px; margin-top: 20px; }
              @media print { body { margin: 0; } .payslip { border: none; } }
            </style>
          </head>
          <body>
            <div class="payslip">
              <div class="header">
                <h1>XPayroll - Payslip</h1>
                <h2>${formatPeriodLabel(payslip.year, payslip.month)}</h2>
              </div>
              
              <div class="employee-info">
                <div>
                  <strong>Employee Name:</strong> ${payslip.employee.name}<br>
                  <strong>Gender:</strong> ${payslip.employee.gender}<br>
                  <strong>Marital Status:</strong> ${payslip.employee.maritalStatus}
                </div>
                <div>
                  <strong>Period:</strong> ${payslip.periodLabel}<br>
                  <strong>Base Salary:</strong> ${formatCurrency(payslip.employee.monthlySalary)}<br>
                  <strong>Calculated:</strong> ${formatConfigTimestamp(payslip.configSnapshot.timestamp)}
                </div>
              </div>
              
              <div class="section">
                <h3>Salary Breakdown</h3>
                <div class="row">
                  <span>Basic Salary:</span>
                  <span>${formatCurrency(payslip.components.basicSalary)}</span>
                </div>
                <div class="row">
                  <span>Bonus E (${payslip.configSummary.bonusE}×):</span>
                  <span>${formatCurrency(payslip.components.bonusE || 0)}</span>
                </div>
                <div class="row">
                  <span>Bonus S (${payslip.configSummary.bonusS}×):</span>
                  <span>${formatCurrency(payslip.components.bonusS || 0)}</span>
                </div>
                <div class="row">
                  <span>Bonus K:</span>
                  <span>${formatCurrency(payslip.components.bonusK || 0)}</span>
                </div>
                <div class="row">
                  <span>Bonus M:</span>
                  <span>${formatCurrency(payslip.components.bonusM || 0)}</span>
                </div>
                ${payslip.employee.maritalStatus === 'married' ? `
                <div class="row">
                  <span>Bonus T:</span>
                  <span>${formatCurrency(payslip.components.bonusT || 0)}</span>
                </div>
                ` : ''}
                <div class="row">
                  <span>Adjustments:</span>
                  <span>${formatCurrency(payslip.adjustmentTotal)}</span>
                </div>
                <div class="row">
                  <span>Insurance Deduction (${payslip.configSummary.insuranceRate}%):</span>
                  <span>-${formatCurrency(payslip.components.insuranceDeduction)}</span>
                </div>
                <div class="row total">
                  <span><strong>Final Salary:</strong></span>
                  <span><strong>${formatCurrency(payslip.finalSalary)}</strong></span>
                </div>
              </div>
              
              <div class="config-info">
                <h4>Configuration Used</h4>
                <p><strong>Workday Hours:</strong> ${payslip.configSummary.workdayHours} hours/day</p>
                <p><strong>Working Days:</strong> ${payslip.configSummary.workingDaysPerMonth} days/month</p>
                <p><strong>Insurance Rate:</strong> ${payslip.configSummary.insuranceRate}%</p>
                <p><strong>Calculated on:</strong> ${formatConfigTimestamp(payslip.configSnapshot.timestamp)}</p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      showPrintView = false;
      selectedPayslip = null;
    }, 100);
  };
</script>

<h2><Icon icon={ICONS.navPayslips} width="1.5em" height="1.5em" /> Payslip Reports</h2>
<p>View and print detailed payslip reports for each employee. Each payslip includes complete salary breakdown and configuration details.</p>

<!-- Period Selection -->
<section class="config-section">
  <h3><Icon icon="solar:calendar-bold" width="1.2em" height="1.2em" /> Select Period</h3>
  <p class="text-muted">Choose a period to view available payslips</p>
  
  <div class="form-group-horizontal">
    <div class="form-group-stacked">
      <label for="period-select">
        <Icon icon="solar:calendar-bold" width="1em" height="1em" />
        Period
      </label>
      <select id="period-select" bind:value={selectedPeriod}>
        {#each availablePeriods as period}
          <option value={period}>{period.label}</option>
        {/each}
      </select>
    </div>
  </div>
</section>

{#if payslips.length === 0}
  <section>
    <div>
      <Icon icon="solar:document-text-bold" width="2.5em" height="2.5em" />
      <h4>No payslips found</h4>
      <p>No salary calculations found for {formatPeriodLabel(selectedPeriod.year, selectedPeriod.month)}</p>
    </div>
  </section>
{:else}
  <section>
    <h3><Icon icon="solar:document-text-bold" width="1.2em" height="1.2em" /> Payslips for {formatPeriodLabel(selectedPeriod.year, selectedPeriod.month)}</h3>
    <p class="text-muted">Click on a payslip to view detailed breakdown</p>
    
    <div class="payslips-grid">
      {#each payslips as payslip}
        <div class="payslip-card" onclick={() => selectedPayslip = payslip}>
          <div class="payslip-header">
            <Icon icon="solar:user-bold" width="1.5em" height="1.5em" />
            <div>
              <h4>{payslip.employee.name}</h4>
              <span class="text-muted">{payslip.employee.maritalStatus === 'married' ? 'Married' : 'Single'}</span>
            </div>
          </div>
          
          <div class="payslip-amount">
            <strong>{formatCurrency(payslip.finalSalary)}</strong>
            <span class="text-muted">Final Salary</span>
          </div>
          
          <div class="payslip-details">
            <div class="detail-row">
              <span>Base:</span>
              <span>{formatCurrency(payslip.employee.monthlySalary)}</span>
            </div>
            <div class="detail-row">
              <span>Bonuses:</span>
              <span>{formatCurrency((payslip.components.bonusE || 0) + (payslip.components.bonusS || 0) + (payslip.components.bonusK || 0) + (payslip.components.bonusM || 0) + (payslip.components.bonusT || 0))}</span>
            </div>
            <div class="detail-row">
              <span>Adjustments:</span>
              <span>{formatCurrency(payslip.adjustmentTotal)}</span>
            </div>
            <div class="detail-row">
              <span>Deductions:</span>
              <span>-{formatCurrency(payslip.components.insuranceDeduction)}</span>
            </div>
          </div>
          
          <div class="payslip-actions">
            <button class="secondary" onclick={(e) => { e.stopPropagation(); printPayslip(payslip); }}>
              <Icon icon="solar:printer-bold" width="1em" height="1em" />
              Print
            </button>
            <button class="secondary" onclick={(e) => { e.stopPropagation(); downloadPayslip(payslip); }}>
              <Icon icon="solar:download-bold" width="1em" height="1em" />
              Download
            </button>
          </div>
        </div>
      {/each}
    </div>
  </section>
{/if}

<!-- Detailed Payslip Modal -->
{#if selectedPayslip}
  <div class="modal-overlay show" onclick={() => selectedPayslip = null}>
    <div class="modal-content" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h3><Icon icon="solar:document-text-bold" width="1.2em" height="1.2em" /> Payslip Details</h3>
        <button class="secondary" onclick={() => selectedPayslip = null}>
          <Icon icon="solar:close-circle-bold" width="1.2em" height="1.2em" />
        </button>
      </div>
      
      <div class="payslip-detail">
        <div class="payslip-detail-header">
          <div>
            <h4>{selectedPayslip.employee.name}</h4>
            <p class="text-muted">{formatPeriodLabel(selectedPayslip.year, selectedPayslip.month)}</p>
          </div>
          <div class="payslip-detail-amount">
            <strong>{formatCurrency(selectedPayslip.finalSalary)}</strong>
            <span>Final Salary</span>
          </div>
        </div>
        
        <!-- Config Snapshot -->
        <div class="config-version">
          <Icon icon="solar:settings-bold" width="1em" height="1em" />
          <div>
            <div>Calculated with config: {selectedPayslip.configSummary.workdayHours}h/day, {selectedPayslip.configSummary.workingDaysPerMonth} days/month, {selectedPayslip.configSummary.insuranceRate}% insurance</div>
            <small class="text-muted">Calculated on {formatConfigTimestamp(selectedPayslip.configSnapshot.timestamp)}</small>
          </div>
        </div>
        
        <div class="payslip-detail-grid">
          <div class="payslip-detail-section">
            <h5><Icon icon="solar:user-bold" width="1em" height="1em" /> Employee Information</h5>
            <dl>
              <dt>Name:</dt>
              <dd>{selectedPayslip.employee.name}</dd>
              <dt>Gender:</dt>
              <dd>{selectedPayslip.employee.gender}</dd>
              <dt>Marital Status:</dt>
              <dd>{selectedPayslip.employee.maritalStatus}</dd>
              <dt>Base Salary:</dt>
              <dd>{formatCurrency(selectedPayslip.employee.monthlySalary)}/month</dd>
            </dl>
          </div>
          
          <div class="payslip-detail-section">
            <h5><Icon icon="solar:calculator-bold" width="1em" height="1em" /> Salary Components</h5>
            <dl>
              <dt>Basic Salary:</dt>
              <dd>{formatCurrency(selectedPayslip.components.basicSalary)}</dd>
              <dt>Bonus E ({selectedPayslip.configSummary.bonusE}×):</dt>
              <dd>{formatCurrency(selectedPayslip.components.bonusE || 0)}</dd>
              <dt>Bonus S ({selectedPayslip.configSummary.bonusS}×):</dt>
              <dd>{formatCurrency(selectedPayslip.components.bonusS || 0)}</dd>
              <dt>Bonus K:</dt>
              <dd>{formatCurrency(selectedPayslip.components.bonusK || 0)}</dd>
              <dt>Bonus M:</dt>
              <dd>{formatCurrency(selectedPayslip.components.bonusM || 0)}</dd>
              {#if selectedPayslip.employee.maritalStatus === 'married'}
                <dt>Bonus T:</dt>
                <dd>{formatCurrency(selectedPayslip.components.bonusT || 0)}</dd>
              {/if}
            </dl>
          </div>
          
          <div class="payslip-detail-section">
            <h5><Icon icon="solar:chart-bold" width="1em" height="1em" /> Adjustments & Deductions</h5>
            <dl>
              <dt>Adjustments:</dt>
              <dd>{formatCurrency(selectedPayslip.adjustmentTotal)}</dd>
              <dt>Insurance Deduction ({selectedPayslip.configSummary.insuranceRate}%):</dt>
              <dd>-{formatCurrency(selectedPayslip.components.insuranceDeduction)}</dd>
              <dt><strong>Final Salary:</strong></dt>
              <dd><strong>{formatCurrency(selectedPayslip.finalSalary)}</strong></dd>
            </dl>
          </div>
          
          <div class="payslip-detail-section">
            <h5><Icon icon="solar:settings-bold" width="1em" height="1em" /> Configuration Details</h5>
            <dl>
              <dt>Workday Hours:</dt>
              <dd>{selectedPayslip.configSummary.workdayHours} hours/day</dd>
              <dt>Working Days:</dt>
              <dd>{selectedPayslip.configSummary.workingDaysPerMonth} days/month</dd>
              <dt>Daily Rate:</dt>
              <dd>{formatCurrency(selectedPayslip.components.basicSalary / selectedPayslip.configSummary.workingDaysPerMonth)}/day</dd>
              <dt>Insurance Rate:</dt>
              <dd>{selectedPayslip.configSummary.insuranceRate}%</dd>
              <dt>Calculated On:</dt>
              <dd>{formatConfigTimestamp(selectedPayslip.configSnapshot.timestamp)}</dd>
            </dl>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="secondary" onclick={() => printPayslip(selectedPayslip)}>
            <Icon icon="solar:printer-bold" width="1.2em" height="1.2em" />
            Print Payslip
          </button>
          <button class="secondary" onclick={() => downloadPayslip(selectedPayslip)}>
            <Icon icon="solar:download-bold" width="1.2em" height="1.2em" />
            Download PDF
          </button>
          <button onclick={() => selectedPayslip = null}>
            <Icon icon="solar:close-circle-bold" width="1.2em" height="1.2em" />
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<ToastContainer />

<style>
  .payslips-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
    margin-top: 1.5rem;
  }

  .payslip-card {
    background: color-mix(in oklab, var(--primary) 6%, transparent);
    border: 1px solid color-mix(in oklab, var(--primary) 8%, transparent);
    border-radius: 1rem;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    @extend %glass, %shadow-sm;
  }

  .payslip-card:hover {
    transform: translateY(-2px);
    @extend %shadow-md;
    border-color: color-mix(in oklab, var(--primary) 15%, transparent);
  }

  .payslip-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .payslip-header h4 {
    margin: 0;
    color: var(--fg);
  }

  .payslip-amount {
    text-align: center;
    margin-bottom: 1rem;
    padding: 1rem;
    background: color-mix(in oklab, var(--primary) 10%, transparent);
    border-radius: 0.75rem;
  }

  .payslip-amount strong {
    display: block;
    font-size: 1.5rem;
    color: var(--primary);
  }

  .payslip-details {
    margin-bottom: 1rem;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }

  .payslip-actions {
    display: flex;
    gap: 0.5rem;
  }

  .payslip-actions button {
    flex: 1;
    padding: 0.5rem;
    font-size: 0.8rem;
  }

  .payslip-detail {
    max-height: 70vh;
    overflow-y: auto;
  }

  .payslip-detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid color-mix(in oklab, var(--primary) 8%, transparent);
  }

  .payslip-detail-header h4 {
    margin: 0;
    color: var(--fg);
  }

  .payslip-detail-amount {
    text-align: right;
  }

  .payslip-detail-amount strong {
    display: block;
    font-size: 1.5rem;
    color: var(--primary);
  }

  .payslip-detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .payslip-detail-section {
    background: color-mix(in oklab, var(--bg-muted) 20%, transparent);
    border-radius: 0.75rem;
    padding: 1rem;
    border: 1px solid color-mix(in oklab, var(--primary) 8%, transparent);
  }

  .payslip-detail-section h5 {
    margin: 0 0 1rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--primary);
  }

  .modal-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    padding-top: 1rem;
    border-top: 1px solid color-mix(in oklab, var(--primary) 8%, transparent);
  }

  @media print {
    .modal-overlay {
      position: static !important;
      background: white !important;
    }
    
    .modal-content {
      box-shadow: none !important;
      border: none !important;
      max-width: none !important;
      max-height: none !important;
    }
    
    .modal-header,
    .modal-actions {
      display: none !important;
    }
  }
</style> 