<script>
  import { onMount } from 'svelte'
  import Employees from './components/Employees.svelte'
  import Attendance from './components/Attendance.svelte'
  import Payroll from './components/Payroll.svelte'
  import Config from './components/Config.svelte'
  
  let activeTab = 0
  const tabs = [
    { label: 'Employees', component: Employees },
    { label: 'Attendance', component: Attendance },
    { label: 'Payroll', component: Payroll },
    { label: 'Configuration', component: Config }
  ]
</script>

<main>
  <header class="app-header">
    <h1><span class="highlight">X</span>Payroll</h1>
    <p>Simple Payroll Management System</p>
  </header>

  <div class="tab-container">
    <div class="tab-header">
      {#each tabs as tab, index}
        <button 
          class="tab-btn {activeTab === index ? 'active' : ''}"
          on:click={() => activeTab = index}
        >
          {tab.label}
        </button>
      {/each}
    </div>
    
    <div class="tab-content">
      {#each tabs as tab, index}
        <div class="tab-panel {activeTab === index ? 'active' : ''}">
          <svelte:component this={tab.component} />
        </div>
      {/each}
    </div>
  </div>

  <footer class="app-footer">
    <p>&copy; {new Date().getFullYear()} XPayroll - v0.1.0</p>
  </footer>
</main>

<style>
  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .app-header {
    text-align: center;
    margin-bottom: 30px;
    padding: 20px 0;
    border-bottom: 2px solid #e0e0e0;
  }

  .app-header h1 {
    font-size: 2.5rem;
    margin: 0;
    color: #333;
  }

  .highlight {
    color: #ff6b35;
    font-weight: bold;
  }

  .app-header p {
    margin: 10px 0 0;
    color: #666;
    font-size: 1.1rem;
  }

  .tab-container {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    overflow: hidden;
  }

  .tab-header {
    display: flex;
    background: #f8f9fa;
    border-bottom: 1px solid #e0e0e0;
  }

  .tab-btn {
    flex: 1;
    padding: 15px 20px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    color: #666;
    transition: all 0.3s ease;
  }

  .tab-btn:hover {
    background: #e9ecef;
    color: #333;
  }

  .tab-btn.active {
    background: white;
    color: #ff6b35;
    border-bottom: 3px solid #ff6b35;
  }

  .tab-content {
    position: relative;
  }

  .tab-panel {
    display: none;
    padding: 30px;
  }

  .tab-panel.active {
    display: block;
  }

  .app-footer {
    text-align: center;
    margin-top: 30px;
    padding: 20px 0;
    color: #666;
    border-top: 1px solid #e0e0e0;
  }
</style>
