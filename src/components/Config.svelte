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
  <div>
    <h2>System Configuration</h2>
    <p>Configure payroll settings and system parameters</p>
  </div>
  
  <div>
    <header>
      <h3>Working Time Settings</h3>
    </header>
    <section>
      <div>
        <label>
          <span>Working Days per Month</span>
          <input 
            type="number"
            bind:value={$config.workingDaysPerMonth}
            onchange={() => updateConfig('workingDaysPerMonth', $config.workingDaysPerMonth)}
            min="1"
            max="31"
          />
        </label>
        
        <label>
          <span>Workday Hours</span>
          <input 
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
  
  <div>
    <header>
      <h3>Bonus Settings</h3>
    </header>
    <section>
      <div>
        <label>
          <span>Bonus E (Days × Daily Rate)</span>
          <input 
            type="number"
            bind:value={$config.bonuses.E.value}
            onchange={() => updateConfig('bonuses.E.value', $config.bonuses.E.value)}
            min="0"
            step="0.5"
          />
        </label>
        
        <label>
          <span>Bonus S (Days × Daily Rate)</span>
          <input 
            type="number"
            bind:value={$config.bonuses.S.value}
            onchange={() => updateConfig('bonuses.S.value', $config.bonuses.S.value)}
            min="0"
            step="0.5"
          />
        </label>
        
        <label>
          <span>Bonus K (Fixed Amount - IDR)</span>
          <input 
            type="number"
            bind:value={$config.bonuses.K.value}
            onchange={() => updateConfig('bonuses.K.value', $config.bonuses.K.value)}
            min="0"
          />
        </label>
        
        <label>
          <span>Bonus M (Fixed Amount - IDR)</span>
          <input 
            type="number"
            bind:value={$config.bonuses.M.value}
            onchange={() => updateConfig('bonuses.M.value', $config.bonuses.M.value)}
            min="0"
          />
        </label>
        
        <label>
          <span>Bonus T (Fixed Amount - IDR)</span>
          <input 
            type="number"
            bind:value={$config.bonuses.T.value}
            onchange={() => updateConfig('bonuses.T.value', $config.bonuses.T.value)}
            min="0"
          />
          <div>Married employees only</div>
        </label>
      </div>
    </section>
  </div>
  
  <div>
    <header>
      <h3>Insurance Deduction</h3>
    </header>
    <section>
      <div>
        <label>
          <span>Insurance Rate (%)</span>
          <input 
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
  
  <div>
    <header>
      <h3>Data Management</h3>
    </header>
    <section>
      <div>
        <button onclick={exportData}>
          Export Data
        </button>
        
        <label>
          Import Data
          <input 
            type="file"
            accept=".json"
            onchange={importData}
          />
        </label>
        
        <button onclick={resetToDefaults}>
          Reset Config
        </button>
        
        <button onclick={clearAllData}>
          Clear All Data
        </button>
      </div>
      
      <div>
        <h4>Current Configuration Summary</h4>
        <div>
          <div>
            <div>Working Days</div>
            <div>{$config.workingDaysPerMonth} days/month</div>
          </div>
          <div>
            <div>Workday Hours</div>
            <div>{$config.workdayHours} hours/day</div>
          </div>
          <div>
            <div>Bonus E</div>
            <div>{$config.bonuses.E.value} × daily rate</div>
          </div>
          <div>
            <div>Bonus S</div>
            <div>{$config.bonuses.S.value} × daily rate</div>
          </div>
          <div>
            <div>Bonus K</div>
            <div>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format($config.bonuses.K.value)}</div>
          </div>
          <div>
            <div>Bonus M</div>
            <div>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format($config.bonuses.M.value)}</div>
          </div>
          <div>
            <div>Bonus T</div>
            <div>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format($config.bonuses.T.value)} (married only)</div>
          </div>
          <div>
            <div>Insurance</div>
            <div>{($config.deductions.insurance.value * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</div> 