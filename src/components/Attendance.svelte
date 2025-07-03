<script>
  import { employees, attendance, currentPeriod } from '../lib/stores.js';
  import { DAY_TYPES, validateAttendance } from '../lib/core.js';
  import Icon from '@iconify/svelte';
  
  let selectedEmployee = $state('');
  let selectedDate = $state('');
  let selectedType = $state('regular');
  let entryTime = $state('');
  let exitTime = $state('');
  
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
    
    let currentAttendance = $attendance;
    if (!currentAttendance[selectedEmployee]) {
      currentAttendance[selectedEmployee] = {};
    }
    
    currentAttendance[selectedEmployee][selectedDate] = attendanceData;
    attendance.set(currentAttendance);
    
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

<h2>Attendance Management</h2>
<p>Track employee attendance and work hours</p>

<section>
  <h3><Icon icon="solar:document-add-bold" width="1.2em" height="1.2em" /> Record Attendance</h3>
  
  <label for="employee-select"><Icon icon="solar:user-bold" width="1em" height="1em" /> Employee</label>
  <select id="employee-select" bind:value={selectedEmployee}>
    <option value="">Select Employee</option>
    {#each $employees as employee}
      <option value={employee.id}>{employee.name}</option>
    {/each}
  </select>
  
  <label for="date-select"><Icon icon="solar:calendar-bold" width="1em" height="1em" /> Date</label>
  <input 
    id="date-select"
    type="date"
    bind:value={selectedDate}
    required
  />
  
  <label for="type-select"><Icon icon="solar:tag-bold" width="1em" height="1em" /> Day Type</label>
  <select id="type-select" bind:value={selectedType}>
    {#each Object.entries(DAY_TYPES) as [key, value]}
      <option value={value}>{getDayTypeLabel(value)}</option>
    {/each}
  </select>
  
  {#if selectedType === 'regular'}
    <label for="entry-time"><Icon icon="solar:clock-circle-bold" width="1em" height="1em" /> Entry Time</label>
    <input 
      id="entry-time"
      type="time"
      bind:value={entryTime}
      required
    />
    
    <label for="exit-time"><Icon icon="solar:clock-circle-bold" width="1em" height="1em" /> Exit Time</label>
    <input 
      id="exit-time"
      type="time"
      bind:value={exitTime}
      required
    />
  {/if}
  
  <button onclick={recordAttendance}>
    <Icon icon="solar:floppy-disk-bold" width="1.2em" height="1.2em" /> Record Attendance
  </button>
</section>

<section>
  <h3><Icon icon="solar:chart-bold" width="1.2em" height="1.2em" /> Attendance Records</h3>
  <p>Current month: {$currentPeriod.month}/{$currentPeriod.year}</p>
  
  {#if $employees.length === 0}
    <div>
      <Icon icon="solar:users-group-rounded-bold" width="2.5em" height="2.5em" />
      <h4>No employees added yet</h4>
      <p>Add employees first to record attendance</p>
    </div>
  {:else}
    {#each $employees as employee}
      {@const empAttendance = getAttendanceForEmployee(employee.id)}
      {@const attendanceDates = Object.keys(empAttendance).sort()}
      
      <section>
        <h4>{employee.name}</h4>
        <p>{attendanceDates.length} days recorded this month</p>
        
        {#if attendanceDates.length === 0}
          <div>
            <Icon icon="solar:calendar-bold" width="2em" height="2em" />
            <p>No attendance records for this month</p>
          </div>
        {:else}
          <table>
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
                  <td>{getDayTypeLabel(record.type)}</td>
                  <td>{record.entryTime || '-'}</td>
                  <td>{record.exitTime || '-'}</td>
                  <td>
                    <button onclick={() => deleteAttendance(employee.id, date)}>
                      <Icon icon="solar:trash-bin-trash-bold" width="1.1em" height="1.1em" /> Delete
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </section>
    {/each}
  {/if}
</section> 