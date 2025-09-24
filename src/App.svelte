<script>
  import Employees from './components/Employees.svelte';
  import Attendance from './components/Attendance.svelte';
  import Payroll from './components/Payroll.svelte';
  import Payslips from './components/Payslips.svelte';
  import Config from './components/Config.svelte';
  import Settings from './components/Settings.svelte';
  import Icon from '@iconify/svelte';
  import { theme, toggleTheme } from './lib/stores.js';
  import { ICONS } from './lib/icons.js';
  import { t } from './lib/i18n.js';
  
  const tabs = [
    { id: 'employees', label: 'Employees', icon: ICONS.navEmployees, component: Employees },
    { id: 'attendance', label: t.attendance, icon: ICONS.navAttendance, component: Attendance },
    { id: 'payroll', label: 'Payroll', icon: ICONS.navPayroll, component: Payroll },
    { id: 'payslips', label: 'Payslips', icon: ICONS.navPayslips, component: Payslips },
    { id: 'config', label: 'Configuration', icon: ICONS.navConfig, component: Config },
    { id: 'settings', label: 'Settings', icon: ICONS.help, component: Settings }
  ];
  
  // Get initial tab from URL or default to employees
  const getInitialTab = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    return tab && tabs.find(t => t.id === tab) ? tab : 'employees';
  };
  
  let activeTab = $state(getInitialTab());

  const ActiveComponent = $derived(tabs.find(tab => tab.id === activeTab)?.component);
  
  // Apply theme to document
  $effect(() => {
    document.documentElement.classList.toggle('dark', $theme.mode === 'dark');
  });
  
  // Update URL when tab changes
  $effect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', activeTab);
    window.history.replaceState({}, '', url);
  });
</script>

<header class="header-fixed">
  <div class="header-content">
    <a href="/" class="logo-link">
      <img src="/logo.jpg" alt="XPayroll" width="48" height="48" />
      <span class="logo-text">XPayroll</span>
    </a>
    
    <nav class="main-nav">
      {#each tabs as tab}
        <button 
          class={activeTab === tab.id ? 'active' : ''}
          onclick={() => activeTab = tab.id}
          aria-label={`Switch to ${tab.label} tab`}
          title={tab.label}
          data-tooltip={tab.label}
        >
          <Icon icon={tab.icon} width="1.5em" height="1.5em" />
        </button>
      {/each}
    </nav>
    
    <button class="theme-toggle" onclick={toggleTheme} aria-label="Toggle color scheme">
      <Icon icon={$theme.mode === 'dark' ? ICONS.themeLight : ICONS.themeDark} width="1.25rem" height="1.25rem" />
    </button>
  </div>
</header>

<main class="fade-in">
  {#if ActiveComponent}
    <ActiveComponent />
  {/if}
</main>

<footer>
  <img src="/logo.jpg" alt="XPayroll" width="48" height="48" />
  <p>Modern payroll management system for efficient business operations.</p>
  <p>© 2025 XPayroll. All rights reserved.</p>
</footer>
