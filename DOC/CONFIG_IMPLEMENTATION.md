# Config Implementation Strategy

## Overview
Our config system ensures **historical accuracy** while providing **immediate feedback**. Config changes are immediate in the editor but don't affect existing salary calculations.

## 1. Config Storage Strategy

### **Global Config Store**
```javascript
// src/lib/stores.js
export const config = writable(getItem(STORAGE_KEYS.CONFIG) || DEFAULT_CONFIG)
```
- **Purpose**: Single source of truth for current configuration
- **Persistence**: Auto-saved to localStorage
- **Usage**: Used for new calculations and config editor

### **Local Config (Editor)**
```javascript
// src/components/Config.svelte
let localConfig = $state({ ...$config })
```
- **Purpose**: Immediate UI updates in config editor
- **Behavior**: Changes reflect instantly, saved only when user clicks "Save"
- **Benefits**: User sees changes immediately without affecting existing data

### **Config Snapshots (Historical)**
```javascript
// src/lib/core.js
export const createConfigSnapshot = (config) => ({
  workdayHours: config.workdayHours,
  workingDaysPerMonth: config.workingDaysPerMonth,
  bonuses: {
    E: { value: config.bonuses.E.value },
    S: { value: config.bonuses.S.value },
    K: { value: config.bonuses.K.value },
    M: { value: config.bonuses.M.value },
    T: { value: config.bonuses.T.value }
  },
  deductions: {
    insurance: { value: config.deductions.insurance.value }
  },
  timestamp: Date.now()
})
```
- **Purpose**: Capture config state at calculation time
- **Storage**: Minimal data (only essential values)
- **Benefits**: Historical accuracy, efficient storage

## 2. Config Usage in Payroll Calculations

### **Calculation Flow**
```javascript
// src/components/Payroll.svelte
const calculateAndStoreSalary = (employee) => {
  const existingRecord = getSalaryRecord(employee.id, $currentPeriod.year, $currentPeriod.month)
  
  if (existingRecord) {
    return existingRecord // Use cached result
  }
  
  // Calculate with current config + snapshot
  const salaryRecord = calculateSalaryRecord(employee, monthAttendance, adjustments, $config)
  storeSalaryRecord(employee.id, $currentPeriod.year, $currentPeriod.month, salaryRecord)
  return salaryRecord
}
```

### **Snapshot Integration**
```javascript
// src/lib/core.js
export const calculateSalaryWithSnapshot = (employee, attendanceData, adjustments = [], config = DEFAULT_CONFIG) => {
  const salaryBreakdown = calculateSalaryBreakdown(employee, attendanceData, adjustments, config)
  const configSnapshot = createConfigSnapshot(config)
  
  return {
    ...salaryBreakdown,
    configSnapshot,           // ← Config at calculation time
    configSummary: getConfigSummary(configSnapshot)  // ← Human-readable summary
  }
}
```

### **Smart Caching**
- **First calculation**: Uses current config, creates snapshot, stores result
- **Subsequent calculations**: Returns cached result (no recalculation)
- **Manual recalculation**: Clears cache, recalculates with current config

## 3. Config Display Strategy

### **Config Editor (Immediate Updates)**
```svelte
<!-- src/components/Config.svelte -->
<dl class="horizontal">
  <dt>Working Days:</dt>
  <dd>{localConfig.workingDaysPerMonth} days/month</dd>  <!-- ← Shows localConfig -->
  <dt>Workday Hours:</dt>
  <dd>{localConfig.workdayHours} hours/day</dd>          <!-- ← Immediate updates -->
</dl>
```
- **Data Source**: `localConfig` (immediate changes)
- **Behavior**: Updates instantly when user changes values
- **Save State**: Clear indication of unsaved changes

### **Salary Reports (Historical Config)**
```svelte
<!-- src/components/Payroll.svelte -->
<div class="config-version">
  <Icon icon="solar:settings-bold" width="1em" height="1em" />
  <span>Calculated with config: {salaryRecord.configSummary.workdayHours}h/day, 
        {salaryRecord.configSummary.workingDaysPerMonth} days/month, 
        {salaryRecord.configSummary.insuranceRate}% insurance</span>
</div>
```
- **Data Source**: `salaryRecord.configSummary` (historical snapshot)
- **Purpose**: Show which config was used for this specific calculation
- **Benefits**: Users understand historical context

### **Global Config Notice**
```svelte
<!-- src/components/Payroll.svelte -->
{#if hasSalaryRecords}
  <div class="config-notice">
    <Icon icon="solar:info-circle-bold" width="1em" height="1em" />
    <span>Salaries calculated with configuration from {timestamp}</span>
    <button class="secondary" onclick={recalculateAllSalaries}>
      <Icon icon="solar:refresh-bold" width="1.2em" height="1.2em" />
      Recalculate with Current Config
    </button>
  </div>
{/if}
```
- **Purpose**: Inform users about historical vs current config
- **Action**: Provide manual recalculation option
- **Visibility**: Only shown when historical records exist

## 4. Data Structure Examples

### **Global Config (Current)**
```javascript
{
  workdayHours: 8,
  workingDaysPerMonth: 22,
  bonuses: {
    E: { type: 'daily_rate_multiplier', value: 5, label: 'Bonus E' },
    S: { type: 'daily_rate_multiplier', value: 2.5, label: 'Bonus S' },
    // ... full config with types and labels
  },
  deductions: {
    insurance: { type: 'percentage', value: 0.07, label: 'Insurance Deduction' }
  }
}
```

### **Config Snapshot (Historical)**
```javascript
{
  workdayHours: 8,
  workingDaysPerMonth: 22,
  bonuses: {
    E: { value: 5 },      // ← Only essential values
    S: { value: 2.5 },
    K: { value: 14000000 },
    M: { value: 9000000 },
    T: { value: 5000000 }
  },
  deductions: {
    insurance: { value: 0.07 }
  },
  timestamp: 1703123456789
}
```

### **Config Summary (UI Display)**
```javascript
{
  workdayHours: 8,
  workingDaysPerMonth: 22,
  bonusE: 5,
  bonusS: 2.5,
  bonusK: 14000000,
  bonusM: 9000000,
  bonusT: 5000000,
  insuranceRate: "7.0"  // ← Formatted for display
}
```

### **Salary Record (Complete)**
```javascript
{
  components: { basicSalary, bonusE, bonusS, ... },
  period: { workdays, hours, byType },
  subtotal, finalSalary,
  configSnapshot: { ... },     // ← Historical config
  configSummary: { ... },      // ← Display-friendly summary
  employeeId, year, month, calculatedAt
}
```

## 5. Key Benefits

### **Historical Accuracy**
- Old salary calculations never change
- Complete audit trail of config changes
- Users can see exactly what config was used

### **Immediate Feedback**
- Config changes visible instantly in editor
- No delay or confusion about current state
- Clear save/cancel workflow

### **Data Efficiency**
- Minimal snapshot storage (only essential values)
- Smart caching prevents unnecessary recalculations
- Compact data structures

### **User Control**
- Choose when to apply config changes
- Manual recalculation option available
- Clear indication of saved vs unsaved state

## 6. Implementation Flow

```
1. User opens config editor
   ↓
2. localConfig = copy of global config
   ↓
3. User makes changes → localConfig updates → UI reflects immediately
   ↓
4. User clicks "Save" → global config = localConfig
   ↓
5. New salary calculations use current config + create snapshot
   ↓
6. Existing salary records remain unchanged (use historical snapshots)
   ↓
7. UI shows config version used for each calculation
```

## 7. Storage Efficiency

### **Config Snapshots**
- **Size**: ~200 bytes per snapshot
- **Content**: Only calculation-relevant values
- **Frequency**: One per salary calculation per period

### **Smart Caching**
- **Cache Key**: `employeeId_year_month`
- **Cache Duration**: Until manual recalculation
- **Cache Benefits**: No redundant calculations

### **Storage Location**
- **Global Config**: `localStorage.xpayroll_config`
- **Salary Records**: `localStorage.xpayroll_salary_records`
- **Backup/Restore**: Includes both config and salary records

This strategy ensures **minimal storage overhead** while maintaining **complete historical accuracy** and **immediate user feedback**. 