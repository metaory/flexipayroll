<script>
  import { config } from '../lib/stores.js';
  import { DEFAULT_CONFIG, formatCurrency } from '../lib/core.js';
  import Icon from '@iconify/svelte';

  let localConfig = $state({ ...$config });
  let hasUnsavedChanges = $state(false);
  let saveStatus = $state('');

  $effect(() => {
    localConfig = { ...$config };
    hasUnsavedChanges = false;
    saveStatus = '';
  });

  const updateLocalConfig = (field, value) => {
    const newConfig = { ...localConfig };
    if (field.includes('.')) {
      const [section, key] = field.split('.');
      if (!newConfig[section]) newConfig[section] = {};
      newConfig[section][key] = value;
    } else {
      newConfig[field] = value;
    }
    localConfig = newConfig;
    hasUnsavedChanges = true;
    saveStatus = '';
  }
  
  const saveConfig = () => {
    config.set(localConfig);
    hasUnsavedChanges = false;
    saveStatus = 'Configuration saved successfully!';
    setTimeout(() => saveStatus = '', 3000);
  }
  
  const cancelChanges = () => {
    localConfig = { ...$config };
    hasUnsavedChanges = false;
    saveStatus = 'Changes cancelled';
    setTimeout(() => saveStatus = '', 3000);
  }
  
  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all configuration to defaults? This will affect all calculations.')) {
      localConfig = { ...DEFAULT_CONFIG };
      hasUnsavedChanges = true;
      saveStatus = 'Configuration reset to defaults. Click Save to apply changes.';
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
        if (data.config) {
          localConfig = { ...data.config };
          hasUnsavedChanges = true;
          saveStatus = 'Data imported. Click Save to apply configuration changes.';
        }
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
</script>

<h2>System Configuration</h2>
<p>Configure payroll settings and system parameters that affect all salary calculations</p>

{#if saveStatus}
  <div class="save-status" class:success={saveStatus.includes('saved')} class:warning={saveStatus.includes('cancelled') || saveStatus.includes('reset')}>
    <Icon icon={saveStatus.includes('saved') ? 'solar:check-circle-bold' : 'solar:info-circle-bold'} width="1em" height="1em" />
    {saveStatus}
  </div>
{/if}

<section>
  <h3><Icon icon="solar:clock-circle-bold" width="1.2em" height="1.2em" /> Working Time Settings</h3>
  <p style="color: var(--fg-muted);">These settings determine how daily and hourly rates are calculated for all employees</p>
  
  <form>
    <div class="form-group-horizontal">
      <div class="form-group-stacked">
        <label for="working-days">
          <Icon icon="solar:calendar-bold" width="1em" height="1em" />
          Working Days per Month
        </label>
        <input 
          id="working-days"
          type="number"
          value={localConfig.workingDaysPerMonth}
          onchange={e => updateLocalConfig('workingDaysPerMonth', Number(e.currentTarget.value))}
          min="1"
          max="31"
        />
        <small style="color: var(--fg-muted);">Used to calculate daily rate: Monthly Salary ÷ Working Days</small>
      </div>
      
      <div class="form-group-stacked">
        <label for="workday-hours">
          <Icon icon="solar:clock-bold" width="1em" height="1em" />
          Standard Workday Hours
        </label>
        <input 
          id="workday-hours"
          type="number"
          value={localConfig.workdayHours}
          onchange={e => updateLocalConfig('workdayHours', Number(e.currentTarget.value))}
          min="1"
          max="24"
          step="0.5"
        />
        <small style="color: var(--fg-muted);">Used to calculate hourly rate: Daily Rate ÷ Workday Hours</small>
      </div>
    </div>
  </form>
</section>

<section>
  <h3><Icon icon="solar:gift-bold" width="1.2em" height="1.2em" /> Bonus Configuration</h3>
  <p style="color: var(--fg-muted);">Configure monthly bonuses that apply to all employees. These are added to basic salary before insurance deduction.</p>
  
  <form>
    <div class="form-group-horizontal">
      <div class="form-group-stacked">
        <label for="bonus-e">
          <Icon icon="solar:star-bold" width="1em" height="1em" />
          Bonus E (Daily Rate Multiplier)
        </label>
        <input 
          id="bonus-e"
          type="number"
          value={localConfig.bonuses.E.value}
          onchange={e => updateLocalConfig('bonuses.E.value', Number(e.currentTarget.value))}
          min="0"
          step="0.5"
        />
        <small style="color: var(--fg-muted);">Applied as: {localConfig.bonuses.E.value} × Daily Rate</small>
      </div>
      
      <div class="form-group-stacked">
        <label for="bonus-s">
          <Icon icon="solar:star-bold" width="1em" height="1em" />
          Bonus S (Daily Rate Multiplier)
        </label>
        <input 
          id="bonus-s"
          type="number"
          value={localConfig.bonuses.S.value}
          onchange={e => updateLocalConfig('bonuses.S.value', Number(e.currentTarget.value))}
          min="0"
          step="0.5"
        />
        <small style="color: var(--fg-muted);">Applied as: {localConfig.bonuses.S.value} × Daily Rate</small>
      </div>
      
      <div class="form-group-stacked">
        <label for="bonus-k">
          <Icon icon="solar:star-bold" width="1em" height="1em" />
          Bonus K (Fixed Amount)
        </label>
        <input 
          id="bonus-k"
          type="number"
          value={localConfig.bonuses.K.value}
          onchange={e => updateLocalConfig('bonuses.K.value', Number(e.currentTarget.value))}
          min="0"
        />
        <small style="color: var(--fg-muted);">Fixed amount: {formatCurrency(localConfig.bonuses.K.value)}</small>
      </div>
      
      <div class="form-group-stacked">
        <label for="bonus-m">
          <Icon icon="solar:star-bold" width="1em" height="1em" />
          Bonus M (Fixed Amount)
        </label>
        <input 
          id="bonus-m"
          type="number"
          value={localConfig.bonuses.M.value}
          onchange={e => updateLocalConfig('bonuses.M.value', Number(e.currentTarget.value))}
          min="0"
        />
        <small style="color: var(--fg-muted);">Fixed amount: {formatCurrency(localConfig.bonuses.M.value)}</small>
      </div>
      
      <div class="form-group-stacked">
        <label for="bonus-t">
          <Icon icon="solar:heart-bold" width="1em" height="1em" />
          Bonus T (Married Only)
        </label>
        <input 
          id="bonus-t"
          type="number"
          value={localConfig.bonuses.T.value}
          onchange={e => updateLocalConfig('bonuses.T.value', Number(e.currentTarget.value))}
          min="0"
        />
        <small style="color: var(--fg-muted);">Fixed amount: {formatCurrency(localConfig.bonuses.T.value)} (married employees only)</small>
      </div>
    </div>
  </form>
</section>

<section>
  <h3><Icon icon="solar:shield-bold" width="1.2em" height="1.2em" /> Insurance Deduction</h3>
  <p style="color: var(--fg-muted);">Insurance deduction is calculated as a percentage of total salary (basic + bonuses + adjustments)</p>
  
  <form>
    <div class="form-group">
      <label for="insurance-rate">
        <Icon icon="solar:percent-bold" width="1em" height="1em" />
        Insurance Deduction Rate (%)
      </label>
      <input 
        id="insurance-rate"
        type="number"
        value={localConfig.deductions.insurance.value * 100}
        onchange={e => updateLocalConfig('deductions.insurance.value', Number(e.currentTarget.value) / 100)}
        min="0"
        max="100"
        step="0.1"
      />
      <small style="color: var(--fg-muted);">Applied as: {(localConfig.deductions.insurance.value * 100).toFixed(1)}% of total salary</small>
    </div>
  </form>
</section>

<section>
  <h3><Icon icon="solar:settings-bold" width="1.2em" height="1.2em" /> Configuration Actions</h3>
  <p style="color: var(--fg-muted);">Save your changes to apply them to all payroll calculations, or cancel to discard modifications</p>
  
  <div class="button-group">
    <button onclick={saveConfig} disabled={!hasUnsavedChanges}>
      <Icon icon="solar:floppy-disk-bold" width="1.2em" height="1.2em" />
      Save Configuration
    </button>
    <button class="secondary" onclick={cancelChanges} disabled={!hasUnsavedChanges}>
      <Icon icon="solar:close-circle-bold" width="1.2em" height="1.2em" />
      Cancel Changes
    </button>
    <button onclick={resetToDefaults}>
      <Icon icon="solar:refresh-bold" width="1.2em" height="1.2em" />
      Reset to Defaults
    </button>
  </div>
  
  {#if hasUnsavedChanges}
    <div class="warning-message">
      <Icon icon="solar:info-circle-bold" width="1em" height="1em" />
      <strong>Unsaved Changes:</strong> You have unsaved configuration changes. 
      Click "Save Configuration" to apply changes to all payroll calculations, 
      or "Cancel Changes" to discard them.
    </div>
  {/if}
</section>

<section>
  <h3><Icon icon="solar:database-bold" width="1.2em" height="1.2em" /> Data Management</h3>
  <p style="color: var(--fg-muted);">Backup and restore your payroll data, or clear all data to start fresh</p>
  
  <div class="button-group">
    <button onclick={exportData}>
      <Icon icon="solar:download-bold" width="1.2em" height="1.2em" />
      Export Data
    </button>
    <button class="danger" onclick={clearAllData}>
      <Icon icon="solar:trash-bin-trash-bold" width="1.2em" height="1.2em" />
      Clear All Data
    </button>
  </div>
  
  <div class="form-group-stacked">
    <label for="import-data">
      <Icon icon="solar:upload-bold" width="1em" height="1em" />
      Import Data from Backup
    </label>
    <input 
      id="import-data"
      type="file"
      accept=".json"
      onchange={importData}
    />
    <small style="color: var(--fg-muted);">Select a backup file to restore employees, attendance, and configuration</small>
  </div>
</section>

<section>
  <h3><Icon icon="solar:chart-bold" width="1.2em" height="1.2em" /> Current Configuration Summary</h3>
  <p style="color: var(--fg-muted);">Overview of how current settings affect salary calculations</p>
  
  <dl class="horizontal">
    <dt>Working Days:</dt>
    <dd>{localConfig.workingDaysPerMonth} days/month</dd>
    <dt>Workday Hours:</dt>
    <dd>{localConfig.workdayHours} hours/day</dd>
    <dt>Daily Rate Calculation:</dt>
    <dd>Monthly Salary ÷ {localConfig.workingDaysPerMonth} days</dd>
    <dt>Hourly Rate Calculation:</dt>
    <dd>Daily Rate ÷ {localConfig.workdayHours} hours</dd>
    <dt>Bonus E:</dt>
    <dd>{localConfig.bonuses.E.value} × daily rate</dd>
    <dt>Bonus S:</dt>
    <dd>{localConfig.bonuses.S.value} × daily rate</dd>
    <dt>Bonus K:</dt>
    <dd>{formatCurrency(localConfig.bonuses.K.value)} (fixed)</dd>
    <dt>Bonus M:</dt>
    <dd>{formatCurrency(localConfig.bonuses.M.value)} (fixed)</dd>
    <dt>Bonus T:</dt>
    <dd>{formatCurrency(localConfig.bonuses.T.value)} (married only)</dd>
    <dt>Insurance Deduction:</dt>
    <dd>{(localConfig.deductions.insurance.value * 100).toFixed(1)}% of total salary</dd>
  </dl>
</section>

<style>
  .save-status {
    padding: 1rem;
    border-radius: var(--radius);
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
  }
  
  .save-status.success {
    background: var(--success);
    color: white;
  }
  
  .save-status.warning {
    background: var(--warning);
    color: white;
  }
  
  .warning-message {
    background: var(--warning);
    color: white;
    padding: 1rem;
    border-radius: var(--radius);
    margin-top: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  small {
    font-size: 0.75rem;
    margin-top: 0.25rem;
  }
</style> 