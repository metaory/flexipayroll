<!--
  Universal Wizard Component
  Clean, functional, dynamic step navigation
-->
<script>
  import Icon from '@iconify/svelte'
  import { ICONS } from '../lib/icons.js'
  
  let { 
    steps = [],
    currentStep = $bindable(0),
    canGoNext = true,
    canGoPrev = true,
    onNext = () => {},
    onPrev = () => {},
    onComplete = () => {},
    title = 'Wizard',
    description = '',
    showProgress = true,
    showNavigation = true,
    children
  } = $props()
  
  const isFirstStep = $derived(currentStep === 0)
  const isLastStep = $derived(currentStep === steps.length - 1)
  const currentStepData = $derived(steps[currentStep])
  const progressPercent = $derived(((currentStep + 1) / steps.length) * 100)
  
  const handleNext = () => {
    if (isLastStep) {
      onComplete()
    } else if (canGoNext) {
      currentStep++
      onNext(currentStep)
    }
  }
  
  const handlePrev = () => {
    if (!isFirstStep && canGoPrev) {
      currentStep--
      onPrev(currentStep)
    }
  }
  
  const goToStep = (stepIndex) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      currentStep = stepIndex
    }
  }
</script>

<!-- Wizard Container -->
<div class="wizard">
  
  <!-- Header -->
  {#if title || description}
    <header class="wizard-header">
      <div class="wizard-title">
        <Icon icon={currentStepData?.icon || ICONS.settings} width="2.5rem" height="2.5rem" />
        <div>
          <h1>{title}</h1>
          {#if description}<p>{description}</p>{/if}
        </div>
      </div>
      
      {#if showProgress}
        <div class="wizard-progress">
          <div class="progress-bar">
            <div class="progress-fill" style:width="{progressPercent}%"></div>
          </div>
          <span>Step {currentStep + 1} of {steps.length}</span>
        </div>
      {/if}
    </header>
  {/if}
  
  <!-- Navigation -->
  {#if showNavigation && steps.length > 1}
    <nav class="wizard-nav">
      {#each steps as step, index}
        <button 
          class="step-button"
          class:active={index === currentStep}
          class:completed={index < currentStep}
          onclick={() => goToStep(index)}
          disabled={index > currentStep}
        >
          <div class="step-icon">
            {#if index < currentStep}
              <Icon icon={ICONS.check} width="1.25rem" height="1.25rem" />
            {:else}
              <Icon icon={step.icon} width="1.25rem" height="1.25rem" />
            {/if}
          </div>
          <div class="step-info">
            <span class="step-title">{step.title}</span>
            <span class="step-description">{step.description}</span>
          </div>
        </button>
      {/each}
    </nav>
  {/if}
  
  <!-- Content -->
  <main class="wizard-content">
    <div class="step-container">
      {#if currentStepData}
        <header class="step-header">
          <Icon icon={currentStepData.icon} width="3rem" height="3rem" />
          <div>
            <h2>{currentStepData.title}</h2>
            <p>{currentStepData.description}</p>
          </div>
        </header>
      {/if}
      
      <div class="step-body">
        {@render children?.(currentStep, currentStepData)}
      </div>
    </div>
  </main>
  
  <!-- Controls -->
  <footer class="wizard-controls">
    <button 
      class="secondary" 
      onclick={handlePrev}
      disabled={isFirstStep || !canGoPrev}
    >
      <Icon icon={ICONS.arrowLeft} width="1rem" height="1rem" />
      Previous
    </button>
    
    <button 
      onclick={handleNext}
      disabled={!canGoNext}
    >
      {#if isLastStep}
        <Icon icon={ICONS.check} width="1rem" height="1rem" />
        Complete
      {:else}
        Next
        <Icon icon={ICONS.arrowRight} width="1rem" height="1rem" />
      {/if}
    </button>
  </footer>
</div>

<style>
  .wizard {
    display: grid;
    gap: 2rem;
    grid-template-rows: auto auto 1fr auto;
    min-height: 60vh;
  }
  
  .wizard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 2rem;
    padding: 2rem;
    background: color-mix(in oklab, var(--primary) 6%, transparent);
    border-radius: 1.5rem;
    border: 1px solid color-mix(in oklab, var(--primary) 8%, transparent);
  }
  
  .wizard-title {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .wizard-title h1 {
    margin: 0;
    color: var(--primary);
  }
  
  .wizard-title p {
    margin: 0;
    color: var(--fg-muted);
  }
  
  .wizard-progress {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
    min-width: 200px;
  }
  
  .progress-bar {
    width: 100%;
    height: 8px;
    background: color-mix(in oklab, var(--bg-muted) 40%, transparent);
    border-radius: 4px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: var(--primary);
    transition: width 0.3s ease;
    border-radius: 4px;
  }
  
  .wizard-nav {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }
  
  .step-button {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background: color-mix(in oklab, var(--secondary) 12%, transparent);
    border: 1px solid color-mix(in oklab, var(--primary) 8%, transparent);
    border-radius: 1rem;
    transition: all 0.2s ease;
    text-align: left;
  }
  
  .step-button:hover:not(:disabled) {
    background: color-mix(in oklab, var(--secondary) 20%, transparent);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px color-mix(in oklab, var(--secondary) 35%, transparent);
  }
  
  .step-button.active {
    background: color-mix(in oklab, var(--primary) 25%, transparent);
    border-color: var(--primary);
  }
  
  .step-button.completed {
    background: color-mix(in oklab, var(--success) 15%, transparent);
    border-color: var(--success);
  }
  
  .step-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .step-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    background: color-mix(in oklab, var(--primary) 20%, transparent);
    flex-shrink: 0;
  }
  
  .step-button.completed .step-icon {
    background: var(--success);
    color: white;
  }
  
  .step-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .step-title {
    font-weight: 600;
    color: var(--fg);
  }
  
  .step-description {
    font-size: 0.875rem;
    color: var(--fg-muted);
  }
  
  .wizard-content {
    background: color-mix(in oklab, var(--primary) 6%, transparent);
    border-radius: 1.5rem;
    border: 1px solid color-mix(in oklab, var(--primary) 8%, transparent);
    overflow: hidden;
  }
  
  .step-container {
    padding: 2rem;
  }
  
  .step-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid color-mix(in oklab, var(--primary) 15%, transparent);
  }
  
  .step-header h2 {
    margin: 0;
    color: var(--primary);
  }
  
  .step-header p {
    margin: 0;
    color: var(--fg-muted);
  }
  
  .step-body {
    min-height: 200px;
  }
  
  .wizard-controls {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.5rem;
    background: color-mix(in oklab, var(--bg-muted) 20%, transparent);
    border-radius: 1rem;
    border: 1px solid color-mix(in oklab, var(--primary) 8%, transparent);
  }
  
  .wizard-controls button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 0.75rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  
  @media (max-width: 768px) {
    .wizard-header {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }
    
    .wizard-progress {
      align-items: stretch;
    }
    
    .wizard-nav {
      grid-template-columns: 1fr;
    }
    
    .step-container {
      padding: 1.5rem;
    }
    
    .wizard-controls {
      padding: 1rem;
    }
  }
</style>