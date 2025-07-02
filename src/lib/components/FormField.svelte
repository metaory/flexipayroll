<script>
  export let label = '';
  export let type = 'text';
  export let value = '';
  export let placeholder = '';
  export let required = false;
  export let min = null;
  export let max = null;
  export let step = null;
  export let options = [];
  export let gridCols = 'grid-cols-1';
</script>

<label class="label {gridCols}">
  <span>{label}</span>
  {#if type === 'select'}
    <select 
      class="select" 
      bind:value 
      {required}
    >
      {#each options as option}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>
  {:else}
    <input 
      class="input"
      {type}
      bind:value
      {placeholder}
      {required}
      {min}
      {max}
      {step}
    />
  {/if}
</label> 