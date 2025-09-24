<script>
  import { createEventDispatcher } from 'svelte';
  import Icon from '@iconify/svelte';
  import { ICONS } from '../lib/icons.js';

  const { show = false, title = '', message = '', type = 'info', confirmText = 'Confirm', cancelText = 'Cancel', showCancel = true } = $props(); // 'info', 'warning', 'error', 'success'

  const dispatch = createEventDispatcher();

  const confirm = () => {
    dispatch('confirm');
  };

  const cancel = () => {
    dispatch('cancel');
  };

  const getIcon = () => {
    const icons = {
      success: ICONS.success,
      error: ICONS.error,
      warning: ICONS.warning,
      info: ICONS.info
    };
    return icons[type] || ICONS.info;
  };
</script>

{#if show}
  <div class="modal-overlay" class:show>
    <div class="modal-content">
      <div class="modal-header">
        <div class="modal-title">
          <Icon icon={getIcon()} width="1.5em" height="1.5em" />
          <h3>{title}</h3>
        </div>
        <button class="close-btn" onclick={cancel}>
          <Icon icon={ICONS.close} width="1.2em" height="1.2em" />
        </button>
      </div>
      
      <div class="modal-body">
        <p>{message}</p>
      </div>

      <div class="modal-actions">
        {#if showCancel}
          <button class="secondary" onclick={cancel}>
            {cancelText}
          </button>
        {/if}
        <button class="primary" onclick={confirm}>
          {confirmText}
        </button>
      </div>
    </div>
  </div>
{/if}

<style lang="sass">
  .modal-overlay
    position: fixed
    top: 0
    left: 0
    right: 0
    bottom: 0
    background: color-mix(in oklab, var(--bg) 80%, transparent)
    backdrop-filter: blur(8px)
    z-index: 1500
    display: flex
    align-items: center
    justify-content: center
    padding: 1rem
    opacity: 0
    visibility: hidden
    transition: all 0.2s ease

    &.show
      opacity: 1
      visibility: visible

  .modal-content
    background: color-mix(in oklab, var(--primary) 8%, transparent)
    backdrop-filter: blur(10px)
    border-radius: 1.5rem
    padding: 2rem
    max-width: 500px
    width: 100%
    max-height: 80vh
    overflow-y: auto
    transform: scale(0.9) translateY(20px)
    transition: all 0.2s ease
    box-shadow: 0 8px 32px color-mix(in oklab, var(--primary) 15%, transparent)

    .show &
      transform: scale(1) translateY(0)

    @media (max-width: 768px)
      padding: 1.5rem
      border-radius: 1rem

  .modal-header
    display: flex
    align-items: center
    justify-content: space-between
    margin-bottom: 1.5rem
    padding-bottom: 1rem
    border-bottom: 1px solid color-mix(in oklab, var(--border-muted) 50%, transparent)

  .modal-title
    display: flex
    align-items: center
    gap: 0.75rem

    h3
      margin: 0
      font-family: 'Bungee', monospace
      line-height: 1.2
      font-weight: 600
      font-size: 1.25rem

      @media (max-width: 768px)
        font-size: 1.1rem

  .close-btn
    width: 2rem
    height: 2rem
    padding: 0
    border-radius: 50%
    background: color-mix(in oklab, var(--bg-muted) 40%, transparent)
    color: var(--fg-muted)
    cursor: pointer
    transition: all 0.2s ease
    display: flex
    align-items: center
    justify-content: center
    border: none
    font: inherit

    &:hover
      background: color-mix(in oklab, var(--bg-muted) 60%, transparent)
      color: var(--fg)

  .modal-body
    p
      margin: 0
      line-height: 1.6
      color: var(--fg)

  .modal-actions
    display: flex
    align-items: center
    flex-wrap: wrap
    justify-content: flex-end
    gap: 0.75rem
    margin-top: 2rem
</style> 