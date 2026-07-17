import assert from 'node:assert/strict'
import { storage } from '../src/core.js'
import {
  APP_VERSION,
  BACKUP_DEFAULTS,
  BACKUP_VERSION,
  buildBackupPayload,
  normalizeAdjustmentsStore,
  normalizeAttendanceStore,
  normalizeBackupData,
  parseLegacyPayload,
  readAllSessionData,
  validateBackupData
} from '../src/persist.js'
import { calculateEmployeePayroll } from '../src/payroll.js'
import { RULE_TYPES, RULE_CATEGORIES, CRITERIA_TYPES } from '../src/rules.js'

const encodeUtf8Base64 = (text) =>
  btoa(Array.from(new TextEncoder().encode(text), (b) => String.fromCharCode(b)).join(''))

const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps

const CANONICAL_KEYS = Object.keys(BACKUP_DEFAULTS)

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
      attendance: 'Kehadiran'
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
    },
    '2026-06': {
      emp_a: {
        items: [{ id: 'att_old', label: 'Lembur', hours: 3 }],
        absent: 1
      }
    }
  }
  const adjustments = {
    [period]: {
      emp_a: [{ id: 'adj_1', label: 'Fine', amount: -50000 }],
      emp_b: []
    },
    '2026-06': {
      emp_a: [{ id: 'adj_old', label: 'Denda', amount: -25000 }]
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
    assert.equal(payload.version, BACKUP_VERSION)
    assert.equal(payload.appVersion, APP_VERSION)
    CANONICAL_KEYS.forEach((key) => {
      assert.ok(key in payload.data, `${key} should be exported`)
    })
    assert.equal(payload.data.xpayroll_employees.length, 2)
    assert.equal(payload.data.xpayroll_theme.mode, 'dark')
    assert.equal(payload.data.xpayroll_wizard_step, 3)
    assert.equal(payload.data.xpayroll_attendance_items['2026-06'].emp_a.absent, 1)
    assert.equal(payload.data.xpayroll_adjustments['2026-06'].emp_a[0].label, 'Denda')
  }

  {
    const ls = mockStorage()
    const payload = buildBackupPayload(ls)
    assert.equal(payload.version, BACKUP_VERSION)
    CANONICAL_KEYS.forEach((key) => {
      assert.ok(key in payload.data, `${key} should exist in empty export`)
    })
    assert.deepEqual(payload.data.xpayroll_employees, [])
    assert.deepEqual(payload.data.xpayroll_attendance_items, {})
    assert.deepEqual(payload.data.xpayroll_adjustments, {})
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
        xpayroll_theme: { mode: 'light' },
        xpayroll_wizard_step: 2
      })

      const before = payrollSnapshot({ ...fx })
      const exported = storage.exportSession()
      assert.ok(exported.trim().startsWith('{'), 'export should be plain JSON')
      ls.data = {}
      const imported = storage.importSession(exported, { reload: false })
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
          xpayroll_theme: { mode: 'light' },
          xpayroll_wizard_step: 2
        })
      )

      assert.equal(restored.xpayroll_attendance_items['2026-06'].emp_a.items[0].hours, 3)
      assert.equal(restored.xpayroll_adjustments['2026-06'].emp_a[0].amount, -25000)

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
    const ls = mockStorage()
    const previous = globalThis.localStorage
    globalThis.localStorage = ls
    try {
      seedLocalStorage(ls, {
        xpayroll_employees: fx.employees,
        xpayroll_attendance_items: fx.attendanceItems,
        xpayroll_adjustments: fx.adjustments,
        xpayroll_theme: { mode: 'dark' }
      })
      const partial = {
        version: 1,
        data: {
          xpayroll_employees: fx.employees,
          xpayroll_rules: fx.rules,
          xpayroll_basic_config: fx.basicConfig
        }
      }
      const imported = storage.importSession(JSON.stringify(partial), { reload: false })
      assert.equal(imported.ok, true, imported.error || 'partial import failed')
      const restored = readAllSessionData(ls)
      assert.deepEqual(restored.xpayroll_attendance_items, {})
      assert.deepEqual(restored.xpayroll_adjustments, {})
      assert.equal(restored.xpayroll_theme.mode, 'light')
      assert.equal(restored.xpayroll_employees.length, 2)
      CANONICAL_KEYS.forEach((key) => {
        assert.ok(key in restored, `${key} should be filled after partial import`)
      })
    } finally {
      globalThis.localStorage = previous
    }
  }

  {
    const ls = mockStorage()
    const previous = globalThis.localStorage
    globalThis.localStorage = ls
    try {
      const v1 = {
        version: 1,
        exportedAt: '2026-01-01T00:00:00.000Z',
        data: {
          xpayroll_employees: fx.employees,
          xpayroll_rules: fx.rules,
          xpayroll_basic_config: fx.basicConfig,
          xpayroll_attendance_items: fx.attendanceItems,
          xpayroll_adjustments: fx.adjustments,
          xpayroll_settings: BACKUP_DEFAULTS.xpayroll_settings,
          xpayroll_theme: { mode: 'dark' }
        }
      }
      const encoded = encodeUtf8Base64(JSON.stringify(v1))
      const imported = storage.importSession(encoded, { reload: false })
      assert.equal(imported.ok, true, imported.error || 'legacy base64 import failed')
      const restored = readAllSessionData(ls)
      assert.equal(restored.xpayroll_theme.mode, 'dark')
      assert.equal(restored.xpayroll_attendance_items['2026-07'].emp_a.absent, 2)
    } finally {
      globalThis.localStorage = previous
    }
  }

  {
    const unicodeAttendance = {
      '2026-07': {
        emp_a: {
          items: [{ id: 'u1', label: 'اضافه\u200cکاری / Lembur', hours: 2 }],
          absent: 0
        }
      }
    }
    const unicodeAdjustments = {
      '2026-07': {
        emp_a: [{ id: 'u2', label: 'جریمه / Denda', amount: -10000 }]
      }
    }
    const ls = mockStorage()
    const previous = globalThis.localStorage
    globalThis.localStorage = ls
    try {
      seedLocalStorage(ls, {
        xpayroll_employees: fx.employees,
        xpayroll_rules: fx.rules,
        xpayroll_basic_config: fx.basicConfig,
        xpayroll_attendance_items: unicodeAttendance,
        xpayroll_adjustments: unicodeAdjustments
      })
      const exported = storage.exportSession()
      ls.data = {}
      const imported = storage.importSession(exported, { reload: false })
      assert.equal(imported.ok, true)
      const restored = readAllSessionData(ls)
      assert.equal(restored.xpayroll_attendance_items['2026-07'].emp_a.items[0].label, 'اضافه\u200cکاری / Lembur')
      assert.equal(restored.xpayroll_adjustments['2026-07'].emp_a[0].label, 'جریمه / Denda')
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
    CANONICAL_KEYS.forEach((key) => {
      assert.ok(key in normalized, `${key} should exist after legacy normalize`)
    })
  }

  {
    const bad = validateBackupData({ xpayroll_employees: [{}] })
    assert.equal(bad.ok, false)
  }

  {
    const dirty = {
      '2026-07': {
        emp_a: [
          { id: 'a1', label: 'Loan', amount: 250000 },
          { id: 'a2', label: 'Advance', amount: -100000 },
          { label: 'bad', amount: 0 },
          null
        ],
        emp_b: 'not-an-array'
      }
    }
    const fixed = normalizeAdjustmentsStore(dirty)
    assert.equal(fixed['2026-07'].emp_a.length, 2)
    assert.equal(fixed['2026-07'].emp_a[0].amount, -250000)
    assert.equal(fixed['2026-07'].emp_a[1].amount, -100000)
    assert.deepEqual(fixed['2026-07'].emp_b, [])
  }

  {
    const att = normalizeAttendanceStore({
      '2026-07': {
        emp_a: [{ id: 'x', label: 'OT', hours: 3 }],
        emp_b: { items: [{ id: 'y', label: 'UT', hours: -8 }], absent: 1.9 },
        emp_c: { items: [null, { label: 'Zero', hours: 0 }], absent: 0 }
      }
    })
    assert.deepEqual(att['2026-07'].emp_a, { items: [{ id: 'x', label: 'OT', hours: 3 }], absent: 0 })
    assert.equal(att['2026-07'].emp_b.absent, 1)
    assert.equal(att['2026-07'].emp_b.items[0].hours, -8)
    assert.equal(att['2026-07'].emp_c.items.length, 1)
    assert.equal(att['2026-07'].emp_c.items[0].hours, 0)
  }

  {
    const previous = globalThis.localStorage
    const ls = mockStorage()
    globalThis.localStorage = ls
    try {
      const period = '2026-07'
      const attendance = {
        [period]: {
          emp_a: { items: [{ id: 'ot1', label: 'OT', hours: 4 }], absent: 2 }
        }
      }
      const adjustments = {
        [period]: {
          emp_a: [{ id: 'loan', label: 'Loan', amount: 500000 }]
        }
      }
      storage.set('xpayroll_attendance_items', normalizeAttendanceStore(attendance))
      storage.set('xpayroll_adjustments', normalizeAdjustmentsStore(adjustments))

      const loadedAtt = normalizeAttendanceStore(storage.get('xpayroll_attendance_items', {}))
      const loadedAdj = normalizeAdjustmentsStore(storage.get('xpayroll_adjustments', {}))

      assert.equal(loadedAtt[period].emp_a.absent, 2)
      assert.equal(loadedAtt[period].emp_a.items[0].hours, 4)
      assert.equal(loadedAdj[period].emp_a[0].amount, -500000)
      assert.equal(loadedAdj[period].emp_a[0].label, 'Loan')
    } finally {
      globalThis.localStorage = previous
    }
  }

  console.log('backup.test.js: all passed')
}

run()
