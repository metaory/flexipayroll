import './style.css'
import { createTabs } from './ui.js'
import { initEmployeeComponent } from './components/employee.js'
import { initAttendanceComponent } from './components/attendance.js'
import { initPayrollComponent } from './components/payroll.js'
import { initConfigComponent } from './components/config.js'

// Initialize the application
const initApp = () => {
  // Create app container
  const appContainer = document.querySelector('#app')

  // Create app header
  const header = document.createElement('header')
  header.innerHTML = `
    <div class="app-header">
      <h1><span class="highlight">X</span>Payroll</h1>
      <p>Simple Payroll Management System</p>
    </div>
  `

  // Create main content area
  const main = document.createElement('main')

  // Create tabs for different sections
  const tabs = createTabs([
    {
      label: 'Employees',
      content: initEmployeeComponent()
    },
    {
      label: 'Attendance',
      content: initAttendanceComponent()
    },
    {
      label: 'Payroll',
      content: initPayrollComponent()
    },
    {
      label: 'Configuration',
      content: initConfigComponent()
    }
  ])

  main.appendChild(tabs)

  // Create footer
  const footer = document.createElement('footer')
  footer.innerHTML = `
    <div class="app-footer">
      <p>&copy; ${new Date().getFullYear()} XPayroll - v0.1.0</p>
    </div>
  `

  // Assemble the app
  appContainer.appendChild(header)
  appContainer.appendChild(main)
  appContainer.appendChild(footer)
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp)
