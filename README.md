<div align="center">
    <img src="public/logo.png" height="128" />
    <h1>FlexiPayroll</h1>
    <h5>A lightweight, browser-based payroll management system for small businesses</h5>
</div>

---

FlexiPayroll is a modern, client-side payroll management system designed for small businesses. It runs entirely in the browser with no backend required—all data is stored locally in your browser. The system automates monthly salary calculations based on attendance tracking, configurable business rules, and employee-specific adjustments.

### Key Features

- **Employee Management**: Add and manage employees with attributes like marital status, gender, and monthly salary
- **Attendance Tracking**: Record daily attendance with entry/exit times using an interactive time grid
- **Flexible Day Types**: Support for regular workdays, holidays, paid leave, and unpaid leave
- **Configurable Rules**: Customizable bonus calculations (E, S, K, M, T) and deductions (insurance)
- **Adjustments**: Add per-employee adjustments with optional comments
- **Salary Reports**: Generate detailed salary breakdowns with all components
- **Data Persistence**: All data stored locally in browser (localStorage)
- **Dark Mode**: Built-in theme switching
- **Zero Dependencies**: Minimal external dependencies, runs entirely client-side

## Quick Start

### Prerequisites

- Node.js 18+ or Bun
- npm, yarn, pnpm, or bun

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build

```bash
# Build for production
npm run build
```

Output will be in the `dist/` directory.

## Usage

### Workflow

1. **Configuration**: Set up working days, bonus amounts, and other business rules
2. **Employees**: Add employees with their monthly salary and attributes
3. **Attendance**: Record daily attendance for each employee (entry/exit times)
4. **Adjustments**: Add any manual adjustments per employee if needed
5. **Reports**: View and export salary breakdowns

### Data Management

- All data is stored in browser localStorage
- Data persists across browser sessions
- Export/import functionality available for backups
- No server or database required

## Development

The project follows functional programming principles:
- Pure functions for calculations
- Declarative, composable code
- Minimal nesting and complexity
- Rules-based configuration system

## License

[AGPL-3.0](LICENSE)
