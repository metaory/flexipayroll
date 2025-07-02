<script>
  import { config } from '../lib/stores.js';
  import { DEFAULT_CONFIG } from '../lib/core.js';
  
  function updateConfig(field, value) {
    const currentConfig = $config;
    const newConfig = { ...currentConfig };
    
    if (field.includes('.')) {
      const [section, key] = field.split('.');
      if (!newConfig[section]) newConfig[section] = {};
      newConfig[section][key] = value;
    } else {
      newConfig[field] = value;
    }
    
    config.set(newConfig);
  }
  
  function resetToDefaults() {
    if (confirm('Are you sure you want to reset all configuration to defaults? This will affect all calculations.')) {
      config.set(DEFAULT_CONFIG);
    }
  }
  
  function exportData() {
    const data = {
      employees: JSON.parse(localStorage.getItem('xpayroll_employees') || '[]'),
      attendance: JSON.parse(localStorage.getItem('xpayroll_attendance') || '{}'),
      config: $config
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xpayroll-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(String(e.target.result));
        if (data.employees) localStorage.setItem('xpayroll_employees', JSON.stringify(data.employees));
        if (data.attendance) localStorage.setItem('xpayroll_attendance', JSON.stringify(data.attendance));
        if (data.config) config.set(data.config);
        alert('Data imported successfully!');
        location.reload();
      } catch (error) {
        alert(`Error importing data: ${error.message}`);
      }
    };
    reader.readAsText(file);
  }
  
  function clearAllData() {
    if (confirm('Are you sure you want to clear ALL data? This will delete all employees, attendance records, and reset configuration. This action cannot be undone.')) {
      localStorage.clear();
      location.reload();
    }
  }
</script>

<div class="config-container">
  <!-- Header Section -->
  <div>
    <h2 class="section-title">System Configuration</h2>
    <p class="section-desc">Configure payroll settings and system parameters</p>
  </div>
  
  <!-- Working Time Configuration -->
  <div class="config-card">
    <header class="config-header">
      <h3 class="config-title">Working Time Settings</h3>
    </header>
    <section class="config-body">
      <div class="config-grid">
        <label class="form-label">
          <span class="label-text">Working Days per Month</span>
          <input 
            class="form-input"
            type="number"
            bind:value={$config.workingDaysPerMonth}
            onchange={() => updateConfig('workingDaysPerMonth', $config.workingDaysPerMonth)}
            min="1"
            max="31"
          />
        </label>
        
        <label class="form-label">
          <span class="label-text">Workday Hours</span>
          <input 
            class="form-input"
            type="number"
            bind:value={$config.workdayHours}
            onchange={() => updateConfig('workdayHours', $config.workdayHours)}
            min="1"
            max="24"
            step="0.5"
          />
        </label>
      </div>
    </section>
  </div>
  
  <!-- Bonus Configuration -->
  <div class="config-card">
    <header class="config-header">
      <h3 class="config-title">Bonus Settings</h3>
    </header>
    <section class="config-body">
      <div class="config-grid">
        <label class="form-label">
          <span class="label-text">Bonus E (Days × Daily Rate)</span>
          <input 
            class="form-input"
            type="number"
            bind:value={$config.bonuses.E.value}
            onchange={() => updateConfig('bonuses.E.value', $config.bonuses.E.value)}
            min="0"
            step="0.5"
          />
        </label>
        
        <label class="form-label">
          <span class="label-text">Bonus S (Days × Daily Rate)</span>
          <input 
            class="form-input"
            type="number"
            bind:value={$config.bonuses.S.value}
            onchange={() => updateConfig('bonuses.S.value', $config.bonuses.S.value)}
            min="0"
            step="0.5"
          />
        </label>
        
        <label class="form-label">
          <span class="label-text">Bonus K (Fixed Amount - IDR)</span>
          <input 
            class="form-input"
            type="number"
            bind:value={$config.bonuses.K.value}
            onchange={() => updateConfig('bonuses.K.value', $config.bonuses.K.value)}
            min="0"
          />
        </label>
        
        <label class="form-label">
          <span class="label-text">Bonus M (Fixed Amount - IDR)</span>
          <input 
            class="form-input"
            type="number"
            bind:value={$config.bonuses.M.value}
            onchange={() => updateConfig('bonuses.M.value', $config.bonuses.M.value)}
            min="0"
          />
        </label>
        
        <label class="form-label">
          <span class="label-text">Bonus T (Fixed Amount - IDR)</span>
          <input 
            class="form-input"
            type="number"
            bind:value={$config.bonuses.T.value}
            onchange={() => updateConfig('bonuses.T.value', $config.bonuses.T.value)}
            min="0"
          />
          <div class="input-help">Married employees only</div>
        </label>
      </div>
    </section>
  </div>
  
  <!-- Insurance Configuration -->
  <div class="config-card">
    <header class="config-header">
      <h3 class="config-title">Insurance Deduction</h3>
    </header>
    <section class="config-body">
      <div class="config-grid">
        <label class="form-label">
          <span class="label-text">Insurance Rate (%)</span>
          <input 
            class="form-input"
            type="number"
            value={$config.deductions.insurance.value * 100}
            onchange={(e) => updateConfig('deductions.insurance.value', Number(e.currentTarget.value) / 100)}
            min="0"
            max="100"
            step="0.1"
          />
        </label>
      </div>
    </section>
  </div>
  
  <!-- Data Management -->
  <div class="config-card">
    <header class="config-header">
      <h3 class="config-title">Data Management</h3>
    </header>
    <section class="config-body">
      <div class="action-grid">
        <button class="btn btn-primary" onclick={exportData}>
          Export Data
        </button>
        
        <label class="btn btn-secondary file-input-wrapper">
          Import Data
          <input 
            type="file"
            accept=".json"
            onchange={importData}
            class="file-input"
          />
        </label>
        
        <button class="btn btn-warning" onclick={resetToDefaults}>
          Reset Config
        </button>
        
        <button class="btn btn-danger" onclick={clearAllData}>
          Clear All Data
        </button>
      </div>
      
      <div class="config-summary">
        <h4 class="summary-title">Current Configuration Summary</h4>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-label">Working Days</div>
            <div class="summary-value">{$config.workingDaysPerMonth} days/month</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Workday Hours</div>
            <div class="summary-value">{$config.workdayHours} hours/day</div>
          </div>
          <div class="summary-item">
            <div class="summary-label bonus">Bonus E</div>
            <div class="summary-value">{$config.bonuses.E.value} × daily rate</div>
          </div>
          <div class="summary-item">
            <div class="summary-label bonus">Bonus S</div>
            <div class="summary-value">{$config.bonuses.S.value} × daily rate</div>
          </div>
          <div class="summary-item">
            <div class="summary-label bonus">Bonus K</div>
            <div class="summary-value currency">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format($config.bonuses.K.value)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label bonus">Bonus M</div>
            <div class="summary-value currency">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format($config.bonuses.M.value)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label bonus">Bonus T</div>
            <div class="summary-value currency">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format($config.bonuses.T.value)} (married only)</div>
          </div>
          <div class="summary-item">
            <div class="summary-label deduction">Insurance</div>
            <div class="summary-value">{($config.deductions.insurance.value * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</div>

<style>
.config-container {
  padding: 1rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0 0 0.5rem 0;
  color: #1976d2;
}

.section-desc {
  color: #666;
  margin: 0 0 2rem 0;
}

.config-card {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  overflow: hidden;
}

.config-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
}

.config-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: #1976d2;
}

.config-body {
  padding: 1.5rem;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.form-label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label-text {
  font-weight: 500;
  color: #333;
}

.form-input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.form-input:focus {
  outline: none;
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}

.input-help {
  font-size: 0.75rem;
  color: #666;
  margin-top: 0.25rem;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-primary {
  background: #1976d2;
  color: white;
}

.btn-primary:hover {
  background: #1565c0;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-warning {
  background: #f57c00;
  color: white;
}

.btn-warning:hover {
  background: #ef6c00;
}

.btn-danger {
  background: #d32f2f;
  color: white;
}

.btn-danger:hover {
  background: #c62828;
}

.file-input-wrapper {
  position: relative;
  cursor: pointer;
}

.file-input {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.config-summary {
  background: #fafafa;
  padding: 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid #e0e0e0;
}

.summary-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: #1976d2;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.summary-item {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 0.375rem;
}

.summary-label {
  font-weight: bold;
  color: #1976d2;
  margin-bottom: 0.25rem;
}

.summary-label.bonus {
  color: #2e7d32;
}

.summary-label.deduction {
  color: #d32f2f;
}

.summary-value {
  color: #666;
  font-size: 0.875rem;
}

.summary-value.currency {
  font-family: monospace;
  font-weight: 500;
}

@media (max-width: 768px) {
  .config-grid {
    grid-template-columns: 1fr;
  }
  
  .action-grid {
    grid-template-columns: 1fr;
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style> 