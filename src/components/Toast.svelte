<script>
  import { createEventDispatcher } from 'svelte';
  import Icon from '@iconify/svelte';
  import { ICONS } from '../lib/icons.js';

  const { type = 'info', message = '', duration = 5000 } = $props(); // 'success', 'error', 'warning', 'info'

  const dispatch = createEventDispatcher();
  let show = $state(true);
  let timeoutId;

  $effect(() => {
    timeoutId = setTimeout(() => {
      show = false;
      dispatch('close');
    }, duration);
  });

  const close = () => {
    show = false;
    clearTimeout(timeoutId);
    dispatch('close');
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
  <div class="toast {type}" class:show>
    <Icon icon={getIcon()} width="1.2em" height="1.2em" />
    <span>{message}</span>
    <button class="close-btn" onclick={close}>
      <Icon icon={ICONS.close} width="1em" height="1em" />
    </button>
  </div>
{/if}

<style lang="sass">
  .toast
    position: fixed
    top: 1rem
    right: 1rem
    z-index: 2000
    padding: 1rem 1.5rem
    border-radius: 1rem
    backdrop-filter: blur(10px)
    transition: all 0.2s ease
    max-width: 400px
    box-shadow: 0 8px 32px color-mix(in oklab, var(--primary) 20%, transparent)
    display: flex
    align-items: center
    gap: 0.75rem
    font-weight: 500
    transform: translateX(100%)
    opacity: 0

    &.show
      transform: translateX(0)
      opacity: 1

    @media (max-width: 768px)
      right: 0.5rem
      left: 0.5rem
      max-width: none
      transform: translateY(-100%)
      top: 0.5rem

      &.show
        transform: translateY(0)

    &.success
      background: color-mix(in oklab, var(--success) 20%, transparent)
      color: var(--success)
      border-left: 4px solid var(--success)

    &.error
      background: color-mix(in oklab, var(--error) 20%, transparent)
      color: var(--error)
      border-left: 4px solid var(--error)

    &.warning
      background: color-mix(in oklab, var(--warning) 20%, transparent)
      color: var(--warning)
      border-left: 4px solid var(--warning)

    &.info
      background: color-mix(in oklab, var(--secondary) 20%, transparent)
      color: var(--secondary)
      border-left: 4px solid var(--secondary)

  .close-btn
    margin-left: auto
    width: 1.5rem
    height: 1.5rem
    padding: 0
    border-radius: 50%
    background: color-mix(in oklab, var(--bg-muted) 40%, transparent)
    color: var(--fg-muted)
    opacity: 0.7
    cursor: pointer
    transition: all 0.2s ease
    display: flex
    align-items: center
    justify-content: center
    border: none
    font: inherit

    &:hover
      opacity: 1
      background: color-mix(in oklab, var(--bg-muted) 60%, transparent)
</style> 