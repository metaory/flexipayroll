<script>
  import Payroll from './components/Payroll.svelte'
  import Icon from '@iconify/svelte'
  import { theme, toggleTheme } from './stores.js'
  
  let footerActions = $state(null)
  
  // Apply theme to document on mount and changes
  $effect(() => {
    const isDark = $theme.mode === 'dark'
    document.documentElement.classList.toggle('dark', isDark)
  });
</script>

<header class="app-header">
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

<main class="app-content">
  <Payroll bind:footerActions />
</main>

<footer class="app-footer">
  <div class="footer-content">
    <div class="footer-branding">
      <span class="footer-text">© 2025 XPayroll</span>
    </div>
    
    <div class="footer-actions">
      {#if footerActions}
        {@render footerActions()}
      {/if}
    </div>
  </div>
</footer>

<style lang="sass">
  @use "./styles.sass" as *

  .app-header
    grid-area: header
    @extend %grid
    grid-template-columns: 1fr auto
    align-items: center
    gap: 2rem
    padding: 1rem 2rem
    background: color-mix(in oklab, var(--primary) 5%, transparent)
    border-bottom: 1px solid var(--border)
    height: 5rem
    box-sizing: border-box

  .app-content
    grid-area: content
    overflow-y: auto
    overflow-x: hidden
    padding: 2rem
    background: var(--bg)
    height: calc(100vh - 9rem)
    box-sizing: border-box

  .app-footer
    grid-area: footer
    background: color-mix(in oklab, var(--primary) 5%, transparent)
    border-top: 1px solid var(--border)
    padding: 1rem 2rem
    height: 4rem
    box-sizing: border-box
  
  .logo
    @extend %grid
    grid-template-columns: auto 1fr
    align-items: center
    gap: 1rem
    text-decoration: none
    color: var(--fg)
    
    img
      border-radius: 0.75rem
  
  .title
    font-family: 'Bungee', monospace
    color: var(--primary)
    font-weight: 600
    font-size: 1.5rem
  
  .subtitle
    font-size: 0.8rem
    color: var(--fg-muted)

  .theme-toggle
    width: 3rem
    height: 3rem
    border-radius: 50%
    border: 1px solid var(--border)
    background: color-mix(in oklab, var(--secondary) 10%, transparent)
    cursor: pointer
    @extend %transition
    @extend %grid
    place-items: center
    
    &:hover
      background: color-mix(in oklab, var(--secondary) 20%, transparent)
      transform: rotate(15deg)
    
    :global(svg)
      color: var(--secondary)

  .footer-content
    @extend %grid
    grid-template-columns: auto 1fr
    align-items: center
    gap: 2rem
    max-width: 1200px
    margin: 0 auto
    height: 100%

  .footer-branding
    @extend %flex
  
  .footer-text
    font-size: 0.75rem
    color: var(--fg-muted)
    opacity: 0.7

  .footer-actions
    @extend %flex
    justify-content: flex-end
    gap: 1rem
  
  @media (max-width: $mobile)
    .app-header
      grid-template-columns: 1fr
      gap: 0.5rem
      text-align: center
      padding: 0.5rem 1rem
      height: 4rem

    .app-content
      padding: 1rem
      height: calc(100vh - 7rem)

    .app-footer
      padding: 0.5rem 1rem
      height: 3rem
    
    .footer-content
      grid-template-columns: 1fr
      text-align: center
</style>