<script>
  import Employees from './components/Employees.svelte';
  import Attendance from './components/Attendance.svelte';
  import Payroll from './components/Payroll.svelte';
  import Config from './components/Config.svelte';
  import Icon from '@iconify/svelte';

  let activeTab = $state('employees');
  const tabs = [
    { id: 'employees', label: 'Employees', icon: 'solar:users-group-rounded-bold', component: Employees },
    { id: 'attendance', label: 'Attendance', icon: 'solar:calendar-bold', component: Attendance },
    { id: 'payroll', label: 'Payroll', icon: 'solar:wallet-bold', component: Payroll },
    { id: 'config', label: 'Configuration', icon: 'solar:settings-bold', component: Config }
  ];
</script>

<header>
  <img src="/logo.svg" alt="XPayroll" />
  <h1>XPayroll</h1>
  <p>Payroll Management System</p>
</header>

<nav>
  {#each tabs as tab}
    <button onclick={() => activeTab = tab.id}>
      <Icon icon={tab.icon} width="1.2em" height="1.2em" />
      <span>{tab.label}</span>
    </button>
  {/each}
</nav>

<main>
  {#if activeTab === 'employees'}
    <Employees />
  {:else if activeTab === 'attendance'}
    <Attendance />
  {:else if activeTab === 'payroll'}
    <Payroll />
  {:else if activeTab === 'config'}
    <Config />
  {/if}
</main>

<footer>
  <img src="/logo.svg" alt="XPayroll" width="48" height="48" />
  <p>Modern payroll management system for efficient business operations.</p>
  
  <section>
    <h3>Features</h3>
    <ul>
      <li><button>Employee Management</button></li>
      <li><button>Attendance Tracking</button></li>
      <li><button>Payroll Processing</button></li>
      <li><button>Reports & Analytics</button></li>
    </ul>
  </section>
  
  <section>
    <h3>Support</h3>
    <ul>
      <li><button>Documentation</button></li>
      <li><button>Help Center</button></li>
      <li><button>Contact Support</button></li>
      <li><button>API Reference</button></li>
    </ul>
  </section>
  
  <section>
    <h3>Company</h3>
    <ul>
      <li><button>About Us</button></li>
      <li><button>Privacy Policy</button></li>
      <li><button>Terms of Service</button></li>
      <li><button>Careers</button></li>
    </ul>
  </section>
  
  <p>© 2025 XPayroll. All rights reserved.</p>
  
  <div>
    <button aria-label="GitHub">
      <Icon icon="solar:github-bold" width="1.25rem" height="1.25rem" />
    </button>
    <button aria-label="Twitter">
      <Icon icon="solar:twitter-bold" width="1.25rem" height="1.25rem" />
    </button>
    <button aria-label="LinkedIn">
      <Icon icon="solar:linkedin-bold" width="1.25rem" height="1.25rem" />
    </button>
  </div>
</footer>
