<script>
  import Employees from './components/Employees.svelte';
  import Attendance from './components/Attendance.svelte';
  import Payroll from './components/Payroll.svelte';
  import Config from './components/Config.svelte';
  import Icon from '@iconify/svelte';
  import { theme, toggleTheme } from './lib/stores.js';
  
  let activeTab = $state('employees');
  
  const tabs = [
    { id: 'employees', label: 'Employees', icon: 'solar:users-group-rounded-bold', component: Employees },
    { id: 'attendance', label: 'Attendance', icon: 'solar:calendar-bold', component: Attendance },
    { id: 'payroll', label: 'Payroll', icon: 'solar:wallet-bold', component: Payroll },
    { id: 'config', label: 'Configuration', icon: 'solar:settings-bold', component: Config }
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
      <Icon icon={$theme.mode === 'dark' ? 'solar:sun-bold' : 'solar:moon-bold'} width="1.25rem" height="1.25rem" />
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
  
  <section>
    <h3>Product</h3>
    <ul>
      <li><button>Features</button></li>
      <li><button>Pricing</button></li>
      <li><button>API</button></li>
      <li><button>Documentation</button></li>
    </ul>
  </section>
  
  <section>
    <h3>Company</h3>
    <ul>
      <li><button>About</button></li>
      <li><button>Blog</button></li>
      <li><button>Careers</button></li>
      <li><button>Contact</button></li>
    </ul>
  </section>
  
  <section>
    <h3>Legal</h3>
    <ul>
      <li><button>Privacy</button></li>
      <li><button>Terms</button></li>
      <li><button>Security</button></li>
      <li><button>Compliance</button></li>
    </ul>
  </section>
  
  <p>© 2025 XPayroll. All rights reserved.</p>
  
  <nav>
    <button aria-label="GitHub">
      <Icon icon="solar:github-bold" width="1.25rem" height="1.25rem" />
    </button>
    <button aria-label="Twitter">
      <Icon icon="solar:twitter-bold" width="1.25rem" height="1.25rem" />
    </button>
    <button aria-label="LinkedIn">
      <Icon icon="solar:linkedin-bold" width="1.25rem" height="1.25rem" />
    </button>
  </nav>
</footer>
