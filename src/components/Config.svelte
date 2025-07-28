<script>
  import { config } from '../lib/stores.js';
  import { DEFAULT_CONFIG, formatCurrency } from '../lib/core.js';
  import Icon from '@iconify/svelte';
  import { ICONS } from '../lib/icons.js';

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
      const parts = field.split('.');
      if (parts.length === 3) {
        // Handle nested objects like bonuses.E.value
        const [section, subsection, key] = parts;
        if (!newConfig[section]) newConfig[section] = {};
        if (!newConfig[section][subsection]) newConfig[section][subsection] = {};
        newConfig[section][subsection][key] = value;
      } else if (parts.length === 2) {
        // Handle simple nested objects like deductions.insurance.value
        const [section, key] = parts;
        if (!newConfig[section]) newConfig[section] = {};
        newConfig[section][key] = value;
      }
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

<div class="config-container">
  <header class="config-header">
    <div class="header-content">
      <h2><Icon icon={ICONS.settings} width="1.5em" height="1.5em" /> System Configuration</h2>
      <p>Configure payroll settings and system parameters that affect all salary calculations</p>
    </div>
  </header>

  {#if hasUnsavedChanges}
    <div class="save-banner-fixed">
      <div class="save-banner-content">
        <Icon icon={ICONS.warning} width="3em" height="3em" />
        <span><strong>Unsaved Changes</strong> You have configuration changes that need to be saved</span>
      </div>
      <div class="save-actions">
        <button class="secondary" onclick={cancelChanges}>
          <Icon icon={ICONS.cancel} width="1.2em" height="1.2em" />
          Cancel
        </button>
        <button class="primary" onclick={saveConfig}>
          <Icon icon={ICONS.save} width="1.2em" height="1.2em" />
          Save Configuration
        </button>
      </div>
    </div>
  {/if}

  {#if saveStatus}
    <div class="save-status" class:success={saveStatus.includes('saved')} class:warning={saveStatus.includes('cancelled') || saveStatus.includes('reset')}>
      <Icon icon={saveStatus.includes('saved') ? ICONS.success : ICONS.info} width="1em" height="1em" />
      {saveStatus}
    </div>
  {/if}

  <form class="config-form">
    <section class="config-section">
      <h3><Icon icon={ICONS.time} width="1.2em" height="1.2em" /> Working Time Settings</h3>
      <p class="text-muted">These settings determine how daily and hourly rates are calculated for all employees</p>

      <div class="form-group-horizontal">
        <div class="form-group-stacked">
          <label for="working-days">
            <Icon icon={ICONS.calendar} width="1em" height="1em" />
            Working Days per Month
          </label>
          <input
            id="working-days"
            type="number"
            value={localConfig.workingDaysPerMonth}
            oninput={e => updateLocalConfig('workingDaysPerMonth', Number(e.currentTarget.value))}
            min="1"
            max="31"
          />
          <small class="text-muted">Used to calculate daily rate: Monthly Salary ÷ Working Days</small>
        </div>

        <div class="form-group-stacked">
          <label for="workday-hours">
            <Icon icon={ICONS.clock} width="1em" height="1em" />
            Standard Workday Hours
          </label>
          <input
            id="workday-hours"
            type="number"
            value={localConfig.workdayHours}
            oninput={e => updateLocalConfig('workdayHours', Number(e.currentTarget.value))}
            min="1"
            max="24"
            step="0.5"
          />
          <small class="text-muted">Used to calculate hourly rate: Daily Rate ÷ Workday Hours</small>
        </div>
      </div>
    </section>

    <section class="config-section">
      <h3><Icon icon={ICONS.bonus} width="1.2em" height="1.2em" /> Bonus Configuration</h3>
      <p class="text-muted">Configure monthly bonuses that apply to all employees. These are added to basic salary before insurance deduction.</p>

      <div class="form-group-horizontal">
        <div class="form-group-stacked">
          <label for="bonus-e">
            <Icon icon={ICONS.star} width="1em" height="1em" />
            Bonus E (Daily Rate Multiplier)
          </label>
          <input
            id="bonus-e"
            type="number"
            value={localConfig.bonuses.E.value}
            oninput={e => updateLocalConfig('bonuses.E.value', Number(e.currentTarget.value))}
            min="0"
            step="0.5"
          />
          <small class="text-muted">Applied as: {localConfig.bonuses.E.value} × Daily Rate</small>
        </div>

        <div class="form-group-stacked">
          <label for="bonus-s">
            <Icon icon={ICONS.star} width="1em" height="1em" />
            Bonus S (Daily Rate Multiplier)
          </label>
          <input
            id="bonus-s"
            type="number"
            value={localConfig.bonuses.S.value}
            oninput={e => updateLocalConfig('bonuses.S.value', Number(e.currentTarget.value))}
            min="0"
            step="0.5"
          />
          <small class="text-muted">Applied as: {localConfig.bonuses.S.value} × Daily Rate</small>
        </div>

        <div class="form-group-stacked">
          <label for="bonus-k">
            <Icon icon={ICONS.star} width="1em" height="1em" />
            Bonus K (Fixed Amount)
          </label>
          <input
            id="bonus-k"
            type="number"
            value={localConfig.bonuses.K.value}
            oninput={e => updateLocalConfig('bonuses.K.value', Number(e.currentTarget.value))}
            min="0"
          />
          <small class="text-muted">Fixed amount: {formatCurrency(localConfig.bonuses.K.value)}</small>
        </div>

        <div class="form-group-stacked">
          <label for="bonus-m">
            <Icon icon={ICONS.star} width="1em" height="1em" />
            Bonus M (Fixed Amount)
          </label>
          <input
            id="bonus-m"
            type="number"
            value={localConfig.bonuses.M.value}
            oninput={e => updateLocalConfig('bonuses.M.value', Number(e.currentTarget.value))}
            min="0"
          />
          <small class="text-muted">Fixed amount: {formatCurrency(localConfig.bonuses.M.value)}</small>
        </div>

        <div class="form-group-stacked">
          <label for="bonus-t">
            <Icon icon={ICONS.heart} width="1em" height="1em" />
            Bonus T (Married Only)
          </label>
          <input
            id="bonus-t"
            type="number"
            value={localConfig.bonuses.T.value}
            oninput={e => updateLocalConfig('bonuses.T.value', Number(e.currentTarget.value))}
            min="0"
          />
          <small class="text-muted">Fixed amount: {formatCurrency(localConfig.bonuses.T.value)} (married employees only)</small>
        </div>
      </div>
    </section>

    <section class="config-section">
      <h3><Icon icon={ICONS.insurance} width="1.2em" height="1.2em" /> Insurance Deduction</h3>
      <p class="text-muted">Insurance deduction is calculated as a percentage of total salary (basic + bonuses + adjustments)</p>

      <div class="form-group">
        <label for="insurance-rate">
          <Icon icon={ICONS.percent} width="1em" height="1em" />
          Insurance Deduction Rate (%)
        </label>
        <input
          id="insurance-rate"
          type="number"
          value={localConfig.deductions.insurance.value * 100}
          oninput={e => updateLocalConfig('deductions.insurance.value', Number(e.currentTarget.value) / 100)}
          min="0"
          max="100"
          step="0.1"
        />
        <small class="text-muted">Applied as: {(localConfig.deductions.insurance.value * 100).toFixed(1)}% of total salary</small>
      </div>
    </section>

    <section class="config-section">
      <h3><Icon icon={ICONS.chart} width="1.2em" height="1.2em" /> Current Configuration Summary</h3>
      <p class="text-muted">Overview of how current settings affect salary calculations</p>

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
  </form>

  <section class="config-section">
    <h3><Icon icon={ICONS.database} width="1.2em" height="1.2em" /> Data Management</h3>
    <p class="text-muted">Backup and restore your payroll data, or clear all data to start fresh</p>

    <div class="button-group">
      <button onclick={exportData}>
        <Icon icon={ICONS.export} width="1.2em" height="1.2em" />
        Export Data
      </button>
      <button onclick={resetToDefaults}>
        <Icon icon={ICONS.refresh} width="1.2em" height="1.2em" />
        Reset to Defaults
      </button>
      <button class="danger" onclick={clearAllData}>
        <Icon icon={ICONS.delete} width="1.2em" height="1.2em" />
        Clear All Data
      </button>
    </div>

    <div class="form-group-stacked">
              <label for="import-data">
          <Icon icon={ICONS.import} width="1em" height="1em" />
          Import Data from Backup
        </label>
      <input
        id="import-data"
        type="file"
        accept=".json"
        onchange={importData}
      />
      <small class="text-muted">Select a backup file to restore employees, attendance, and configuration</small>
    </div>
  </section>
</div>

<style>
  .config-container {
    max-width: 100%;
    overflow: hidden;
  }

  .config-header {
    background: color-mix(in oklab, var(--secondary) 15%, transparent);
    margin: -2.5rem -2.5rem 2rem -2.5rem;
    padding: 2rem 2.5rem 1rem 2.5rem;
    border-radius: 0 0 1.5rem 1.5rem;
    box-shadow: 0 4px 16px color-mix(in oklab, var(--secondary) 25%, transparent);

    @media (max-width: 768px) {
      margin: -1.5rem -1.5rem 1.5rem -1.5rem;
      padding: 1.5rem 1.5rem 1rem 1.5rem;
      border-radius: 0 0 1rem 1rem;
    }
  }

  .header-content h2 {
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .save-banner-fixed {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background: color-mix(in oklab, var(--warning) 20%, transparent);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    color: var(--fg);

    border-radius: 0 0 1rem 1rem;
    padding: 1rem 2rem;
    margin: 0 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    box-shadow: 0 4px 40px color-mix(in oklab, var(--warning) 30%, transparent);

    @media (max-width: 768px) {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
      margin: 0 0.5rem;
      padding: 1rem;
      border-radius: 0 0 0.75rem 0.75rem;
    }
  }

  .save-banner-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    font-weight: bold;
    color: var(--fg-muted);
    strong {
      font-family: bungee, monospace;
      color: var(--fg);
    }
  }

  .save-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .save-actions button {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    border-radius: 0.5rem;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .save-actions button.primary {
    background: var(--primary);
    color: white;
    box-shadow: 0 2px 8px color-mix(in oklab, var(--primary) 30%, transparent);
  }

  .save-actions button.primary:hover {
    background: color-mix(in oklab, var(--primary) 80%, black);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px color-mix(in oklab, var(--primary) 40%, transparent);
  }

  .save-actions button.secondary {
    background: color-mix(in oklab, var(--bg-muted) 90%, transparent);
    color: var(--fg);
    box-shadow: 0 2px 8px color-mix(in oklab, var(--bg-muted) 30%, transparent);
  }

  .save-actions button.secondary:hover {
    background: color-mix(in oklab, var(--bg-muted) 100%, transparent);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px color-mix(in oklab, var(--bg-muted) 40%, transparent);
  }

  .config-form {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    margin-top: 1rem;
  }

  .config-section {
    background: color-mix(in oklab, var(--primary) 10%, transparent);
    border-radius: 1.5rem;
    padding: 2rem;
    box-shadow: 0 8px 32px color-mix(in oklab, var(--primary) 18%, transparent);

    @media (max-width: 768px) {
      padding: 1.5rem;
      border-radius: 1rem;
    }
  }

  .config-section h3 {
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .config-section p {
    margin-bottom: 1.5rem;
  }

  .save-status {
    padding: 1rem 1.5rem;
    border-radius: 1rem;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    box-shadow: 0 4px 16px color-mix(in oklab, var(--bg-muted) 30%, transparent);
  }

  .save-status.success {
    background: color-mix(in oklab, var(--success) 90%, transparent);
    color: white;
    box-shadow: 0 4px 16px color-mix(in oklab, var(--success) 30%, transparent);
  }

  .save-status.warning {
    background: color-mix(in oklab, var(--warning) 90%, transparent);
    color: white;
    box-shadow: 0 4px 16px color-mix(in oklab, var(--warning) 30%, transparent);
  }

  small {
    font-size: 0.75rem;
    margin-top: 0.25rem;
  }
</style>
