import assert from 'node:assert/strict'
import { resolvePrintLabels, DEFAULT_PRINT_LABELS } from '../src/stores.js'
import { formatLocalizedDate, formatLocalizedPeriod } from '../src/core.js'
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
    assert.ok(html.indexOf('Daily salary') < html.indexOf('Month salary'))
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
      adjustments: [{ label: 'Loan', amount: -100 }],
      adjustmentTotal: -100
    }, labels, fmt)
    assert.match(html, /Loan/)
    assert.doesNotMatch(html, /ADJUSTMENT.*>-<\/span>/)
  }

  {
    const labels = resolvePrintLabels({ printLabels: { adjustment: 'PENYESUAIAN' } })
    const html = buildAdjustmentSection({ ...baseResult, adjustments: [{ amount: -50 }], adjustmentTotal: -50 }, labels, fmt)
    assert.match(html, /PENYESUAIAN/)
    assert.match(html, /-\$50/)
  }

  {
    const html = buildPrintHtml(baseResult, '2026-01', { organizationName: 'Acme', currencySymbol: '$' })
    assert.match(html, /Acme/)
    assert.match(html, /Daily salary/)
    assert.match(html, /section-title">Adjustments</)
    assert.match(html, />Net<\/span>/)
  }

  {
    const html = buildPrintHtml(baseResult, '2026-01', {
      printLabels: { adjustments: 'Penyesuaian', net: 'Gaji bersih' }
    })
    assert.match(html, /section-title">Penyesuaian</)
    assert.match(html, /Gaji bersih/)
    assert.doesNotMatch(html, /section-title">Adjustments</)
  }

  {
    const html = buildPrintHtml(baseResult, '2026-06', {
      locale: 'fa-IR',
      organizationName: 'Acme',
      currencySymbol: '$'
    })
    assert.match(html, /۱۴۰۵\/۰۳/)
    assert.doesNotMatch(html, /2026-06/)
    assert.doesNotMatch(html, /Generated/)
  }

  {
    const html = buildPrintHtml(baseResult, '2026-01', { footerLabel: 'Confidential — internal use only' })
    assert.match(html, /footer-sep/)
    assert.match(html, /Confidential — internal use only/)
    assert.doesNotMatch(buildPrintHtml(baseResult, '2026-01', {}), /<hr class="footer-sep">/)
  }

  {
    assert.equal(formatLocalizedPeriod('2026-06', 'fa-IR'), '۱۴۰۵/۰۳')
    assert.match(formatLocalizedDate(new Date(2026, 5, 24), 'fa-IR'), /۱۴۰۵/)
  }

  console.log('print.test.js: all passed')
}

run()
