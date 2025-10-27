Here's a POLISHED version of your payroll system description. It's structured, minimal, and designed for clarity, making it suitable for both technical reference and onboarding documents for this project.


---

📄 Payroll System Specification (POLISHED)

1. Overview

This payroll system automates monthly salary calculations for employees based on attendance, predefined business rules, and configurable parameters. It supports per-employee adjustments and generates a clear salary breakdown.


---

2. Core Concepts

2.1. Working Time

Standard Workday: 8 hours (includes 1-hour lunch break)

Working Days per Month: Configurable per payroll period

Daily Rate:
Daily Rate = Monthly Salary ÷ Working Days

Hourly Rate:
Hourly Rate = Daily Rate ÷ 8



---

2.2. Day Types

Type	Hours Credited	Notes

Regular	Based on entry/exit	Requires attendance times
Holiday	8 hours	Paid automatically
Paid Leave	8 hours	Paid automatically
Unpaid Leave	0 hours	No pay



---

3. Salary Breakdown

3.1. Bonuses (All configurable, applied monthly)

Bonus	Amount	Applies To

E	5 × Daily Rate	All employees
S	2.5 × Daily Rate	All employees
K	14 million IDR (fixed)	All employees
M	9 million IDR (fixed)	All employees
T	5 million IDR (fixed)	Married employees only



---

3.2. Deductions

Insurance (Deduct I): 7% of total gross salary
Gross salary includes basic pay, all bonuses, and adjustments.



---

3.3. Adjustments

Manual positive/negative amounts per employee

Optional comment included in salary report



---

4. Employee & Configuration Management

4.1. Employee Data

Attribute	Notes

Name	Required
Marital Status	Affects eligibility for Bonus T
Gender	Reserved for future rules (optional)
Monthly Salary	Base for all salary calculations


Employee data can be updated before payroll each month

Changes persist as new defaults for following months



---

4.2. Configuration Types

Type	Examples	Notes

Global	Bonus K, Bonus M	Apply to all employees
Conditional	Bonus T (married only)	Based on employee attributes
Monthly Override	Any config	Temporary for current payroll only
Persistent	Any config	Becomes new default for future months



---

5. Calculation Process

5.1. Step-by-Step

1. Calculate Basic Salary:
Hours Worked × Hourly Rate


2. Apply Bonuses (E, S, K, M, T if married)


3. Apply Adjustments (manual inputs)


4. Apply Insurance Deduction: 7% of total from step 3


5. Generate detailed salary breakdown




---

5.2. Formula

Final Salary = (Basic Salary + Bonuses + Adjustments) × (1 - 0.07)

Where:

Basic Salary = Hours Worked × Hourly Rate

Bonuses = Sum of all applicable bonuses

Adjustments = Manual additions or deductions

Insurance Deduction = 7% of gross total before deduction



---

6. System Workflow

6.1. Monthly Routine

Phase	Action

Start of Month	Update employee data & configurations
Throughout Month	Record daily attendance per employee
End of Month	Calculate salaries & generate reports
Final Review	Apply adjustments, review, finalize



---

6.2. Data Operations

Export: Backup all data to JSON file

Import: Restore from backup

Reset: Clear system to start fresh



---

7. Attendance Recording

For each employee, daily records include:

Day Type	Data Required

Regular	Entry and exit times
Holiday	No input (8 hours credited)
Paid Leave	No input (8 hours credited)
Unpaid Leave	No input (0 hours credited)



---

8. Notes & Considerations

Configurable parameters can be adjusted each month

Changes made before payroll affect future defaults

Bonuses, deductions, and attendance rules are fully transparent in reports

Married status directly affects eligibility for Bonus T

Gender-based rules are reserved for future expansion



---

9. Future Extensions (Optional)

Gender-based bonuses or deductions

Overtime tracking

Partial day leaves

Automated attendance import (from timesheets or devices)