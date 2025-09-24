<script>
  import { createEventDispatcher } from 'svelte'
  import { CONFIG_FIELDS } from '../payroll.js'
  
  let { config = {} } = $props()
  const dispatch = createEventDispatcher()
  
  const updateConfig = (field, value) => {
    dispatch('update', { [field]: value })
  }
</script>

<div class="config-grid">
  {#each CONFIG_FIELDS as field}
    <label class="field">
      <span>{field.label}</span>
      <input 
        {...field} 
        value={config[field.key] || ''}
        oninput={(e) => updateConfig(field.key, e.target.value)}
      />
    </label>
  {/each}
</div>

<style lang="sass">
  @use "../styles.sass" as *
  
  .config-grid
    @extend %grid
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))
    gap: 2rem
    
  .field
    @extend %grid
    gap: 0.5rem
    
    span
      font-weight: 600
      color: var(--fg)
      
    input
      @extend %input-base
</style>
