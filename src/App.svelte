<script>
  import './app.css';
  import { AppBar, Avatar, Switch } from '@skeletonlabs/skeleton-svelte';
  import { theme, toggleTheme } from './lib/stores.js';
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
  
  // Apply theme to document with transition
  $effect(() => {
    document.documentElement.classList.toggle('dark', $theme.mode === 'dark');
  });
  
  // Initialize theme on mount
  import { onMount } from 'svelte';
  onMount(() => {
    // Ensure theme is properly set on initial load
    document.documentElement.classList.toggle('dark', $theme.mode === 'dark');
  });
  

</script>

<div class="min-h-screen bg-surface-50-900-token transition-colors duration-300">
  <!-- Header -->
  <AppBar>
    <svelte:fragment slot="lead">
      <div class="flex items-center gap-3">
        <Avatar src="/logo.svg" name="XPayroll" size="lg" />
        <div>
          <h1 class="text-xl font-bold text-primary-500">XPayroll</h1>
          <p class="text-sm text-surface-600-400-token">Payroll Management System</p>
        </div>
      </div>
    </svelte:fragment>
    <svelte:fragment slot="trail">
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2">
          <button 
            class="btn variant-ghost p-2 rounded-full hover:bg-surface-200-700-token transition-colors"
            on:click={() => toggleTheme()}
            title="Toggle theme"
          >
            <Icon icon={$theme.mode === 'dark' ? 'solar:moon-bold' : 'solar:sun-bold'} width="1.2em" height="1.2em" />
          </button>
        </div>
      </div>
    </svelte:fragment>
  </AppBar>
  
  <!-- Main Content -->
  <main class="container mx-auto p-6 max-w-7xl">
    <!-- Navigation Tabs -->
    <div class="card p-0 mb-6 shadow-lg">
      <header class="card-header bg-surface-100-800-token border-b border-surface-300-600-token">
        <nav class="flex">
          {#each tabs as tab}
            <button 
              class="flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-all duration-200 border-b-2 {activeTab === tab.id 
                ? 'text-primary-500 border-primary-500 bg-primary-50-900-token' 
                : 'text-surface-600-400-token border-transparent hover:text-surface-900-50-token hover:bg-surface-200-700-token'}"
              on:click={() => activeTab = tab.id}
            >
              <span class="text-lg">
                <Icon icon={tab.icon} width="1.2em" height="1.2em" />
              </span>
              <span>{tab.label}</span>
            </button>
          {/each}
        </nav>
      </header>
      
      <!-- Tab Content -->
      <section class="p-6">
        {#each tabs as tab}
          {#if activeTab === tab.id}
            <div class="animate-fade-in">
              <svelte:component this={tab.component} />
            </div>
          {/if}
        {/each}
      </section>
    </div>
  </main>
</div>

<style>
  .animate-fade-in {
    animation: fadeIn 0.3s ease-in-out;
  }
  
  @keyframes fadeIn {
    from { 
      opacity: 0; 
      transform: translateY(10px); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0); 
    }
  }
</style>
