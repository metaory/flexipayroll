# XPayroll (vanilla-edition)

A lightweight, browser-based payroll management system built with vanilla JavaScript.

## Features

- 👤 Employee management
- 🕒 Attendance tracking
- 💰 Salary calculation with bonuses and deductions
- 📃 Detailed salary reports
- ⚙️ Configurable system parameters
- 💾 Persistent data storage using localStorage

## Getting Started

### Installation

1. Clone the repository
```bash
git clone https://github.com/metaory/xpayroll.git
cd xpayroll
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Usage Guide

### Managing Employees

1. Navigate to the "Employees" tab
2. Click "Add Employee" to create a new employee
3. Fill in the required details (name, gender, marital status, monthly salary)
4. View and manage employees in the table

### Recording Attendance

1. Navigate to the "Attendance" tab
2. Select a month and employee
3. For each day, click "Record" to add attendance data
4. Choose the day type (regular, holiday, paid/unpaid leave)
5. For regular days, enter entry and exit times

### Calculating Payroll

1. Navigate to the "Payroll" tab
2. Select the month for calculation
3. View the salary breakdown for each employee
4. Add adjustments if needed
5. Click "Print Report" to generate a printable salary report

### System Configuration

1. Navigate to the "Configuration" tab
2. Modify default values for calculations
3. Click "Save Configuration" to apply changes
4. Changes will affect future calculations

## Calculation Logic

Salaries are calculated based on:
- Monthly salary converted to hourly rate
- Actual hours worked for regular days
- Standard workday hours for holidays and paid leave
- Additional bonuses (E, S, K, M, T)
- Insurance deduction (7% by default)
- Manual adjustments with comments

## Data Storage

All data is stored in the browser's localStorage. There is no server component.

- To clear all data: Go to Configuration and click "Reset to Defaults"
- To backup data: Export your browser's localStorage data

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory and can be served by any static file server.

## Development

The project follows a modular architecture with clear separation of concerns:

- `components/`: UI components for different sections
- `store.js`: Data persistence and state management
- `calc.js`: Calculation logic
- `ui.js`: UI utilities and helper functions

## License

This project is licensed under the MIT License - see the LICENSE file for details.



