<script>
  import { settings, i18nLabels, resetSettings, DEFAULT_SETTINGS } from '../stores.js';
  import { formatCurrency } from '../core.js';
  import { toasts } from '../lib/toast.js';
  import ToastContainer from './ToastContainer.svelte';
  import Modal from './Modal.svelte';
  import Icon from '@iconify/svelte';
  import { ICONS } from '../lib/icons.js';
  import { g } from '../lib/i18n.js';

  let localSettings = $state({ ...$settings });
  let localLabels = $state({ ...$i18nLabels });
  let hasUnsavedChanges = $state(false);
  let saveStatus = $state('');
  let showResetModal = $state(false);

  $effect(() => {
    localSettings = { ...$settings };
    localLabels = { ...$i18nLabels };
    hasUnsavedChanges = false;
    saveStatus = '';
  });

  const updateLocalSetting = (key, value) => {
    localSettings[key] = value;
    hasUnsavedChanges = true;
    saveStatus = '';
  };

  const updateLocalLabel = (key, value) => {
    localLabels[key] = value;
    hasUnsavedChanges = true;
    saveStatus = '';
  };

  const saveSettings = () => {
    // Save core settings
    settings.set(localSettings);
    
    // Save i18n labels separately
    i18nLabels.set(localLabels);
    
    hasUnsavedChanges = false;
    saveStatus = 'Settings saved successfully!';
    toasts.success('Settings saved successfully!');
    setTimeout(() => saveStatus = '', 3000);
  };

  const cancelChanges = () => {
    localSettings = { ...$settings };
    localLabels = { ...$i18nLabels };
    hasUnsavedChanges = false;
    saveStatus = 'Changes cancelled';
    toasts.info('Changes cancelled');
    setTimeout(() => saveStatus = '', 3000);
  };

  const resetToDefaults = () => {
    showResetModal = true;
  };

  const confirmReset = () => {
    localSettings = { ...DEFAULT_SETTINGS };
    localLabels = { ...DEFAULT_SETTINGS.labels };
    hasUnsavedChanges = true;
    saveStatus = 'Settings reset to defaults. Click Save to apply changes.';
    toasts.warning('Settings reset to defaults. Click Save to apply changes.');
    showResetModal = false;
  };

  const cancelReset = () => {
    showResetModal = false;
  };

  // Simplified settings - remove dynamic groups for now
</script>

<h2><Icon icon={ICONS.help} width="1.5em" height="1.5em" /> Application Settings</h2>
<p>Configure display preferences, currency formatting, and labels used throughout the application. These settings do not affect salary calculations.</p>

{#if saveStatus}
  <div class="save-status {saveStatus.includes('success') ? 'success' : 'warning'}">
    <Icon icon={saveStatus.includes('success') ? ICONS.success : ICONS.warning} width="1em" height="1em" />
    {saveStatus}
  </div>
{/if}

{#if hasUnsavedChanges}
  <div class="save-banner-fixed">
    <div class="save-banner-content">
      <Icon icon={ICONS.warning} width="3em" height="3em" />
      <span><strong>Unsaved Changes</strong> You have settings changes that need to be saved</span>
    </div>
    <div class="save-actions">
      <button class="secondary" onclick={cancelChanges}>
        <Icon icon={ICONS.cancel} width="1.2em" height="1.2em" />
        Cancel
      </button>
      <button class="primary" onclick={saveSettings}>
        <Icon icon={ICONS.save} width="1.2em" height="1.2em" />
        Save Settings
      </button>
    </div>
  </div>
{/if}

<div class="config-form">
  <!-- Currency Settings Section -->
  <section class="config-section">
    <h3><Icon icon={ICONS.money} width="1.2em" height="1.2em" /> Currency Settings</h3>
    <p class="text-muted">Configure the currency format used for displaying amounts throughout the application.</p>

    <div class="currency-settings-layout">
      <div class="currency-settings">
        <div class="form-group-stacked">
          <label for="currency-code">
            <Icon icon={ICONS.money} width="1em" height="1em" />
            Currency Code
          </label>
          <input
            id="currency-code"
            type="text"
            value={localSettings.currency.code}
            oninput={e => updateLocalSetting('currency', { ...localSettings.currency, code: e.currentTarget.value.toUpperCase() })}
            maxlength="3"
            placeholder="USD"
          />
          <small class="text-muted">ISO 4217 currency code</small>
        </div>

        <div class="form-group-stacked">
          <label for="currency-symbol">
            <Icon icon={ICONS.money} width="1em" height="1em" />
            Currency Symbol
          </label>
          <input
            id="currency-symbol"
            type="text"
            value={localSettings.currency.symbol}
            oninput={e => updateLocalSetting('currency', { ...localSettings.currency, symbol: e.currentTarget.value })}
            maxlength="5"
          />
          <small class="text-muted">Symbol to display</small>
        </div>

        <div class="form-group-stacked">
          <label for="currency-locale">
            <Icon icon={ICONS.money} width="1em" height="1em" />
            Locale
          </label>
          <input
            id="currency-locale"
            type="text"
            value={localSettings.currency.locale}
            oninput={e => updateLocalSetting('currency', { ...localSettings.currency, locale: e.currentTarget.value })}
            placeholder="en-US"
          />
          <small class="text-muted">Number formatting locale</small>
        </div>

        <div class="form-group-stacked">
          <label class="switch-label">
            <Icon icon={ICONS.money} width="1em" height="1em" />
            Symbol Position
          </label>
          <div class="switch-container">
            <button 
              class="switch-button {localSettings.currency.position === 'before' ? 'active' : ''}"
              onclick={() => updateLocalSetting('currency', { ...localSettings.currency, position: 'before' })}
            >
              Before
            </button>
            <button 
              class="switch-button {localSettings.currency.position === 'after' ? 'active' : ''}"
              onclick={() => updateLocalSetting('currency', { ...localSettings.currency, position: 'after' })}
            >
              After
            </button>
          </div>
          <small class="text-muted">Symbol position relative to amount</small>
        </div>
      </div>

      <div class="currency-preview">
        <h4>Preview</h4>
        <div class="preview-content">
          <strong>Sample amounts formatted with current settings:</strong>
          <div class="preview-amounts">
            <span>{formatCurrency(1000000, localSettings.currency)}</span>
            <span>{formatCurrency(500000, localSettings.currency)}</span>
            <span>{formatCurrency(10000, localSettings.currency)}</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Future: Dynamic Label Sections -->
  <!-- Label customization will be added in a future version -->

  <section class="config-section">
    <h3><Icon icon={ICONS.help} width="1.2em" height="1.2em" /> Actions</h3>
    <p class="text-muted">Manage your application settings</p>

    <div class="button-group">
      <button class="secondary" onclick={resetToDefaults}>
        <Icon icon={ICONS.refresh} width="1em" height="1em" />
        Reset to Defaults
      </button>
    </div>
  </section>
</div>

<Modal 
  show={showResetModal}
  type="warning"
  title="Reset Settings"
  message="Are you sure you want to reset all settings to their default values? This action cannot be undone."
  confirmText="Reset"
  cancelText="Cancel"
  on:confirm={confirmReset}
  on:cancel={cancelReset}
/>

<ToastContainer />

<style>
  .config-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
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

  .currency-preview {
    background: color-mix(in oklab, var(--bg-muted) 20%, transparent);
    border-radius: 0.75rem;
    padding: 1rem;
    border: 1px solid color-mix(in oklab, var(--primary) 8%, transparent);
  }

  .preview-amounts {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
    flex-wrap: wrap;
  }

  .currency-settings-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    align-items: start;
  }

  .currency-settings {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .currency-preview {
    background: color-mix(in oklab, var(--bg-muted) 20%, transparent);
    border-radius: 0.75rem;
    padding: 1.5rem;
    border: 1px solid color-mix(in oklab, var(--primary) 8%, transparent);
    height: fit-content;
  }

  .preview-content {
    margin-top: 1rem;
  }

  .preview-amounts {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .preview-amounts span {
    background: color-mix(in oklab, var(--primary) 10%, transparent);
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-family: 'Bungee', monospace;
    font-weight: bold;
    color: var(--primary);
    border: 1px solid color-mix(in oklab, var(--primary) 15%, transparent);
  }

  .switch-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }

  .switch-container {
    display: flex;
    background: color-mix(in oklab, var(--bg-muted) 30%, transparent);
    border-radius: 0.5rem;
    padding: 0.25rem;
    gap: 0.25rem;
  }

  .switch-button {
    flex: 1;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.25rem;
    background: transparent;
    color: var(--fg);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
  }

  .switch-button.active {
    background: var(--primary);
    color: white;
    box-shadow: 0 2px 8px color-mix(in oklab, var(--primary) 30%, transparent);
  }

  .switch-button:hover:not(.active) {
    background: color-mix(in oklab, var(--bg-muted) 50%, transparent);
  }

  @media (max-width: 768px) {
    .currency-settings-layout {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
  }




  small {
    grid-column: 2;
    font-size: 0.75rem;
    margin-top: 0.25rem;
  }
</style> 