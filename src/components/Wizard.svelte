<script>
  import Icon from '@iconify/svelte'
  import { STEPS } from '../payroll.js'

  let { currentStep = 0, onNext, onPrev } = $props()

  const currentStepData = $derived(STEPS[currentStep])
</script>

<header class="wizard-header">
  <div class="step-info">
    <Icon icon={currentStepData.icon} width="3rem" height="3rem" style="width: 3rem; height: 3rem" />
    <div>
      <h1>{currentStepData.title}</h1>
      <p>{currentStepData.formula || `Step ${currentStep + 1} of ${STEPS.length}`}</p>
    </div>
  </div>

  <div class="header-right">
    <div class="progress">
      <span>{currentStep + 1}/{STEPS.length}</span>
      <div class="progress-bar">
        <div class="fill" style="width: {((currentStep + 1) / STEPS.length) * 100}%"></div>
      </div>
    </div>
    <div class="wizard-nav">
      <button type="button" class="secondary" onclick={onPrev} disabled={currentStep === 0}>
        <Icon icon="mingcute:arrow-left-fill" width="1.25rem" height="1.25rem" />
        Previous
      </button>
      <button type="button" class="primary" onclick={onNext} disabled={currentStep >= STEPS.length - 1}>
        Next
        <Icon icon="mingcute:arrow-right-fill" width="1.25rem" height="1.25rem" />
      </button>
    </div>
  </div>
</header>

<section class="wizard-content">
  <slot />
</section>

<style lang="sass">
  @use "../styles.sass" as *

  .wizard-header
    position: absolute
    top: 0
    left: 0
    right: 0
    z-index: 10
    display: grid
    grid-template-columns: 1fr auto
    align-items: center
    gap: 2rem
    padding: 2rem
    background: transparent
    backdrop-filter: blur(4px)

  .step-info
    display: grid
    grid-template-columns: auto 1fr
    align-items: center
    gap: 1rem

    > :global(svg)
      color: var(--primary)

    h1
      margin: 0
      font-size: 1.5rem
      @extend %gradient-text

    p
      margin: 0
      color: var(--fg-muted)

  .header-right
    display: grid
    grid-template-columns: auto auto
    align-items: center
    gap: 2rem

  .progress
    margin-top: 2rem;
    display: grid
    grid-template-columns: auto 1fr
    align-items: center
    gap: 1rem

    span
      font-weight: 600
      min-width: 3rem
      text-align: right

  .progress-bar
    width: 200px
    height: 0.5rem
    background: var(--surface)
    border-radius: var(--radius)
    overflow: hidden

    .fill
      height: 100%
      background: var(--primary)
      transition: width 0.3s ease

  .wizard-nav
    display: grid
    grid-template-columns: auto auto
    gap: 1rem

    button
      @extend %button-base

      &.primary
        @extend %button-primary

      &.secondary
        @extend %button-secondary

  .wizard-content
    position: absolute
    top: 0
    left: 0
    right: 0
    bottom: 0
    padding: 2rem
    padding-top: calc(2rem + 5rem)
    overflow-y: auto
    overflow-x: hidden
    height: 100%
    box-sizing: border-box
</style>
