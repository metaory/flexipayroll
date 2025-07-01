# XPayroll Documentation

This directory contains all the documentation for the XPayroll system.

## Documentation Structure

### 📋 [BUSINESS_RULES.md](./BUSINESS_RULES.md)
Complete business logic and rules for the payroll system:
- Working time rules and calculations
- Bonus and deduction rules
- Configuration management
- Employee attributes and validation
- Salary calculation process
- Data persistence rules

### 🏗️ [UNDERSTANDING.md](./UNDERSTANDING.md)
Technical implementation overview:
- System architecture and design decisions
- Current implementation status
- Implementation plan and phases
- Risk assessment and success metrics
- Technical stack and code organization

### 💾 [STORAGE_PLAN.md](./STORAGE_PLAN.md)
Data storage and persistence strategy:
- Current localStorage implementation
- Storage options analysis
- Import/export functionality
- Data structure and schema
- Migration and backup strategies

## System Overview

XPayroll is a **single-user, local-first** payroll management system that:
- Runs entirely in the browser
- Uses localStorage for data persistence
- Requires no server or authentication
- Supports import/export for backup/restore
- Automates manual payroll calculations

## Key Design Principles

1. **Simplicity First**: No unnecessary complexity
2. **Local-First**: Works offline, no server required
3. **Single User**: No multi-user complexity
4. **File-Based**: Easy backup/restore via JSON files
5. **Business Rules**: Clear separation of business logic

---

*All documentation should be updated as the system evolves.* 