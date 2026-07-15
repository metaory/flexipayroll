import assert from 'node:assert/strict'
import { storage } from '../src/core.js'
import {
  BACKUP_DEFAULTS,
  buildBackupPayload,
  normalizeBackupData,
  parseLegacyPayload,
  readAllSessionData,
  validateBackupData
} from '../src/persist.js'
import { calculateEmployeePayroll } from '../src/payroll.js'
import { RULE_TYPES, RULE_CATEGORIES, CRITERIA_TYPES } from '../src/rules.js'

const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps

const mockStorage = () => {
  const data = {}
  return {
    data,
    get length() { return Object.keys(data).length },
    key: (i) => Object.keys(data)[i] ?? null,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => { data[key] = value },
    removeItem: (key) => { delete data[key] }
  }
}

const fixture = () => {
  const period = '2026-07'
  const employees = [
    {
      id: 'emp_a',
      name: 'Alice',
      gender: 'female',
      maritalStatus: 'married',
      childrenStatus: 'has_children',
      dailySalary: 200,
      yearsOfExperience: 3,
      probation: 'a',
      probationRulesA: ['insurance'],
      probationRulesB: []
    },
    {
      id: 'emp_b',
      name: 'Bob',
      gender: 'male',
      maritalStatus: 'single',
      childrenStatus: 'no_children',
      dailySalary: 150,
      yearsOfExperience: 1.5,
      probation: null,
      probationRulesA: [],
      probationRulesB: []
    }
  ]
  const rules = [
    {
      id: 'bonus_e',
      label: 'Bonus E',
      type: RULE_TYPES.DAYS_MULTIPLIER,
      value: 5,
      criteria: { appliesTo: [] },
      category: RULE_CATEGORIES.BONUS,
      order: 1,
      enabled: true
    },
    {
      id: 'insurance',
      label: 'Insurance Deduction',
      type: RULE_TYPES.PERCENTAGE_MONTHLY,
      value: 0.07,
      criteria: { appliesTo: [] },
      category: RULE_CATEGORIES.DEDUCTION,
      order: 2,
      enabled: true
    },
    {
      id: 'marital_bonus',
      label: 'Marital Bonus',
      type: RULE_TYPES.FIXED,
      value: 150000,
      criteria: { appliesTo: [CRITERIA_TYPES.MARRIED] },
      category: RULE_CATEGORIES.BONUS,
      order: 3,
      enabled: false
    }
  ]
  const basicConfig = {
    organizationName: 'Acme',
    workdayHours: 8,
    workingDaysPerMonth: 22,
    currencySymbol: 'Rp',
    locale: 'id-ID',
    monthDays: 30,
    firstDayWeekday: 'Monday',
    overtimeRate: 1.5,
    undertimeRate: 0.5,
    footerLabel: 'Confidential',
    printLabels: {
      monthSalary: 'Gaji bulan',
      dailySalary: 'Gaji harian',
      adjustments: 'Penyesuaian',
      adjustment: 'PENYESUAIAN',
      totalAdjustments: 'Total penyesuaian',
      attendance: 'Kehadiran',
      net: 'Bersih'
    }
  }
  const attendanceItems = {
    [period]: {
      emp_a: {
        items: [{ id: 'att_1', label: 'OT', hours: 4 }],
        absent: 2
      },
      emp_b: {
        items: [{ id: 'att_2', label: 'UT', hours: -2 }],
        absent: 0
      }
    }
  }
  const adjustments = {
    [period]: {
      emp_a: [{ id: 'adj_1', label: 'Fine', amount: -50000 }],
      emp_b: []
    }
  }
  return { period, employees, rules, basicConfig, attendanceItems, adjustments }
}

const payrollSnapshot = ({ employees, rules, basicConfig, attendanceItems, adjustments, period }) =>
  employees.map((employee) => {
    const result = calculateEmployeePayroll(
      employee,
      attendanceItems[period]?.[employee.id] || { items: [], absent: 0 },
      adjustments[period]?.[employee.id] || [],
      rules,
      basicConfig
    )
    return {
      id: employee.id,
      finalSalary: result.finalSalary,
      baseSalary: result.baseSalary,
      attendanceAdjustment: result.attendanceAdjustment,
      adjustmentTotal: result.adjustmentTotal
    }
  })

const seedLocalStorage = (ls, payload) => {
  Object.entries(payload).forEach(([key, value]) => {
    ls.setItem(key, JSON.stringify(value))
  })
}

const run = () => {
  const fx = fixture()

  {
    const ls = mockStorage()
    seedLocalStorage(ls, {
      xpayroll_employees: fx.employees,
      xpayroll_rules: fx.rules,
      xpayroll_basic_config: fx.basicConfig,
      xpayroll_attendance_items: fx.attendanceItems,
      xpayroll_adjustments: fx.adjustments,
      xpayroll_settings: BACKUP_DEFAULTS.xpayroll_settings,
      xpayroll_theme: { mode: 'dark' },
      xpayroll_wizard_step: 3
    })
    const payload = buildBackupPayload(ls)
    assert.equal(payload.version, 1)
    assert.ok('xpayroll_theme' in payload.data, 'theme should be exported')
    assert.ok('xpayroll_wizard_step' in payload.data, 'wizard step should be exported')
    assert.equal(payload.data.xpayroll_employees.length, 2)
    assert.equal(payload.data.xpayroll_theme.mode, 'dark')
  }

  {
    const ls = mockStorage()
    const payload = buildBackupPayload(ls)
    assert.equal(Object.keys(payload.data).length, 0)
  }

  {
    const ls = mockStorage()
    const previous = globalThis.localStorage
    globalThis.localStorage = ls
    try {
      seedLocalStorage(ls, {
        xpayroll_employees: fx.employees,
        xpayroll_rules: fx.rules,
        xpayroll_basic_config: fx.basicConfig,
        xpayroll_attendance_items: fx.attendanceItems,
        xpayroll_adjustments: fx.adjustments,
        xpayroll_settings: BACKUP_DEFAULTS.xpayroll_settings,
        xpayroll_theme: { mode: 'light' }
      })

      const before = payrollSnapshot({ ...fx })
      const encoded = storage.exportSession()
      ls.data = {}
      const imported = storage.importSession(encoded, { reload: false })
      assert.equal(imported.ok, true, imported.error || 'import failed')
      const restored = readAllSessionData(ls)
      const after = payrollSnapshot({
        ...fx,
        employees: restored.xpayroll_employees,
        rules: restored.xpayroll_rules,
        basicConfig: restored.xpayroll_basic_config,
        attendanceItems: restored.xpayroll_attendance_items,
        adjustments: restored.xpayroll_adjustments
      })

      assert.deepEqual(
        normalizeBackupData(restored),
        normalizeBackupData({
          xpayroll_employees: fx.employees,
          xpayroll_rules: fx.rules,
          xpayroll_basic_config: fx.basicConfig,
          xpayroll_attendance_items: fx.attendanceItems,
          xpayroll_adjustments: fx.adjustments,
          xpayroll_settings: BACKUP_DEFAULTS.xpayroll_settings,
          xpayroll_theme: { mode: 'light' }
        })
      )

      before.forEach((row, i) => {
        assert.ok(near(row.finalSalary, after[i].finalSalary), `finalSalary mismatch for ${row.id}`)
        assert.ok(near(row.baseSalary, after[i].baseSalary), `baseSalary mismatch for ${row.id}`)
        assert.ok(near(row.attendanceAdjustment, after[i].attendanceAdjustment), `attendanceAdjustment mismatch for ${row.id}`)
        assert.ok(near(row.adjustmentTotal, after[i].adjustmentTotal), `adjustmentTotal mismatch for ${row.id}`)
      })
    } finally {
      globalThis.localStorage = previous
    }
  }

  {
    const legacy = {
      xpayroll_employees: JSON.stringify(fx.employees),
      xpayroll_rules: JSON.stringify(fx.rules),
      xpayroll_basic_config: JSON.stringify(fx.basicConfig),
      xpayroll_attendance_items: JSON.stringify(fx.attendanceItems),
      xpayroll_adjustments: JSON.stringify(fx.adjustments)
    }
    const parsed = parseLegacyPayload(legacy)
    const normalized = normalizeBackupData(parsed)
    assert.equal(validateBackupData(normalized).ok, true)
    assert.equal(normalized.xpayroll_employees[0].name, 'Alice')
    assert.equal(normalized.xpayroll_attendance_items['2026-07'].emp_a.absent, 2)
  }

  {
    const bad = validateBackupData({ xpayroll_employees: [{}] })
    assert.equal(bad.ok, false)
  }

  console.log('backup.test.js: all passed')
}

run()
