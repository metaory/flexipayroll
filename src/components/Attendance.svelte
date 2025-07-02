<script>
  import { employees, attendance, currentPeriod } from '../lib/stores.js';
  import { DAY_TYPES, validateAttendance } from '../lib/core.js';
  import Icon from '@iconify/svelte';
  
  let selectedEmployee = '';
  let selectedDate = '';
  let selectedType = 'regular';
  let entryTime = '';
  let exitTime = '';
  
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

<div class="attendance-container">
  <!-- Header Section -->
  <div>
    <h2 class="section-title">Attendance Management</h2>
    <p class="section-desc">Track employee attendance and work hours</p>
  </div>
  
  <!-- Record Attendance Form -->
  <div class="form-card">
    <header class="form-header">
      <h3 class="form-title"><Icon icon="solar:document-add-bold" width="1.2em" height="1.2em" /> Record Attendance</h3>
    </header>
    <section class="form-body">
      <div class="form-grid">
        <label class="form-label">
          <span class="label-text"><Icon icon="solar:user-bold" width="1em" height="1em" /> Employee</span>
          <select class="form-select" bind:value={selectedEmployee}>
            <option value="">Select Employee</option>
            {#each $employees as employee}
              <option value={employee.id}>{employee.name}</option>
            {/each}
          </select>
        </label>
        
        <label class="form-label">
          <span class="label-text"><Icon icon="solar:calendar-bold" width="1em" height="1em" /> Date</span>
          <input 
            class="form-input"
            type="date"
            bind:value={selectedDate}
            required
          />
        </label>
        
        <label class="form-label">
          <span class="label-text"><Icon icon="solar:tag-bold" width="1em" height="1em" /> Day Type</span>
          <select class="form-select" bind:value={selectedType}>
            {#each Object.entries(DAY_TYPES) as [key, value]}
              <option value={value}>{getDayTypeLabel(value)}</option>
            {/each}
          </select>
        </label>
        
        {#if selectedType === 'regular'}
          <label class="form-label">
            <span class="label-text"><Icon icon="solar:clock-circle-bold" width="1em" height="1em" /> Entry Time</span>
            <input 
              class="form-input"
              type="time"
              bind:value={entryTime}
              required
            />
          </label>
          
          <label class="form-label">
            <span class="label-text"><Icon icon="solar:clock-circle-bold" width="1em" height="1em" /> Exit Time</span>
            <input 
              class="form-input"
              type="time"
              bind:value={exitTime}
              required
            />
          </label>
        {/if}
      </div>
      
      <div class="form-actions">
        <button class="btn btn-success" onclick={recordAttendance}>
          <span class="btn-icon"><Icon icon="solar:floppy-disk-bold" width="1.2em" height="1.2em" /></span> Record Attendance
        </button>
      </div>
    </section>
  </div>
  
  <!-- Attendance Records -->
  <div class="list-card">
    <header class="list-header">
      <h3 class="list-title"><Icon icon="solar:chart-bold" width="1.2em" height="1.2em" /> Attendance Records</h3>
      <p class="list-desc">Current month: {$currentPeriod.month}/{$currentPeriod.year}</p>
    </header>
    <section class="list-body">
      {#if $employees.length === 0}
        <div class="empty-state">
          <div class="empty-icon"><Icon icon="solar:users-group-rounded-bold" width="2.5em" height="2.5em" /></div>
          <h4 class="empty-title">No employees added yet</h4>
          <p class="empty-desc">Add employees first to record attendance</p>
        </div>
      {:else}
        <div class="employee-attendance-list">
          {#each $employees as employee}
            {@const empAttendance = getAttendanceForEmployee(employee.id)}
            {@const attendanceDates = Object.keys(empAttendance).sort()}
            
            <div class="employee-card">
              <header class="employee-header">
                <div>
                  <h4 class="employee-name">{employee.name}</h4>
                  <p class="employee-stats">
                    {attendanceDates.length} days recorded this month
                  </p>
                </div>
                <div class="employee-summary">
                  <div class="summary-number">{attendanceDates.length}</div>
                  <div class="summary-label">Days</div>
                </div>
              </header>
              <section class="employee-body">
                {#if attendanceDates.length === 0}
                  <div class="empty-attendance">
                    <div class="empty-icon-small"><Icon icon="solar:calendar-bold" width="2em" height="2em" /></div>
                    <p>No attendance records for this month</p>
                  </div>
                {:else}
                  <div class="table-container">
                    <table class="data-table">
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
                          <tr class={index % 2 === 0 ? 'row-even' : 'row-odd'}>
                            <td class="date-cell">{new Date(date).toLocaleDateString()}</td>
                            <td>
                              <span class="badge badge-{getDayTypeColor(record.type)}">
                                {getDayTypeLabel(record.type)}
                              </span>
                            </td>
                            <td class="time-cell">{record.entryTime || '-'}</td>
                            <td class="time-cell">{record.exitTime || '-'}</td>
                            <td>
                              <div class="action-buttons">
                                <button 
                                  class="btn btn-sm btn-danger"
                                  onclick={() => deleteAttendance(employee.id, date)}
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

<style>
.attendance-container {
  padding: 1rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0 0 0.5rem 0;
  color: #1976d2;
}

.section-desc {
  color: #666;
  margin: 0 0 2rem 0;
}

.form-card, .list-card {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  overflow: hidden;
}

.form-header, .list-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
}

.form-title, .list-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: #1976d2;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.list-desc {
  color: #666;
  margin: 0.5rem 0 0 0;
}

.form-body, .list-body {
  padding: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label-text {
  font-weight: 500;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-input, .form-select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}

.form-actions {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-success {
  background: #2e7d32;
  color: white;
}

.btn-success:hover {
  background: #1b5e20;
}

.btn-danger {
  background: #d32f2f;
  color: white;
}

.btn-danger:hover {
  background: #c62828;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.btn-icon {
  display: flex;
  align-items: center;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
}

.empty-icon {
  font-size: 4rem;
  color: #ccc;
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1.25rem;
  color: #666;
  margin: 0 0 0.5rem 0;
}

.empty-desc {
  color: #999;
  margin: 0;
}

.employee-attendance-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.employee-card {
  background: #fafafa;
  border: 1px solid #e0e0e0;
  border-radius: 0.5rem;
  overflow: hidden;
}

.employee-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.employee-name {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: #1976d2;
}

.employee-stats {
  color: #666;
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
}

.employee-summary {
  text-align: right;
}

.summary-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: #2e7d32;
}

.summary-label {
  font-size: 0.75rem;
  color: #666;
}

.employee-body {
  padding: 1.5rem;
}

.empty-attendance {
  text-align: center;
  padding: 2rem 1rem;
}

.empty-icon-small {
  font-size: 2rem;
  color: #ccc;
  margin-bottom: 0.5rem;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background: #f5f5f5;
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #e0e0e0;
}

.data-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #f0f0f0;
}

.row-even {
  background: #fafafa;
}

.row-odd {
  background: white;
}

.data-table tr:hover {
  background: #f0f0f0;
}

.date-cell {
  font-weight: 500;
}

.time-cell {
  font-family: monospace;
}

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-success {
  background: #e8f5e8;
  color: #2e7d32;
}

.badge-warning {
  background: #fff3e0;
  color: #f57c00;
}

.badge-primary {
  background: #e3f2fd;
  color: #1976d2;
}

.badge-error {
  background: #ffebee;
  color: #d32f2f;
}

.action-buttons {
  display: flex;
  justify-content: center;
}
</style> 