<script>
  import { config } from '../lib/stores.js';
  import { DEFAULT_CONFIG } from '../lib/core.js';

  // Local state for config
  const localConfig = $state(config.get());

  // Keep localConfig in sync with store
  $effect(() => {
    const unsub = config.subscribe(value => localConfig.set(value));
    return unsub;
  });

  function updateConfig(field, value) {
    const currentConfig = localConfig.get();
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
      config: localConfig.get()
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

<h2>System Configuration</h2>
<p>Configure payroll settings and system parameters</p>

<section>
  <h3>Working Time Settings</h3>
  
  <label for="working-days">Working Days per Month</label>
  <input 
    id="working-days"
    type="number"
    value={localConfig.get().workingDaysPerMonth}
    on:change={e => updateConfig('workingDaysPerMonth', Number(e.currentTarget.value))}
    min="1"
    max="31"
  />
  
  <label for="workday-hours">Workday Hours</label>
  <input 
    id="workday-hours"
    type="number"
    value={localConfig.get().workdayHours}
    on:change={e => updateConfig('workdayHours', Number(e.currentTarget.value))}
    min="1"
    max="24"
    step="0.5"
  />
</section>

<section>
  <h3>Bonus Settings</h3>
  
  <label for="bonus-e">Bonus E (Days × Daily Rate)</label>
  <input 
    id="bonus-e"
    type="number"
    value={localConfig.get().bonuses.E.value}
    on:change={e => updateConfig('bonuses.E.value', Number(e.currentTarget.value))}
    min="0"
    step="0.5"
  />
  
  <label for="bonus-s">Bonus S (Days × Daily Rate)</label>
  <input 
    id="bonus-s"
    type="number"
    value={localConfig.get().bonuses.S.value}
    on:change={e => updateConfig('bonuses.S.value', Number(e.currentTarget.value))}
    min="0"
    step="0.5"
  />
  
  <label for="bonus-k">Bonus K (Fixed Amount - IDR)</label>
  <input 
    id="bonus-k"
    type="number"
    value={localConfig.get().bonuses.K.value}
    on:change={e => updateConfig('bonuses.K.value', Number(e.currentTarget.value))}
    min="0"
  />
  
  <label for="bonus-m">Bonus M (Fixed Amount - IDR)</label>
  <input 
    id="bonus-m"
    type="number"
    value={localConfig.get().bonuses.M.value}
    on:change={e => updateConfig('bonuses.M.value', Number(e.currentTarget.value))}
    min="0"
  />
  
  <label for="bonus-t">Bonus T (Fixed Amount - IDR)</label>
  <input 
    id="bonus-t"
    type="number"
    value={localConfig.get().bonuses.T.value}
    on:change={e => updateConfig('bonuses.T.value', Number(e.currentTarget.value))}
    min="0"
  />
  <p>Married employees only</p>
</section>

<section>
  <h3>Insurance Deduction</h3>
  
  <label for="insurance-rate">Insurance Rate (%)</label>
  <input 
    id="insurance-rate"
    type="number"
    value={localConfig.get().deductions.insurance.value * 100}
    on:change={e => updateConfig('deductions.insurance.value', Number(e.currentTarget.value) / 100)}
    min="0"
    max="100"
    step="0.1"
  />
</section>

<section>
  <h3>Data Management</h3>
  
  <button on:click={exportData}>Export Data</button>
  
  <label>
    Import Data
    <input 
      type="file"
      accept=".json"
      on:change={importData}
    />
  </label>
  
  <button on:click={resetToDefaults}>Reset Config</button>
  
  <button on:click={clearAllData}>Clear All Data</button>
  
  <section>
    <h4>Current Configuration Summary</h4>
    <div>
      <div>Working Days: {localConfig.get().workingDaysPerMonth} days/month</div>
      <div>Workday Hours: {localConfig.get().workdayHours} hours/day</div>
      <div>Bonus E: {localConfig.get().bonuses.E.value} × daily rate</div>
      <div>Bonus S: {localConfig.get().bonuses.S.value} × daily rate</div>
      <div>Bonus K: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(localConfig.get().bonuses.K.value)}</div>
      <div>Bonus M: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(localConfig.get().bonuses.M.value)}</div>
      <div>Bonus T: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(localConfig.get().bonuses.T.value)} (married only)</div>
      <div>Insurance: {(localConfig.get().deductions.insurance.value * 100).toFixed(1)}%</div>
    </div>
  </section>
</section> 