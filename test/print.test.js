import assert from 'node:assert/strict'
import { resolvePrintLabels, DEFAULT_PRINT_LABELS } from '../src/stores.js'
import {
  buildAdjustmentSection,
  buildEarningsSection,
  buildPrintHtml
} from '../src/lib/print.js'

const fmt = (v) => `$${v}`

const baseResult = {
  employee: { name: 'Alice' },
  baseSalary: 2200000,
  dailyRate: 100000,
  hourlyRate: 12500,
  actualDays: 20,
  grossSalary: 2200000,
  adjustmentTotal: 0,
  attendanceAdjustment: 50000,
  finalSalary: 2200000,
  adjustments: [],
  ruleResults: { rawOvertimeHours: 2, rawUndertimeHours: 0, bonuses: {}, deductions: {} }
}

const run = () => {
  {
    const labels = resolvePrintLabels({})
    assert.deepEqual(labels, DEFAULT_PRINT_LABELS)
  }

  {
    const labels = resolvePrintLabels({ printLabels: { monthSalary: 'Gaji bulanan' } })
    assert.equal(labels.monthSalary, 'Gaji bulanan')
    assert.equal(labels.dailySalary, DEFAULT_PRINT_LABELS.dailySalary)
  }

  {
    const labels = resolvePrintLabels({})
    const html = buildEarningsSection(baseResult, labels, fmt)
    assert.match(html, /Month salary/)
    assert.match(html, /Daily salary/)
    assert.match(html, /\$100000/)
    assert.match(html, /Attendance/)
    assert.doesNotMatch(html, /OT \d/)
    assert.doesNotMatch(html, /UT \d/)
  }

  {
    const labels = resolvePrintLabels({ printLabels: { monthSalary: 'Gaji', dailySalary: 'Harian', attendance: 'Kehadiran' } })
    const html = buildEarningsSection(baseResult, labels, fmt)
    assert.match(html, /Gaji/)
    assert.match(html, /Harian/)
    assert.match(html, /Kehadiran/)
    assert.doesNotMatch(html, /Month salary/)
  }

  {
    const labels = resolvePrintLabels({})
    const html = buildAdjustmentSection({ ...baseResult, adjustments: [], adjustmentTotal: 0 }, labels, fmt)
    assert.match(html, /ADJUSTMENT/)
    assert.match(html, />-<\/span>/)
    assert.match(html, /Total adjustments/)
  }

  {
    const labels = resolvePrintLabels({})
    const html = buildAdjustmentSection({
      ...baseResult,
      adjustments: [{ label: 'Gift', amount: 100 }],
      adjustmentTotal: 100
    }, labels, fmt)
    assert.match(html, /Gift/)
    assert.doesNotMatch(html, /ADJUSTMENT.*>-<\/span>/)
  }

  {
    const labels = resolvePrintLabels({ printLabels: { adjustment: 'PENYESUAIAN' } })
    const html = buildAdjustmentSection({ ...baseResult, adjustments: [{ amount: 50 }], adjustmentTotal: 50 }, labels, fmt)
    assert.match(html, /PENYESUAIAN/)
    assert.match(html, /\+\$50/)
  }

  {
    const html = buildPrintHtml(baseResult, '2026-01', { organizationName: 'Acme', currencySymbol: '$' })
    assert.match(html, /Acme/)
    assert.match(html, /Daily salary/)
    assert.match(html, /Adjustments/)
    assert.match(html, />Net<\/span>/)
  }

  {
    const html = buildPrintHtml(baseResult, '2026-01', {
      printLabels: { net: 'Gaji bersih' }
    })
    assert.match(html, /Gaji bersih/)
    assert.doesNotMatch(html, />Net<\/span>/)
  }

  console.log('print.test.js: all passed')
}

run()
