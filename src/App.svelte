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
      <span class="subtitle">Flexible Payroll Management</span>
    </div>
  </a>

  <button class="theme-toggle" onclick={toggleTheme} aria-label="Toggle color scheme">
    <Icon icon={$theme.mode === 'dark' ? 'line-md:moon-filled-to-sunny-filled-transition' : 'line-md:sunny-outline-to-moon-alt-loop-transition'} width="1.5rem" height="1.5rem" />
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

  :global(body::before)
    content: ''
    position: fixed
    top: 0
    left: 0
    width: 100vw
    height: 100vh
    background-image: url('./bg-animated.svg')
    background-size: cover
    background-position: center
    background-repeat: no-repeat
    background-attachment: fixed
    z-index: -1
    filter: $bg-filter-light
    @extend %transition

  :global(html.dark body::before)
    filter: $bg-filter-dark

  main 
    background: var(--bg)

  .app-header
    grid-area: header
    @extend %grid
    grid-template-columns: 1fr auto
    align-items: center
    gap: 3rem
    padding: 1.5rem 3rem
    height: 5rem
    box-sizing: border-box
    position: relative
    z-index: 1

  .app-content
    grid-area: content
    overflow: hidden
    padding: 0
    margin: auto 2em
    background: var(--bg)
    height: calc(100vh - 9rem)
    box-sizing: border-box
    border-radius: 1.6em
    position: relative
    z-index: 1

  .app-footer
    grid-area: footer
    padding: 1rem 2rem
    height: 4rem
    box-sizing: border-box
    position: relative
    z-index: 1

  .logo
    @extend %grid
    grid-template-columns: auto 1fr
    align-items: center
    gap: 1.5rem
    text-decoration: none
    color: var(--fg)

    :global(svg)
      color: var(--brand)
      border-radius: 0.75rem

  .title
    font-family: 'Bungee', monospace
    color: var(--brand)
    font-weight: 600
    font-size: 1.5rem
    line-height: 1.2

  .subtitle
    font-size: 0.85rem
    font-style: italic
    color: var(--fg-muted)
    margin-left: 1rem
    opacity: 0.8

  .theme-toggle
    width: 3rem
    height: 3rem
    border-radius: 50%
    cursor: pointer
    @extend %transition
    @extend %grid
    place-items: center

    &:hover
      background: var(--bg)

    :global(svg)
      color: var(--primary)

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
