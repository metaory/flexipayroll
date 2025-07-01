# Business Rules & Domain Knowledge

## Core Concepts

### Working Time
- **Standard day**: 8 hours (including 1-hour lunch break)
- **Working days per month**: Configurable parameter (not fixed at 22)
- **Daily rate**: Monthly salary ÷ working days per month
- **Hourly rate**: Daily rate ÷ 8

### Day Types
- **Regular**: Entry/exit times required for hourly calculation
- **Holiday**: 8 hours credited automatically
- **Paid Leave**: 8 hours credited automatically  
- **Unpaid Leave**: 0 hours, no pay

## Salary Components

### Bonuses
All bonuses are configurable and apply monthly:

- **Bonus E**: 5 working days × daily rate
- **Bonus S**: 2.5 working days × daily rate
- **Bonus K**: Fixed 14 million IDR (applies to everyone)
- **Bonus M**: Fixed 9 million IDR (applies to everyone)
- **Bonus T**: Fixed 5 million IDR (married employees only)

### Deductions
- **Insurance (Deduct I)**: 7% of total calculated salary (includes all bonuses and adjustments)

### Adjustments
Manual positive/negative amounts per employee with optional comments included in salary breakdown report.

## Configuration System

### Types
- **Global**: Apply to all employees (bonuses K, M)
- **Conditional**: Based on employee attributes (marital status, gender)
- **Monthly override**: Changes for current month only
- **Persistent**: Changes become new defaults for following months

### Employee Data
- **Attributes**: Name, marital status, gender, monthly salary
- **Update frequency**: Can be changed every month before payroll
- **Persistence**: Changes become new defaults for following months

## Calculation Process

### Step-by-Step Flow
1. Calculate basic salary: Hours worked × hourly rate
2. Add all applicable bonuses (E, S, K, M, T if married)
3. Add any adjustments (positive/negative with comments)
4. Apply insurance deduction: 7% of total from step 3

### Formula
```
Final Salary = (Basic + Bonuses + Adjustments) × (1 - 0.07)
```

Where:
- Basic = Hours worked × hourly rate
- Bonuses = E + S + K + M + T (if married)
- Insurance = 7% of (Basic + Bonuses + Adjustments)

## System Workflow

### Monthly Process
1. **Start of Month**: Update employee data or configurations if needed
2. **During Month**: Record daily attendance for each employee
3. **End of Month**: Calculate payroll and generate reports
4. **Review**: Check calculations and add any adjustments

### Data Management
- **Export**: Save data to JSON file for backup
- **Import**: Restore data from backup file
- **Reset**: Clear all data and start fresh

## Usage Guidelines

### Employee Setup
- Add each employee with name, marital status, gender, and monthly salary
- Employee data can be updated monthly and becomes new defaults

### Configuration
- Set working days per month, bonus amounts, and working hours
- Changes can apply to current month or become new defaults

### Attendance Recording
- For each day, choose type and enter times:
  - **Regular**: Enter entry and exit times for hourly calculation
  - **Holiday**: Automatically credited 8 hours
  - **Paid Leave**: Automatically credited 8 hours
  - **Unpaid Leave**: No hours credited

### Payroll Calculation
- View salary breakdown for each employee
- Add adjustments if needed with optional comments
- Generate reports

## Important Notes

- Regular days require both entry and exit times for hourly calculation
- Holiday and paid leave days are automatically credited 8 hours
- Married employees receive bonus T automatically
- All bonuses are configurable and can be changed monthly
- Insurance deduction is 7% of total salary (includes all bonuses and adjustments)
- Working days per month is configurable and affects daily/hourly rate calculations 