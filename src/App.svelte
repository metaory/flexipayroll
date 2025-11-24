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

<button class="theme-toggle" onclick={toggleTheme} aria-label="Toggle color scheme">
  <Icon icon={$theme.mode === 'dark' ? 'line-md:moon-filled-to-sunny-filled-transition' : 'line-md:sunny-outline-to-moon-alt-loop-transition'} width="1.5rem" height="1.5rem" />
</button>

<main class="app-content">
  <Payroll />
</main>

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

  .app-content
    overflow: hidden
    padding: 0
    margin: auto 2em
    background: var(--bg)
    height: 100vh
    box-sizing: border-box
    border-radius: 1.6em
    position: relative
    z-index: 1

  .theme-toggle
    position: fixed
    top: 1rem
    right: 1rem
    width: 3.5rem
    height: 3.5rem
    border-radius: 50%
    cursor: pointer
    @extend %transition
    @extend %grid
    place-items: center
    background: var(--surface)
    border: 2px solid var(--border-muted)
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15)
    z-index: 1000

    &:hover
      background: var(--surface-medium)
      border-color: var(--primary)
      transform: scale(1.1)
      box-shadow: 0 6px 20px color-mix(in oklab, var(--primary) 30%, transparent)

    :global(svg)
      color: var(--primary)

  @media (max-width: $mobile)
    .theme-toggle
      top: 0.5rem
      right: 0.5rem
      width: 3rem
      height: 3rem

    .app-content
      padding: 1rem
      margin: 0 0.5em
      height: 100vh

</style>
