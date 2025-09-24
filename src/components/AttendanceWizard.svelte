<!--
  Attendance Wizard - Clean month-by-month attendance recording
  Focused workflow for recording daily attendance
-->
<script>
  import { employees, attendance, config, currentPeriod } from '../stores.js';
  import { calculateWorkingHours, DAY_TYPES } from '../core.js';
  import { toasts } from '../lib/toast.js';
  import Wizard from './Wizard.svelte';
  import Icon from '@iconify/svelte';
  import { ICONS } from '../lib/icons.js';
  
  let currentStep = $state(0);
  let selectedPeriod = $state({ year: $currentPeriod.year, month: $currentPeriod.month });
  let selectedEmployee = $state('');
  let viewMode = $state('overview'); // 'overview' | 'record' | 'bulk'
  
  // Form state for recording attendance
  let attendanceForm = $state({
    date: '',
    type: 'regular',
    entryTime: '08:00',
    exitTime: '17:00'
  });
  
  // Generate available periods (last 12 months)
  const availablePeriods = (() => {
    const periods = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      periods.push({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      });
    }
    return periods;
  })();
  
  // Get month key for attendance storage
  const getMonthKey = (year, month) => `${year}-${String(month).padStart(2, '0')}`;
  
  // Get attendance for specific employee and period
  const getEmployeeAttendance = (employeeId) => {
    const monthKey = getMonthKey(selectedPeriod.year, selectedPeriod.month);
    return $attendance[employeeId]?.[monthKey] || {};
  };
  
  // Calculate attendance summary for employee
  const getAttendanceSummary = (employeeId) => {
    const monthAttendance = getEmployeeAttendance(employeeId);
    const summary = {
      totalDays: 0,
      totalHours: 0,
      byType: { regular: 0, holiday: 0, paid_leave: 0, unpaid_leave: 0 }
    };
    
    Object.entries(monthAttendance).forEach(([date, dayData]) => {
      summary.totalDays++;
      summary.byType[dayData.type]++;
      
      if (dayData.type === 'regular') {
        const hours = calculateWorkingHours(dayData.entryTime, dayData.exitTime);
        summary.totalHours += hours;
      } else {
        const dayTypeConfig = $config.dayTypes[dayData.type];
        if (dayTypeConfig && dayTypeConfig.hours !== 'calculated') {
          summary.totalHours += dayTypeConfig.hours;
        }
      }
    });
    
    return summary;
  };
  
  // Generate calendar days for the selected month
  const getCalendarDays = () => {
    const year = selectedPeriod.year;
    const month = selectedPeriod.month;
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const days = [];
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month - 1, day);
      const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        date: dateString,
        day,
        dayOfWeek: date.getDay(),
        isWeekend: date.getDay() === 0 || date.getDay() === 6
      });
    }
    
    return days;
  };
  
  const calendarDays = $derived(getCalendarDays());
  
  // Wizard steps
  const getSteps = () => {
    if (viewMode === 'overview') {
      return [
        {
          title: 'Attendance Overview',
          description: 'View attendance summary for all employees',
          icon: ICONS.calendar
        }
      ];
    } else if (viewMode === 'record') {
      return [
        {
          title: 'Select Employee',
          description: 'Choose employee to record attendance',
          icon: ICONS.user
        },
        {
          title: 'Calendar View',
          description: 'Record daily attendance for the month',
          icon: ICONS.calendar
        }
      ];
    } else {
      return [
        {
          title: 'Bulk Operations',
          description: 'Apply attendance to multiple employees',
          icon: ICONS.users
        }
      ];
    }
  };
  
  const steps = $derived(getSteps());
  
  const canProceedToNext = $derived(() => {
    if (viewMode === 'record' && currentStep === 0) {
      return selectedEmployee !== '';
    }
    return true;
  });
  
  const startRecording = () => {
    viewMode = 'record';
    currentStep = 0;
    selectedEmployee = '';
  };
  
  const startBulkEdit = () => {
    viewMode = 'bulk';
    currentStep = 0;
  };
  
  const backToOverview = () => {
    viewMode = 'overview';
    currentStep = 0;
    selectedEmployee = '';
  };
  
  const saveAttendance = (employeeId, date, attendanceData) => {
    const monthKey = getMonthKey(selectedPeriod.year, selectedPeriod.month);
    
    attendance.update(current => {
      const updated = { ...current };
      if (!updated[employeeId]) updated[employeeId] = {};
      if (!updated[employeeId][monthKey]) updated[employeeId][monthKey] = {};
      updated[employeeId][monthKey][date] = attendanceData;
      return updated;
    });
    
    toasts.success('Attendance saved successfully!');
  };
  
  const removeAttendance = (employeeId, date) => {
    const monthKey = getMonthKey(selectedPeriod.year, selectedPeriod.month);
    
    attendance.update(current => {
      const updated = { ...current };
      if (updated[employeeId]?.[monthKey]?.[date]) {
        delete updated[employeeId][monthKey][date];
      }
      return updated;
    });
    
    toasts.success('Attendance removed successfully!');
  };
  
  const quickAddAttendance = (type, dates = []) => {
    if (!selectedEmployee || dates.length === 0) return;
    
    dates.forEach(date => {
      let attendanceData = { type };
      
      if (type === 'regular') {
        attendanceData.entryTime = '08:00';
        attendanceData.exitTime = '17:00';
      }
      
      saveAttendance(selectedEmployee, date, attendanceData);
    });
  };
  
  // Format time for display
  const formatTime = (time) => time || '--:--';
  
  // Get day type configuration
  const getDayTypeConfig = (type) => $config.dayTypes[type] || {};
</script>

<Wizard 
  {steps}
  bind:currentStep
  title="Attendance Management"
  description="Record and manage employee attendance"
  canGoNext={canProceedToNext}
  onComplete={() => {}}
>
  {#snippet children(stepIndex, stepData)}
    
    <!-- Overview Mode -->
    {#if viewMode === 'overview'}
      <div class="attendance-overview">
        <div class="overview-header">
          <div class="period-selector">
            <label for="period">
              <Icon icon={ICONS.calendar} width="1.25rem" height="1.25rem" />
              Period
            </label>
            <select id="period" bind:value={selectedPeriod}>
              {#each availablePeriods as period}
                <option value={period}>
                  {period.label}
                </option>
              {/each}
            </select>
          </div>
          
          <div class="action-buttons">
            <button class="primary" onclick={startRecording}>
              <Icon icon={ICONS.addAttendance} width="1.25rem" height="1.25rem" />
              Record Attendance
            </button>
            <button class="secondary" onclick={startBulkEdit}>
              <Icon icon={ICONS.users} width="1.25rem" height="1.25rem" />
              Bulk Operations
            </button>
          </div>
        </div>
        
        {#if $employees.length === 0}
          <div class="empty-state">
            <Icon icon={ICONS.users} width="4rem" height="4rem" />
            <h4>No Employees Added</h4>
            <p>Add employees first before recording attendance.</p>
          </div>
        {:else}
          <div class="employees-attendance-grid">
            {#each $employees as employee (employee.id)}
              {@const summary = getAttendanceSummary(employee.id)}
              <div class="employee-attendance-card">
                <div class="employee-header">
                  <div class="employee-info">
                    <Icon icon={employee.gender === 'male' ? ICONS.male : ICONS.female} width="2rem" height="2rem" />
                    <div>
                      <h4>{employee.name}</h4>
                      <span class="employee-role">{employee.maritalStatus} • {employee.gender}</span>
                    </div>
                  </div>
                  
                  <button class="secondary" onclick={() => { selectedEmployee = employee.id; startRecording(); }}>
                    <Icon icon={ICONS.edit} width="1rem" height="1rem" />
                    Edit
                  </button>
                </div>
                
                <div class="attendance-summary">
                  <div class="summary-stats">
                    <div class="stat">
                      <Icon icon={ICONS.calendar} width="1.25rem" height="1.25rem" />
                      <div>
                        <span class="value">{summary.totalDays}</span>
                        <span class="label">Days Recorded</span>
                      </div>
                    </div>
                    
                    <div class="stat">
                      <Icon icon={ICONS.clock} width="1.25rem" height="1.25rem" />
                      <div>
                        <span class="value">{summary.totalHours.toFixed(1)}</span>
                        <span class="label">Total Hours</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="day-types-breakdown">
                    {#each Object.entries(summary.byType) as [type, count]}
                      {#if count > 0}
                        {@const typeConfig = getDayTypeConfig(type)}
                        <div class="day-type-item">
                          <Icon icon={ICONS[type] || ICONS.calendar} width="1rem" height="1rem" />
                          <span class="count">{count}</span>
                          <span class="type-label">{typeConfig.label || type}</span>
                        </div>
                      {/if}
                    {/each}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    
    <!-- Recording Mode -->
    {:else if viewMode === 'record'}
      
      <!-- Step 1: Select Employee -->
      {#if stepIndex === 0}
        <div class="select-employee-step">
          <h3>
            <Icon icon={ICONS.user} width="1.5rem" height="1.5rem" />
            Select Employee
          </h3>
          
          <div class="employee-selection-grid">
            {#each $employees as employee (employee.id)}
              <button 
                class="employee-selection-card"
                class:selected={selectedEmployee === employee.id}
                onclick={() => selectedEmployee = employee.id}
              >
                <Icon icon={employee.gender === 'male' ? ICONS.male : ICONS.female} width="2.5rem" height="2.5rem" />
                <div>
                  <h4>{employee.name}</h4>
                  <span class="employee-info">{employee.maritalStatus} • {employee.gender}</span>
                  
                  {@const summary = getAttendanceSummary(employee.id)}
                  <div class="current-status">
                    {summary.totalDays} days • {summary.totalHours.toFixed(1)} hours
                  </div>
                </div>
                
                {#if selectedEmployee === employee.id}
                  <Icon icon={ICONS.check} width="1.5rem" height="1.5rem" />
                {/if}
              </button>
            {/each}
          </div>
        </div>
      
      <!-- Step 2: Calendar View -->
      {:else if stepIndex === 1}
        <div class="calendar-step">
          <div class="calendar-header">
            <h3>
              <Icon icon={ICONS.calendar} width="1.5rem" height="1.5rem" />
              {selectedPeriod.label} - {$employees.find(emp => emp.id === selectedEmployee)?.name}
            </h3>
            
            <div class="quick-actions">
              <span class="quick-label">Quick Add:</span>
              <button class="secondary small" onclick={() => quickAddAttendance('regular', calendarDays.filter(d => !d.isWeekend).map(d => d.date))}>
                <Icon icon={ICONS.regular} width="1rem" height="1rem" />
                All Weekdays
              </button>
              <button class="secondary small" onclick={() => quickAddAttendance('holiday', calendarDays.filter(d => d.isWeekend).map(d => d.date))}>
                <Icon icon={ICONS.holiday} width="1rem" height="1rem" />
                All Weekends
              </button>
            </div>
          </div>
          
          <div class="calendar-grid">
            <div class="calendar-header-row">
              {#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as dayName}
                <div class="day-header">{dayName}</div>
              {/each}
            </div>
            
            <!-- Add empty cells for days before month start -->
            {#each Array(calendarDays[0]?.dayOfWeek || 0) as _}
              <div class="calendar-cell empty"></div>
            {/each}
            
            {#each calendarDays as dayInfo (dayInfo.date)}
              {@const employeeAttendance = getEmployeeAttendance(selectedEmployee)}
              {@const dayAttendance = employeeAttendance[dayInfo.date]}
              
              <div class="calendar-cell" class:weekend={dayInfo.isWeekend} class:has-attendance={dayAttendance}>
                <div class="day-number">{dayInfo.day}</div>
                
                {#if dayAttendance}
                  <div class="attendance-info">
                    <div class="day-type {dayAttendance.type}">
                      <Icon icon={ICONS[dayAttendance.type] || ICONS.calendar} width="1rem" height="1rem" />
                      {getDayTypeConfig(dayAttendance.type).label?.substring(0, 4) || dayAttendance.type}
                    </div>
                    
                    {#if dayAttendance.type === 'regular'}
                      <div class="time-info">
                        <div class="times">
                          {formatTime(dayAttendance.entryTime)} - {formatTime(dayAttendance.exitTime)}
                        </div>
                        <div class="hours">
                          {calculateWorkingHours(dayAttendance.entryTime, dayAttendance.exitTime).toFixed(1)}h
                        </div>
                      </div>
                    {:else}
                      <div class="fixed-hours">
                        {getDayTypeConfig(dayAttendance.type).hours || 0}h
                      </div>
                    {/if}
                    
                    <button class="remove-btn" onclick={() => removeAttendance(selectedEmployee, dayInfo.date)}>
                      <Icon icon={ICONS.close} width="0.875rem" height="0.875rem" />
                    </button>
                  </div>
                {:else}
                  <button class="add-attendance-btn" onclick={() => {
                    attendanceForm.date = dayInfo.date;
                    saveAttendance(selectedEmployee, dayInfo.date, { 
                      type: 'regular', 
                      entryTime: '08:00', 
                      exitTime: '17:00' 
                    });
                  }}>
                    <Icon icon={ICONS.add} width="1rem" height="1rem" />
                  </button>
                {/if}
              </div>
            {/each}
          </div>
          
          <div class="calendar-legend">
            <h4>Day Types</h4>
            <div class="legend-items">
              {#each Object.entries($config.dayTypes) as [type, config]}
                <div class="legend-item">
                  <Icon icon={ICONS[type] || ICONS.calendar} width="1rem" height="1rem" />
                  <span class="type-name">{config.label}</span>
                  <span class="type-hours">
                    {config.hours === 'calculated' ? 'Variable' : `${config.hours}h`}
                  </span>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}
    
    <!-- Bulk Mode -->
    {:else if viewMode === 'bulk'}
      <div class="bulk-operations">
        <h3>
          <Icon icon={ICONS.users} width="1.5rem" height="1.5rem" />
          Bulk Operations
        </h3>
        <p>Apply attendance settings to multiple employees at once.</p>
        
        <div class="bulk-form">
          <div class="form-group-stacked">
            <label>Day Type</label>
            <select bind:value={attendanceForm.type}>
              {#each Object.entries($config.dayTypes) as [type, config]}
                <option value={type}>{config.label}</option>
              {/each}
            </select>
          </div>
          
          {#if attendanceForm.type === 'regular'}
            <div class="form-group-horizontal">
              <div class="form-group-stacked">
                <label>Entry Time</label>
                <input type="time" bind:value={attendanceForm.entryTime} />
              </div>
              <div class="form-group-stacked">
                <label>Exit Time</label>
                <input type="time" bind:value={attendanceForm.exitTime} />
              </div>
            </div>
          {/if}
          
          <div class="date-selection">
            <h4>Select Dates</h4>
            <div class="quick-date-buttons">
              <button class="secondary" onclick={() => {}}>All Weekdays</button>
              <button class="secondary" onclick={() => {}}>All Weekends</button>
              <button class="secondary" onclick={() => {}}>Entire Month</button>
            </div>
          </div>
          
          <div class="employee-selection">
            <h4>Select Employees</h4>
            <div class="employee-checkboxes">
              {#each $employees as employee}
                <label class="checkbox-label">
                  <input type="checkbox" />
                  <span>{employee.name}</span>
                </label>
              {/each}
            </div>
          </div>
          
          <button class="primary" onclick={() => {}}>
            <Icon icon={ICONS.save} width="1.25rem" height="1.25rem" />
            Apply to Selected Employees
          </button>
        </div>
      </div>
    {/if}
  {/snippet}
</Wizard>

<!-- Back to Overview Button -->
{#if viewMode !== 'overview'}
  <button class="back-to-overview" onclick={backToOverview}>
    <Icon icon={ICONS.back} width="1.25rem" height="1.25rem" />
    Back to Overview
  </button>
{/if}

<style lang="sass">
  .attendance-overview
    display: grid
    gap: 2rem
    
  .overview-header
    @extend %flex-between
    align-items: flex-start
    gap: 2rem
    
    @media (max-width: 768px)
      flex-direction: column
      align-items: stretch
      
  .period-selector
    @extend %flex
    gap: 1rem
    align-items: center
    
    label
      @extend %flex
      gap: 0.5rem
      @extend %font-weight-medium
      color: var(--fg)
      
    select
      min-width: 200px
      
  .action-buttons
    @extend %flex
    gap: 1rem
    
  .employees-attendance-grid
    display: grid
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr))
    gap: 1.5rem
    
  .employee-attendance-card
    @extend %card
    border: 1px solid color-mix(in oklab, var(--primary) 15%, transparent)
    
    .employee-header
      @extend %flex-between
      margin-bottom: 1.5rem
      
      .employee-info
        @extend %flex
        gap: 1rem
        
        svg
          color: var(--primary)
          
        h4
          margin: 0 0 0.25rem 0
          @extend %font-weight-bold
          
        .employee-role
          font-size: 0.875rem
          @extend %text-muted
          
    .attendance-summary
      .summary-stats
        display: grid
        grid-template-columns: 1fr 1fr
        gap: 1rem
        margin-bottom: 1.5rem
        
        .stat
          @extend %flex
          gap: 0.75rem
          padding: 1rem
          background: color-mix(in oklab, var(--primary) 8%, transparent)
          border-radius: 0.75rem
          
          svg
            color: var(--primary)
            
          .value
            display: block
            @extend %font-weight-bold
            font-size: 1.25rem
            color: var(--primary)
            
          .label
            display: block
            font-size: 0.875rem
            @extend %text-muted
            
      .day-types-breakdown
        display: grid
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr))
        gap: 0.75rem
        
        .day-type-item
          @extend %flex
          gap: 0.5rem
          padding: 0.5rem 0.75rem
          background: color-mix(in oklab, var(--secondary) 8%, transparent)
          border-radius: 0.5rem
          font-size: 0.875rem
          
          svg
            color: var(--secondary)
            
          .count
            @extend %font-weight-bold
            color: var(--secondary)
            
          .type-label
            @extend %text-muted
            
  .select-employee-step
    h3
      @extend %flex
      gap: 0.75rem
      color: var(--primary)
      margin-bottom: 2rem
      
  .employee-selection-grid
    display: grid
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))
    gap: 1rem
    
  .employee-selection-card
    @extend %card
    @extend %flex
    gap: 1rem
    text-align: left
    border: 2px solid color-mix(in oklab, var(--primary) 15%, transparent)
    @extend %transition
    position: relative
    
    &:hover
      @extend %button-hover
      border-color: var(--primary)
      
    &.selected
      border-color: var(--primary)
      background: color-mix(in oklab, var(--primary) 10%, transparent)
      
      > svg:last-child
        position: absolute
        top: 1rem
        right: 1rem
        color: var(--primary)
        
    > svg:first-child
      color: var(--primary)
      flex-shrink: 0
      
    h4
      margin: 0 0 0.25rem 0
      @extend %font-weight-bold
      
    .employee-info
      font-size: 0.875rem
      @extend %text-muted
      margin-bottom: 0.5rem
      
    .current-status
      font-size: 0.875rem
      @extend %font-weight-medium
      color: var(--primary)
      
  .calendar-step
    .calendar-header
      @extend %flex-between
      align-items: flex-start
      margin-bottom: 2rem
      
      h3
        @extend %flex
        gap: 0.75rem
        color: var(--primary)
        margin: 0
        
      .quick-actions
        @extend %flex
        gap: 0.75rem
        align-items: center
        flex-wrap: wrap
        
        .quick-label
          @extend %font-weight-medium
          @extend %text-muted
          
        button.small
          padding: 0.5rem 0.75rem
          font-size: 0.8rem
          
  .calendar-grid
    display: grid
    grid-template-columns: repeat(7, 1fr)
    gap: 1px
    background: color-mix(in oklab, var(--primary) 15%, transparent)
    border-radius: 1rem
    overflow: hidden
    margin-bottom: 2rem
    
    .calendar-header-row
      display: contents
      
      .day-header
        padding: 1rem 0.5rem
        background: color-mix(in oklab, var(--primary) 20%, transparent)
        color: var(--primary)
        text-align: center
        @extend %font-weight-bold
        font-size: 0.875rem
        
    .calendar-cell
      background: var(--bg)
      min-height: 120px
      padding: 0.75rem
      position: relative
      display: flex
      flex-direction: column
      
      &.empty
        background: color-mix(in oklab, var(--bg-muted) 30%, transparent)
        
      &.weekend
        background: color-mix(in oklab, var(--bg-muted) 20%, transparent)
        
      &.has-attendance
        background: color-mix(in oklab, var(--success) 8%, transparent)
        
      .day-number
        @extend %font-weight-bold
        color: var(--fg)
        margin-bottom: 0.5rem
        
      .attendance-info
        flex: 1
        display: grid
        gap: 0.5rem
        
        .day-type
          @extend %flex
          gap: 0.25rem
          padding: 0.25rem 0.5rem
          border-radius: 0.5rem
          font-size: 0.75rem
          @extend %font-weight-medium
          
          &.regular
            background: color-mix(in oklab, var(--primary) 15%, transparent)
            color: var(--primary)
            
          &.holiday
            background: color-mix(in oklab, var(--warning) 15%, transparent)
            color: var(--warning)
            
          &.paid_leave
            background: color-mix(in oklab, var(--success) 15%, transparent)
            color: var(--success)
            
          &.unpaid_leave
            background: color-mix(in oklab, var(--error) 15%, transparent)
            color: var(--error)
            
        .time-info, .fixed-hours
          font-size: 0.75rem
          @extend %text-muted
          
          .times
            @extend %font-weight-medium
            
          .hours
            color: var(--primary)
            @extend %font-weight-bold
            
        .remove-btn
          position: absolute
          top: 0.25rem
          right: 0.25rem
          @extend %button-circular
          width: 1.5rem
          height: 1.5rem
          padding: 0
          background: color-mix(in oklab, var(--error) 80%, transparent)
          color: white
          opacity: 0
          @extend %transition
          
        &:hover .remove-btn
          opacity: 1
          
      .add-attendance-btn
        position: absolute
        top: 50%
        left: 50%
        transform: translate(-50%, -50%)
        @extend %button-circular
        width: 2rem
        height: 2rem
        padding: 0
        @extend %color-primary
        color: white
        opacity: 0
        @extend %transition
        
      &:hover .add-attendance-btn
        opacity: 1
        
  .calendar-legend
    h4
      color: var(--primary)
      margin-bottom: 1rem
      
    .legend-items
      display: grid
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))
      gap: 1rem
      
      .legend-item
        @extend %flex
        gap: 0.75rem
        padding: 0.75rem
        background: color-mix(in oklab, var(--primary) 8%, transparent)
        border-radius: 0.75rem
        
        svg
          color: var(--primary)
          
        .type-name
          @extend %font-weight-medium
          flex: 1
          
        .type-hours
          @extend %font-weight-bold
          color: var(--primary)
          
  .bulk-operations
    h3
      @extend %flex
      gap: 0.75rem
      color: var(--primary)
      margin-bottom: 1rem
      
    p
      @extend %text-muted
      margin-bottom: 2rem
      
  .bulk-form
    @extend %card
    
    .date-selection, .employee-selection
      margin: 1.5rem 0
      
      h4
        color: var(--primary)
        margin-bottom: 1rem
        
    .quick-date-buttons
      @extend %flex
      gap: 0.75rem
      flex-wrap: wrap
      
    .employee-checkboxes
      display: grid
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))
      gap: 0.75rem
      
      .checkbox-label
        @extend %flex
        gap: 0.5rem
        padding: 0.75rem
        background: color-mix(in oklab, var(--primary) 8%, transparent)
        border-radius: 0.5rem
        @extend %transition
        cursor: pointer
        
        &:hover
          background: color-mix(in oklab, var(--primary) 12%, transparent)
          
        input[type="checkbox"]
          accent-color: var(--primary)
          
  .back-to-overview
    position: fixed
    top: 6rem
    left: 2rem
    @extend %button-secondary
    z-index: 100
    @extend %shadow-lg
    
    @media (max-width: 768px)
      top: 5rem
      left: 1rem
      
  .empty-state
    @extend %grid
    place-items: center
    text-align: center
    gap: 1.5rem
    padding: 4rem 2rem
    
    svg
      @extend %opacity-subtle
      color: var(--fg-muted)
      
    h4
      margin: 0
      color: var(--fg-muted)
      
    p
      @extend %text-muted
      margin: 0
</style>
