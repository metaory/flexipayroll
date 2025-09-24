<script>
  import Payroll from './components/Payroll.svelte'
  import Icon from '@iconify/svelte'
  import { theme, toggleTheme } from './stores.js'
  
  // Apply theme to document on mount and changes
  $effect(() => {
    const isDark = $theme.mode === 'dark'
    document.documentElement.classList.toggle('dark', isDark)
  });
</script>

<header class="app-header">
  <a href="/" class="logo">
    <Icon icon="mynaui:chevron-up-left-square-solid" width="48" height="48" />
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
  <Payroll />
</main>

<footer class="app-footer">
  <span class="footer-text">© 2025 XPayroll</span>
</footer>

<style lang="sass">
  @use "./styles.sass" as *

  .app-header
    grid-area: header
    @extend %grid
    grid-template-columns: 1fr auto
    align-items: center
    gap: 3rem
    padding: 1.5rem 3rem
    background: var(--bg-muted)
    height: 5rem
    box-sizing: border-box

  .app-content
    grid-area: content
    overflow-y: auto
    overflow-x: hidden
    padding: 2rem
    margin: auto 2em
    background: var(--bg)
    height: calc(100vh - 9rem)
    box-sizing: border-box
    border-radius: 1.6em

  .app-footer
    grid-area: footer
    background: var(--bg-muted)
    padding: 1rem 2rem
    height: 4rem
    box-sizing: border-box
  
  .logo
    @extend %grid
    grid-template-columns: auto 1fr
    align-items: center
    gap: 1.5rem
    text-decoration: none
    color: var(--fg)
    
    :global(svg)
      color: var(--primary)
      border-radius: 0.75rem
  
  .title
    font-family: 'Bungee', monospace
    color: var(--primary)
    font-weight: 600
    font-size: 1.5rem
    line-height: 1.2
  
  .subtitle
    font-size: 0.85rem
    color: var(--fg-muted)
    margin-top: 0.25rem

  .theme-toggle
    width: 3rem
    height: 3rem
    border-radius: 50%
    border: 1px solid var(--border)
    background: var(--surface-light)
    cursor: pointer
    @extend %transition
    @extend %grid
    place-items: center
    
    &:hover
      background: var(--surface-medium)
      transform: rotate(15deg)
    
    :global(svg)
      color: var(--secondary)

  .footer-text
    font-size: 0.75rem
    color: var(--fg-muted)
    opacity: 0.7
    text-align: center
  
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
    
</style>