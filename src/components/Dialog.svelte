<script>
  import { createEventDispatcher } from 'svelte'
  import Icon from '@iconify/svelte'
  
  const dispatch = createEventDispatcher()
  
  let { 
    open = $bindable(false), 
    title = '', 
    size = 'medium',
    closable = true,
    closeOnBackdrop = true 
  } = $props()
  
  let dialog = $state(null)
  
  // Sync open prop with dialog state
  $effect(() => {
    if (dialog) {
      if (open) {
        dialog.showModal()
      } else {
        dialog.close()
      }
    }
  })
  
  // Handle native close events (ESC key, etc.)
  $effect(() => {
    if (dialog) {
      const handleNativeClose = () => {
        open = false
        dispatch('close')
      }
      
      dialog.addEventListener('close', handleNativeClose)
      
      return () => {
        dialog.removeEventListener('close', handleNativeClose)
      }
    }
  })
  
  // Handle manual close events (backdrop, close button)
  const handleClose = () => {
    open = false
    dispatch('close')
  }
  
  const handleBackdropClick = (event) => {
    if (closeOnBackdrop && event.target === dialog) {
      handleClose()
    }
  }
</script>

<dialog 
  bind:this={dialog} 
  class="dialog" 
  class:size-small={size === 'small'}
  class:size-medium={size === 'medium'}
  class:size-large={size === 'large'}
  class:size-fullscreen={size === 'fullscreen'}
  onclick={handleBackdropClick}
>
  <div class="dialog-content">
    {#if title}
      <div class="dialog-header">
        <h3>{title}</h3>
        {#if closable}
          <button class="close-btn" onclick={handleClose}>
            <Icon icon="tabler:x" width="2.5rem" height="2.5rem" style="width: var(--icon-size); height: var(--icon-size)" />
          </button>
        {/if}
      </div>
    {/if}
    
    <div class="dialog-body">
      <slot />
    </div>
  </div>
</dialog>

<style lang="sass">
  @use "../styles.sass" as *
  
  .dialog
    border: none
    border-radius: var(--radius)
    padding: 0
    margin: auto
    background: transparent
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1)
    max-height: 90vh
    overflow: hidden
    
    // Hide dialog when not open to prevent FOUC
    &:not([open])
      display: none
    
    &::backdrop
      background: rgba(0, 0, 0, 0.7)
      backdrop-filter: blur(6px)
    
    &.size-small
      max-width: 400px
      width: 90%
      
    &.size-medium
      max-width: 600px
      width: 90%
      
    &.size-large
      max-width: 800px
      width: 95%
      
    &.size-fullscreen
      max-width: 95vw
      width: 95vw
      max-height: 95vh
      height: 95vh
  
  .dialog-content
    background: var(--bg)
    border-radius: var(--radius)
    width: 100%
    height: 100%
    display: flex
    flex-direction: column
    overflow: hidden
  
  .dialog-header
    display: flex
    justify-content: space-between
    align-items: center
    padding: 1.5rem 2rem
    border-bottom: 1px solid var(--border-muted)
    flex-shrink: 0
    
    h3
      margin: 0
      font-size: 1.25rem
      font-weight: 600
      color: var(--primary)
      
  .close-btn
    width: 2rem
    height: 2rem
    border-radius: 50%
    border: none
    background: var(--surface)
    color: var(--fg-muted)
    cursor: pointer
    display: flex
    align-items: center
    justify-content: center
    transition: all 0.2s ease
    
    &:hover
      background: var(--surface-medium)
      color: var(--fg)
  
  .dialog-body
    padding: 2rem
    flex: 1
    overflow-y: auto
    max-height: calc(95vh - 10rem)
    
    // Remove padding if no header
    .dialog:not(:has(.dialog-header)) &
      padding-top: 2rem
</style>
