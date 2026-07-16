<script>
  import Payroll from './components/Payroll.svelte'
  import ToastContainer from './components/ToastContainer.svelte'
  import Icon from '@iconify/svelte/dist/OfflineIcon.svelte'
  import { ICONS } from './lib/icons.js'
  import { theme, toggleTheme } from './stores.js'
  import { storage, defaultSessionBasename } from './core.js'
  import { filenamePromptDialog } from './lib/dialog.js'
  import { toasts } from './lib/toast.js'
  import pkg from '../package.json'

  let fileInput = $state()
  let installEvent = $state()
  let installReady = $state(false)

  // Apply theme to document on mount and changes
  $effect(() => {
    const isDark = $theme.mode === 'dark'
    document.documentElement.classList.toggle('dark', isDark)
  })

  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true

  $effect(() => {
    if (typeof window === 'undefined') return
    installReady = !isStandalone()
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault()
      installEvent = event
      installReady = true
    }
    const onAppInstalled = () => {
      installEvent = null
      installReady = false
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  })

  const handleLoad = async (e) => {
    const file = e.target.files?.[0]
    const result = await storage.loadSessionFile(file)
    if (result?.ok) {
      toasts.success('Session restored')
      return
    }
    toasts.error(result?.error || 'Invalid or incompatible backup file')
    e.target.value = ''
  }
  const handleSave = async () => {
    const locale = storage.get('xpayroll_basic_config', {})?.locale
    const prefix = defaultSessionBasename(locale)
    const filename = await filenamePromptDialog(`${prefix}-`, prefix)
    if (!filename) return
    storage.downloadSession(filename)
  }
  const handleInstall = async () => {
    if (!installEvent) return
    await installEvent.prompt()
    const { outcome } = await installEvent.userChoice
    if (outcome !== 'accepted') return
    installEvent = null
    installReady = false
  }
</script>

<div class="toolbar">
  <button class="toolbar-btn" onclick={handleSave} aria-label="Save session">
    <Icon icon={ICONS.save} width="1.5rem" height="1.5rem" />
  </button>
  <button class="toolbar-btn" onclick={() => fileInput.click()} aria-label="Load session">
    <Icon icon={ICONS.folderOpen} width="1.5rem" height="1.5rem" />
  </button>
  <button class="toolbar-btn" onclick={toggleTheme} aria-label="Toggle color scheme">
    <Icon icon={$theme.mode === 'dark' ? ICONS.themeLight : ICONS.themeDark} width="1.5rem" height="1.5rem" />
  </button>
  {#if installReady}
    <button class="toolbar-btn" onclick={handleInstall} aria-label="Install app">
      <Icon icon={ICONS.install} width="1.5rem" height="1.5rem" />
    </button>
  {/if}
</div>
<input type="file" accept=".json,.zip,.ziip,.txt" bind:this={fileInput} onchange={handleLoad} hidden />

<main class="app-content">
  <Payroll />
</main>
<ToastContainer />

<small class="version" aria-hidden="true">v{pkg.version}</small>

<style lang="sass">
  @use "./styles.sass" as *

  :global(body::before)
    content: ''
    position: fixed
    top: 0
    left: 0
    width: 100vw
    height: 100vh
    background-image: url('/bg-animated.svg')
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
    margin: 0.5rem 1rem
    background: var(--bg)
    height: calc(100dvh - 1rem)
    box-sizing: border-box
    border-radius: 1rem
    position: relative
    z-index: 1

  .toolbar
    position: fixed
    top: 0.5rem
    right: 40%
    display: flex
    z-index: 1000
    background: var(--surface)
    border: 2px solid var(--border-muted)
    border-radius: 0.75rem
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15)

  .toolbar-btn
    width: 2.75rem
    height: 2.75rem
    border-radius: 50%
    cursor: pointer
    @extend %transition
    @extend %grid
    place-items: center
    background: transparent
    border: none

    &:hover
      background: var(--surface-medium)
      border-radius: 20%

    :global(svg)
      color: var(--primary)

  .version
    position: fixed
    bottom: 0.6rem
    left: 0.8rem
    z-index: 10
    font-family: 'JetBrains Mono', monospace
    font-size: 0.75rem
    color: var(--fg-muted)
    opacity: 0.4
    pointer-events: none
    user-select: none

    @media print
      display: none

  @media (max-width: $mobile)
    .toolbar
      top: 0.5rem
      right: 0.5rem

    .toolbar-btn
      width: 2.75rem
      height: 2.75rem

    .app-content
      padding: 0.75rem
      margin: 0 0.5rem
      height: 100dvh

    .version
      left: 0.5rem

</style>
