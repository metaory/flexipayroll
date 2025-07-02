<script>
  import Employees from './components/Employees.svelte';
  import Attendance from './components/Attendance.svelte';
  import Payroll from './components/Payroll.svelte';
  import Config from './components/Config.svelte';
  import { theme, toggleTheme } from './lib/stores.js';
  import Icon from '@iconify/svelte';
  let activeTab = 'employees';
  const tabs = [
    { id: 'employees', label: 'Employees', icon: 'solar:users-group-rounded-bold', component: Employees },
    { id: 'attendance', label: 'Attendance', icon: 'solar:calendar-bold', component: Attendance },
    { id: 'payroll', label: 'Payroll', icon: 'solar:wallet-bold', component: Payroll },
    { id: 'config', label: 'Configuration', icon: 'solar:settings-bold', component: Config }
  ];
</script>

<div class="app-root">
  <header class="app-header">
    <div class="header-left">
      <img src="/logo.svg" alt="XPayroll" class="logo" />
      <div>
        <h1 class="app-title">XPayroll</h1>
        <p class="app-desc">Payroll Management System</p>
      </div>
    </div>
    <button class="theme-toggle" onclick={() => toggleTheme()} title="Toggle theme">
      {$theme.mode === 'dark' ? '🌙' : '☀️'}
    </button>
  </header>
  <nav class="tab-nav">
    {#each tabs as tab}
      <button 
        class="tab-btn {activeTab === tab.id ? 'active' : ''}"
        onclick={() => activeTab = tab.id}
      >
        <span class="tab-icon"><Icon icon={tab.icon} width="1.2em" height="1.2em" /></span>
        <span>{tab.label}</span>
      </button>
    {/each}
  </nav>
  <main class="main-content">
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

<style>
.app-root {
  min-height: 100vh;
  background: #f9f9f9;
  color: #222;
  font-family: system-ui, sans-serif;
}
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem 1rem 2rem;
  background: #fff;
  border-bottom: 1px solid #eee;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.logo {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}
.app-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0;
}
.app-desc {
  font-size: 0.95rem;
  color: #888;
  margin: 0;
}
.theme-toggle {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background 0.2s;
}
.theme-toggle:hover {
  background: #f0f0f0;
}
.tab-nav {
  display: flex;
  border-bottom: 1px solid #eee;
  background: #fafafa;
}
.tab-btn {
  flex: 1;
  padding: 1rem 0;
  background: none;
  border: none;
  font-size: 1rem;
  color: #666;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.tab-btn.active {
  color: #1976d2;
  border-bottom: 2px solid #1976d2;
  background: #e3f2fd;
}
.tab-btn:hover:not(.active) {
  background: #f0f0f0;
  color: #222;
}
.main-content {
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 2px 8px 0 #0001;
}
</style>
