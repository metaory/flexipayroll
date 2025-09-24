<!--
  Reports Center - Payslip generation and reporting
  Multiple report formats: summary and detailed payslips
-->
<script>
  import { employees, config, currentPeriod } from '../stores.js';
  import { getSalaryRecord, getPeriodSalaryRecords } from '../stores.js';
  import { formatCurrency } from '../core.js';
  import { toasts } from '../lib/toast.js';
  import Wizard from './Wizard.svelte';
  import Modal from './Modal.svelte';
  import Icon from '@iconify/svelte';
  import { ICONS } from '../lib/icons.js';
  
  let currentStep = $state(0);
  let selectedPeriod = $state({ year: $currentPeriod.year, month: $currentPeriod.month });
  let selectedEmployee = $state('');
  let reportType = $state('summary'); // 'summary' | 'detailed'
  let showPayslipModal = $state(false);
  let currentPayslip = $state(null);
  let bulkExport = $state(false);
  
  // Generate available periods (last 12 months)
  const availablePeriods = (() => {
    const periods = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      periods.push({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      });
    }
    return periods;
  })();
  
  // Get all employee salary records for the period
  const getEmployeeReports = () => {
    return $employees.map(employee => {
      const salaryRecord = getSalaryRecord(employee.id, selectedPeriod.year, selectedPeriod.month);
      return {
        employee,
        salaryRecord,
        hasData: !!salaryRecord
      };
    }).filter(item => item.hasData);
  };
  
  const employeeReports = $derived(getEmployeeReports());
  
  // Get period summary
  const periodSummary = $derived(() => {
    const records = getPeriodSalaryRecords(selectedPeriod.year, selectedPeriod.month);
    
    return {
      totalEmployees: records.length,
      totalPayroll: records.reduce((sum, record) => sum + record.finalSalary, 0),
      totalHours: records.reduce((sum, record) => sum + (record.period?.hours || 0), 0),
      totalDeductions: records.reduce((sum, record) => sum + (record.components?.insuranceDeduction || 0), 0),
      averageSalary: records.length > 0 ? records.reduce((sum, record) => sum + record.finalSalary, 0) / records.length : 0
    };
  });
  
  // Wizard steps
  const steps = [
    {
      title: 'Reports Overview',
      description: 'View and generate payslip reports',
      icon: ICONS.document
    }
  ];
  
  const generatePayslip = (employee, salaryRecord, type = 'summary') => {
    currentPayslip = {
      employee,
      salaryRecord,
      type,
      period: selectedPeriod,
      generatedAt: new Date().toISOString()
    };
    showPayslipModal = true;
  };
  
  const printPayslip = () => {
    window.print();
  };
  
  const downloadPayslip = (employee, type = 'summary') => {
    const filename = `payslip-${employee.name.replace(/\s+/g, '-')}-${selectedPeriod.year}-${String(selectedPeriod.month).padStart(2, '0')}-${type}.pdf`;
    
    // In a real implementation, this would generate a PDF
    toasts.success(`Payslip downloaded: ${filename}`);
  };
  
  const exportAllPayslips = () => {
    bulkExport = true;
    
    employeeReports.forEach(({ employee }) => {
      downloadPayslip(employee, reportType);
    });
    
    bulkExport = false;
    toasts.success(`All ${reportType} payslips exported successfully!`);
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
</script>

<Wizard 
  {steps}
  bind:currentStep
  title="Reports Center"
  description="Generate and manage payslip reports"
  canGoNext={true}
  onComplete={() => {}}
>
  {#snippet children(stepIndex, stepData)}
    <div class="reports-center">
      <div class="reports-header">
        <div class="period-selector">
          <label for="period">
            <Icon icon={ICONS.calendar} width="1.25rem" height="1.25rem" />
            Period
          </label>
          <select id="period" bind:value={selectedPeriod}>
            {#each availablePeriods as period}
              <option value={period}>
                {period.label}
              </option>
            {/each}
          </select>
        </div>
        
        <div class="report-controls">
          <div class="report-type-selector">
            <label>Report Type:</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" bind:group={reportType} value="summary" />
                <span>Summary</span>
              </label>
              <label class="radio-label">
                <input type="radio" bind:group={reportType} value="detailed" />
                <span>Detailed</span>
              </label>
            </div>
          </div>
          
          <button class="primary" onclick={exportAllPayslips} disabled={employeeReports.length === 0}>
            <Icon icon={ICONS.download} width="1.25rem" height="1.25rem" />
            Export All {reportType === 'summary' ? 'Summary' : 'Detailed'}
          </button>
        </div>
      </div>
      
      <div class="period-summary">
        <h3>
          <Icon icon={ICONS.chart} width="1.5rem" height="1.5rem" />
          {selectedPeriod.label} Summary
        </h3>
        
        <div class="summary-grid">
          <div class="summary-card">
            <Icon icon={ICONS.users} width="2.5rem" height="2.5rem" />
            <div>
              <span class="summary-value">{periodSummary.totalEmployees}</span>
              <span class="summary-label">Employees</span>
            </div>
          </div>
          
          <div class="summary-card">
            <Icon icon={ICONS.wadMoney} width="2.5rem" height="2.5rem" />
            <div>
              <span class="summary-value">{formatCurrency(periodSummary.totalPayroll)}</span>
              <span class="summary-label">Total Payroll</span>
            </div>
          </div>
          
          <div class="summary-card">
            <Icon icon={ICONS.clock} width="2.5rem" height="2.5rem" />
            <div>
              <span class="summary-value">{periodSummary.totalHours.toFixed(1)}</span>
              <span class="summary-label">Total Hours</span>
            </div>
          </div>
          
          <div class="summary-card">
            <Icon icon={ICONS.percent} width="2.5rem" height="2.5rem" />
            <div>
              <span class="summary-value">{formatCurrency(periodSummary.totalDeductions)}</span>
              <span class="summary-label">Total Deductions</span>
            </div>
          </div>
          
          <div class="summary-card">
            <Icon icon={ICONS.calculator} width="2.5rem" height="2.5rem" />
            <div>
              <span class="summary-value">{formatCurrency(periodSummary.averageSalary)}</span>
              <span class="summary-label">Average Salary</span>
            </div>
          </div>
        </div>
      </div>
      
      {#if employeeReports.length === 0}
        <div class="empty-state">
          <Icon icon={ICONS.document} width="4rem" height="4rem" />
          <h4>No Salary Records Found</h4>
          <p>No salary calculations found for {selectedPeriod.label}. Calculate payroll first to generate reports.</p>
        </div>
      {:else}
        <div class="reports-grid">
          {#each employeeReports as { employee, salaryRecord } (employee.id)}
            <div class="employee-report-card">
              <div class="employee-header">
                <div class="employee-info">
                  <Icon icon={employee.gender === 'male' ? ICONS.male : ICONS.female} width="2rem" height="2rem" />
                  <div>
                    <h4>{employee.name}</h4>
                    <div class="employee-meta">
                      <span class="final-salary">{formatCurrency(salaryRecord.finalSalary)}</span>
                      <span class="calculation-date">
                        Calculated {formatDate(salaryRecord.calculatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="report-actions">
                <h5>Generate Reports</h5>
                <div class="action-buttons">
                  <button class="secondary" onclick={() => generatePayslip(employee, salaryRecord, 'summary')}>
                    <Icon icon={ICONS.document} width="1rem" height="1rem" />
                    Summary Payslip
                  </button>
                  
                  <button class="secondary" onclick={() => generatePayslip(employee, salaryRecord, 'detailed')}>
                    <Icon icon={ICONS.documentText} width="1rem" height="1rem" />
                    Detailed Payslip
                  </button>
                  
                  <button class="primary" onclick={() => downloadPayslip(employee, reportType)}>
                    <Icon icon={ICONS.download} width="1rem" height="1rem" />
                    Download
                  </button>
                </div>
              </div>
              
              <div class="quick-summary">
                <div class="summary-item">
                  <span class="label">Base Salary</span>
                  <span class="value">{formatCurrency(salaryRecord.components?.basicSalary || 0)}</span>
                </div>
                <div class="summary-item">
                  <span class="label">Total Bonuses</span>
                  <span class="value">+{formatCurrency(
                    (salaryRecord.components?.bonusE || 0) + 
                    (salaryRecord.components?.bonusS || 0) + 
                    (salaryRecord.components?.bonusK || 0) + 
                    (salaryRecord.components?.bonusM || 0) + 
                    (salaryRecord.components?.bonusT || 0)
                  )}</span>
                </div>
                <div class="summary-item">
                  <span class="label">Insurance</span>
                  <span class="value negative">-{formatCurrency(salaryRecord.components?.insuranceDeduction || 0)}</span>
                </div>
                <div class="summary-item final">
                  <span class="label">Final Salary</span>
                  <span class="value">{formatCurrency(salaryRecord.finalSalary)}</span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/snippet}
</Wizard>

<!-- Payslip Preview Modal -->
<Modal show={showPayslipModal} onClose={() => showPayslipModal = false} size="large">
  {#snippet children()}
    {#if currentPayslip}
      <div class="payslip-modal">
        <div class="payslip-header">
          <h3>
            <Icon icon={ICONS.document} width="1.5rem" height="1.5rem" />
            {currentPayslip.type === 'summary' ? 'Summary' : 'Detailed'} Payslip
          </h3>
          
          <div class="payslip-controls">
            <button class="secondary" onclick={printPayslip}>
              <Icon icon={ICONS.print} width="1rem" height="1rem" />
              Print
            </button>
            <button class="primary" onclick={() => downloadPayslip(currentPayslip.employee, currentPayslip.type)}>
              <Icon icon={ICONS.download} width="1rem" height="1rem" />
              Download PDF
            </button>
          </div>
        </div>
        
        <div class="payslip-content">
          <!-- Company Header -->
          <div class="company-header">
            <div class="company-info">
              <h2>XPayroll Company</h2>
              <p>Professional Payroll Management</p>
            </div>
            <div class="payslip-meta">
              <div class="meta-item">
                <span class="meta-label">Period:</span>
                <span class="meta-value">{currentPayslip.period.label}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Generated:</span>
                <span class="meta-value">{formatDate(currentPayslip.generatedAt)} at {formatTime(currentPayslip.generatedAt)}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Type:</span>
                <span class="meta-value">{currentPayslip.type === 'summary' ? 'Summary Report' : 'Detailed Report'}</span>
              </div>
            </div>
          </div>
          
          <!-- Employee Information -->
          <div class="employee-section">
            <h4>Employee Information</h4>
            <div class="employee-details">
              <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">{currentPayslip.employee.name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Gender:</span>
                <span class="detail-value">{currentPayslip.employee.gender}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Marital Status:</span>
                <span class="detail-value">{currentPayslip.employee.maritalStatus}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Monthly Salary:</span>
                <span class="detail-value">{formatCurrency(currentPayslip.employee.monthlySalary)}</span>
              </div>
            </div>
          </div>
          
          <!-- Attendance Summary -->
          <div class="attendance-section">
            <h4>Attendance Summary</h4>
            <div class="attendance-grid">
              <div class="attendance-item">
                <span class="attendance-label">Working Days:</span>
                <span class="attendance-value">{currentPayslip.salaryRecord.period?.workdays || 0}</span>
              </div>
              <div class="attendance-item">
                <span class="attendance-label">Total Hours:</span>
                <span class="attendance-value">{currentPayslip.salaryRecord.period?.hours || 0}</span>
              </div>
              <div class="attendance-item">
                <span class="attendance-label">Regular Days:</span>
                <span class="attendance-value">{currentPayslip.salaryRecord.period?.regular || 0}</span>
              </div>
              <div class="attendance-item">
                <span class="attendance-label">Holidays:</span>
                <span class="attendance-value">{currentPayslip.salaryRecord.period?.holiday || 0}</span>
              </div>
              <div class="attendance-item">
                <span class="attendance-label">Paid Leave:</span>
                <span class="attendance-value">{currentPayslip.salaryRecord.period?.paid_leave || 0}</span>
              </div>
              <div class="attendance-item">
                <span class="attendance-label">Unpaid Leave:</span>
                <span class="attendance-value">{currentPayslip.salaryRecord.period?.unpaid_leave || 0}</span>
              </div>
            </div>
          </div>
          
          <!-- Salary Breakdown -->
          <div class="salary-section">
            <h4>Salary Breakdown</h4>
            
            {#if currentPayslip.type === 'summary'}
              <!-- Summary View -->
              <div class="salary-summary">
                <div class="salary-row">
                  <span class="salary-label">Base Salary</span>
                  <span class="salary-value">{formatCurrency(currentPayslip.salaryRecord.components?.basicSalary || 0)}</span>
                </div>
                <div class="salary-row">
                  <span class="salary-label">Total Bonuses</span>
                  <span class="salary-value positive">+{formatCurrency(
                    (currentPayslip.salaryRecord.components?.bonusE || 0) + 
                    (currentPayslip.salaryRecord.components?.bonusS || 0) + 
                    (currentPayslip.salaryRecord.components?.bonusK || 0) + 
                    (currentPayslip.salaryRecord.components?.bonusM || 0) + 
                    (currentPayslip.salaryRecord.components?.bonusT || 0)
                  )}</span>
                </div>
                {#if currentPayslip.salaryRecord.components?.adjustmentTotal !== 0}
                  <div class="salary-row">
                    <span class="salary-label">Adjustments</span>
                    <span class="salary-value" class:positive={currentPayslip.salaryRecord.components.adjustmentTotal > 0} class:negative={currentPayslip.salaryRecord.components.adjustmentTotal < 0}>
                      {currentPayslip.salaryRecord.components.adjustmentTotal >= 0 ? '+' : ''}{formatCurrency(currentPayslip.salaryRecord.components.adjustmentTotal)}
                    </span>
                  </div>
                {/if}
                <div class="salary-row subtotal">
                  <span class="salary-label">Subtotal</span>
                  <span class="salary-value">{formatCurrency(currentPayslip.salaryRecord.subtotal)}</span>
                </div>
                <div class="salary-row">
                  <span class="salary-label">Insurance Deduction</span>
                  <span class="salary-value negative">-{formatCurrency(currentPayslip.salaryRecord.components?.insuranceDeduction || 0)}</span>
                </div>
                <div class="salary-row final">
                  <span class="salary-label">Final Salary</span>
                  <span class="salary-value">{formatCurrency(currentPayslip.salaryRecord.finalSalary)}</span>
                </div>
              </div>
            {:else}
              <!-- Detailed View -->
              <div class="salary-detailed">
                <!-- Base Salary -->
                <div class="salary-group">
                  <h5>Base Salary Calculation</h5>
                  <div class="calculation-detail">
                    <span>Hours Worked: {currentPayslip.salaryRecord.period?.hours || 0}</span>
                    <span>Hourly Rate: {formatCurrency((currentPayslip.salaryRecord.components?.basicSalary || 0) / (currentPayslip.salaryRecord.period?.hours || 1))}</span>
                    <span class="calculation-result">Base Salary: {formatCurrency(currentPayslip.salaryRecord.components?.basicSalary || 0)}</span>
                  </div>
                </div>
                
                <!-- Bonuses -->
                <div class="salary-group">
                  <h5>Bonuses</h5>
                  {#if currentPayslip.salaryRecord.components?.bonusE > 0}
                    <div class="bonus-detail">
                      <span class="bonus-name">Bonus E</span>
                      <span class="bonus-amount">{formatCurrency(currentPayslip.salaryRecord.components.bonusE)}</span>
                    </div>
                  {/if}
                  {#if currentPayslip.salaryRecord.components?.bonusS > 0}
                    <div class="bonus-detail">
                      <span class="bonus-name">Bonus S</span>
                      <span class="bonus-amount">{formatCurrency(currentPayslip.salaryRecord.components.bonusS)}</span>
                    </div>
                  {/if}
                  {#if currentPayslip.salaryRecord.components?.bonusK > 0}
                    <div class="bonus-detail">
                      <span class="bonus-name">Bonus K</span>
                      <span class="bonus-amount">{formatCurrency(currentPayslip.salaryRecord.components.bonusK)}</span>
                    </div>
                  {/if}
                  {#if currentPayslip.salaryRecord.components?.bonusM > 0}
                    <div class="bonus-detail">
                      <span class="bonus-name">Bonus M</span>
                      <span class="bonus-amount">{formatCurrency(currentPayslip.salaryRecord.components.bonusM)}</span>
                    </div>
                  {/if}
                  {#if currentPayslip.salaryRecord.components?.bonusT > 0}
                    <div class="bonus-detail">
                      <span class="bonus-name">Bonus T (Married)</span>
                      <span class="bonus-amount">{formatCurrency(currentPayslip.salaryRecord.components.bonusT)}</span>
                    </div>
                  {/if}
                </div>
                
                <!-- Adjustments -->
                {#if currentPayslip.salaryRecord.components?.adjustments && currentPayslip.salaryRecord.components.adjustments.length > 0}
                  <div class="salary-group">
                    <h5>Manual Adjustments</h5>
                    {#each currentPayslip.salaryRecord.components.adjustments as adjustment}
                      <div class="adjustment-detail">
                        <span class="adjustment-comment">{adjustment.comment || 'No comment'}</span>
                        <span class="adjustment-amount" class:negative={adjustment.amount < 0}>
                          {adjustment.amount >= 0 ? '+' : ''}{formatCurrency(adjustment.amount)}
                        </span>
                      </div>
                    {/each}
                  </div>
                {/if}
                
                <!-- Deductions -->
                <div class="salary-group">
                  <h5>Deductions</h5>
                  <div class="deduction-detail">
                    <span class="deduction-name">Insurance Deduction ({((currentPayslip.salaryRecord.configSnapshot?.deductions?.insurance?.value || 0.07) * 100).toFixed(1)}%)</span>
                    <span class="deduction-amount">{formatCurrency(currentPayslip.salaryRecord.components?.insuranceDeduction || 0)}</span>
                  </div>
                </div>
                
                <!-- Final Calculation -->
                <div class="salary-group final-group">
                  <div class="final-calculation">
                    <div class="final-row">
                      <span>Subtotal Before Deductions:</span>
                      <span>{formatCurrency(currentPayslip.salaryRecord.subtotal)}</span>
                    </div>
                    <div class="final-row">
                      <span>Total Deductions:</span>
                      <span class="negative">-{formatCurrency(currentPayslip.salaryRecord.components?.insuranceDeduction || 0)}</span>
                    </div>
                    <div class="final-row total">
                      <span>Final Salary:</span>
                      <span>{formatCurrency(currentPayslip.salaryRecord.finalSalary)}</span>
                    </div>
                  </div>
                </div>
              </div>
            {/if}
          </div>
          
          <!-- Footer -->
          <div class="payslip-footer">
            <p>This is a computer-generated payslip and does not require a signature.</p>
            <p>Generated by XPayroll Management System</p>
          </div>
        </div>
      </div>
    {/if}
  {/snippet}
</Modal>

<style lang="sass">
  .reports-center
    display: grid
    gap: 2rem
    
  .reports-header
    @extend %flex-between
    align-items: flex-start
    gap: 2rem
    
    @media (max-width: 768px)
      flex-direction: column
      align-items: stretch
      
  .period-selector
    @extend %flex
    gap: 1rem
    align-items: center
    
    label
      @extend %flex
      gap: 0.5rem
      @extend %font-weight-medium
      color: var(--fg)
      
    select
      min-width: 200px
      
  .report-controls
    @extend %flex
    gap: 2rem
    align-items: center
    
    @media (max-width: 768px)
      flex-direction: column
      align-items: stretch
      gap: 1rem
      
  .report-type-selector
    @extend %flex
    gap: 1rem
    align-items: center
    
    label
      @extend %font-weight-medium
      color: var(--fg)
      
    .radio-group
      @extend %flex
      gap: 1rem
      
      .radio-label
        @extend %flex
        gap: 0.5rem
        align-items: center
        padding: 0.5rem 1rem
        background: color-mix(in oklab, var(--primary) 8%, transparent)
        border-radius: 0.75rem
        cursor: pointer
        @extend %transition
        
        &:hover
          background: color-mix(in oklab, var(--primary) 12%, transparent)
          
        input[type="radio"]
          accent-color: var(--primary)
          
        span
          @extend %font-weight-medium
          color: var(--fg)
          
  .period-summary
    @extend %card
    border: 1px solid color-mix(in oklab, var(--primary) 15%, transparent)
    
    h3
      @extend %flex
      gap: 0.75rem
      color: var(--primary)
      margin-bottom: 1.5rem
      
      svg
        color: var(--primary)
        
  .summary-grid
    display: grid
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))
    gap: 1rem
    
    .summary-card
      @extend %flex
      gap: 1rem
      padding: 1.5rem
      background: color-mix(in oklab, var(--primary) 8%, transparent)
      border-radius: 1rem
      
      svg
        color: var(--primary)
        flex-shrink: 0
        
      .summary-value
        display: block
        @extend %font-weight-bold
        font-size: 1.25rem
        color: var(--primary)
        font-family: 'JetBrains Mono', monospace
        
      .summary-label
        display: block
        font-size: 0.875rem
        @extend %text-muted
        
  .reports-grid
    display: grid
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr))
    gap: 1.5rem
    
  .employee-report-card
    @extend %card
    border: 1px solid color-mix(in oklab, var(--primary) 15%, transparent)
    
    .employee-header
      margin-bottom: 1.5rem
      
      .employee-info
        @extend %flex
        gap: 1rem
        
        svg
          color: var(--primary)
          flex-shrink: 0
          
        h4
          margin: 0 0 0.5rem 0
          @extend %font-weight-bold
          
        .employee-meta
          display: grid
          gap: 0.25rem
          
          .final-salary
            @extend %font-weight-bold
            font-size: 1.1rem
            color: var(--primary)
            font-family: 'JetBrains Mono', monospace
            
          .calculation-date
            font-size: 0.875rem
            @extend %text-muted
            
    .report-actions
      margin-bottom: 1.5rem
      
      h5
        color: var(--primary)
        margin-bottom: 1rem
        
      .action-buttons
        display: grid
        grid-template-columns: 1fr 1fr auto
        gap: 0.75rem
        
        @media (max-width: 480px)
          grid-template-columns: 1fr
          
        button
          @extend %flex
          gap: 0.5rem
          justify-content: center
          padding: 0.75rem
          
    .quick-summary
      .summary-item
        @extend %flex-between
        padding: 0.75rem 0
        border-bottom: 1px solid color-mix(in oklab, var(--primary) 10%, transparent)
        
        &:last-child
          border-bottom: none
          
        &.final
          border-top: 2px solid color-mix(in oklab, var(--primary) 20%, transparent)
          margin-top: 0.5rem
          padding-top: 1rem
          
          .label
            @extend %font-weight-bold
            font-size: 1.1rem
            
          .value
            @extend %font-weight-bold
            font-size: 1.1rem
            color: var(--primary)
            
        .label
          @extend %font-weight-medium
          color: var(--fg-muted)
          
        .value
          @extend %font-weight-bold
          color: var(--fg)
          font-family: 'JetBrains Mono', monospace
          
          &.positive
            color: var(--success)
            
          &.negative
            color: var(--error)
            
  .empty-state
    @extend %grid
    place-items: center
    text-align: center
    gap: 1.5rem
    padding: 4rem 2rem
    
    svg
      @extend %opacity-subtle
      color: var(--fg-muted)
      
    h4
      margin: 0
      color: var(--fg-muted)
      
    p
      @extend %text-muted
      margin: 0
      
  // Payslip Modal Styles
  .payslip-modal
    max-width: 800px
    
  .payslip-header
    @extend %flex-between
    margin-bottom: 2rem
    padding-bottom: 1rem
    border-bottom: 2px solid color-mix(in oklab, var(--primary) 15%, transparent)
    
    h3
      @extend %flex
      gap: 0.75rem
      color: var(--primary)
      margin: 0
      
    .payslip-controls
      @extend %flex
      gap: 0.75rem
      
  .payslip-content
    background: white
    color: black
    padding: 2rem
    border-radius: 0.5rem
    font-size: 0.9rem
    line-height: 1.4
    
    // Print styles
    @media print
      padding: 0
      box-shadow: none
      border-radius: 0
      
  .company-header
    @extend %flex-between
    margin-bottom: 2rem
    padding-bottom: 1rem
    border-bottom: 2px solid #ddd
    
    .company-info
      h2
        margin: 0 0 0.5rem 0
        color: #333
        
      p
        margin: 0
        color: #666
        
    .payslip-meta
      text-align: right
      
      .meta-item
        display: grid
        grid-template-columns: auto 1fr
        gap: 0.5rem
        margin-bottom: 0.25rem
        
        .meta-label
          font-weight: 600
          color: #666
          
        .meta-value
          color: #333
          
  .employee-section, .attendance-section, .salary-section
    margin-bottom: 2rem
    
    h4
      margin: 0 0 1rem 0
      color: #333
      font-size: 1.1rem
      border-bottom: 1px solid #ddd
      padding-bottom: 0.5rem
      
  .employee-details
    display: grid
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))
    gap: 0.75rem
    
    .detail-row
      display: grid
      grid-template-columns: auto 1fr
      gap: 0.5rem
      
      .detail-label
        font-weight: 600
        color: #666
        
      .detail-value
        color: #333
        
  .attendance-grid
    display: grid
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr))
    gap: 0.75rem
    
    .attendance-item
      @extend %flex-between
      padding: 0.5rem
      background: #f8f9fa
      border-radius: 0.25rem
      
      .attendance-label
        color: #666
        font-weight: 500
        
      .attendance-value
        color: #333
        font-weight: 600
        
  .salary-summary
    .salary-row
      @extend %flex-between
      padding: 0.75rem 0
      border-bottom: 1px solid #eee
      
      &:last-child
        border-bottom: none
        
      &.subtotal
        border-top: 1px solid #ddd
        border-bottom: 1px solid #ddd
        margin: 0.5rem 0
        
      &.final
        border-top: 2px solid #333
        margin-top: 1rem
        padding-top: 1rem
        font-weight: bold
        font-size: 1.1rem
        
      .salary-label
        color: #666
        font-weight: 500
        
      .salary-value
        color: #333
        font-weight: 600
        font-family: 'JetBrains Mono', monospace
        
        &.positive
          color: #28a745
          
        &.negative
          color: #dc3545
          
  .salary-detailed
    .salary-group
      margin-bottom: 1.5rem
      padding: 1rem
      background: #f8f9fa
      border-radius: 0.5rem
      
      &.final-group
        background: #e9ecef
        border: 2px solid #dee2e6
        
      h5
        margin: 0 0 1rem 0
        color: #333
        font-size: 1rem
        
      .calculation-detail
        display: grid
        gap: 0.5rem
        
        .calculation-result
          font-weight: bold
          color: #333
          padding-top: 0.5rem
          border-top: 1px solid #dee2e6
          
      .bonus-detail, .adjustment-detail, .deduction-detail
        @extend %flex-between
        padding: 0.5rem 0
        border-bottom: 1px solid #dee2e6
        
        &:last-child
          border-bottom: none
          
      .final-calculation
        .final-row
          @extend %flex-between
          padding: 0.5rem 0
          
          &.total
            border-top: 2px solid #333
            margin-top: 0.5rem
            padding-top: 0.75rem
            font-weight: bold
            font-size: 1.1rem
            
  .payslip-footer
    margin-top: 2rem
    padding-top: 1rem
    border-top: 1px solid #ddd
    text-align: center
    color: #666
    
    p
      margin: 0.25rem 0
      font-size: 0.8rem
</style>
