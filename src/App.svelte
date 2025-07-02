<script>
  import Employees from './components/Employees.svelte';
  import Attendance from './components/Attendance.svelte';
  import Payroll from './components/Payroll.svelte';
  import Config from './components/Config.svelte';
  import { theme, toggleTheme } from './lib/stores.js';
  import Icon from '@iconify/svelte';

  
  let activeTab = $state('employees');
  const tabs = [
    { id: 'employees', label: 'Employees', icon: 'solar:users-group-rounded-bold', component: Employees },
    { id: 'attendance', label: 'Attendance', icon: 'solar:calendar-bold', component: Attendance },
    { id: 'payroll', label: 'Payroll', icon: 'solar:wallet-bold', component: Payroll },
    { id: 'config', label: 'Configuration', icon: 'solar:settings-bold', component: Config }
  ];
  
  // Theme management - reactive statement to handle theme changes
  $effect(() => {
    const themeData = $theme;
    
    // Apply theme class to document
    if (themeData.mode === 'dark') {
      document.documentElement.classList.add('theme-dark');
    } else {
      document.documentElement.classList.remove('theme-dark');
    }
  });
</script>

<div class="xpayroll">
  <header class="xpayroll-header">
    <div class="xpayroll-container xpayroll-header__container">
      <div class="xpayroll-header__brand">
        <img src="/logo.svg" alt="XPayroll" />
        <div>
          <h1>XPayroll</h1>
          <p>Payroll Management System</p>
        </div>
      </div>
      <button class="xpayroll-header__theme-toggle" onclick={toggleTheme} title="Toggle theme">
        {$theme.mode === 'light' ? '🌙' : '☀️'}
      </button>
    </div>
  </header>
  
  <nav class="xpayroll-nav">
    <div class="xpayroll-container xpayroll-nav__container">
      {#each tabs as tab}
        <button 
          class="xpayroll-nav__tab {activeTab === tab.id ? 'xpayroll-nav__tab--active' : ''}"
          onclick={() => activeTab = tab.id}
        >
          <Icon icon={tab.icon} width="1.2em" height="1.2em" />
          <span>{tab.label}</span>
        </button>
      {/each}
    </div>
  </nav>
  
  <main class="xpayroll-main">
    <div class="xpayroll-container">
      {#if activeTab === 'employees'}
        <Employees />
      {:else if activeTab === 'attendance'}
        <Attendance />
      {:else if activeTab === 'payroll'}
        <Payroll />
      {:else if activeTab === 'config'}
        <Config />
      {/if}
    </div>
  </main>
</div>
