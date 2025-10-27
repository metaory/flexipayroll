<script>
  import Icon from '@iconify/svelte'
  import { createEventDispatcher, tick } from 'svelte'
  import { DAY_TYPES, calculateWorkingHours, getDaysInMonth, getWeekdays, getWeekdayName } from '../core.js'
  import { setAttendance, removeAttendance, getAttendance } from '../stores.js'
  import BitGrid from 'bit-grid-component'

  let { employees = [], period = '', basicConfig = {} } = $props()
  const dispatch = createEventDispatcher()

  // Reactive computation of calendar days
  const calendarDays = $derived.by(() => {
    const daysInMonth = basicConfig.monthDays || getDaysInMonth(period)
    const weekdays = getWeekdays(period)
    const firstDayWeekday = (basicConfig && basicConfig.firstDayWeekday) ? basicConfig.firstDayWeekday : 'Saturday'

    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1
      const date = `${period}-${String(day).padStart(2, '0')}`
      const isWeekday = weekdays.includes(date)
      const weekdayName = getWeekdayName(day, firstDayWeekday)
      return { day, date, isWeekday, weekdayName }
    })
  })

  // Time formatting utilities
  const formatTimeSlot = (hour, minutes) => {
    const h = Math.floor(hour)
    const m = Math.floor(minutes)
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }

  const parseTime = (timeString) => {
    if (!timeString || typeof timeString !== 'string') return 8 // Default to 8 AM
    const [h, m] = timeString.split(':').map(Number)
    return h + (m / 60)
  }

  const formatTimeFromHour = (decimalHour) => {
    if (typeof decimalHour !== 'number') return '08:00' // Default to 8 AM
    const h = Math.floor(decimalHour)
    const m = Math.round((decimalHour - h) * 60)
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }

  // Time slots with variable granularity
  const timeSlots = [
    // 8:00-10:00 AM: 15-min intervals (8 columns)
    ...Array.from({ length: 8 }, (_, i) => {
      const totalMinutes = 8 * 60 + (i * 15) // Convert to total minutes from midnight
      const hour = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      return {
        hour: hour + (minutes / 60),
        label: `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
        duration: 0.25
      }
    }),
    // 10:00 AM-5:00 PM: 1-hour intervals (7 columns)
    ...Array.from({ length: 7 }, (_, i) => ({
      hour: 10 + i,
      label: `${10 + i}:00`,
      duration: 1
    })),
    // 5:00-8:00 PM: 15-min intervals (13 columns)
    ...Array.from({ length: 13 }, (_, i) => {
      const totalMinutes = 17 * 60 + (i * 15) // Convert to total minutes from midnight
      const hour = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      return {
        hour: hour + (minutes / 60),
        label: `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
        duration: 0.25
      }
    })
  ]

  // Attendance data structure: { [employeeId]: { [date]: { type, entryTime, exitTime, notes } } }
  let attendanceData = $state({})
  let attendanceGrids = $state({})

  // Load attendance data for current period
  $effect(() => {
    if (period && employees.length > 0) {
      const loadedData = {}
      employees.forEach(emp => {
        loadedData[emp.id] = getAttendance(period, emp.id)
      })
      attendanceData = loadedData

      // Initialize BitGrids after data is loaded - also trigger on calendarDays changes
      tick().then(() => {
        employees.forEach(emp => {
          initializeAttendanceGrid(emp.id)
        })
      })
    }
  })

  // Re-initialize grids when calendarDays changes (e.g., config update)
  $effect(() => {
    if (calendarDays.length > 0 && employees.length > 0) {
      tick().then(() => {
        employees.forEach(emp => {
          initializeAttendanceGrid(emp.id)
        })
      })
    }
  })


  // Initialize BitGrid for attendance tracking
  const initializeAttendanceGrid = (employeeId) => {
    const container = document.getElementById(`attendance-grid-${employeeId}`)
    if (!container) return

    // Clean up existing grid
    if (attendanceGrids[employeeId]) {
      attendanceGrids[employeeId].remove()
    }

    // Create data array - days as rows, time slots as columns (pre-filled with standard hours 8-17)
    const data = calendarDays.map(day => 
      timeSlots.map(slot => {
        // Pre-fill with standard working hours (8 AM to 5 PM inclusive)
        const slotHour = typeof slot.hour === 'number' ? slot.hour : 0
        return slotHour >= 8 && slotHour <= 17
      })
    )

    // Create BitGrid with days as rows, time slots as columns
    const grid = new BitGrid({
      data: data,
      rowLabels: calendarDays.map(day => `${day.day} - ${day.weekdayName}`),
      colLabels: timeSlots.map(slot => slot.label),
      onChange: (newData) => handleGridChange(employeeId, newData)
    })

    container.appendChild(grid)
    attendanceGrids[employeeId] = grid
    
    // Load existing attendance data after grid is created
    loadExistingAttendanceData(employeeId, grid)
    
    return grid
  }

  // Load existing attendance data into the grid (only if different from standard hours)
  const loadExistingAttendanceData = (employeeId, grid) => {
    const employeeData = attendanceData[employeeId] || {}
    
    calendarDays.forEach((day, dayIndex) => {
      const dayData = employeeData[day.date]
      if (dayData && dayData.type === DAY_TYPES.REGULAR) {
        const entryTime = parseTime(dayData.entryTime || '08:00')
        const exitTime = parseTime(dayData.exitTime || '17:00')
        
        // Only update if the saved times are different from standard (8-17)
        if (entryTime !== 8 || exitTime !== 17) {
          // Clear all cells for this day first
          timeSlots.forEach((_, slotIndex) => {
            grid.setCell(dayIndex, slotIndex, false)
          })
          
          // Mark cells as selected based on saved entry/exit times
          timeSlots.forEach((slot, slotIndex) => {
            const slotHour = typeof slot.hour === 'number' ? slot.hour : 0
            if (slotHour >= entryTime && slotHour < exitTime) {
              grid.setCell(dayIndex, slotIndex, true)
            }
          })
        }
      } else if (dayData && dayData.type !== DAY_TYPES.REGULAR) {
        // Clear all cells for non-regular days (holiday, sick, leave, absent)
        timeSlots.forEach((_, slotIndex) => {
          grid.setCell(dayIndex, slotIndex, false)
        })
      }
    })
  }

  // Handle grid changes for specific employee
  const handleGridChange = (employeeId, gridData) => {
    calendarDays.forEach((day, dayIndex) => {
      const dayRow = gridData[dayIndex]
      const selectedSlots = timeSlots.filter((_, i) => dayRow[i])
      
      if (selectedSlots.length === 0) {
        removeAttendance(period, employeeId, day.date)
        return
      }
      
      const entryTime = formatTimeFromHour(selectedSlots[0].hour)
      const exitTime = formatTimeFromHour(
        selectedSlots[selectedSlots.length - 1].hour + 
        selectedSlots[selectedSlots.length - 1].duration
      )
      
      updateAttendance(employeeId, day.date, {
        type: DAY_TYPES.REGULAR,
        entryTime,
        exitTime
      })
    })
  }


  // Update attendance data and persist
  const updateAttendance = (employeeId, date, data) => {
    attendanceData = {
      ...attendanceData,
      [employeeId]: {
        ...attendanceData[employeeId],
        [date]: data
      }
    }

    // Persist to store
    if (Object.keys(data).length > 0) {
      setAttendance(period, employeeId, date, data)
    } else {
      removeAttendance(period, employeeId, date)
    }
  }

</script>

<div class="attendance-container">
  {#if employees.length === 0}
    <div class="empty">
      <Icon icon="solar:users-group-rounded-bold-duotone" width="3rem" height="3rem" />
      <p>No employees to track attendance for</p>
      <p class="text-muted">Add employees first to record attendance</p>
    </div>
  {:else}
    <div class="attendance-header">
      <h3>Attendance for {period}</h3>
      <div class="attendance-summary">
        <span>{employees.length} employees</span>
        <span>{calendarDays.length} days</span>
      </div>
    </div>

    <!-- BitGrids for attendance tracking -->
    <div class="attendance-grids-section">
      <div class="grid-header">
        <h4>Monthly Attendance Tracking</h4>
        <p class="text-muted">Click and drag to adjust working hours. Default: 8 AM - 5 PM. Rows = days, Columns = time slots (15-min for 8-10 AM & 5-8 PM, 1-hour for 10 AM-5 PM)</p>
      </div>
      
      {#each employees as employee}
        <div class="employee-attendance-section">
          <div class="employee-header">
            <h5>{employee.name}</h5>
            <span class="employee-meta">{employee.gender} • {employee.maritalStatus}</span>
          </div>
          <div id="attendance-grid-{employee.id}" class="attendance-grid-container"></div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style lang="sass">
  @use "../styles.sass" as *

  .attendance-container
    @extend %grid
    gap: 2rem
    padding-top: 2rem

  .attendance-header
    @extend %flex-between
    padding-top: 0.2rem

    h3
      margin: 0
      @extend %gradient-text

  .attendance-summary
    @extend %flex
    gap: 1rem
    color: var(--fg-muted)
    font-size: 0.875rem

    span
      padding: 0.75rem 1.5rem
      font-weight: 700
      font-size: 0.875rem
      cursor: default

      // First span (employees count)
      &:nth-child(1)
        color: var(--primary)

      // Second span (days count)  
      &:nth-child(2)
        background: linear-gradient(135deg, var(--info-bg) 0%, var(--info) 20%)
        color: var(--info)

  .attendance-grids-section
    @extend %card-base
    margin-bottom: 2rem
    max-width: 100%
    overflow: hidden

    .grid-header
      margin-bottom: 2rem

      h4
        margin: 0 0 0.5rem 0
        @extend %gradient-text

      p
        margin: 0
        font-size: 0.875rem

  .employee-attendance-section
    margin-bottom: 2rem
    padding: 1.5rem
    background: var(--surface-secondary)
    border-radius: var(--radius)
    border: 2px solid var(--border-muted)

    &:last-child
      margin-bottom: 0

    .employee-header
      @extend %flex-between
      margin-bottom: 1rem

      h5
        margin: 0
        color: var(--primary)
        font-size: 1rem

      .employee-meta
        color: var(--fg-muted)
        font-size: 0.875rem

  .attendance-grid-container
    display: grid
    border: 2px solid var(--border-muted)
    padding: 1em 3em 1em 1em
    border-radius: var(--radius)
    overflow-x: auto
    overflow-y: auto
    max-height: 70vh
    min-height: 300px
    width: 100%
    background: var(--bg)
    
    // Hide scrollbar when not needed
    &::-webkit-scrollbar
      width: 8px
      height: 8px
    
    &::-webkit-scrollbar-track
      background: transparent
    
    &::-webkit-scrollbar-thumb
      background: var(--border-muted)
      border-radius: 4px
      
      &:hover
        background: var(--border)
    
    // Firefox scrollbar
    scrollbar-width: thin
    scrollbar-color: var(--border-muted) transparent

  .empty
    @extend %grid
    place-items: center
    gap: 1rem
    padding: 3rem
    text-align: center
    color: var(--fg-muted)

    p
      margin: 0

    .text-muted
      font-size: 0.875rem
      opacity: 0.7
</style>
