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

<div class="space-y-6">
  <!-- Header Section -->
  <div>
    <h2 class="h2 text-primary-500">System Configuration</h2>
    <p class="text-surface-600-400-token mt-1">Configure payroll settings and system parameters</p>
  </div>
  
  <!-- Working Time Configuration -->
  <div class="card p-6 transition-all duration-300">
    <header class="card-header">
      <h3 class="h3">Working Time Settings</h3>
    </header>
    <section class="card-body">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <label class="label">
          <span>Working Days per Month</span>
          <input 
            class="input"
            type="number"
            bind:value={$config.workingDaysPerMonth}
            on:change={() => updateConfig('workingDaysPerMonth', $config.workingDaysPerMonth)}
            min="1"
            max="31"
          />
        </label>
        
        <label class="label">
          <span>Workday Hours</span>
          <input 
            class="input"
            type="number"
            bind:value={$config.workdayHours}
            on:change={() => updateConfig('workdayHours', $config.workdayHours)}
            min="1"
            max="24"
            step="0.5"
          />
        </label>
      </div>
    </section>
  </div>
  
  <!-- Bonus Configuration -->
  <div class="card p-6 transition-all duration-300">
    <header class="card-header">
      <h3 class="h3">Bonus Settings</h3>
    </header>
    <section class="card-body">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <label class="label">
          <span>Bonus E (Days × Daily Rate)</span>
          <input 
            class="input"
            type="number"
            bind:value={$config.bonuses.E.value}
            on:change={() => updateConfig('bonuses.E.value', $config.bonuses.E.value)}
            min="0"
            step="0.5"
          />
        </label>
        
        <label class="label">
          <span>Bonus S (Days × Daily Rate)</span>
          <input 
            class="input"
            type="number"
            bind:value={$config.bonuses.S.value}
            on:change={() => updateConfig('bonuses.S.value', $config.bonuses.S.value)}
            min="0"
            step="0.5"
          />
        </label>
        
        <label class="label">
          <span>Bonus K (Fixed Amount - IDR)</span>
          <input 
            class="input"
            type="number"
            bind:value={$config.bonuses.K.value}
            on:change={() => updateConfig('bonuses.K.value', $config.bonuses.K.value)}
            min="0"
          />
        </label>
        
        <label class="label">
          <span>Bonus M (Fixed Amount - IDR)</span>
          <input 
            class="input"
            type="number"
            bind:value={$config.bonuses.M.value}
            on:change={() => updateConfig('bonuses.M.value', $config.bonuses.M.value)}
            min="0"
          />
        </label>
        
        <label class="label">
          <span>Bonus T (Fixed Amount - IDR)</span>
          <input 
            class="input"
            type="number"
            bind:value={$config.bonuses.T.value}
            on:change={() => updateConfig('bonuses.T.value', $config.bonuses.T.value)}
            min="0"
          />
          <div class="text-sm text-surface-600-400-token">Married employees only</div>
        </label>
      </div>
    </section>
  </div>
  
  <!-- Insurance Configuration -->
  <div class="card p-6 transition-all duration-300">
    <header class="card-header">
      <h3 class="h3">Insurance Deduction</h3>
    </header>
    <section class="card-body">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <label class="label">
          <span>Insurance Rate (%)</span>
          <input 
            class="input"
            type="number"
            value={$config.deductions.insurance.value * 100}
            on:change={(e) => updateConfig('deductions.insurance.value', Number(e.currentTarget.value) / 100)}
            min="0"
            max="100"
            step="0.1"
          />
        </label>
      </div>
    </section>
  </div>
  
  <!-- Data Management -->
  <div class="card p-6 transition-all duration-300">
    <header class="card-header">
      <h3 class="h3">Data Management</h3>
    </header>
    <section class="card-body">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button class="btn variant-filled-primary" onclick={exportData}>
          Export Data
        </button>
        
        <label class="btn variant-filled-secondary cursor-pointer">
          Import Data
          <input 
            type="file"
            accept=".json"
            on:change={importData}
            class="hidden"
          />
        </label>
        
        <button class="btn variant-filled-warning" onclick={resetToDefaults}>
          Reset Config
        </button>
        
        <button class="btn variant-filled-error" onclick={clearAllData}>
          Clear All Data
        </button>
      </div>
      
      <div class="mt-6 p-6 bg-surface-50-900-token rounded-lg">
        <h4 class="h4 mb-4 text-primary-500">Current Configuration Summary</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div class="p-3 bg-surface-100-800-token rounded-lg">
            <div class="font-bold text-primary-500">Working Days</div>
            <div class="text-surface-600-400-token">{$config.workingDaysPerMonth} days/month</div>
          </div>
          <div class="p-3 bg-surface-100-800-token rounded-lg">
            <div class="font-bold text-primary-500">Workday Hours</div>
            <div class="text-surface-600-400-token">{$config.workdayHours} hours/day</div>
          </div>
          <div class="p-3 bg-surface-100-800-token rounded-lg">
            <div class="font-bold text-success-500">Bonus E</div>
            <div class="text-surface-600-400-token">{$config.bonuses.E.value} × daily rate</div>
          </div>
          <div class="p-3 bg-surface-100-800-token rounded-lg">
            <div class="font-bold text-success-500">Bonus S</div>
            <div class="text-surface-600-400-token">{$config.bonuses.S.value} × daily rate</div>
          </div>
          <div class="p-3 bg-surface-100-800-token rounded-lg">
            <div class="font-bold text-success-500">Bonus K</div>
            <div class="text-surface-600-400-token font-mono">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format($config.bonuses.K.value)}</div>
          </div>
          <div class="p-3 bg-surface-100-800-token rounded-lg">
            <div class="font-bold text-success-500">Bonus M</div>
            <div class="text-surface-600-400-token font-mono">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format($config.bonuses.M.value)}</div>
          </div>
          <div class="p-3 bg-surface-100-800-token rounded-lg">
            <div class="font-bold text-success-500">Bonus T</div>
            <div class="text-surface-600-400-token font-mono">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format($config.bonuses.T.value)} (married only)</div>
          </div>
          <div class="p-3 bg-surface-100-800-token rounded-lg">
            <div class="font-bold text-error-500">Insurance</div>
            <div class="text-surface-600-400-token">{($config.deductions.insurance.value * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</div> 