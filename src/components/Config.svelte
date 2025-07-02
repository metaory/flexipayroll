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

<div>
  <div class="xpayroll-card">
    <div class="xpayroll-card__header">
      <h2>System Configuration</h2>
      <p>Configure payroll settings and system parameters</p>
    </div>
  </div>
  
  <div class="xpayroll-card" style="margin-top: 1rem;">
    <div class="xpayroll-card__header">
      <h3>Working Time Settings</h3>
    </div>
    <div class="xpayroll-card__body">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
        <div class="xpayroll-form__group">
          <label class="xpayroll-form__label" for="working-days">Working Days per Month</label>
          <input 
            id="working-days"
            class="xpayroll-form__input"
            type="number"
            bind:value={$config.workingDaysPerMonth}
            onchange={() => updateConfig('workingDaysPerMonth', $config.workingDaysPerMonth)}
            min="1"
            max="31"
          />
        </div>
        
        <div class="xpayroll-form__group">
          <label class="xpayroll-form__label" for="workday-hours">Workday Hours</label>
          <input 
            id="workday-hours"
            class="xpayroll-form__input"
            type="number"
            bind:value={$config.workdayHours}
            onchange={() => updateConfig('workdayHours', $config.workdayHours)}
            min="1"
            max="24"
            step="0.5"
          />
        </div>
      </div>
    </div>
  </div>
  
  <div class="xpayroll-card" style="margin-top: 1rem;">
    <div class="xpayroll-card__header">
      <h3>Bonus Settings</h3>
    </div>
    <div class="xpayroll-card__body">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
        <div class="xpayroll-form__group">
          <label class="xpayroll-form__label" for="bonus-e">Bonus E (Days × Daily Rate)</label>
          <input 
            id="bonus-e"
            class="xpayroll-form__input"
            type="number"
            bind:value={$config.bonuses.E.value}
            onchange={() => updateConfig('bonuses.E.value', $config.bonuses.E.value)}
            min="0"
            step="0.5"
          />
        </div>
        
        <div class="xpayroll-form__group">
          <label class="xpayroll-form__label" for="bonus-s">Bonus S (Days × Daily Rate)</label>
          <input 
            id="bonus-s"
            class="xpayroll-form__input"
            type="number"
            bind:value={$config.bonuses.S.value}
            onchange={() => updateConfig('bonuses.S.value', $config.bonuses.S.value)}
            min="0"
            step="0.5"
          />
        </div>
        
        <div class="xpayroll-form__group">
          <label class="xpayroll-form__label" for="bonus-k">Bonus K (Fixed Amount - IDR)</label>
          <input 
            id="bonus-k"
            class="xpayroll-form__input"
            type="number"
            bind:value={$config.bonuses.K.value}
            onchange={() => updateConfig('bonuses.K.value', $config.bonuses.K.value)}
            min="0"
          />
        </div>
        
        <div class="xpayroll-form__group">
          <label class="xpayroll-form__label" for="bonus-m">Bonus M (Fixed Amount - IDR)</label>
          <input 
            id="bonus-m"
            class="xpayroll-form__input"
            type="number"
            bind:value={$config.bonuses.M.value}
            onchange={() => updateConfig('bonuses.M.value', $config.bonuses.M.value)}
            min="0"
          />
        </div>
        
        <div class="xpayroll-form__group">
          <label class="xpayroll-form__label" for="bonus-t">Bonus T (Fixed Amount - IDR)</label>
          <input 
            id="bonus-t"
            class="xpayroll-form__input"
            type="number"
            bind:value={$config.bonuses.T.value}
            onchange={() => updateConfig('bonuses.T.value', $config.bonuses.T.value)}
            min="0"
          />
          <div style="font-size: 0.875rem; color: color('text-muted', 'xpayroll'); margin-top: 0.25rem;">Married employees only</div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="xpayroll-card" style="margin-top: 1rem;">
    <div class="xpayroll-card__header">
      <h3>Insurance Deduction</h3>
    </div>
    <div class="xpayroll-card__body">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
        <div class="xpayroll-form__group">
          <label class="xpayroll-form__label" for="insurance-rate">Insurance Rate (%)</label>
          <input 
            id="insurance-rate"
            class="xpayroll-form__input"
            type="number"
            value={$config.deductions.insurance.value * 100}
            onchange={(e) => updateConfig('deductions.insurance.value', Number(e.currentTarget.value) / 100)}
            min="0"
            max="100"
            step="0.1"
          />
        </div>
      </div>
    </div>
  </div>
  
  <div class="xpayroll-card" style="margin-top: 1rem;">
    <div class="xpayroll-card__header">
      <h3>Data Management</h3>
    </div>
    <div class="xpayroll-card__body">
      <div style="display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 2rem;">
        <button class="xpayroll-btn xpayroll-btn--primary" onclick={exportData}>
          Export Data
        </button>
        
        <label class="xpayroll-btn xpayroll-btn--secondary" style="cursor: pointer;">
          Import Data
          <input 
            type="file"
            accept=".json"
            onchange={importData}
            style="display: none;"
          />
        </label>
        
        <button class="xpayroll-btn xpayroll-btn--secondary" onclick={resetToDefaults}>
          Reset Config
        </button>
        
        <button class="xpayroll-btn xpayroll-btn--danger" onclick={clearAllData}>
          Clear All Data
        </button>
      </div>
      
      <div>
        <h4>Current Configuration Summary</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem;">
          <div style="padding: 1rem; background: color('surface-alt', 'xpayroll'); border-radius: 0.5rem;">
            <div style="font-weight: 500; color: color('text-muted', 'xpayroll');">Working Days</div>
            <div style="font-size: 1.25rem; font-weight: bold; color: color('text', 'xpayroll');">{$config.workingDaysPerMonth} days/month</div>
          </div>
          <div style="padding: 1rem; background: color('surface-alt', 'xpayroll'); border-radius: 0.5rem;">
            <div style="font-weight: 500; color: color('text-muted', 'xpayroll');">Workday Hours</div>
            <div style="font-size: 1.25rem; font-weight: bold; color: color('text', 'xpayroll');">{$config.workdayHours} hours/day</div>
          </div>
          <div style="padding: 1rem; background: color('surface-alt', 'xpayroll'); border-radius: 0.5rem;">
            <div style="font-weight: 500; color: color('text-muted', 'xpayroll');">Bonus E</div>
            <div style="font-size: 1.25rem; font-weight: bold; color: color('text', 'xpayroll');">{$config.bonuses.E.value} × daily rate</div>
          </div>
          <div style="padding: 1rem; background: color('surface-alt', 'xpayroll'); border-radius: 0.5rem;">
            <div style="font-weight: 500; color: color('text-muted', 'xpayroll');">Bonus S</div>
            <div style="font-size: 1.25rem; font-weight: bold; color: color('text', 'xpayroll');">{$config.bonuses.S.value} × daily rate</div>
          </div>
          <div style="padding: 1rem; background: color('surface-alt', 'xpayroll'); border-radius: 0.5rem;">
            <div style="font-weight: 500; color: color('text-muted', 'xpayroll');">Bonus K</div>
            <div style="font-size: 1.25rem; font-weight: bold; color: color('text', 'xpayroll');">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format($config.bonuses.K.value)}</div>
          </div>
          <div style="padding: 1rem; background: color('surface-alt', 'xpayroll'); border-radius: 0.5rem;">
            <div style="font-weight: 500; color: color('text-muted', 'xpayroll');">Bonus M</div>
            <div style="font-size: 1.25rem; font-weight: bold; color: color('text', 'xpayroll');">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format($config.bonuses.M.value)}</div>
          </div>
          <div style="padding: 1rem; background: color('surface-alt', 'xpayroll'); border-radius: 0.5rem;">
            <div style="font-weight: 500; color: color('text-muted', 'xpayroll');">Bonus T</div>
            <div style="font-size: 1.25rem; font-weight: bold; color: color('text', 'xpayroll');">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format($config.bonuses.T.value)} (married only)</div>
          </div>
          <div style="padding: 1rem; background: color('surface-alt', 'xpayroll'); border-radius: 0.5rem;">
            <div style="font-weight: 500; color: color('text-muted', 'xpayroll');">Insurance</div>
            <div style="font-size: 1.25rem; font-weight: bold; color: color('text', 'xpayroll');">{($config.deductions.insurance.value * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div> 