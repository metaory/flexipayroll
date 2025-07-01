<script>
  import { employees, attendance, currentPeriod } from '../lib/stores.js'
  import { validateAttendance, DAY_TYPES, calculateWorkingHours } from '../lib/core.js'
  
  let selectedEmployee = ''
  let selectedDate = new Date().toISOString().split('T')[0]
  let attendanceData = {
    type: 'regular',
    entryTime: '',
    exitTime: ''
  }
  
  $: selectedEmployeeData = $employees.find(emp => emp.id === selectedEmployee)
  $: monthAttendance = selectedEmployee ? getMonthAttendance(selectedEmployee, $currentPeriod.year, $currentPeriod.month) : {}
  
  function getMonthAttendance(employeeId, year, month) {
    const monthStr = `${year}-${month.toString().padStart(2, '0')}`
    const empAttendance = $attendance[employeeId] || {}
    const results = {}
    
    for (const [date, data] of Object.entries(empAttendance)) {
      if (date.startsWith(monthStr)) {
        results[date] = data
      }
    }
    return results
  }
  
  function saveAttendance() {
    if (!selectedEmployee) {
      alert('Please select an employee')
      return
    }
    
    const validation = validateAttendance(attendanceData)
    if (!validation.isValid) {
      alert('Validation errors:\n' + validation.errors.join('\n'))
      return
    }
    
    attendance.update(data => {
      if (!data[selectedEmployee]) {
        data[selectedEmployee] = {}
      }
      data[selectedEmployee][selectedDate] = { ...attendanceData }
      return data
    })
    
    // Reset form
    attendanceData = {
      type: 'regular',
      entryTime: '',
      exitTime: ''
    }
  }
  
  function deleteAttendance(date) {
    if (confirm('Are you sure you want to delete this attendance record?')) {
      attendance.update(data => {
        if (data[selectedEmployee] && data[selectedEmployee][date]) {
          delete data[selectedEmployee][date]
        }
        return data
      })
    }
  }
  
  function getDayTypeLabel(type) {
    return DAY_TYPES[type.toUpperCase()] || type
  }
  
  function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate()
  }
  
  function getDayName(dateStr) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  }
  
  function isToday(dateStr) {
    return dateStr === new Date().toISOString().split('T')[0]
  }
</script>

<div class="attendance-container">
  <div class="header">
    <h2>Attendance Management</h2>
  </div>

  <div class="controls">
    <div class="form-group">
      <label for="employee">Employee</label>
      <select id="employee" bind:value={selectedEmployee}>
        <option value="">Select Employee</option>
        {#each $employees as employee}
          <option value={employee.id}>{employee.name}</option>
        {/each}
      </select>
    </div>
    
    <div class="form-group">
      <label for="year">Year</label>
      <select id="year" bind:value={$currentPeriod.year}>
        {#each Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i) as year}
          <option value={year}>{year}</option>
        {/each}
      </select>
    </div>
    
    <div class="form-group">
      <label for="month">Month</label>
      <select id="month" bind:value={$currentPeriod.month}>
        {#each Array.from({length: 12}, (_, i) => i + 1) as month}
          <option value={month}>{new Date(2024, month - 1).toLocaleDateString('en-US', { month: 'long' })}</option>
        {/each}
      </select>
    </div>
  </div>

  {#if selectedEmployee}
    <div class="attendance-form">
      <h3>Record Attendance</h3>
      
      <div class="form-grid">
        <div class="form-group">
          <label for="date">Date</label>
          <input 
            id="date"
            type="date" 
            bind:value={selectedDate}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
        
        <div class="form-group">
          <label for="type">Day Type</label>
          <select id="type" bind:value={attendanceData.type}>
            {#each Object.entries(DAY_TYPES) as [key, value]}
              <option value={value}>{key.replace('_', ' ').toUpperCase()}</option>
            {/each}
          </select>
        </div>
        
        {#if attendanceData.type === 'regular'}
          <div class="form-group">
            <label for="entryTime">Entry Time</label>
            <input 
              id="entryTime"
              type="time" 
              bind:value={attendanceData.entryTime}
            />
          </div>
          
          <div class="form-group">
            <label for="exitTime">Exit Time</label>
            <input 
              id="exitTime"
              type="time" 
              bind:value={attendanceData.exitTime}
            />
          </div>
          
          {#if attendanceData.entryTime && attendanceData.exitTime}
            <div class="form-group">
              <label for="hours-worked">Hours Worked</label>
              <div id="hours-worked" class="hours-display">
                {calculateWorkingHours(attendanceData.entryTime, attendanceData.exitTime)} hours
              </div>
            </div>
          {/if}
        {/if}
      </div>
      
      <div class="form-actions">
        <button class="btn btn-primary" on:click={saveAttendance}>
          Save Attendance
        </button>
      </div>
    </div>

    <div class="monthly-view">
      <h3>Monthly Attendance - {$currentPeriod.year}-{$currentPeriod.month.toString().padStart(2, '0')}</h3>
      
      <div class="calendar-grid">
        {#each Array.from({length: getDaysInMonth($currentPeriod.year, $currentPeriod.month)}, (_, i) => i + 1) as day}
          {@const dateStr = `${$currentPeriod.year}-${$currentPeriod.month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`}
          {@const dayData = monthAttendance[dateStr]}
          {@const dayName = getDayName(dateStr)}
          
          <div class="calendar-day {isToday(dateStr) ? 'today' : ''} {dayData ? 'has-data' : ''}">
            <div class="day-header">
              <span class="day-number">{day}</span>
              <span class="day-name">{dayName}</span>
            </div>
            
            {#if dayData}
              <div class="day-content">
                <div class="day-type">{dayData.type.toUpperCase()}</div>
                {#if dayData.type === 'regular' && dayData.entryTime && dayData.exitTime}
                  <div class="time-info">
                    <div>{dayData.entryTime} - {dayData.exitTime}</div>
                    <div class="hours">{calculateWorkingHours(dayData.entryTime, dayData.exitTime)}h</div>
                  </div>
                {/if}
                <button class="btn btn-small btn-danger" on:click={() => deleteAttendance(dateStr)}>
                  ×
                </button>
              </div>
            {:else}
              <div class="day-content empty">
                <span class="empty-text">No data</span>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="empty-state">
      <p>Please select an employee to manage attendance.</p>
    </div>
  {/if}
</div>

<style>
  .attendance-container {
    max-width: 100%;
  }

  .header {
    margin-bottom: 20px;
  }

  .header h2 {
    margin: 0;
    color: #333;
  }

  .controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  .form-group label {
    margin-bottom: 5px;
    font-weight: 500;
    color: #555;
  }

  .form-group input,
  .form-group select {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }

  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: #ff6b35;
    box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.2);
  }

  .attendance-form {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    border: 1px solid #e0e0e0;
  }

  .attendance-form h3 {
    margin: 0 0 20px 0;
    color: #333;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
  }

  .hours-display {
    padding: 8px 12px;
    background: #e9ecef;
    border-radius: 4px;
    font-weight: 500;
    color: #333;
  }

  .form-actions {
    display: flex;
    gap: 10px;
  }

  .monthly-view {
    margin-top: 30px;
  }

  .monthly-view h3 {
    margin: 0 0 20px 0;
    color: #333;
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 8px;
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .calendar-day {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    min-height: 80px;
    padding: 8px;
    background: #f8f9fa;
  }

  .calendar-day.today {
    border-color: #ff6b35;
    background: #fff3f0;
  }

  .calendar-day.has-data {
    background: white;
    border-color: #28a745;
  }

  .day-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
  }

  .day-number {
    font-weight: 600;
    color: #333;
  }

  .day-name {
    font-size: 12px;
    color: #666;
  }

  .day-content {
    position: relative;
  }

  .day-content.empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 40px;
  }

  .empty-text {
    font-size: 12px;
    color: #999;
  }

  .day-type {
    font-size: 12px;
    font-weight: 600;
    color: #28a745;
    margin-bottom: 2px;
  }

  .time-info {
    font-size: 11px;
    color: #666;
  }

  .time-info .hours {
    font-weight: 600;
    color: #333;
  }

  .btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .btn-primary {
    background: #ff6b35;
    color: white;
  }

  .btn-primary:hover {
    background: #e55a2b;
  }

  .btn-danger {
    background: #dc3545;
    color: white;
  }

  .btn-danger:hover {
    background: #c82333;
  }

  .btn-small {
    padding: 2px 6px;
    font-size: 12px;
    position: absolute;
    top: 0;
    right: 0;
  }

  .empty-state {
    text-align: center;
    padding: 40px;
    color: #666;
  }

  @media (max-width: 768px) {
    .calendar-grid {
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
      padding: 10px;
    }

    .calendar-day {
      min-height: 60px;
      padding: 4px;
    }

    .day-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .day-name {
      font-size: 10px;
    }
  }
</style> 