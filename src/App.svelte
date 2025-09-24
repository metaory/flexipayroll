<script>
  import Payroll from './components/Payroll.svelte'
  import Icon from '@iconify/svelte'
  import { theme, toggleTheme } from './stores.js'
  
  // Apply theme to document
  $effect(() => {
    document.documentElement.classList.toggle('dark', $theme.mode === 'dark');
  });
</script>

<header class="header">
  <a href="/" class="logo">
    <img src="/logo.jpg" alt="XPayroll" width="48" height="48" />
    <div>
      <span class="title">XPayroll</span>
      <span class="subtitle">Professional Payroll Management</span>
    </div>
  </a>
  
  <button class="theme-toggle" onclick={toggleTheme} aria-label="Toggle color scheme">
    <Icon icon={$theme.mode === 'dark' ? 'solar:sun-bold-duotone' : 'solar:moon-bold-duotone'} width="1.5rem" height="1.5rem" />
  </button>
</header>

<Payroll />

<footer class="app-footer">
  <div class="footer-content">
    <div class="footer-branding">
      <img src="/logo.jpg" alt="XPayroll" width="32" height="32" />
      <div>
        <span class="footer-title">XPayroll</span>
        <span class="footer-subtitle">Professional Payroll Management System</span>
      </div>
    </div>
    
    <div class="footer-info">
      <span>Built with transparency and precision in mind</span>
      <span>© 2025 XPayroll. All rights reserved.</span>
    </div>
  </div>
</footer>

<style>
  /* Simple header */
  .header {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 2rem;
    padding: 1.5rem 2rem;
    background: color-mix(in oklab, var(--primary) 5%, transparent);
    border-bottom: 1px solid var(--border);
  }
  
  .logo {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 1rem;
    text-decoration: none;
    color: var(--fg);
  }
  
  .logo img {
    border-radius: 0.75rem;
  }
  
  .title {
    font-family: 'Bungee', monospace;
    color: var(--primary);
    font-weight: 600;
    font-size: 1.5rem;
  }
  
  .subtitle {
    font-size: 0.8rem;
    color: var(--fg-muted);
  }

  .theme-toggle {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    border: 1px solid var(--border);
    background: color-mix(in oklab, var(--secondary) 10%, transparent);
    cursor: pointer;
    transition: all 0.2s ease;
    display: grid;
    place-items: center;
  }
  
  .theme-toggle:hover {
    background: color-mix(in oklab, var(--secondary) 20%, transparent);
    transform: rotate(15deg);
  }
  
  .theme-toggle svg {
    color: var(--secondary);
  }

  /* Footer */
  .app-footer {
    background: color-mix(in oklab, var(--primary) 5%, transparent);
    border-top: 1px solid var(--border);
    padding: 2rem;
  }

  .footer-content {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .footer-branding {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 1rem;
  }
  
  .footer-branding img {
    border-radius: 0.5rem;
  }
  
  .footer-title {
    font-weight: 600;
    color: var(--primary);
    font-size: 1.1rem;
  }
  
  .footer-subtitle {
    font-size: 0.85rem;
    color: var(--fg-muted);
  }

  .footer-info {
    text-align: right;
  }
  
  .footer-info span {
    display: block;
    font-size: 0.85rem;
    color: var(--fg-muted);
  }
  
  .footer-info span:first-child {
    font-weight: 500;
  }
  
  @media (max-width: 768px) {
    .header {
      grid-template-columns: 1fr;
      gap: 1rem;
      text-align: center;
    }
    
    .footer-content {
      grid-template-columns: 1fr;
      text-align: center;
    }
    
    .footer-info {
      text-align: center;
    }
  }
</style>