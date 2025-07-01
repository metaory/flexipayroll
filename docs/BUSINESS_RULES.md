# XPayroll Business Rules & Configuration

## System Overview

XPayroll automates manual payroll calculations for employees based on attendance records and configurable business rules. The system replaces manual calculations with an automated, rule-based solution.

## Core Business Rules

### 1. Working Time Rules

**Standard Working Day:**
- **Hours per day**: 8 hours (including 1-hour lunch break)
- **Working days per month**: 22 days (standard)
- **Hourly calculation**: Based on actual entry/exit times

**Day Types:**
- **Regular**: Normal working day with entry/exit times
- **Holiday**: Holiday with pay (credited as 8 hours)
- **Paid Leave**: Paid leave (credited as 8 hours)
- **Unpaid Leave**: Unpaid leave (0 hours, no pay)

### 2. Salary Calculation Rules

**Base Calculations:**
```
Daily Rate = Monthly Salary ÷ 22 working days
Hourly Rate = Daily Rate ÷ 8 hours
Basic Salary = Total Hours Worked × Hourly Rate
```

**Working Hours Calculation:**
```
Working Hours = Exit Time - Entry Time (in hours, rounded to 2 decimal places)
```

### 3. Bonus Rules

All bonuses are configurable and can be modified monthly. Changes persist for future months.

**Bonus E:**
- **Type**: Daily rate multiplier
- **Calculation**: 5 working days × Daily rate
- **Condition**: Applies to all employees
- **Configurable**: Yes (default: 5 days)

**Bonus S:**
- **Type**: Daily rate multiplier
- **Calculation**: 2.5 working days × Daily rate
- **Condition**: Applies to all employees
- **Configurable**: Yes (default: 2.5 days)

**Bonus K:**
- **Type**: Fixed amount
- **Calculation**: Fixed 14 million IDR
- **Condition**: Applies to all employees
- **Configurable**: Yes (default: 14,000,000)

**Bonus M:**
- **Type**: Fixed amount
- **Calculation**: Fixed 9 million IDR
- **Condition**: Applies to all employees
- **Configurable**: Yes (default: 9,000,000)

**Bonus T:**
- **Type**: Fixed amount
- **Calculation**: Fixed 5 million IDR
- **Condition**: Married employees only
- **Configurable**: Yes (default: 5,000,000)

### 4. Deduction Rules

**Insurance Deduction (Deduct I):**
- **Type**: Percentage of total
- **Calculation**: 7% of total calculated salary (includes all bonuses)
- **Condition**: Applies to all employees
- **Configurable**: Yes (default: 7%)

### 5. Adjustment Rules

**Manual Adjustments:**
- **Type**: Positive or negative amounts
- **Purpose**: Manual corrections, special bonuses, penalties
- **Requirements**: Amount + optional comment
- **Scope**: Per employee, per month

## Configuration Management

### Configuration Types

**1. Global Configurations:**
- Apply to all employees
- Examples: workday hours, bonus K, bonus M, insurance deduction

**2. Conditional Configurations:**
- Apply based on employee attributes
- Examples: bonus T (married employees only)

**3. Employee-Specific Configurations:**
- Override global/conditional rules for specific employees
- Can be set monthly

### Configuration Change Rules

**Monthly Override:**
- Any configuration can be changed for a specific month
- Changes apply only to that month's payroll
- Does not affect future months

**Persistent Changes:**
- Changes made during payroll become new defaults
- Future months use the updated values
- Maintains configuration history

**Configuration Hierarchy:**
1. Employee-specific overrides (highest priority)
2. Monthly overrides
3. Conditional rules (based on employee attributes)
4. Global defaults (lowest priority)

## Employee Attributes

### Required Attributes
- **Name**: Employee full name
- **Gender**: male/female (for future conditional rules)
- **Marital Status**: single/married (affects bonus T)
- **Monthly Salary**: Base salary for calculations

### Attribute Rules
- All attributes can be modified monthly
- Changes persist for future months
- Marital status changes affect bonus T eligibility

## Attendance Management

### Data Collection
- **Manual Entry**: Entry and exit times per day
- **Day Type Selection**: Regular, holiday, paid leave, unpaid leave
- **Monthly Scope**: Data collected per employee per month

### Validation Rules
- Entry time must be before exit time
- Working hours cannot exceed 24 hours per day
- Regular days require both entry and exit times
- Holiday/paid leave days are credited 8 hours automatically

## Salary Calculation Process

### Step-by-Step Process

1. **Attendance Summary**
   - Calculate total hours worked
   - Count days by type (regular, holiday, paid leave, unpaid leave)

2. **Basic Salary**
   - Calculate hourly rate from monthly salary
   - Multiply by total hours worked

3. **Bonus Calculations**
   - Apply all applicable bonuses based on rules
   - Use current configuration values

4. **Adjustments**
   - Add/subtract manual adjustments
   - Include adjustment comments in breakdown

5. **Subtotal**
   - Sum: Basic salary + all bonuses + adjustments

6. **Deductions**
   - Calculate insurance deduction (7% of subtotal)

7. **Final Total**
   - Final salary = Subtotal - deductions

### Calculation Formula

```
Final Salary = (Basic Salary + Bonus E + Bonus S + Bonus K + Bonus M + Bonus T + Adjustments) × (1 - Insurance Deduction)
```

Where:
- Basic Salary = Hours Worked × (Monthly Salary ÷ 22 ÷ 8)
- Bonus E = Daily Rate × Config.BonusE
- Bonus S = Daily Rate × Config.BonusS
- Bonus K = Config.BonusK
- Bonus M = Config.BonusM
- Bonus T = Config.BonusT (if married)
- Insurance Deduction = Config.DeductI

## Data Persistence Rules

### Storage Strategy
- **Employees**: Persistent data, can be modified monthly
- **Attendance**: Monthly records per employee
- **Configurations**: Current values + monthly overrides
- **Adjustments**: Monthly records per employee

### Data Lifecycle
1. **Setup**: Initial employee and configuration setup
2. **Monthly Process**: Attendance entry → calculation → adjustments → final salary
3. **Persistence**: Changes become defaults for future months

## Business Constraints

### Validation Rules
- Employee names must be at least 2 characters
- Monthly salary must be greater than 0
- Working hours must be positive and reasonable
- Configuration values must be within valid ranges

### Business Logic
- Married employees receive bonus T
- All employees receive other bonuses (E, S, K, M)
- Insurance deduction applies to total calculated amount
- Adjustments can be positive or negative

## Future Considerations

### Extensible Rules
- Gender-based rules (currently not used)
- Seniority-based bonuses
- Performance-based adjustments
- Department-specific rules

### Compliance Requirements
- Local labor law compliance
- Tax calculation integration
- Audit trail requirements
- Data retention policies

---

*This document defines the complete business logic for the XPayroll system. All calculations and rules must follow these specifications.* 