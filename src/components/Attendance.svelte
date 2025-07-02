<script>
  import { employees, attendance, currentPeriod } from '../lib/stores.js';
  import { DAY_TYPES, validateAttendance } from '../lib/core.js';
  import Icon from '@iconify/svelte';
  
  let selectedEmployee = $state('');
  let selectedDate = $state('');
  let selectedType = $state('regular');
  let entryTime = $state('');
  let exitTime = $state('');
  
  // Initialize with current date
  $effect(() => {
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

<div>
  <div class="xpayroll-card">
    <div class="xpayroll-card__header">
      <h2>Attendance Management</h2>
      <p>Track employee attendance and work hours</p>
    </div>
  </div>
  
  <div class="xpayroll-card" style="margin-top: 1rem;">
    <div class="xpayroll-card__header">
      <h3><Icon icon="solar:document-add-bold" width="1.2em" height="1.2em" /> Record Attendance</h3>
    </div>
    <div class="xpayroll-card__body">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div class="xpayroll-form__group">
          <label class="xpayroll-form__label"><Icon icon="solar:user-bold" width="1em" height="1em" /> Employee</label>
          <select class="xpayroll-form__select" bind:value={selectedEmployee}>
            <option value="">Select Employee</option>
            {#each $employees as employee}
              <option value={employee.id}>{employee.name}</option>
            {/each}
          </select>
        </div>
        
        <div class="xpayroll-form__group">
          <label class="xpayroll-form__label"><Icon icon="solar:calendar-bold" width="1em" height="1em" /> Date</label>
          <input 
            class="xpayroll-form__input"
            type="date"
            bind:value={selectedDate}
            required
          />
        </div>
        
        <div class="xpayroll-form__group">
          <label class="xpayroll-form__label"><Icon icon="solar:tag-bold" width="1em" height="1em" /> Day Type</label>
          <select class="xpayroll-form__select" bind:value={selectedType}>
            {#each Object.entries(DAY_TYPES) as [key, value]}
              <option value={value}>{getDayTypeLabel(value)}</option>
            {/each}
          </select>
        </div>
        
        {#if selectedType === 'regular'}
          <div class="xpayroll-form__group">
            <label class="xpayroll-form__label"><Icon icon="solar:clock-circle-bold" width="1em" height="1em" /> Entry Time</label>
            <input 
              class="xpayroll-form__input"
              type="time"
              bind:value={entryTime}
              required
            />
          </div>
          
          <div class="xpayroll-form__group">
            <label class="xpayroll-form__label"><Icon icon="solar:clock-circle-bold" width="1em" height="1em" /> Exit Time</label>
            <input 
              class="xpayroll-form__input"
              type="time"
              bind:value={exitTime}
              required
            />
          </div>
        {/if}
      </div>
      
      <div style="margin-top: 1.5rem;">
        <button class="xpayroll-btn xpayroll-btn--primary" onclick={recordAttendance}>
          <Icon icon="solar:floppy-disk-bold" width="1.2em" height="1.2em" /> Record Attendance
        </button>
      </div>
    </div>
  </div>
  
  <div class="xpayroll-card" style="margin-top: 1rem;">
    <div class="xpayroll-card__header">
      <h3><Icon icon="solar:chart-bold" width="1.2em" height="1.2em" /> Attendance Records</h3>
      <p>Current month: {$currentPeriod.month}/{$currentPeriod.year}</p>
    </div>
    <div class="xpayroll-card__body">
      {#if $employees.length === 0}
        <div class="xpayroll-empty-state">
          <Icon icon="solar:users-group-rounded-bold" width="2.5em" height="2.5em" />
          <h4>No employees added yet</h4>
          <p>Add employees first to record attendance</p>
        </div>
      {:else}
        <div>
          {#each $employees as employee}
            {@const empAttendance = getAttendanceForEmployee(employee.id)}
            {@const attendanceDates = Object.keys(empAttendance).sort()}
            
            <div class="xpayroll-card" style="margin-bottom: 1rem;">
              <div class="xpayroll-card__header">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <h4>{employee.name}</h4>
                    <p>
                      {attendanceDates.length} days recorded this month
                    </p>
                  </div>
                  <div style="text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: color('primary', 'xpayroll');">{attendanceDates.length}</div>
                    <div style="font-size: 0.875rem; color: color('text-muted', 'xpayroll');">Days</div>
                  </div>
                </div>
              </div>
              <div class="xpayroll-card__body">
                {#if attendanceDates.length === 0}
                  <div class="xpayroll-empty-state">
                    <Icon icon="solar:calendar-bold" width="2em" height="2em" />
                    <p>No attendance records for this month</p>
                  </div>
                {:else}
                  <div style="overflow-x: auto;">
                    <table class="xpayroll-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Entry Time</th>
                          <th>Exit Time</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {#each attendanceDates as date, index}
                          {@const record = empAttendance[date]}
                          <tr>
                            <td>{new Date(date).toLocaleDateString()}</td>
                            <td>
                              <span style="text-transform: capitalize;">
                                {getDayTypeLabel(record.type)}
                              </span>
                            </td>
                            <td>{record.entryTime || '-'}</td>
                            <td>{record.exitTime || '-'}</td>
                            <td>
                              <div style="display: flex; gap: 0.5rem;">
                                <button class="xpayroll-btn xpayroll-btn--danger" onclick={() => deleteAttendance(employee.id, date)}>
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
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div> 