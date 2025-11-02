<script>
  import Icon from '@iconify/svelte'
  import { createEventDispatcher } from 'svelte'
  import { STEPS } from '../payroll.js'

  let { currentStep = 0 } = $props()
  const dispatch = createEventDispatcher()

  const currentStepData = $derived(STEPS[currentStep])

  const handleNext = (event) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    dispatch('next')
  }
  
  const handlePrev = (event) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    dispatch('prev')
  }
</script>

<header class="wizard-header">
  <div class="step-info">
    <Icon icon={currentStepData.icon} width="2.5rem" height="2.5rem" />
    <div>
      <h1>{currentStepData.title}</h1>
      <p>{currentStepData.formula || `Step ${currentStep + 1} of ${STEPS.length}`}</p>
    </div>
  </div>

  <div class="progress">
    <span>{currentStep + 1}/{STEPS.length}</span>
    <div class="progress-bar">
      <div class="fill" style="width: {((currentStep + 1) / STEPS.length) * 100}%"></div>
    </div>
  </div>
</header>

<section class="wizard-content">
  <slot />
</section>

<footer class="wizard-footer">
  <button type="button" class="secondary" onclick={handlePrev} disabled={currentStep === 0}>
    <Icon icon="solar:arrow-left-linear" width="1rem" height="1rem" />
    Previous
  </button>

  <button type="button" class="primary" onclick={handleNext} disabled={currentStep >= STEPS.length - 1}>
    Next
    <Icon icon="solar:arrow-right-linear" width="1rem" height="1rem" />
  </button>
</footer>

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
    @extend %glass
    background: transparent

  .step-info
    display: grid
    grid-template-columns: auto 1fr
    align-items: center
    gap: 1rem

    h1
      margin: 0
      font-size: 1.5rem
      @extend %gradient-text

    p
      margin: 0
      color: var(--fg-muted)

  .progress
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

  .wizard-content
    position: absolute
    top: 0
    left: 0
    right: 0
    bottom: 0
    padding: 2rem
    padding-top: calc(2rem + 5rem)
    padding-bottom: calc(2rem + 5rem)
    overflow-y: auto
    overflow-x: hidden
    height: 100%
    box-sizing: border-box

  .wizard-footer
    position: absolute
    bottom: 0
    left: 0
    right: 0
    z-index: 10
    display: grid
    grid-template-columns: auto auto
    justify-content: space-between
    gap: 1rem
    padding: 1.5rem 2rem
    @extend %glass
    background: transparent

    button
      @extend %button-base

      &.primary
        @extend %button-primary
        justify-self: end

      &.secondary
        @extend %button-secondary
        justify-self: start
</style>
