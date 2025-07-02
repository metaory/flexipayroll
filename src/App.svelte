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
        {#if $theme.mode === 'light'}
          <img src="/scheme/dark.svg" alt="Switch to dark mode" width="24" height="24" />
        {:else}
          <img src="/scheme/light.svg" alt="Switch to light mode" width="24" height="24" />
        {/if}
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
  
  <footer class="xpayroll-footer">
    <div class="xpayroll-container">
      <div class="xpayroll-footer__top">
        <div class="xpayroll-footer__column">
          <div class="xpayroll-footer__logo">
            <img src="/logo.svg" alt="XPayroll" width="48" height="48" />
          </div>
          <p class="xpayroll-footer__description">
            Modern payroll management system for efficient business operations.
          </p>
        </div>
        <div class="xpayroll-footer__column">
          <h3 class="xpayroll-footer__title" id="xpayroll-footer-title-01">Features</h3>
          <ul class="xpayroll-footer__navigation" aria-labelledby="xpayroll-footer-title-01">
            <li><button class="xpayroll-footer__link">Employee Management</button></li>
            <li><button class="xpayroll-footer__link">Attendance Tracking</button></li>
            <li><button class="xpayroll-footer__link">Payroll Processing</button></li>
            <li><button class="xpayroll-footer__link">Reports & Analytics</button></li>
          </ul>
        </div>
        <div class="xpayroll-footer__column">
          <h3 class="xpayroll-footer__title" id="xpayroll-footer-title-02">Support</h3>
          <ul class="xpayroll-footer__navigation" aria-labelledby="xpayroll-footer-title-02">
            <li><button class="xpayroll-footer__link">Documentation</button></li>
            <li><button class="xpayroll-footer__link">Help Center</button></li>
            <li><button class="xpayroll-footer__link">Contact Support</button></li>
            <li><button class="xpayroll-footer__link">API Reference</button></li>
          </ul>
        </div>
        <div class="xpayroll-footer__column">
          <h3 class="xpayroll-footer__title" id="xpayroll-footer-title-03">Company</h3>
          <ul class="xpayroll-footer__navigation" aria-labelledby="xpayroll-footer-title-03">
            <li><button class="xpayroll-footer__link">About Us</button></li>
            <li><button class="xpayroll-footer__link">Privacy Policy</button></li>
            <li><button class="xpayroll-footer__link">Terms of Service</button></li>
            <li><button class="xpayroll-footer__link">Careers</button></li>
          </ul>
        </div>
      </div>
      <div class="xpayroll-footer__bottom">
        <p class="xpayroll-footer__copyright">
          © 2025 XPayroll. All rights reserved.
        </p>
        <div class="xpayroll-footer__social">
          <button class="xpayroll-footer__social-link" aria-label="GitHub">
            <Icon icon="solar:github-bold" width="1.25rem" height="1.25rem" />
          </button>
          <button class="xpayroll-footer__social-link" aria-label="Twitter">
            <Icon icon="solar:twitter-bold" width="1.25rem" height="1.25rem" />
          </button>
          <button class="xpayroll-footer__social-link" aria-label="LinkedIn">
            <Icon icon="solar:linkedin-bold" width="1.25rem" height="1.25rem" />
          </button>
        </div>
      </div>
    </div>
  </footer>
</div>
