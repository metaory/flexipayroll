<script>
  import Setup from './components/Setup.svelte'
  import Settings from './components/Settings.svelte'
  import Icon from '@iconify/svelte'
  import { theme, toggleTheme } from './stores.js'
  import { ICONS } from './lib/icons.js'
  
  const workflows = [
    { 
      id: 'setup', 
      label: 'Setup', 
      icon: ICONS.settings, 
      component: Setup,
      description: 'Configure business rules and calculations'
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: ICONS.help, 
      component: Settings,
      description: 'System preferences and data management'
    }
  ]
  
  // Get initial workflow from URL or default to setup
  const getInitialWorkflow = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const workflow = urlParams.get('workflow');
    return workflow && workflows.find(w => w.id === workflow) ? workflow : 'setup';
  };
  
  let activeWorkflow = $state(getInitialWorkflow());

  const ActiveComponent = $derived(workflows.find(workflow => workflow.id === activeWorkflow)?.component);
  const activeWorkflowInfo = $derived(workflows.find(workflow => workflow.id === activeWorkflow));
  
  // Apply theme to document
  $effect(() => {
    document.documentElement.classList.toggle('dark', $theme.mode === 'dark');
  });
  
  // Update URL when workflow changes
  $effect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('workflow', activeWorkflow);
    window.history.replaceState({}, '', url);
  });
</script>

<header class="header-fixed">
  <div class="header-content">
    <a href="/" class="logo-link">
      <img src="/logo.jpg" alt="XPayroll" width="48" height="48" />
      <div class="logo-text-container">
        <span class="logo-text">XPayroll</span>
        <span class="logo-subtitle">Professional Payroll Management</span>
      </div>
    </a>
    
    <nav class="main-nav">
      {#each workflows as workflow}
        <button 
          class="workflow-button"
          class:active={activeWorkflow === workflow.id}
          onclick={() => activeWorkflow = workflow.id}
          aria-label={`Switch to ${workflow.label} workflow`}
          title={workflow.description}
        >
          <div class="workflow-icon">
            <Icon icon={workflow.icon} width="2rem" height="2rem" />
          </div>
          <div class="workflow-info">
            <span class="workflow-label">{workflow.label}</span>
            <span class="workflow-description">{workflow.description}</span>
          </div>
        </button>
      {/each}
    </nav>
    
    <div class="header-actions">
      <div class="current-workflow-info">
        <Icon icon={activeWorkflowInfo?.icon} width="1.5rem" height="1.5rem" />
        <div>
          <span class="current-workflow-label">{activeWorkflowInfo?.label}</span>
          <span class="current-workflow-description">{activeWorkflowInfo?.description}</span>
        </div>
      </div>
      
      <button class="theme-toggle" onclick={toggleTheme} aria-label="Toggle color scheme">
        <Icon icon={$theme.mode === 'dark' ? ICONS.themeLight : ICONS.themeDark} width="1.5rem" height="1.5rem" />
      </button>
    </div>
  </div>
</header>

<main class="main-content">
  {#if ActiveComponent}
    <div class="workflow-container">
      <ActiveComponent />
    </div>
  {/if}
</main>

<footer class="app-footer">
  <div class="footer-content">
    <div class="footer-branding">
      <img src="/logo.jpg" alt="XPayroll" width="32" height="32" />
      <div>
        <span class="footer-title">XPayroll</span>
        <span class="footer-subtitle">Professional Payroll Management System</span>
      </div>
    </div>
    
    <div class="footer-info">
      <span>Built with transparency and precision in mind</span>
      <span>© 2025 XPayroll. All rights reserved.</span>
    </div>
  </div>
</footer>

<style>
  /* Enhanced Header Styling */
  .header-fixed {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background: color-mix(in oklab, var(--bg) 95%, transparent);
    backdrop-filter: blur(20px);
    box-shadow: 0 4px 20px color-mix(in oklab, var(--primary) 10%, transparent);
    border-bottom: 1px solid color-mix(in oklab, var(--primary) 15%, transparent);
  }

  .header-content {
    display: grid;
    grid-template-columns: auto 1fr auto;
    grid-template-areas: "logo nav actions";
    align-items: center;
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 2rem;
    height: 5rem;
    gap: 2rem;
  }

  @media (max-width: 1200px) {
    .header-content {
      grid-template-columns: auto 1fr auto;
      grid-template-areas: "logo nav actions";
      padding: 0 1.5rem;
      height: 4.5rem;
      gap: 1.5rem;
    }
  }

  @media (max-width: 768px) {
    .header-content {
      grid-template-columns: 1fr;
      grid-template-areas: "logo" "nav" "actions";
      padding: 1rem;
      height: auto;
      gap: 1rem;
    }
  }

  .logo-link {
    grid-area: logo;
    display: flex;
    align-items: center;
    gap: 1rem;
    text-decoration: none;
    color: var(--fg);
    justify-self: start;
    transition: all 0.2s ease;
  }
  
  .logo-link:hover {
    transform: translateY(-2px);
  }
  
  .logo-link img {
    border-radius: 0.75rem;
    box-shadow: 0 4px 16px color-mix(in oklab, var(--bg-muted) 30%, transparent);
    transition: all 0.2s ease;
  }
  
  .logo-text-container {
    display: grid;
    gap: 0.25rem;
  }
  
  .logo-text {
    font-family: 'Bungee', monospace;
    color: var(--primary);
    font-weight: 600;
    font-size: 1.5rem;
    line-height: 1;
  }
  
  .logo-subtitle {
    font-size: 0.8rem;
    color: var(--fg-muted);
    line-height: 1;
    font-weight: 400;
  }

  @media (max-width: 768px) {
    .logo-link {
      justify-self: center;
    }
    
    .logo-text {
      font-size: 1.25rem;
    }
    
    .logo-subtitle {
      font-size: 0.75rem;
    }
  }

  .main-nav {
    grid-area: nav;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.75rem;
    justify-items: center;
    align-items: center;
    max-width: 900px;
    margin: 0 auto;
  }

  @media (max-width: 1200px) {
    .main-nav {
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 0.5rem;
    }
  }

  @media (max-width: 768px) {
    .main-nav {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }
  }
  
  @media (max-width: 480px) {
    .main-nav {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }
  }

  .workflow-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: color-mix(in oklab, var(--secondary) 8%, transparent);
    border: 1px solid color-mix(in oklab, var(--secondary) 15%, transparent);
    border-radius: 1rem;
    transition: all 0.2s ease;
    width: 100%;
    min-height: 5rem;
    text-align: center;
    position: relative;
    overflow: hidden;
    cursor: pointer;
  }
  
  .workflow-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: transparent;
    transition: all 0.2s ease;
  }
  
  .workflow-button:hover:not(.active) {
    background: color-mix(in oklab, var(--secondary) 15%, transparent);
    border-color: color-mix(in oklab, var(--secondary) 25%, transparent);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px color-mix(in oklab, var(--bg-muted) 30%, transparent);
  }
  
  .workflow-button:hover:not(.active)::before {
    background: var(--secondary);
  }
  
  .workflow-button.active {
    background: color-mix(in oklab, var(--primary) 15%, transparent);
    border-color: var(--primary);
    box-shadow: 0 8px 32px color-mix(in oklab, var(--bg-muted) 40%, transparent);
  }
  
  .workflow-button.active::before {
    background: var(--primary);
  }
  
  .workflow-button.active .workflow-icon svg {
    color: var(--primary);
    transform: scale(1.1);
  }
  
  .workflow-button.active .workflow-label {
    color: var(--primary);
    font-weight: 600;
  }
  
  .workflow-button.active .workflow-description {
    color: var(--primary);
    opacity: 0.8;
  }

  @media (max-width: 768px) {
    .workflow-button {
      flex-direction: row;
      gap: 1rem;
      min-height: 4rem;
      text-align: left;
    }
  }
  
  @media (max-width: 480px) {
    .workflow-button {
      padding: 0.875rem;
    }
  }

  .workflow-icon {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .workflow-icon svg {
    color: var(--secondary);
    transition: all 0.2s ease;
  }
  
  @media (max-width: 768px) {
    .workflow-icon {
      flex-shrink: 0;
    }
  }

  .workflow-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
  }
  
  .workflow-label {
    font-weight: 500;
    color: var(--fg);
    font-size: 0.9rem;
    line-height: 1.2;
  }
  
  .workflow-description {
    color: var(--fg-muted);
    font-size: 0.75rem;
    line-height: 1.3;
  }
  
  @media (max-width: 480px) {
    .workflow-description {
      display: none;
    }
  }

  .header-actions {
    grid-area: actions;
    display: flex;
    align-items: center;
    gap: 1.5rem;
    justify-self: end;
  }
  
  @media (max-width: 768px) {
    .header-actions {
      justify-self: center;
      gap: 1rem;
    }
  }

  .current-workflow-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: color-mix(in oklab, var(--primary) 10%, transparent);
    border-radius: 0.75rem;
    border: 1px solid color-mix(in oklab, var(--primary) 20%, transparent);
  }
  
  .current-workflow-info svg {
    color: var(--primary);
    flex-shrink: 0;
  }
  
  .current-workflow-label {
    display: block;
    font-weight: 600;
    color: var(--primary);
    font-size: 0.9rem;
    line-height: 1;
  }
  
  .current-workflow-description {
    display: block;
    font-size: 0.75rem;
    color: var(--fg-muted);
    line-height: 1.2;
  }
  
  @media (max-width: 768px) {
    .current-workflow-info {
      display: none;
    }
  }

  .theme-toggle {
    width: 3rem;
    height: 3rem;
    padding: 0;
    border-radius: 50%;
    border: none;
    background: color-mix(in oklab, var(--secondary) 12%, transparent);
    border: 1px solid color-mix(in oklab, var(--secondary) 20%, transparent);
    box-shadow: 0 4px 16px color-mix(in oklab, var(--bg-muted) 30%, transparent);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .theme-toggle:hover {
    background: color-mix(in oklab, var(--secondary) 20%, transparent);
    transform: translateY(-2px) rotate(15deg);
    box-shadow: 0 8px 32px color-mix(in oklab, var(--bg-muted) 40%, transparent);
  }
  
  .theme-toggle svg {
    color: var(--secondary);
  }
  
  @media (max-width: 768px) {
    .theme-toggle {
      width: 2.5rem;
      height: 2.5rem;
    }
  }

  /* Enhanced Main Content */
  .main-content {
    margin-top: 5rem;
    min-height: calc(100vh - 5rem - 6rem); /* Account for header and footer */
    padding: 0;
    background: var(--bg);
  }
  
  @media (max-width: 768px) {
    .main-content {
      margin-top: 0;
      padding-top: 2rem;
      min-height: calc(100vh - 8rem);
    }
  }

  .workflow-container {
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 0;
  }

  /* Enhanced Footer */
  .app-footer {
    background: color-mix(in oklab, var(--primary) 8%, transparent);
    border-top: 1px solid color-mix(in oklab, var(--primary) 15%, transparent);
    padding: 2rem 0;
    margin-top: auto;
  }

  .footer-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;
  }
  
  @media (max-width: 768px) {
    .footer-content {
      flex-direction: column;
      text-align: center;
      gap: 1.5rem;
      padding: 0 1rem;
    }
  }

  .footer-branding {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .footer-branding img {
    border-radius: 0.5rem;
    box-shadow: 0 2px 8px color-mix(in oklab, var(--bg-muted) 20%, transparent);
  }
  
  .footer-title {
    display: block;
    font-weight: 600;
    color: var(--primary);
    font-size: 1.1rem;
    line-height: 1;
  }
  
  .footer-subtitle {
    display: block;
    font-size: 0.85rem;
    color: var(--fg-muted);
    line-height: 1.2;
  }

  .footer-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    text-align: right;
  }
  
  @media (max-width: 768px) {
    .footer-info {
      text-align: center;
    }
  }
  
  .footer-info span {
    font-size: 0.85rem;
    color: var(--fg-muted);
  }
  
  .footer-info span:first-child {
    font-weight: 500;
  }
</style>