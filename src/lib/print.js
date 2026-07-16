/**
 * Print utility for employee payroll reports
 * Single-page summary for PDF export
 */

import { formatCurrency, formatLocalizedPeriod } from '../core.js'
import { resolveProbation } from '../payroll.js'
import { resolveLocale } from '../persist.js'
import { resolvePrintLabels } from '../stores.js'

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const styles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; font-size: 10.5pt; line-height: 1.35; padding: 1rem; color: #000; font-weight: 700; }
  .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 0.75rem; margin-bottom: 1rem; }
  .header h1 { font-size: 17pt; margin-bottom: 0.1rem; letter-spacing: 2px; font-weight: 900; }
  .header p { font-size: 10.5pt; color: #111; font-weight: 900; }
  .section { margin-bottom: 0.75rem; }
  .section-title { font-weight: 900; font-size: 12pt; border-bottom: 1px solid #000; padding-bottom: 0.15rem; margin-bottom: 0.35rem; text-transform: uppercase; letter-spacing: 1px; text-align: right; }
  .row { display: flex; justify-content: space-between; padding: 0.15rem 0; border-bottom: 1px dotted #ccc; font-size: 10.5pt; }
  .row:last-child { border-bottom: none; }
  .row.subtotal { border-top: 1px solid #000; border-bottom: 1px solid #000; font-weight: 900; margin-top: 0.35rem; padding: 0.35rem 0; }
  .row.heading .label { font-size: 12pt; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; }
  .row.total { border-top: 2px solid #000; font-weight: 900; margin-top: 0.35rem; padding: 0.5rem 0; }
  .label { color: #111; font-weight: 900; text-align: right; }
  .value { font-weight: 900; text-align: left; font-family: 'Courier New', monospace; font-size: 10.5pt; }
  .stats { display: flex; justify-content: center; gap: 1rem; margin-bottom: 0.5rem; font-size: 10.5pt; color: #111; font-weight: 900; }
  .stats b { font-weight: 900; }
  .footer-sep { border: none; border-top: 1px solid #000; margin: 0.75rem 0 0.5rem; }
  .footer-label { text-align: center; font-size: 9pt; font-weight: 800; margin-bottom: 0.5rem; }
  @media print { body { padding: 0.5rem; } }
`

export const row = (label, value, cls = '') => `<div class="row ${cls}"><span class="value">${esc(value)}</span><span class="label">${esc(label)}</span></div>`

const section = (title, content) => `<div class="section"><div class="section-title">${esc(title)}</div>${content}</div>`

const signedFmt = (value, fmt) => `${value >= 0 ? '+' : '-'}${fmt(Math.abs(value || 0))}`

const getAppliedRules = (result) => {
  const applied = { bonuses: [], deductions: [] }
  Object.entries(result.ruleResults || {}).map(([category, rules]) => {
    if (category !== 'bonuses' && category !== 'deductions') return null
    Object.entries(rules || {}).map(([, ruleData]) => {
      const value = ruleData.finalValue !== undefined ? ruleData.finalValue : ruleData.value
      const rule = ruleData.rule
      const pct = rule.type === 'percentage_monthly' || rule.type === 'percentage_base'
        ? ` (${(rule.value * 100).toFixed(1)}%)`
        : ''
      applied[category].push({ label: rule.label + pct, value })
      return null
    })
    return null
  })
  return applied
}

export const getAdjustmentRows = (result, labels, fmt) =>
  (result.adjustments || [])
    .map((item) => {
      const amount = Number(item?.amount) || 0
      if (amount === 0) return ''
      const label = item?.label ? `${item.label}` : labels.adjustment
      return row(label, signedFmt(amount, fmt))
    })
    .filter(Boolean)

export const buildAdjustmentSection = (result, labels, fmt) => {
  const totalAdjustments = result.adjustmentTotal || 0
  const itemRows = getAdjustmentRows(result, labels, fmt)
  return [
    ...(itemRows.length ? itemRows : [row(labels.adjustment, '-')]),
    row(labels.totalAdjustments, signedFmt(totalAdjustments, fmt), 'subtotal')
  ].join('')
}

export const buildEarningsSection = (result, labels, fmt) => {
  const hasAttendanceHours = (result.ruleResults?.rawOvertimeHours ?? 0) > 0 || (result.ruleResults?.rawUndertimeHours ?? 0) > 0
  const applied = getAppliedRules(result)
  const grossBeforeAdjustments = result.grossSalary - (result.adjustmentTotal || 0)
  return [
    row(labels.dailySalary, fmt(result.dailyRate)),
    row(labels.monthSalary, fmt(result.baseSalary)),
    ...applied.bonuses.map(b => row(b.label, '+' + fmt(b.value))),
    ...applied.deductions.map(d => row(d.label, '-' + fmt(d.value))),
    ...(hasAttendanceHours ? [row(labels.attendance, signedFmt(result.attendanceAdjustment || 0, fmt))] : []),
    row(labels.gross, fmt(grossBeforeAdjustments), 'subtotal heading')
  ].filter(Boolean).join('')
}

export const buildPrintHtml = (result, period, config = {}) => {
  const currencySymbol = config.currencySymbol ?? '$'
  const organizationName = config.organizationName ?? ''
  const footerLabel = String(config.footerLabel ?? '').trim()
  const labels = resolvePrintLabels(config)
  const locale = resolveLocale(config.locale)
  const fmt = (v) => formatCurrency(v, locale, 'IDR', currencySymbol)
  const periodLabel = formatLocalizedPeriod(period, locale)
  const probationLabel = ({ a: labels.probationA, b: labels.probationB })[resolveProbation(result.employee)] ?? ''
  const headerLine = probationLabel
    ? `${esc(probationLabel)} - ${esc(result.employee.name)} · ${esc(periodLabel)}`
    : `${esc(result.employee.name)} · ${esc(periodLabel)}`

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payslip - ${esc(result.employee.name)} - ${esc(periodLabel)}</title>
  <style>${styles}</style>
</head>
<body>
  <div class="header">
    ${organizationName ? `<h1>${esc(organizationName)}</h1><p style="font-size:12pt;font-weight:bold;margin:0.3rem 0">${esc(labels.payslip)}</p>` : `<h1>${esc(labels.payslip)}</h1>`}
    <p>${headerLine}</p>
  </div>
  
  <div class="stats">
    <span><b>${esc(labels.days)}:</b> ${result.actualDays}</span>
    <span><b>${esc(labels.daily)}:</b> ${fmt(result.dailyRate)}</span>
    <span><b>${esc(labels.hourly)}:</b> ${fmt(result.hourlyRate)}</span>
  </div>
  
  ${section(labels.earnings, buildEarningsSection(result, labels, fmt))}

  ${section(labels.adjustments, buildAdjustmentSection(result, labels, fmt))}
  
  ${section(labels.summary, row(labels.net, fmt(result.finalSalary), 'total'))}

  ${footerLabel ? `<hr class="footer-sep"><div class="footer-label">${esc(footerLabel)}</div>` : ''}
</body>
</html>`
}

export const printEmployeeReport = (result, period, config = {}) => {
  const html = buildPrintHtml(result, period, config)
  const printUrl = `${window.location.origin}${window.location.pathname}#print`
  const win = window.open(printUrl, '_blank', 'width=800,height=600')
  if (!win) return

  const renderAndPrint = () => {
    win.document.open()
    win.document.write(html)
    win.document.close()
    win.onafterprint = () => win.close()
    win.focus()
    win.print()
  }

  if (win.document.readyState === 'complete') {
    setTimeout(renderAndPrint, 0)
    return
  }
  win.addEventListener('load', renderAndPrint, { once: true })
}
