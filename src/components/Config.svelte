<script>
  import { config } from '../lib/stores.js';
  import { DEFAULT_CONFIG } from '../lib/core.js';

  let localConfig = $state($config);

  $effect(() => {
    localConfig = $config;
  });

  const updateConfig = (field, value) => {
    const newConfig = { ...localConfig };
    if (field.includes('.')) {
      const [section, key] = field.split('.');
      if (!newConfig[section]) newConfig[section] = {};
      newConfig[section][key] = value;
    } else {
      newConfig[field] = value;
    }
    config.set(newConfig);
  }
  
  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all configuration to defaults? This will affect all calculations.')) {
      config.set(DEFAULT_CONFIG);
    }
  }
  
  const exportData = () => {
    const data = {
      employees: JSON.parse(localStorage.getItem('xpayroll_employees') || '[]'),
      attendance: JSON.parse(localStorage.getItem('xpayroll_attendance') || '{}'),
      config: localConfig
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xpayroll-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  const importData = (event) => {
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
  
  const clearAllData = () => {
    if (confirm('Are you sure you want to clear ALL data? This will delete all employees, attendance records, and reset configuration. This action cannot be undone.')) {
      localStorage.clear();
      location.reload();
    }
  }
  
  const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR' 
  }).format(amount)
</script>

<h2>System Configuration</h2>
<p>Configure payroll settings and system parameters</p>

<section>
  <h3>Working Time Settings</h3>
  
  <form>
    <div class="form-group-horizontal">
      <div class="form-group-stacked">
        <label for="working-days">Working Days per Month</label>
        <input 
          id="working-days"
          type="number"
          value={localConfig.workingDaysPerMonth}
          onchange={e => updateConfig('workingDaysPerMonth', Number(e.currentTarget.value))}
          min="1"
          max="31"
        />
      </div>
      
      <div class="form-group-stacked">
        <label for="workday-hours">Workday Hours</label>
        <input 
          id="workday-hours"
          type="number"
          value={localConfig.workdayHours}
          onchange={e => updateConfig('workdayHours', Number(e.currentTarget.value))}
          min="1"
          max="24"
          step="0.5"
        />
      </div>
    </div>
  </form>
</section>

<section>
  <h3>Bonus Settings</h3>
  
  <form>
    <div class="form-group-horizontal">
      <div class="form-group-stacked">
        <label for="bonus-e">Bonus E (Days × Daily Rate)</label>
        <input 
          id="bonus-e"
          type="number"
          value={localConfig.bonuses.E.value}
          onchange={e => updateConfig('bonuses.E.value', Number(e.currentTarget.value))}
          min="0"
          step="0.5"
        />
      </div>
      
      <div class="form-group-stacked">
        <label for="bonus-s">Bonus S (Days × Daily Rate)</label>
        <input 
          id="bonus-s"
          type="number"
          value={localConfig.bonuses.S.value}
          onchange={e => updateConfig('bonuses.S.value', Number(e.currentTarget.value))}
          min="0"
          step="0.5"
        />
      </div>
      
      <div class="form-group-stacked">
        <label for="bonus-k">Bonus K (Fixed Amount - IDR)</label>
        <input 
          id="bonus-k"
          type="number"
          value={localConfig.bonuses.K.value}
          onchange={e => updateConfig('bonuses.K.value', Number(e.currentTarget.value))}
          min="0"
        />
      </div>
      
      <div class="form-group-stacked">
        <label for="bonus-m">Bonus M (Fixed Amount - IDR)</label>
        <input 
          id="bonus-m"
          type="number"
          value={localConfig.bonuses.M.value}
          onchange={e => updateConfig('bonuses.M.value', Number(e.currentTarget.value))}
          min="0"
        />
      </div>
      
      <div class="form-group-stacked">
        <label for="bonus-t">Bonus T (Fixed Amount - IDR)</label>
        <input 
          id="bonus-t"
          type="number"
          value={localConfig.bonuses.T.value}
          onchange={e => updateConfig('bonuses.T.value', Number(e.currentTarget.value))}
          min="0"
        />
      </div>
    </div>
    
    <p class="text-muted">Married employees only</p>
  </form>
</section>

<section>
  <h3>Insurance Deduction</h3>
  
  <form>
    <div class="form-group">
      <label for="insurance-rate">Insurance Rate (%)</label>
      <input 
        id="insurance-rate"
        type="number"
        value={localConfig.deductions.insurance.value * 100}
        onchange={e => updateConfig('deductions.insurance.value', Number(e.currentTarget.value) / 100)}
        min="0"
        max="100"
        step="0.1"
      />
    </div>
  </form>
</section>

<section>
  <h3>Data Management</h3>
  
  <div class="button-group">
    <button onclick={exportData}>Export Data</button>
    <button onclick={resetToDefaults}>Reset Config</button>
    <button class="danger" onclick={clearAllData}>Clear All Data</button>
  </div>
  
  <div class="form-group-stacked">
    <label for="import-data">Import Data</label>
    <input 
      id="import-data"
      type="file"
      accept=".json"
      onchange={importData}
    />
  </div>
  
  <h4>Current Configuration Summary</h4>
  <dl class="horizontal">
    <dt>Working Days:</dt>
    <dd>{localConfig.workingDaysPerMonth} days/month</dd>
    <dt>Workday Hours:</dt>
    <dd>{localConfig.workdayHours} hours/day</dd>
    <dt>Bonus E:</dt>
    <dd>{localConfig.bonuses.E.value} × daily rate</dd>
    <dt>Bonus S:</dt>
    <dd>{localConfig.bonuses.S.value} × daily rate</dd>
    <dt>Bonus K:</dt>
    <dd>{formatCurrency(localConfig.bonuses.K.value)}</dd>
    <dt>Bonus M:</dt>
    <dd>{formatCurrency(localConfig.bonuses.M.value)}</dd>
    <dt>Bonus T:</dt>
    <dd>{formatCurrency(localConfig.bonuses.T.value)} (married only)</dd>
    <dt>Insurance:</dt>
    <dd>{(localConfig.deductions.insurance.value * 100).toFixed(1)}%</dd>
  </dl>
</section> 