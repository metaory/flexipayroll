/**
 * Print utility for employee payroll reports
 * Single-page summary for PDF export
 */

import { formatCurrency, formatHours } from '../core.js'

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const styles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; font-size: 10pt; line-height: 1.35; padding: 1rem; color: #000; }
  .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 0.75rem; margin-bottom: 1rem; }
  .header h1 { font-size: 14pt; margin-bottom: 0.1rem; letter-spacing: 2px; }
  .header p { font-size: 9pt; color: #333; }
  .section { margin-bottom: 0.75rem; }
  .section-title { font-weight: bold; font-size: 10pt; border-bottom: 1px solid #000; padding-bottom: 0.15rem; margin-bottom: 0.35rem; text-transform: uppercase; letter-spacing: 1px; }
  .row { display: flex; justify-content: space-between; padding: 0.15rem 0; border-bottom: 1px dotted #ccc; font-size: 10pt; }
  .row:last-child { border-bottom: none; }
  .row.subtotal { border-top: 1px solid #000; border-bottom: 1px solid #000; font-weight: bold; margin-top: 0.35rem; padding: 0.35rem 0; }
  .row.total { border-top: 2px solid #000; font-weight: bold; font-size: 12pt; margin-top: 0.35rem; padding: 0.5rem 0; }
  .label { color: #333; }
  .value { font-weight: 600; text-align: right; font-family: 'Courier New', monospace; }
  .stats { display: flex; gap: 1rem; margin-bottom: 0.5rem; font-size: 9pt; color: #555; }
  .footer { margin-top: 0.75rem; padding-top: 0.5rem; border-top: 1px solid #000; font-size: 8pt; color: #666; text-align: center; }
  @media print { body { padding: 0.5rem; } }
`

const row = (label, value, cls = '') => `<div class="row ${cls}"><span class="label">${esc(label)}</span><span class="value">${esc(value)}</span></div>`

const section = (title, content) => `<div class="section"><div class="section-title">${esc(title)}</div>${content}</div>`

const getAppliedRules = (result) => {
  const applied = { bonuses: [], deductions: [] }
  Object.entries(result.ruleResults || {}).map(([category, rules]) => {
    if (category !== 'bonuses' && category !== 'deductions') return null
    Object.entries(rules || {}).map(([, ruleData]) => {
      const value = ruleData.finalValue !== undefined ? ruleData.finalValue : ruleData.value
      if (value > 0) {
        const rule = ruleData.rule
        const pct = rule.type === 'percentage_monthly' || rule.type === 'percentage_base'
          ? ` (${(rule.value * 100).toFixed(1)}%)`
          : ''
        applied[category].push({ label: rule.label + pct, value })
      }
      return null
    })
    return null
  })
  return applied
}

const getAttendanceRows = (result) =>
  (result.attendanceItems || [])
    .map((item) => {
      const hours = Number(item?.hours) || 0
      if (hours === 0) return ''
      const label = item?.label ? `${item.label}` : 'Attendance'
      return row(label, formatHours(hours))
    })
    .filter(Boolean)

const getAdjustmentRows = (result, fmt) =>
  (result.adjustments || [])
    .map((item) => {
      const amount = Number(item?.amount) || 0
      if (amount === 0) return ''
      const label = item?.label ? `${item.label}` : 'Adjustment'
      const sign = amount > 0 ? '+' : '-'
      return row(label, `${sign}${fmt(Math.abs(amount))}`)
    })
    .filter(Boolean)

export const printEmployeeReport = (result, period, currencySymbol = '$', organizationName = '') => {
  const fmt = (v) => formatCurrency(v, 'id-ID', 'IDR', currencySymbol)
  const applied = getAppliedRules(result)
  const grossBeforeAdjustments = result.grossSalary - (result.adjustmentTotal || 0)
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payslip - ${esc(result.employee.name)} - ${esc(period)}</title>
  <style>${styles}</style>
</head>
<body>
  <div class="header">
    ${organizationName ? `<h1>${esc(organizationName)}</h1><p style="font-size:12pt;font-weight:bold;margin:0.3rem 0">PAYSLIP</p>` : '<h1>PAYSLIP</h1>'}
    <p>${esc(result.employee.name)} · ${esc(period)}</p>
  </div>
  
  <div class="stats">
    <span><b>Days:</b> ${result.actualDays}</span>
    <span><b>Hours:</b> ${formatHours(result.totalHours)}</span>
    <span><b>Daily:</b> ${fmt(result.dailyRate)}</span>
    <span><b>Hourly:</b> ${fmt(result.hourlyRate)}</span>
  </div>
  
  ${section('Earnings', [
    row('Base', fmt(result.baseSalary)),
    ...applied.bonuses.map(b => row(b.label, '+' + fmt(b.value))),
    row('Gross', fmt(grossBeforeAdjustments), 'subtotal')
  ].filter(Boolean).join(''))}

  ${section('Adjustments', [
    ...applied.deductions.map(d => row(d.label, '-' + fmt(d.value))),
    ...getAdjustmentRows(result, fmt)
  ].join('') || row('None', '-'))}

  ${section('Attendance', [
    ...getAttendanceRows(result)
  ].join('') || row('None', '-'))}
  
  ${section('Summary', row('Net', fmt(result.finalSalary), 'total'))}

  <div class="footer">Generated ${new Date().toLocaleDateString()} · XPayroll</div>
</body>
</html>`

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
