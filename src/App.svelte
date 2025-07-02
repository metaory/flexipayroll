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
</script>

<div>
  <header>
    <div>
      <img src="/logo.svg" alt="XPayroll" />
      <div>
        <h1>XPayroll</h1>
        <p>Payroll Management System</p>
      </div>
    </div>
    <button onclick={toggleTheme} title="Toggle theme">
      {$theme.mode === 'dark' ? '🌙' : '☀️'}
    </button>
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
</div>
