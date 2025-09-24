<script>
  import Icon from '@iconify/svelte'
  import { employees, currentPeriod } from '../stores.js'
  import { formatCurrency } from '../core.js'
  
  let selectedPeriod = $state($currentPeriod)
  let reportType = $state('summary')
  
  const availablePeriods = $derived(() => {
    const periods = []
    const currentDate = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      periods.push({
        value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      })
    }
    return periods
  })
  
  const printReport = () => {
    window.print()
  }
</script>

<div class="reports-wizard">
  <header class="wizard-header">
    <div class="step-info">
      <Icon icon="solar:document-text-bold-duotone" width="2.5rem" height="2.5rem" />
      <div>
        <h1>Reports & Payslips</h1>
        <p>Generate salary reports and payslips</p>
      </div>
    </div>
    
    <div class="controls">
      <select bind:value={selectedPeriod}>
        {#each availablePeriods as period}
          <option value={period.value}>{period.label}</option>
        {/each}
      </select>
      
      <button class="btn-primary" onclick={printReport}>
        <Icon icon="solar:printer-bold-duotone" width="1rem" height="1rem" />
        Print
      </button>
    </div>
  </header>
  
  <main class="reports-content">
    <div class="report-options">
      <h2>Report Type</h2>
      <div class="options-grid">
        <label class="option-card">
          <input type="radio" bind:group={reportType} value="summary" />
          <div class="card-content">
            <Icon icon="solar:document-bold-duotone" width="2rem" height="2rem" />
            <div>
              <strong>Summary Payslip</strong>
              <p>Essential information only</p>
            </div>
          </div>
        </label>
        
        <label class="option-card">
          <input type="radio" bind:group={reportType} value="detailed" />
          <div class="card-content">
            <Icon icon="solar:document-text-bold-duotone" width="2rem" height="2rem" />
            <div>
              <strong>Detailed Payslip</strong>
              <p>Complete breakdown</p>
            </div>
          </div>
        </label>
      </div>
    </div>
    
    {#if $employees.length === 0}
      <div class="empty-state">
        <Icon icon="solar:document-text-bold-duotone" width="3rem" height="3rem" />
        <p>No employees found</p>
        <span>Add employees first to generate reports</span>
      </div>
    {:else}
      <div class="reports-grid">
        {#each $employees as emp}
          <div class="payslip-preview">
            {#if reportType === 'summary'}
              <div class="payslip summary">
                <div class="payslip-header">
                  <h3>Payslip Summary</h3>
                  <div class="meta">
                    <span>{emp.name}</span>
                    <span>{availablePeriods.find(p => p.value === selectedPeriod)?.label}</span>
                  </div>
                </div>
                
                <div class="payslip-content">
                  <div class="line">
                    <span>Employee:</span>
                    <span>{emp.name}</span>
                  </div>
                  <div class="line">
                    <span>Status:</span>
                    <span>{emp.maritalStatus} • {emp.gender}</span>
                  </div>
                  <div class="line">
                    <span>Base Salary:</span>
                    <span>{formatCurrency(emp.monthlySalary)}</span>
                  </div>
                  <div class="line final">
                    <span>Estimated Net:</span>
                    <span>{formatCurrency(emp.monthlySalary * 1.25)}</span>
                  </div>
                </div>
              </div>
            {:else}
              <div class="payslip detailed">
                <div class="payslip-header">
                  <h3>Detailed Payslip</h3>
                  <div class="meta">
                    <span>{emp.name}</span>
                    <span>{availablePeriods.find(p => p.value === selectedPeriod)?.label}</span>
                  </div>
                </div>
                
                <div class="payslip-content">
                  <div class="section">
                    <h4>Employee Information</h4>
                    <div class="info-grid">
                      <div class="info-item">
                        <span>Name:</span>
                        <span>{emp.name}</span>
                      </div>
                      <div class="info-item">
                        <span>Gender:</span>
                        <span>{emp.gender}</span>
                      </div>
                      <div class="info-item">
                        <span>Marital Status:</span>
                        <span>{emp.maritalStatus}</span>
                      </div>
                      <div class="info-item">
                        <span>Monthly Salary:</span>
                        <span>{formatCurrency(emp.monthlySalary)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="section">
                    <h4>Calculation Breakdown</h4>
                    <div class="calc-grid">
                      <div class="calc-item">
                        <span>Base Salary:</span>
                        <span>{formatCurrency(emp.monthlySalary)}</span>
                      </div>
                      <div class="calc-item">
                        <span>Estimated Bonuses:</span>
                        <span>{formatCurrency(emp.monthlySalary * 0.3)}</span>
                      </div>
                      <div class="calc-item">
                        <span>Estimated Deductions:</span>
                        <span>-{formatCurrency(emp.monthlySalary * 0.05)}</span>
                      </div>
                      <div class="calc-item final">
                        <span>Estimated Net:</span>
                        <span>{formatCurrency(emp.monthlySalary * 1.25)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            {/if}
            
            <div class="payslip-actions">
              <button class="btn-secondary">
                <Icon icon="solar:eye-bold-duotone" width="1rem" height="1rem" />
                View
              </button>
              <button class="btn-primary" onclick={printReport}>
                <Icon icon="solar:printer-bold-duotone" width="1rem" height="1rem" />
                Print
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </main>
</div>

<style>
  .reports-wizard {
    min-height: 100vh;
  }
  
  .wizard-header {
    background: color-mix(in oklab, var(--primary) 5%, transparent);
    border-bottom: 1px solid color-mix(in oklab, var(--primary) 15%, transparent);
    padding: 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .step-info {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }
  
  .step-info h1 {
    font-size: 2rem;
    font-weight: 600;
    margin: 0;
    color: var(--primary);
  }
  
  .step-info p {
    margin: 0;
    color: var(--fg-muted);
    font-size: 1.1rem;
  }
  
  .controls {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .controls select {
    padding: 0.5rem;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
  }
  
  .reports-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 3rem 2rem;
  }
  
  .report-options h2 {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
    color: var(--primary);
  }
  
  .options-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 3rem;
  }
  
  .option-card {
    cursor: pointer;
  }
  
  .card-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background: color-mix(in oklab, var(--secondary) 8%, transparent);
    border: 1px solid color-mix(in oklab, var(--secondary) 15%, transparent);
    border-radius: 0.75rem;
    transition: all 0.2s ease;
  }
  
  .option-card:has(input:checked) .card-content {
    background: color-mix(in oklab, var(--primary) 15%, transparent);
    border-color: var(--primary);
    color: var(--primary);
  }
  
  .card-content input {
    display: none;
  }
  
  .card-content strong {
    display: block;
    margin-bottom: 0.25rem;
  }
  
  .card-content p {
    margin: 0;
    color: var(--fg-muted);
    font-size: 0.9rem;
  }
  
  .reports-grid {
    display: grid;
    gap: 2rem;
  }
  
  .payslip-preview {
    background: color-mix(in oklab, var(--bg-muted) 30%, transparent);
    border-radius: 1rem;
    border: 1px solid var(--border);
    overflow: hidden;
  }
  
  .payslip {
    padding: 2rem;
    background: white;
    color: #333;
  }
  
  .payslip-header {
    margin-bottom: 2rem;
    border-bottom: 2px solid #333;
    padding-bottom: 1rem;
  }
  
  .payslip-header h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    color: #333;
  }
  
  .meta {
    display: flex;
    justify-content: space-between;
    color: #666;
  }
  
  .line {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid #eee;
  }
  
  .line.final {
    font-size: 1.1rem;
    font-weight: 700;
    color: #006600;
    border-bottom: 2px solid #006600;
    margin-top: 1rem;
    padding-top: 1rem;
  }
  
  .section {
    margin-bottom: 2rem;
  }
  
  .section h4 {
    margin: 0 0 1rem 0;
    color: #333;
    border-bottom: 1px solid #ccc;
    padding-bottom: 0.5rem;
  }
  
  .info-grid,
  .calc-grid {
    display: grid;
    gap: 0.75rem;
  }
  
  .info-item,
  .calc-item {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
  }
  
  .calc-item.final {
    font-size: 1.1rem;
    font-weight: 700;
    color: #006600;
    border-top: 2px solid #006600;
    margin-top: 1rem;
    padding-top: 1rem;
  }
  
  .payslip-actions {
    padding: 1rem 2rem;
    background: color-mix(in oklab, var(--bg-muted) 50%, transparent);
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
  }
  
  .empty-state {
    text-align: center;
    padding: 3rem;
    color: var(--fg-muted);
  }
  
  .empty-state p {
    margin: 1rem 0 0.5rem 0;
    font-size: 1.1rem;
  }
  
  .btn-primary,
  .btn-secondary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 500;
    transition: all 0.2s ease;
    cursor: pointer;
  }
  
  .btn-primary {
    background: var(--primary);
    color: white;
    border: none;
  }
  
  .btn-primary:hover {
    background: color-mix(in oklab, var(--primary) 90%, black);
  }
  
  .btn-secondary {
    background: color-mix(in oklab, var(--secondary) 10%, transparent);
    color: var(--fg);
    border: 1px solid var(--border);
  }
  
  .btn-secondary:hover {
    background: color-mix(in oklab, var(--secondary) 20%, transparent);
  }
  
  @media (max-width: 768px) {
    .wizard-header {
      flex-direction: column;
      gap: 1rem;
    }
    
    .options-grid {
      grid-template-columns: 1fr;
    }
  }
  
  @media print {
    .wizard-header,
    .payslip-actions,
    .report-options {
      display: none !important;
    }
    
    .payslip {
      box-shadow: none !important;
      border: none !important;
    }
  }
</style>
