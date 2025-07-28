# Config Snapshot Strategy

## Core Principle
**Config changes should be immediate in the config editor, but historical salary calculations remain unchanged.**

## Data Flow

### 1. **Config Editor (Immediate Updates)**
```
User changes config → localConfig updates → UI reflects changes immediately
```
- ✅ **Immediate feedback** - User sees changes instantly
- ✅ **Unsaved state** - Clear indication of pending changes
- ✅ **Save/Cancel** - User controls when to apply changes

### 2. **Salary Calculations (Snapshot-Based)**
```
Calculate salary → Capture config snapshot → Store with salary record
```
- ✅ **Historical accuracy** - Old calculations stay the same
- ✅ **Config snapshot** - Each salary record includes config state
- ✅ **Efficient storage** - Minimal config data per record

## Implementation Details

### **Config Snapshots**
```javascript
// Minimal snapshot for storage efficiency
{
  workdayHours: 8,
  workingDaysPerMonth: 22,
  bonuses: { E: { value: 5 }, S: { value: 2.5 }, ... },
  deductions: { insurance: { value: 0.07 } },
  timestamp: 1703123456789
}
```

### **Salary Records**
```javascript
// Each salary record includes config snapshot
{
  components: { basicSalary, bonusE, bonusS, ... },
  period: { workdays, hours, byType },
  subtotal, finalSalary,
  configSnapshot: { ... },  // ← Config at calculation time
  configSummary: { ... },   // ← Human-readable summary
  employeeId, year, month, calculatedAt
}
```

### **UI Representation**
- **Config Editor**: Shows current config values (immediate updates)
- **Salary Reports**: Shows config version used for each calculation
- **Config Notice**: Indicates when historical vs current config is used

## Key Behaviors

### ✅ **Config Editor**
- Changes reflect immediately in UI
- Unsaved changes clearly indicated
- Save button applies changes to global config
- Cancel button reverts to last saved state

### ✅ **Salary Calculations**
- New calculations use current config (with snapshot)
- Existing calculations remain unchanged
- Manual "Recalculate" option available
- Clear indication of config version used

### ✅ **Data Efficiency**
- Minimal config snapshots (only essential values)
- Smart caching (don't recalculate if record exists)
- Efficient storage and retrieval

## Alignment Check

### **Current Implementation Status**
- ✅ Config editor shows immediate updates
- ✅ Salary records include config snapshots
- ✅ Historical calculations preserved
- ✅ UI shows config version information
- ✅ Manual recalculation available

### **Next Steps**
1. **Test config change flow** - Ensure immediate updates in config editor
2. **Verify snapshot storage** - Check data efficiency
3. **Review UI clarity** - Ensure users understand config versioning
4. **Performance testing** - Verify minimal overhead

## Benefits
- **Historical accuracy** - Old reports never change
- **Immediate feedback** - Config changes visible instantly
- **Data efficiency** - Minimal storage overhead
- **User control** - Choose when to apply config changes
- **Audit trail** - Complete history of config changes 