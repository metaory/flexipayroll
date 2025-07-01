<script>
  import { config, clearAllData } from '../lib/stores.js'
  import { formatCurrency } from '../lib/core.js'
  
  let showResetConfirm = false
  
  function resetToDefaults() {
    if (confirm('Are you sure you want to reset all configuration to defaults? This will also clear all data.')) {
      clearAllData()
    }
  }
  
  function exportConfig() {
    const data = {
      config: $config,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `xpayroll-config-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  function importConfig(event) {
    const file = event.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (data.config) {
          config.set(data.config)
          alert('Configuration imported successfully!')
        } else {
          alert('Invalid configuration file format.')
        }
      } catch (error) {
        alert('Error reading configuration file: ' + error.message)
      }
    }
    reader.readAsText(file)
    
    event.target.value = ''
  }
</script>

<div class="config-container">
  <div class="header">
    <h2>System Configuration</h2>
    <div class="header-actions">
      <button class="btn btn-secondary" on:click={exportConfig}>
        Export Config
      </button>
      <label class="btn btn-secondary" for="import-config">
        Import Config
        <input 
          id="import-config"
          type="file" 
          accept=".json"
          on:change={importConfig}
          style="display: none;"
        />
      </label>
      <button class="btn btn-danger" on:click={() => showResetConfirm = true}>
        Reset All Data
      </button>
    </div>
  </div>

  <div class="config-sections">
    <div class="config-section">
      <h3>Working Time Configuration</h3>
      
      <div class="config-grid">
        <div class="config-item">
          <label for="workdayHours">Workday Hours</label>
          <input 
            id="workdayHours"
            type="number" 
            bind:value={$config.workdayHours}
            min="1"
            max="24"
          />
          <span class="help-text">Standard working hours per day (including lunch break)</span>
        </div>
        
        <div class="config-item">
          <label for="workingDaysPerMonth">Working Days per Month</label>
          <input 
            id="workingDaysPerMonth"
            type="number" 
            bind:value={$config.workingDaysPerMonth}
            min="1"
            max="31"
          />
          <span class="help-text">Average working days per month for rate calculations</span>
        </div>
      </div>
    </div>

    <div class="config-section">
      <h3>Bonus Configuration</h3>
      
      <div class="config-grid">
        <div class="config-item">
          <label for="bonusE">Bonus E (Daily Rate Multiplier)</label>
          <input 
            id="bonusE"
            type="number" 
            bind:value={$config.bonuses.E.value}
            min="0"
            step="0.5"
          />
          <span class="help-text">Multiplier for daily rate (e.g., 5 = 5 working days)</span>
        </div>
        
        <div class="config-item">
          <label for="bonusS">Bonus S (Daily Rate Multiplier)</label>
          <input 
            id="bonusS"
            type="number" 
            bind:value={$config.bonuses.S.value}
            min="0"
            step="0.5"
          />
          <span class="help-text">Multiplier for daily rate (e.g., 2.5 = 2.5 working days)</span>
        </div>
        
        <div class="config-item">
          <label for="bonusK">Bonus K (Fixed Amount)</label>
          <input 
            id="bonusK"
            type="number" 
            bind:value={$config.bonuses.K.value}
            min="0"
          />
          <span class="help-text">Fixed amount in IDR (applies to everyone)</span>
        </div>
        
        <div class="config-item">
          <label for="bonusM">Bonus M (Fixed Amount)</label>
          <input 
            id="bonusM"
            type="number" 
            bind:value={$config.bonuses.M.value}
            min="0"
          />
          <span class="help-text">Fixed amount in IDR (applies to everyone)</span>
        </div>
        
        <div class="config-item">
          <label for="bonusT">Bonus T (Fixed Amount)</label>
          <input 
            id="bonusT"
            type="number" 
            bind:value={$config.bonuses.T.value}
            min="0"
          />
          <span class="help-text">Fixed amount in IDR (married employees only)</span>
        </div>
      </div>
    </div>

    <div class="config-section">
      <h3>Deduction Configuration</h3>
      
      <div class="config-grid">
        <div class="config-item">
          <label for="insuranceRate">Insurance Deduction Rate (%)</label>
          <input 
            id="insuranceRate"
            type="number" 
            bind:value={$config.deductions.insurance.value}
            min="0"
            max="100"
            step="0.01"
          />
          <span class="help-text">Percentage of total salary (including bonuses and adjustments)</span>
        </div>
      </div>
    </div>

    <div class="config-section">
      <h3>Day Type Configuration</h3>
      
      <div class="config-grid">
        <div class="config-item">
          <label for="holidayHours">Holiday Hours</label>
          <input 
            id="holidayHours"
            type="number" 
            bind:value={$config.dayTypes.holiday.hours}
            min="0"
            max="24"
          />
          <span class="help-text">Hours credited for holiday days</span>
        </div>
        
        <div class="config-item">
          <label for="paidLeaveHours">Paid Leave Hours</label>
          <input 
            id="paidLeaveHours"
            type="number" 
            bind:value={$config.dayTypes.paid_leave.hours}
            min="0"
            max="24"
          />
          <span class="help-text">Hours credited for paid leave days</span>
        </div>
        
        <div class="config-item">
          <label for="unpaidLeaveHours">Unpaid Leave Hours</label>
          <input 
            id="unpaidLeaveHours"
            type="number" 
            bind:value={$config.dayTypes.unpaid_leave.hours}
            min="0"
            max="24"
          />
          <span class="help-text">Hours credited for unpaid leave days</span>
        </div>
      </div>
    </div>
  </div>

  <div class="config-summary">
    <h3>Configuration Summary</h3>
    <div class="summary-grid">
      <div class="summary-item">
        <span class="label">Daily Rate Calculation:</span>
        <span class="value">Monthly Salary ÷ {$config.workingDaysPerMonth} days</span>
      </div>
      <div class="summary-item">
        <span class="label">Hourly Rate Calculation:</span>
        <span class="value">Daily Rate ÷ {$config.workdayHours} hours</span>
      </div>
      <div class="summary-item">
        <span class="label">Insurance Deduction:</span>
        <span class="value">{$config.deductions.insurance.value * 100}% of total salary</span>
      </div>
    </div>
  </div>

  {#if showResetConfirm}
    <div class="modal-overlay" role="dialog" aria-modal="true">
      <button 
        class="modal-backdrop" 
        on:click={() => showResetConfirm = false}
        on:keydown={(e) => e.key === 'Escape' && (showResetConfirm = false)}
        aria-label="Close modal"
      >
      </button>
      <div class="modal" role="document">
        <h3>Reset All Data</h3>
        <p>This will permanently delete all employees, attendance records, and reset configuration to defaults. This action cannot be undone.</p>
        <div class="modal-actions">
          <button class="btn btn-danger" on:click={resetToDefaults}>
            Yes, Reset Everything
          </button>
          <button class="btn btn-secondary" on:click={() => showResetConfirm = false}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .config-container {
    max-width: 100%;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
  }

  .header h2 {
    margin: 0;
    color: #333;
  }

  .header-actions {
    display: flex;
    gap: 10px;
  }

  .config-sections {
    display: flex;
    flex-direction: column;
    gap: 30px;
  }

  .config-section {
    background: white;
    border-radius: 8px;
    padding: 25px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .config-section h3 {
    margin: 0 0 20px 0;
    color: #333;
    font-size: 1.2rem;
  }

  .config-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
  }

  .config-item {
    display: flex;
    flex-direction: column;
  }

  .config-item label {
    margin-bottom: 8px;
    font-weight: 500;
    color: #555;
  }

  .config-item input {
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }

  .config-item input:focus {
    outline: none;
    border-color: #ff6b35;
    box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.2);
  }

  .help-text {
    margin-top: 5px;
    font-size: 12px;
    color: #666;
    font-style: italic;
  }

  .config-summary {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 25px;
    border: 1px solid #e0e0e0;
  }

  .config-summary h3 {
    margin: 0 0 20px 0;
    color: #333;
  }

  .summary-grid {
    display: grid;
    gap: 15px;
  }

  .summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background: white;
    border-radius: 4px;
    border: 1px solid #e0e0e0;
  }

  .summary-item .label {
    font-weight: 500;
    color: #555;
  }

  .summary-item .value {
    color: #333;
    font-family: monospace;
  }

  .btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
  }



  .btn-secondary {
    background: #6c757d;
    color: white;
  }

  .btn-secondary:hover {
    background: #5a6268;
  }

  .btn-danger {
    background: #dc3545;
    color: white;
  }

  .btn-danger:hover {
    background: #c82333;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    border: none;
    cursor: pointer;
  }

  .modal {
    background: white;
    border-radius: 8px;
    padding: 30px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }

  .modal h3 {
    margin: 0 0 15px 0;
    color: #333;
  }

  .modal p {
    margin: 0 0 20px 0;
    color: #666;
    line-height: 1.5;
  }

  .modal-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }

  @media (max-width: 768px) {
    .header {
      flex-direction: column;
      gap: 15px;
      align-items: stretch;
    }

    .header-actions {
      justify-content: center;
    }

    .config-grid {
      grid-template-columns: 1fr;
    }

    .summary-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 5px;
    }

    .modal-actions {
      flex-direction: column;
    }
  }
</style> 