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
  
  const dayTypeLabels = {
    regular: 'Regular Work Day',
    holiday: 'Holiday',
    paid_leave: 'Paid Leave',
    unpaid_leave: 'Unpaid Leave'
  }
  
  const dayTypeDescriptions = {
    regular: 'Enter entry and exit times for hourly calculation',
    holiday: 'Automatically credited 8 hours',
    paid_leave: 'Automatically credited 8 hours',
    unpaid_leave: 'No hours credited, no pay'
  }
  
  const getDayTypeLabel = (type) => dayTypeLabels[type] || type
  
  const createAttendanceData = () => ({
    type: selectedType,
    entryTime: selectedType === 'regular' ? entryTime : null,
    exitTime: selectedType === 'regular' ? exitTime : null
  })
  
  const recordAttendance = () => {
    if (!selectedEmployee || !selectedDate) {
      alert('Please select an employee and date');
      return;
    }
    
    const attendanceData = createAttendanceData();
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
  
  const deleteAttendance = (employeeId, date) => {
    if (confirm('Are you sure you want to delete this attendance record?')) {
      let currentAttendance = $attendance;
      if (currentAttendance[employeeId]?.[date]) {
        delete currentAttendance[employeeId][date];
        attendance.set(currentAttendance);
      }
    }
  }
  
  const getAttendanceForEmployee = (employeeId) => {
    const empAttendance = $attendance[employeeId] || {};
    const monthStr = `${$currentPeriod.year}-${$currentPeriod.month.toString().padStart(2, '0')}`;
    
    return Object.entries(empAttendance)
      .filter(([date]) => date.startsWith(monthStr))
      .reduce((acc, [date, data]) => ({ ...acc, [date]: data }), {});
  }
  
  const isRegularDay = $derived(selectedType === 'regular')
  const hasEmployees = $derived($employees.length > 0)
  
  const totalDaysRecorded = $derived(
    $employees.reduce((total, emp) => {
      const empAttendance = getAttendanceForEmployee(emp.id);
      return total + Object.keys(empAttendance).length;
    }, 0)
  )
  
  const getEmployeeStats = (employeeId) => {
    const empAttendance = getAttendanceForEmployee(employeeId);
    const days = Object.values(empAttendance);
    
    return {
      totalDays: days.length,
      regularDays: days.filter(d => d.type === 'regular').length,
      holidays: days.filter(d => d.type === 'holiday').length,
      paidLeave: days.filter(d => d.type === 'paid_leave').length,
      unpaidLeave: days.filter(d => d.type === 'unpaid_leave').length
    }
  }
</script>

<h2>Attendance Management</h2>
<p>Track employee attendance and work hours. Daily attendance records are used to calculate basic salary based on hours worked.</p>

<div class="stats-grid">
  <div class="stat-card">
    <Icon icon="solar:calendar-bold" width="2em" height="2em" />
    <div>
      <strong>{$currentPeriod.month}/{$currentPeriod.year}</strong>
      <span>Current Period</span>
    </div>
  </div>
  <div class="stat-card">
    <Icon icon="solar:document-bold" width="2em" height="2em" />
    <div>
      <strong>{totalDaysRecorded}</strong>
      <span>Total Days Recorded</span>
    </div>
  </div>
  <div class="stat-card">
    <Icon icon="solar:users-group-rounded-bold" width="2em" height="2em" />
    <div>
      <strong>{$employees.length}</strong>
      <span>Active Employees</span>
    </div>
  </div>
</div>

<section>
  <h3><Icon icon="solar:document-add-bold" width="1.2em" height="1.2em" /> Record Daily Attendance</h3>
      <p class="text-muted">Record attendance for each employee. Different day types affect salary calculations differently.</p>
  
  <form>
    <div class="form-group-horizontal">
      <div class="form-group-stacked">
        <label for="employee-select">
          <Icon icon="solar:user-bold" width="1em" height="1em" />
          Select Employee
        </label>
        <select id="employee-select" bind:value={selectedEmployee}>
          <option value="">Choose an employee...</option>
          {#each $employees as employee}
            <option value={employee.id}>{employee.name}</option>
          {/each}
        </select>
      </div>
      
      <div class="form-group-stacked">
        <label for="date-select">
          <Icon icon="solar:calendar-bold" width="1em" height="1em" />
          Date
        </label>
        <input 
          id="date-select"
          type="date"
          bind:value={selectedDate}
          required
        />
      </div>
      
      <div class="form-group-stacked">
        <label for="type-select">
          <Icon icon="solar:tag-bold" width="1em" height="1em" />
          Day Type
        </label>
        <select id="type-select" bind:value={selectedType}>
          {#each Object.entries(DAY_TYPES) as [key, value]}
            <option value={value}>{getDayTypeLabel(value)}</option>
          {/each}
        </select>
        <small class="text-muted">{dayTypeDescriptions[selectedType]}</small>
      </div>
    </div>
    
    {#if isRegularDay}
      <div class="form-group-horizontal">
        <div class="form-group-stacked">
          <label for="entry-time">
            <Icon icon="solar:clock-circle-bold" width="1em" height="1em" />
            Entry Time
          </label>
          <input 
            id="entry-time"
            type="time"
            bind:value={entryTime}
            required
          />
          <small class="text-muted">When employee started work</small>
        </div>
        
        <div class="form-group-stacked">
          <label for="exit-time">
            <Icon icon="solar:clock-circle-bold" width="1em" height="1em" />
            Exit Time
          </label>
          <input 
            id="exit-time"
            type="time"
            bind:value={exitTime}
            required
          />
          <small class="text-muted">When employee finished work</small>
        </div>
        
        <div class="form-group-stacked">
          <button onclick={recordAttendance}>
            <Icon icon="solar:floppy-disk-bold" width="1.2em" height="1.2em" /> Record Attendance
          </button>
        </div>
      </div>
    {:else}
      <div class="form-group-horizontal">
        <div class="form-group-stacked">
          <button onclick={recordAttendance}>
            <Icon icon="solar:floppy-disk-bold" width="1.2em" height="1.2em" /> Record Attendance
          </button>
        </div>
      </div>
    {/if}
  </form>
</section>

<section>
  <h3><Icon icon="solar:chart-bold" width="1.2em" height="1.2em" /> Monthly Attendance Records</h3>
      <p class="text-muted">Current month: {$currentPeriod.month}/{$currentPeriod.year}</p>
  
  {#if !hasEmployees}
    <div>
      <Icon icon="solar:users-group-rounded-bold" width="2.5em" height="2.5em" />
      <h4>No employees added yet</h4>
      <p>Add employees first to record attendance</p>
    </div>
  {:else}
    {#each $employees as employee}
      {@const empAttendance = getAttendanceForEmployee(employee.id)}
      {@const attendanceDates = Object.keys(empAttendance).sort()}
      {@const stats = getEmployeeStats(employee.id)}
      
      <section>
        <h4><Icon icon="solar:user-bold" width="1em" height="1em" /> {employee.name}</h4>
        <div class="employee-stats">
          <div class="stat-item">
            <Icon icon="solar:calendar-bold" width="1em" height="1em" />
            <span><strong>{stats.totalDays}</strong> days recorded</span>
          </div>
          <div class="stat-item">
            <Icon icon="solar:clock-circle-bold" width="1em" height="1em" />
            <span><strong>{stats.regularDays}</strong> regular days</span>
          </div>
          <div class="stat-item">
            <Icon icon="solar:star-bold" width="1em" height="1em" />
            <span><strong>{stats.holidays}</strong> holidays</span>
          </div>
          <div class="stat-item">
            <Icon icon="solar:heart-bold" width="1em" height="1em" />
            <span><strong>{stats.paidLeave}</strong> paid leave</span>
          </div>
          <div class="stat-item">
            <Icon icon="solar:close-circle-bold" width="1em" height="1em" />
            <span><strong>{stats.unpaidLeave}</strong> unpaid leave</span>
          </div>
        </div>
        
        {#if attendanceDates.length === 0}
          <div>
            <Icon icon="solar:calendar-bold" width="2em" height="2em" />
            <p>No attendance records for this month</p>
          </div>
        {:else}
          <table>
            <thead>
              <tr>
                <th><Icon icon="solar:calendar-bold" width="1em" height="1em" /> Date</th>
                <th><Icon icon="solar:tag-bold" width="1em" height="1em" /> Type</th>
                <th><Icon icon="solar:clock-circle-bold" width="1em" height="1em" /> Entry Time</th>
                <th><Icon icon="solar:clock-circle-bold" width="1em" height="1em" /> Exit Time</th>
                <th><Icon icon="solar:settings-bold" width="1em" height="1em" /> Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each attendanceDates as date}
                {@const record = empAttendance[date]}
                <tr>
                  <td>{new Date(date).toLocaleDateString()}</td>
                  <td>
                    <span class="day-type-badge" class:regular={record.type === 'regular'} class:holiday={record.type === 'holiday'} class:paid={record.type === 'paid_leave'} class:unpaid={record.type === 'unpaid_leave'}>
                      {getDayTypeLabel(record.type)}
                    </span>
                  </td>
                  <td>{record.entryTime || '-'}</td>
                  <td>{record.exitTime || '-'}</td>
                  <td>
                    <div class="button-group">
                      <button class="danger" onclick={() => deleteAttendance(employee.id, date)}>
                        <Icon icon="solar:trash-bin-trash-bold" width="1.1em" height="1.1em" /> Delete
                      </button>
                    </div>
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

<style>
  /* Using global .stats-grid class */
  
  .stat-card {
    background: color-mix(in oklab, var(--secondary) 12%, transparent);
    border-radius: 1.5rem;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 8px 32px color-mix(in oklab, var(--secondary) 20%, transparent);
  }
  
  .stat-card > div {
    display: flex;
    flex-direction: column;
  }
  
  .stat-card strong {
    font-size: 1.5rem;
    color: var(--primary);
  }
  
  .stat-card span {
    font-size: 0.875rem;
    color: var(--fg-muted);
  }
  
  .employee-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .stat-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--fg-muted);
  }
  
  .day-type-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 500;
    box-shadow: 0 2px 8px color-mix(in oklab, var(--bg-muted) 30%, transparent);
  }
  
  .day-type-badge.regular {
    background: var(--primary);
    color: white;
    box-shadow: 0 2px 8px color-mix(in oklab, var(--primary) 30%, transparent);
  }
  
  .day-type-badge.holiday {
    background: var(--warning);
    color: white;
    box-shadow: 0 2px 8px color-mix(in oklab, var(--warning) 30%, transparent);
  }
  
  .day-type-badge.paid {
    background: var(--success);
    color: white;
    box-shadow: 0 2px 8px color-mix(in oklab, var(--success) 30%, transparent);
  }
  
  .day-type-badge.unpaid {
    background: var(--error);
    color: white;
    box-shadow: 0 2px 8px color-mix(in oklab, var(--error) 30%, transparent);
  }
  
  small {
    font-size: 0.75rem;
    margin-top: 0.25rem;
  }
</style> 