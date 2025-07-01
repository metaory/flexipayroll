# XPayroll System Understanding & Plan

## System Overview

XPayroll is a manual payroll management system that automates salary calculations for employees based on attendance records and configurable rules. The system replaces manual calculations with an automated, configurable solution.

## Core Requirements Analysis

### 1. Data Structure

**Employees:**
- Basic info: name, gender, marital status
- Monthly salary (base for calculations)
- Unique ID for tracking

**Attendance:**
- Manual entry/exit times per day
- Day types: regular, holiday with pay, paid leave, unpaid leave
- Monthly collection per employee

**Configuration:**
- Global settings that apply to all employees
- Conditional settings based on employee attributes (marital status, gender)
- Configurable monthly with persistence for future months

### 2. Calculation Rules

**Base Calculations:**
- Working day = 8 hours (including 1-hour lunch)
- Daily rate = Monthly salary ÷ 22 working days
- Hourly rate = Daily rate ÷ 8 hours
- Basic salary = Hours worked × Hourly rate

**Bonuses (Configurable):**
- **Bonus E**: 5 working days × Daily rate
- **Bonus S**: 2.5 working days × Daily rate  
- **Bonus K**: Fixed 14 million (global)
- **Bonus M**: Fixed 9 million (global)
- **Bonus T**: Fixed 5 million (married employees only)

**Deductions:**
- **Deduct I**: 7% of total calculated salary (includes all bonuses)

**Adjustments:**
- Manual positive/negative amounts per employee
- Optional comments for breakdown report

### 3. Workflow

1. **Setup Phase**: Configure employees and base configs
2. **Monthly Process**: 
   - Enter attendance data per employee
   - Optionally modify configs for the month (override or persistent)
   - Calculate salaries with adjustments
   - Generate breakdown reports
3. **Persistence**: Changes become defaults for future months

### 4. Configuration Change Nature

**Two Types of Changes:**
1. **Monthly Override**: Change applies only to current month
2. **Persistent Change**: Change becomes new default for future months

**Configuration Hierarchy:**
1. Employee-specific overrides (highest priority)
2. Monthly overrides
3. Conditional rules (based on employee attributes)
4. Global defaults (lowest priority)

## Current Implementation Status

### ✅ Implemented
- Basic project structure with Vite
- Business logic core with all payroll rules and calculations
- Employee CRUD operations with validation
- Reactive store with localStorage persistence
- Core calculation engine with bonus/deduction rules
- Basic UI components (tabs, forms, tables)
- Payroll calculation with breakdown
- Configuration management

### 🔄 Partially Implemented
- Attendance tracking (basic structure exists)
- Salary calculation (core logic complete)
- UI components (functional but needs refinement)

### ❌ Missing/Incomplete
- Comprehensive attendance management
- Detailed salary breakdown reports
- Print/export functionality
- Data validation and error handling
- Advanced configuration management
- Month-over-month comparison
- Audit trail for changes

## Technical Architecture

### Frontend Stack
- **Framework**: Vanilla JavaScript (no frameworks)
- **Build Tool**: Vite
- **Storage**: localStorage with Proxy-based reactivity
- **UI**: Custom components with modern CSS

### Code Organization
```
src/
├── main.js          # App initialization
├── core.js          # Business logic & calculation rules
├── store.js         # Data management & persistence
├── calc.js          # Legacy calculation exports (deprecated)
├── ui.js            # UI utilities & components
├── style.css        # Styling
└── components/      # Feature components
    ├── employee.js  # Employee management
    ├── attendance.js # Attendance tracking
    ├── payroll.js   # Salary calculation
    └── config.js    # Configuration management
```

## Implementation Plan

### Phase 1: Core Functionality Completion
1. **Complete Attendance Management**
   - Daily entry/exit time input
   - Day type selection (regular/holiday/paid leave/unpaid leave)
   - Monthly view with calendar interface
   - Bulk operations for efficiency

2. **Enhance Configuration System**
   - Global vs conditional config management
   - Month-specific overrides
   - Configuration history/audit trail
   - Validation and constraints

3. **Improve Salary Calculation**
   - Real-time calculation updates
   - Detailed breakdown display
   - Adjustment management per employee
   - Calculation validation

### Phase 2: Reporting & Export
1. **Salary Reports**
   - Individual employee breakdowns
   - Company-wide summary
   - Month-over-month comparisons
   - Printable formats

2. **Data Export**
   - PDF generation
   - Excel/CSV export
   - Backup/restore functionality

### Phase 3: Advanced Features
1. **Data Management**
   - Import/export capabilities
   - Data validation and cleaning
   - Backup and recovery

2. **User Experience**
   - Keyboard shortcuts
   - Bulk operations
   - Search and filtering
   - Responsive design

3. **System Robustness**
   - Error handling
   - Data validation
   - Performance optimization
   - Offline capability

## Key Design Decisions

### 1. Vanilla JavaScript Approach
- **Pros**: No dependencies, fast loading, full control
- **Cons**: More boilerplate, manual state management
- **Rationale**: Aligns with user preferences for minimal dependencies

### 2. localStorage Persistence
- **Pros**: Simple, works offline, no server needed
- **Cons**: Limited storage, no multi-user support
- **Rationale**: Suitable for single-company use case

### 3. Proxy-based Reactivity
- **Pros**: Automatic UI updates, clean API
- **Cons**: Browser compatibility considerations
- **Rationale**: Modern approach that simplifies state management

### 4. Component-based Architecture
- **Pros**: Modular, maintainable, testable
- **Cons**: Slight overhead for simple components
- **Rationale**: Scales well as system grows

## Risk Assessment

### Technical Risks
1. **Browser Compatibility**: Proxy objects not supported in older browsers
2. **Storage Limits**: localStorage has size limitations
3. **Data Loss**: No backup mechanism currently

### Business Risks
1. **Calculation Accuracy**: Complex rules may have edge cases
2. **Data Integrity**: Manual entry prone to errors
3. **Compliance**: May need to meet local labor law requirements

## Success Metrics

1. **Accuracy**: 100% calculation accuracy vs manual process
2. **Efficiency**: 80% reduction in payroll processing time
3. **Usability**: Intuitive interface requiring minimal training
4. **Reliability**: 99.9% uptime with data integrity

## Next Steps

1. **Immediate**: Complete attendance management component
2. **Short-term**: Enhance configuration system
3. **Medium-term**: Implement comprehensive reporting
4. **Long-term**: Add advanced features and optimizations

---

*This document will be updated as the implementation progresses and requirements evolve.* 