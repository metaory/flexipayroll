<script>
  export let headers = [];
  export let rows = [];
  export let emptyMessage = 'No data available';
  export let showActions = true;
  
  // Slot for custom row actions
  let actionSlot;
</script>

<div class="table-wrap">
  {#if rows.length === 0}
    <div class="text-center py-8">
      <p class="text-surface-600-400-token">{emptyMessage}</p>
    </div>
  {:else}
    <table class="table">
      <thead>
        <tr>
          {#each headers as header}
            <th>{header}</th>
          {/each}
          {#if showActions}
            <th>Actions</th>
          {/if}
        </tr>
      </thead>
      <tbody>
        {#each rows as row, index}
          <tr class="hover:bg-surface-100-800-token transition-colors duration-200">
            {#each row as cell}
              <td>{cell}</td>
            {/each}
            {#if showActions && actionSlot}
              <td>
                <svelte:fragment this={actionSlot} {row} {index} />
              </td>
            {/if}
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .table-wrap {
    overflow-x: auto;
  }
</style> 