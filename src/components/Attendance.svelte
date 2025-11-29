<script>
  import Icon from '@iconify/svelte'
  import { tick, untrack } from 'svelte'
  import { DAY_TYPES, calculateWorkingHours, getDaysInMonth, getWeekdays, getWeekdayName } from '../core.js'
  import { setAttendance, removeAttendance, getAttendance } from '../stores.js'
  import BitGrid from 'bit-grid-component'

  let { employees = [], period = '', basicConfig = {} } = $props()

  // Reactive computation of calendar days
  const calendarDays = $derived.by(() => {
    const daysInMonth = basicConfig.monthDays || getDaysInMonth(period)
    const weekdays = getWeekdays(period)
    const firstDayWeekday = basicConfig?.firstDayWeekday || 'Saturday'

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
    if (typeof decimalHour !== 'number' || isNaN(decimalHour)) return '08:00' // Default to 8 AM
    const h = Math.floor(decimalHour)
    const m = Math.round((decimalHour - h) * 60)
    // Ensure minutes don't exceed 59
    const finalH = h + Math.floor(m / 60)
    const finalM = m % 60
    return `${finalH.toString().padStart(2, '0')}:${finalM.toString().padStart(2, '0')}`
  }

  // Format compact time range label
  const formatRangeLabel = (startHour, startMin, durationHours) => {
    const endMin = startMin + durationHours * 60
    const endHour = startHour + Math.floor(endMin / 60)
    const endMinutes = endMin % 60
    const startStr = startMin === 0 ? `${startHour}` : `${startHour}:${startMin.toString().padStart(2, '0')}`
    const endStr = endMinutes === 0 ? `${endHour}` : `${endHour}:${endMinutes.toString().padStart(2, '0')}`
    return `${startStr}-${endStr}`
  }

  // Time slots with variable granularity
  const timeSlots = [
    // 8:00 AM - 4:00 PM: 1-hour intervals (8 columns)
    ...Array.from({ length: 8 }, (_, i) => ({
      hour: 8 + i,
      label: `${8 + i}-${9 + i}`,
      duration: 1
    })),
    // 4:00 PM - 8:00 PM: 15-min intervals (16 columns)
    ...Array.from({ length: 16 }, (_, i) => {
      const totalMinutes = 16 * 60 + (i * 15)
      const hour = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      return {
        hour: hour + (minutes / 60),
        label: formatRangeLabel(hour, minutes, 0.25),
        duration: 0.25
      }
    })
  ]

  // Attendance data structure: { [employeeId]: { [date]: { type, entryTime, exitTime, notes } } }
  let attendanceData = $state({})
  let attendanceGrids = $state({})
  let initializedPeriod = $state('')
  let isLoadingData = $state({})
  // All employees collapsed by default (empty object means all are false/collapsed)
  let expandedEmployees = $state({})

  // Clean up grids only when period changes (not when collapsing)
  const cleanupGrids = () => {
    untrack(() => {
      Object.keys(attendanceGrids).map(employeeId => {
        const container = document.getElementById(`attendance-grid-${employeeId}`)
        if (container) {
          const grid = attendanceGrids[employeeId]
          if (grid && grid.parentNode) {
            grid.parentNode.removeChild(grid)
          }
        }
      })
      attendanceGrids = {}
      isLoadingData = {}
    })
  }

  // Load attendance data for current period
  $effect(() => {
    if (!period || employees.length === 0) return

    const periodChanged = period !== initializedPeriod

    // Clean up old grids when period changes
    if (periodChanged) {
      cleanupGrids()
      initializedPeriod = period
    }
    
    // Load fresh data from storage (untrack to prevent reactive loop)
    untrack(() => {
      attendanceData = employees.reduce((acc, emp) => {
        acc[emp.id] = getAttendance(period, emp.id)
        return acc
      }, {})
    })
  })

  // Re-initialize grids when calendarDays changes (e.g., config update) but only if period matches
  $effect(() => {
    if (calendarDays.length === 0 || employees.length === 0 || period !== initializedPeriod) return
    untrack(() => {
      // Re-initialize only existing grids
      Object.keys(attendanceGrids).map(employeeId => {
        const container = document.getElementById(`attendance-grid-${employeeId}`)
        const grid = attendanceGrids[employeeId]
        if (container && grid) {
          // Remove old grid
          if (grid.parentNode) {
            grid.parentNode.removeChild(grid)
          }
          delete attendanceGrids[employeeId]
          // Re-initialize
          waitTicks(1).then(() => initializeAttendanceGrid(employeeId))
        }
      })
    })
  })

  // Wait for DOM element to be ready
  const waitForElement = (id, maxAttempts = 10) => {
    const attempt = (count) => {
      const element = document.getElementById(id)
      if (element) return Promise.resolve(element)
      if (count >= maxAttempts) return Promise.resolve(null)
      return new Promise(resolve => setTimeout(() => attempt(count + 1).then(resolve), 50))
    }
    return attempt(0)
  }

  // Wait for DOM rendering (using setTimeout to avoid triggering effects)
  const waitTicks = (count = 3) => {
    const delay = 16 * count // ~16ms per frame, multiply by count
    return new Promise(resolve => setTimeout(resolve, delay))
  }

  // Initialize grid when employee section is expanded (simple approach - wait for each)
  $effect(() => {
    if (!period || employees.length === 0 || calendarDays.length === 0) return

    employees
      .filter(emp => expandedEmployees[emp.id] && !untrack(() => attendanceGrids[emp.id]))
      .map(emp => {
        waitForElement(`attendance-grid-${emp.id}`)
          .then(() => initializeAttendanceGrid(emp.id))
      })
  })


  // Initialize BitGrid for attendance tracking
  const initializeAttendanceGrid = (employeeId) => {
    const container = document.getElementById(`attendance-grid-${employeeId}`)
    if (!container) return

    // Prevent double initialization
    if (attendanceGrids[employeeId]) return

    // Clear container (should be empty but just in case)
    container.innerHTML = ''

    // Load fresh data from storage to ensure we have the latest saved state
    const employeeData = getAttendance(period, employeeId) || {}

    // Default work hours: 8:00 to 16:00 (8 hours)
    const defaultEntry = 8
    const defaultExit = 16
    
    // Only fill defaults if employee has NO data at all for this period (brand new)
    const isNewEmployee = Object.keys(employeeData).length === 0

    // Create data array - days as rows, time slots as columns
    const data = calendarDays.map(day => {
      const dayData = employeeData[day.date]

      if (dayData?.type === DAY_TYPES.REGULAR && dayData.entryTime && dayData.exitTime) {
        const entryTime = parseTime(dayData.entryTime)
        const exitTime = parseTime(dayData.exitTime)
        return timeSlots.map(slot => slotOverlaps(slot, entryTime, exitTime))
      }

      // New employee - fill with defaults; existing employee - leave empty
      return isNewEmployee 
        ? timeSlots.map(slot => slotOverlaps(slot, defaultEntry, defaultExit))
        : timeSlots.map(() => false)
    })

    // Create BitGrid with days as rows, time slots as columns
    const grid = new BitGrid({
      data: data,
      rowLabels: calendarDays.map(day => `${day.day} - ${day.weekdayName}`),
      colLabels: timeSlots.map(slot => slot.label),
      onChange: (newData) => handleGridChange(employeeId, newData)
    })

    // Set loading flag BEFORE appending to prevent onChange from firing
    untrack(() => {
      isLoadingData = { ...isLoadingData, [employeeId]: true }
      attendanceGrids[employeeId] = grid
    })

    container.appendChild(grid)

    // After grid is created, ensure all cells match saved data exactly
    waitTicks(3).then(() => {
      loadExistingAttendanceData(employeeId, grid)
      waitTicks(1).then(() => {
        untrack(() => {
          isLoadingData = { ...isLoadingData, [employeeId]: false }
        })
      })
    })

    return grid
  }

  // Check if slot overlaps with work period
  const slotOverlaps = (slot, entryTime, exitTime) => {
    const slotStart = typeof slot.hour === 'number' ? slot.hour : 0
    const slotEnd = slotStart + (slot.duration || 1)
    return slotStart < exitTime && slotEnd > entryTime
  }

  // Clear all slots for a day
  const clearDaySlots = (grid, dayIndex) => {
    timeSlots.map((_, slotIndex) => grid.setCell(dayIndex, slotIndex, false))
  }

  // Ensure grid cells match saved attendance data exactly, save defaults only for brand new employees
  const loadExistingAttendanceData = (employeeId, grid) => {
    // Re-fetch latest data to ensure we have the most current state
    const employeeData = getAttendance(period, employeeId) || {}
    
    // Default work hours: 8:00 to 16:00 (8 hours)
    const defaultEntry = 8
    const defaultExit = 16
    
    // Only fill defaults if employee has NO data at all for this period (brand new)
    const isNewEmployee = Object.keys(employeeData).length === 0

    calendarDays.map((day, dayIndex) => {
      const dayData = employeeData[day.date]

      // Regular day with entry/exit times - load saved data
      if (dayData?.type === DAY_TYPES.REGULAR && dayData.entryTime && dayData.exitTime) {
        const entryTime = parseTime(dayData.entryTime)
        const exitTime = parseTime(dayData.exitTime)
        timeSlots.map((slot, slotIndex) => {
          grid.setCell(dayIndex, slotIndex, slotOverlaps(slot, entryTime, exitTime))
        })
        return
      }

      // New employee with no data - fill with defaults and save
      if (isNewEmployee) {
        timeSlots.map((slot, slotIndex) => {
          grid.setCell(dayIndex, slotIndex, slotOverlaps(slot, defaultEntry, defaultExit))
        })
        updateAttendance(employeeId, day.date, {
          type: DAY_TYPES.REGULAR,
          entryTime: formatTimeFromHour(defaultEntry),
          exitTime: formatTimeFromHour(defaultExit)
        })
        return
      }

      // Existing employee, day with no data - clear cells
      clearDaySlots(grid, dayIndex)
    })
  }

  // Handle grid changes for specific employee
  const handleGridChange = (employeeId, gridData) => {
    if (isLoadingData[employeeId]) return

    calendarDays.map((day, dayIndex) => {
      const dayRow = gridData[dayIndex]
      const selectedIndices = dayRow
        .map((selected, i) => selected ? i : -1)
        .filter(i => i >= 0)

      if (selectedIndices.length === 0) {
        removeAttendance(period, employeeId, day.date)
        untrack(() => {
          attendanceData = {
            ...attendanceData,
            [employeeId]: { ...attendanceData[employeeId], [day.date]: undefined }
          }
        })
        return
      }

      const firstSlot = timeSlots[selectedIndices[0]]
      const lastSlot = timeSlots[selectedIndices[selectedIndices.length - 1]]

      updateAttendance(employeeId, day.date, {
        type: DAY_TYPES.REGULAR,
        entryTime: formatTimeFromHour(firstSlot.hour),
        exitTime: formatTimeFromHour(lastSlot.hour + lastSlot.duration)
      })
    })
  }


  // Update attendance data and persist
  const updateAttendance = (employeeId, date, data) => {
    // Update local state (untrack to prevent reactive loop)
    untrack(() => {
      attendanceData = {
        ...attendanceData,
        [employeeId]: {
          ...attendanceData[employeeId],
          [date]: data
        }
      }
    })

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
      <Icon icon="tabler:users-group" width="4rem" height="4rem" style="width: 4rem; height: 4rem" />
      <p>No employees to track attendance for</p>
      <p class="text-muted">Add employees first to record attendance</p>
    </div>
  {:else}
    <!-- Compact header with controls -->
    <div class="attendance-grids-section">
      <div class="grid-header">
        <div class="header-content">
          <div class="header-title">
            <h4>Attendance Tracking - {period}</h4>
            <p class="text-muted">Click and drag to mark working hours. Empty days = no work/absent. Rows = days, Columns = time slots (1-hour for 8-16, 15-min for 16-20)</p>
          </div>
          <div class="header-actions">
            <div class="attendance-summary">
              <span>{employees.length} employees</span>
              <span>{calendarDays.length} days</span>
            </div>
            <button
              class="toggle-all-btn"
              onclick={() => {
                const allExpanded = employees.every(emp => expandedEmployees[emp.id])
                expandedEmployees = employees.reduce((acc, emp) => {
                  acc[emp.id] = !allExpanded
                  return acc
                }, {})
              }}
            >
              <Icon icon="tabler:list" width="2.5rem" height="2.5rem" style="width: var(--icon-size); height: var(--icon-size)" />
              {employees.every(emp => expandedEmployees[emp.id]) ? 'Collapse All' : 'Expand All'}
            </button>
          </div>
        </div>
      </div>

      {#each employees as employee}
        <div class="employee-attendance-section" class:collapsed={!expandedEmployees[employee.id]}>
          <button
            class="employee-header"
            onclick={() => {
              expandedEmployees = { ...expandedEmployees, [employee.id]: !expandedEmployees[employee.id] }
            }}
          >
            <div class="employee-info">
              <Icon icon={expandedEmployees[employee.id] ? "tabler:chevron-down" : "tabler:chevron-right"} width="2.5rem" height="2.5rem" style="width: var(--icon-size); height: var(--icon-size)" />
              <h5>{employee.name}</h5>
            </div>
            <span class="employee-meta">{employee.gender} • {employee.maritalStatus}</span>
          </button>
          <div 
            id="attendance-grid-{employee.id}" 
            class="attendance-grid-container"
            style:display={expandedEmployees[employee.id] ? 'grid' : 'none'}
          >
            {#if !attendanceGrids[employee.id]}
              <div class="grid-loading">
                <Icon icon="line-md:loading-loop" width="3rem" height="3rem" style="width: 3rem; height: 3rem" />
                <span>Loading attendance grid...</span>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style lang="sass">
  @use "../styles.sass" as *

  .attendance-container
    @extend %grid
    gap: 0.5rem
    padding-top: 0.5rem

  .attendance-summary
    @extend %flex
    gap: 1rem
    color: var(--fg-muted)
    font-size: 0.875rem

    span
      padding: 0.75rem 1.5rem
      font-weight: 700
      font-size: 1.2rem
      cursor: default
      border-radius: 0.5rem
      transition: all 0.3s ease
      position: relative
      overflow: hidden

      &::after
        content: ''
        position: absolute
        top: 0
        left: -100%
        width: 100%
        height: 100%
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)
        transition: left 0.5s ease

      &:hover::after
        left: 100%

      // First span (employees count)
      &:nth-child(1)
        color: var(--primary)
        background: var(--primary-bg)
        border: 2px solid var(--primary)

        &:hover
          transform: scale(1.05)
          box-shadow: 0 4px 12px color-mix(in oklab, var(--primary) 25%, transparent)

      // Second span (days count)
      &:nth-child(2)
        background: linear-gradient(135deg, var(--info-bg) 0%, color-mix(in oklab, var(--info) 30%, transparent) 100%)
        color: var(--info)
        border: 2px solid var(--info)

        &:hover
          transform: scale(1.05)
          box-shadow: 0 4px 12px color-mix(in oklab, var(--info) 25%, transparent)

  .toggle-all-btn
    @extend %button-base
    @extend %button-outline
    padding: 0.75rem 1.25rem
    font-size: 1.15rem
    position: relative
    overflow: hidden

    &::before
      content: ''
      position: absolute
      top: 50%
      left: 50%
      width: 0
      height: 0
      border-radius: 50%
      background: var(--primary-bg)
      transform: translate(-50%, -50%)
      transition: width 0.4s ease, height 0.4s ease

    &:hover
      background: var(--primary-bg)
      color: var(--primary)
      border-color: var(--primary)
      transform: translateY(-2px)
      box-shadow: 0 4px 12px color-mix(in oklab, var(--primary) 25%, transparent)

      &::before
        width: 300px
        height: 300px

  .attendance-grids-section
    @extend %card-base
    margin-bottom: 0.5rem
    max-width: 100%
    overflow: hidden
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08)

    .grid-header
      margin-bottom: 1rem
      padding: 1rem 1.25rem
      background: linear-gradient(135deg, var(--surface-muted) 0%, var(--surface-secondary) 100%)
      border-radius: var(--radius)
      border: 2px solid var(--border-muted)

      .header-content
        @extend %flex-between
        gap: 2rem
        align-items: flex-start

        @media (max-width: 900px)
          flex-direction: column
          gap: 1rem

      .header-title
        flex: 1
        min-width: 0

        h4
          margin: 0 0 0.5rem 0
          @extend %gradient-text
          font-size: 1.75rem

        p
          margin: 0
          font-size: 1.05rem
          color: var(--fg-muted)
          line-height: 1.5

      .header-actions
        @extend %flex
        gap: 1rem
        align-items: center
        flex-shrink: 0

        @media (max-width: 900px)
          width: 100%
          justify-content: space-between

  .employee-attendance-section
    margin-bottom: 0.5rem
    background: var(--surface-secondary)
    border-radius: var(--radius)
    border: 3px solid var(--border-muted)
    overflow: hidden
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
    position: relative

    &:last-child
      margin-bottom: 0

    &.collapsed
      background: var(--surface-muted)
      border-color: transparent
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1)

      &:hover
        border-color: var(--border-muted)
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15)
        transform: translateY(-2px)

    &:not(.collapsed)
      border-color: var(--primary)
      box-shadow: 0 4px 20px color-mix(in oklab, var(--primary) 20%, transparent)

    .employee-header
      @extend %flex-between
      width: 100%
      padding: 0.875rem 1.25rem
      background: transparent
      cursor: pointer
      transition: all 0.3s ease
      text-align: left
      position: relative

      &::before
        content: ''
        position: absolute
        left: 0
        top: 0
        bottom: 0
        width: 4px
        background: var(--primary)
        transform: scaleY(0)
        transition: transform 0.3s ease
        transform-origin: top

      &:hover
        background: var(--surface-medium)
        padding-left: 2rem

        &::before
          transform: scaleY(1)

        .employee-info h5
          color: var(--secondary)
          transform: translateX(0.5rem)

        .employee-meta
          color: var(--fg)

      .employee-info
        @extend %flex
        gap: 1rem
        align-items: center
        transition: all 0.3s ease

        :global(svg)
          transition: all 0.3s ease
          color: var(--primary)

        h5
          margin: 0
          color: var(--primary)
          font-size: 1.5rem
          font-weight: 600
          transition: all 0.3s ease

      .employee-meta
        color: var(--fg-muted)
        font-size: 1.3rem
        transition: all 0.3s ease
        font-weight: 500

  .attendance-grid-container
    display: grid
    border-top: 2px solid var(--border-muted)
    padding: 1.5rem
    overflow-x: auto
    overflow-y: auto
    max-height: 70vh
    min-height: 300px
    width: 100%
    background: var(--bg)
    animation: slideDown 0.3s ease-out
    position: relative

    @keyframes slideDown
      from
        opacity: 0
        max-height: 0
        padding-top: 0
        padding-bottom: 0
      to
        opacity: 1
        max-height: 70vh
        padding-top: 1.5rem
        padding-bottom: 1.5rem

    // Thick scrollbars
    &::-webkit-scrollbar
      width: 16px
      height: 16px

    &::-webkit-scrollbar-track
      background: var(--surface-muted)
      border-radius: 8px

    &::-webkit-scrollbar-thumb
      background: var(--border)
      border-radius: 8px
      border: 3px solid var(--surface-muted)
      transition: background 0.2s ease

      &:hover
        background: var(--primary)

    // Firefox scrollbar
    scrollbar-width: auto
    scrollbar-color: var(--border) var(--surface-muted)

  .grid-loading
    @extend %flex
    flex-direction: column
    align-items: center
    justify-content: center
    gap: 1rem
    min-height: 300px
    color: var(--fg-muted)

    :global(svg)
      color: var(--primary)

    span
      font-size: 1.2rem
      font-weight: 500

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
