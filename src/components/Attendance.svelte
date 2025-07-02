<script>
  import { employees, attendance, currentPeriod } from '../lib/stores.js';
  import { DAY_TYPES, validateAttendance } from '../lib/core.js';
  import Icon from '@iconify/svelte';
  import { effect } from 'svelte';
  
  let selectedEmployee = '';
  let selectedDate = '';
  let selectedType = 'regular';
  let entryTime = '';
  let exitTime = '';
  
  // Initialize with current date
  effect(() => {
    if (!selectedDate) {
      selectedDate = new Date().toISOString().split('T')[0];
    }
  });
  
  function recordAttendance() {
    if (!selectedEmployee || !selectedDate) {
      alert('Please select an employee and date');
      return;
    }
    
    const attendanceData = {
      type: selectedType,
      entryTime: selectedType === 'regular' ? entryTime : null,
      exitTime: selectedType === 'regular' ? exitTime : null
    };
    
    const validation = validateAttendance(attendanceData);
    if (!validation.isValid) {
      alert(`Validation errors:\n${validation.errors.join('\n')}`);
      return;
    }
    
    // Get current attendance data
    let currentAttendance = $attendance;
    if (!currentAttendance[selectedEmployee]) {
      currentAttendance[selectedEmployee] = {};
    }
    
    // Update attendance
    currentAttendance[selectedEmployee][selectedDate] = attendanceData;
    attendance.set(currentAttendance);
    
    // Reset form
    entryTime = '';
    exitTime = '';
    alert('Attendance recorded successfully!');
  }
  
  function deleteAttendance(employeeId, date) {
    if (confirm('Are you sure you want to delete this attendance record?')) {
      let currentAttendance = $attendance;
      if (currentAttendance[employeeId]?.[date]) {
        delete currentAttendance[employeeId][date];
        attendance.set(currentAttendance);
      }
    }
  }
  
  function getDayTypeLabel(type) {
    const labels = {
      regular: 'Regular Work Day',
      holiday: 'Holiday',
      paid_leave: 'Paid Leave',
      unpaid_leave: 'Unpaid Leave'
    };
    return labels[type] || type;
  }
  
  function getDayTypeColor(type) {
    const colors = {
      regular: 'success',
      holiday: 'warning',
      paid_leave: 'primary',
      unpaid_leave: 'error'
    };
    return colors[type] || 'surface';
  }
  
  function getAttendanceForEmployee(employeeId) {
    const empAttendance = $attendance[employeeId] || {};
    const monthStr = `${$currentPeriod.year}-${$currentPeriod.month.toString().padStart(2, '0')}`;
    const results = {};
    
    for (const [date, data] of Object.entries(empAttendance)) {
      if (date.startsWith(monthStr)) {
        results[date] = data;
      }
    }
    return results;
  }
</script>

<div class="space-y-6">
  <!-- Header Section -->
  <div>
    <h2 class="h2 text-primary-500">Attendance Management</h2>
    <p class="text-surface-600-400-token mt-1">Track employee attendance and work hours</p>
  </div>
  
  <!-- Record Attendance Form -->
  <div class="card p-6 bg-gradient-to-br from-success-50-900-token to-surface-50-900-token border border-success-200-700-token">
    <header class="card-header mb-6">
      <h3 class="h3 text-success-500"><Icon icon="solar:document-add-bold" width="1.2em" height="1.2em" /> Record Attendance</h3>
    </header>
    <section class="card-body">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <label class="label">
          <span class="text-surface-700-300-token font-medium"><Icon icon="solar:user-bold" width="1em" height="1em" /> Employee</span>
          <select class="select" bind:value={selectedEmployee}>
            <option value="">Select Employee</option>
            {#each $employees as employee}
              <option value={employee.id}>{employee.name}</option>
            {/each}
          </select>
        </label>
        
        <label class="label">
          <span class="text-surface-700-300-token font-medium"><Icon icon="solar:calendar-bold" width="1em" height="1em" /> Date</span>
          <input 
            class="input"
            type="date"
            bind:value={selectedDate}
            required
          />
        </label>
        
        <label class="label">
          <span class="text-surface-700-300-token font-medium"><Icon icon="solar:tag-bold" width="1em" height="1em" /> Day Type</span>
          <select class="select" bind:value={selectedType}>
            {#each Object.entries(DAY_TYPES) as [key, value]}
              <option value={value}>{getDayTypeLabel(value)}</option>
            {/each}
          </select>
        </label>
        
        {#if selectedType === 'regular'}
          <label class="label">
            <span class="text-surface-700-300-token font-medium"><Icon icon="solar:clock-circle-bold" width="1em" height="1em" /> Entry Time</span>
            <input 
              class="input"
              type="time"
              bind:value={entryTime}
              required
            />
          </label>
          
          <label class="label">
            <span class="text-surface-700-300-token font-medium"><Icon icon="solar:clock-circle-bold" width="1em" height="1em" /> Exit Time</span>
            <input 
              class="input"
              type="time"
              bind:value={exitTime}
              required
            />
          </label>
        {/if}
      </div>
      
      <div class="flex gap-3 mt-6">
        <button class="btn variant-filled-success" on:click={recordAttendance}>
          <span class="mr-2"><Icon icon="solar:floppy-disk-bold" width="1.2em" height="1.2em" /></span> Record Attendance
        </button>
      </div>
    </section>
  </div>
  
  <!-- Attendance Records -->
  <div class="card p-6">
    <header class="card-header mb-6">
      <h3 class="h3 text-primary-500"><Icon icon="solar:chart-bold" width="1.2em" height="1.2em" /> Attendance Records</h3>
      <p class="text-surface-600-400-token">Current month: {$currentPeriod.month}/{$currentPeriod.year}</p>
    </header>
    <section class="card-body">
      {#if $employees.length === 0}
        <div class="text-center py-8">
          <div class="text-6xl mb-4 text-surface-400-600-token"><Icon icon="solar:users-group-rounded-bold" width="2.5em" height="2.5em" /></div>
          <h4 class="h4 text-surface-600-400-token mb-2">No employees added yet</h4>
          <p class="text-surface-500-500-token">Add employees first to record attendance</p>
        </div>
      {:else}
        <div class="space-y-6">
          {#each $employees as employee}
            {@const empAttendance = getAttendanceForEmployee(employee.id)}
            {@const attendanceDates = Object.keys(empAttendance).sort()}
            
            <div class="card p-6 bg-surface-50-900-token border border-surface-200-700-token">
              <header class="card-header mb-4">
                <div class="flex justify-between items-center">
                  <div>
                    <h4 class="h4 text-primary-500">{employee.name}</h4>
                    <p class="text-sm text-surface-600-400-token">
                      {attendanceDates.length} days recorded this month
                    </p>
                  </div>
                  <div class="text-right">
                    <div class="text-2xl font-bold text-success-500">{attendanceDates.length}</div>
                    <div class="text-sm text-surface-600-400-token">Days</div>
                  </div>
                </div>
              </header>
              <section class="card-body">
                {#if attendanceDates.length === 0}
                  <div class="text-center py-6">
                    <div class="text-4xl mb-2 text-surface-400-600-token"><Icon icon="solar:calendar-bold" width="2em" height="2em" /></div>
                    <p class="text-surface-600-400-token">No attendance records for this month</p>
                  </div>
                {:else}
                  <div class="table-wrap">
                    <table class="table">
                      <thead>
                        <tr class="bg-surface-100-800-token">
                          <th class="text-left">Date</th>
                          <th class="text-left">Type</th>
                          <th class="text-left">Entry Time</th>
                          <th class="text-left">Exit Time</th>
                          <th class="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {#each attendanceDates as date, index}
                          {@const record = empAttendance[date]}
                          <tr class="hover:bg-surface-100-800-token transition-colors duration-200 {index % 2 === 0 ? 'bg-surface-50-900-token' : ''}">
                            <td class="font-medium">{new Date(date).toLocaleDateString()}</td>
                            <td>
                              <span class="badge variant-soft-{getDayTypeColor(record.type)}">
                                {getDayTypeLabel(record.type)}
                              </span>
                            </td>
                            <td class="font-mono">{record.entryTime || '-'}</td>
                            <td class="font-mono">{record.exitTime || '-'}</td>
                            <td>
                              <div class="flex justify-center">
                                <button 
                                  class="btn btn-sm variant-filled-error"
                                  on:click={() => deleteAttendance(employee.id, date)}
                                >
                                  <Icon icon="solar:trash-bin-trash-bold" width="1.1em" height="1.1em" /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        {/each}
                      </tbody>
                    </table>
                  </div>
                {/if}
              </section>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  </div>
</div> 