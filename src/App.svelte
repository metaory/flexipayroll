<script>
  import Employees from './components/Employees.svelte';
  import Attendance from './components/Attendance.svelte';
  import Payroll from './components/Payroll.svelte';
  import Config from './components/Config.svelte';
  import Icon from '@iconify/svelte';
  import { theme, toggleTheme } from './lib/stores.js';
  import { ICONS } from './lib/icons.js';
  
  let activeTab = $state('employees');
  
  const tabs = [
    { id: 'employees', label: 'Employees', icon: ICONS.navEmployees, component: Employees },
    { id: 'attendance', label: 'Attendance', icon: ICONS.attendance, component: Attendance },
    { id: 'payroll', label: 'Payroll', icon: ICONS.payroll, component: Payroll },
    { id: 'config', label: 'Configuration', icon: ICONS.navConfig, component: Config }
  ];

  const ActiveComponent = $derived(tabs.find(tab => tab.id === activeTab)?.component);
  
  // Apply theme to document
  $effect(() => {
    document.documentElement.classList.toggle('dark', $theme.mode === 'dark');
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
        >
          <Icon icon={tab.icon} width="1.2em" height="1.2em" />
          <span>{tab.label}</span>
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
