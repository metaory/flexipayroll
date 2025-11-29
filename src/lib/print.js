/**
 * Print utility for employee payroll reports
 * Compact black and white formatting for PDF export
 */

import { formatCurrency, formatHours } from '../core.js'

const styles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; font-size: 11pt; line-height: 1.4; padding: 1.5rem; color: #000; }
  .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 0.75rem; margin-bottom: 1rem; }
  .header h1 { font-size: 16pt; margin-bottom: 0.15rem; letter-spacing: 2px; }
  .header p { font-size: 9pt; color: #333; }
  .section { margin-bottom: 1rem; }
  .section-title { font-weight: bold; font-size: 10pt; border-bottom: 1px solid #000; padding-bottom: 0.15rem; margin-bottom: 0.35rem; text-transform: uppercase; letter-spacing: 1px; }
  .row { display: flex; justify-content: space-between; padding: 0.15rem 0; border-bottom: 1px dotted #ccc; font-size: 10pt; }
  .row:last-child { border-bottom: none; }
  .row.subtotal { border-top: 1px solid #000; border-bottom: 1px solid #000; font-weight: bold; margin-top: 0.35rem; padding: 0.35rem 0; }
  .row.total { border-top: 2px solid #000; font-weight: bold; font-size: 12pt; margin-top: 0.35rem; padding: 0.5rem 0; }
  .label { color: #333; }
  .value { font-weight: 600; text-align: right; font-family: 'Courier New', monospace; }
  .stats { display: flex; gap: 1.5rem; margin-bottom: 0.5rem; font-size: 9pt; color: #555; }
  .footer { margin-top: 1.5rem; padding-top: 0.75rem; border-top: 1px solid #000; font-size: 8pt; color: #666; text-align: center; }
  @media print { body { padding: 0.75rem; } }
`

const row = (label, value, cls = '') => `<div class="row ${cls}"><span class="label">${label}</span><span class="value">${value}</span></div>`

const section = (title, content) => `<div class="section"><div class="section-title">${title}</div>${content}</div>`

const getAppliedRules = (result) => {
  const applied = { bonuses: [], deductions: [] }
  Object.entries(result.ruleResults).map(([category, rules]) => {
    if (category !== 'bonuses' && category !== 'deductions') return
    Object.entries(rules).map(([ruleId, ruleData]) => {
      const value = ruleData.finalValue !== undefined ? ruleData.finalValue : ruleData.value
      if (value > 0) {
        const rule = ruleData.rule
        const pct = rule.type === 'percentage_monthly' || rule.type === 'percentage_base'
          ? ` (${(rule.value * 100).toFixed(1)}%)`
          : ''
        applied[category].push({ label: rule.label + pct, value })
      }
    })
  })
  return applied
}

export const printEmployeeReport = (result, period, currencySymbol = '$', organizationName = '') => {
  const fmt = (v) => formatCurrency(v, 'id-ID', 'IDR', currencySymbol)
  const applied = getAppliedRules(result)
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payslip - ${result.employee.name} - ${period}</title>
  <style>${styles}</style>
</head>
<body>
  <div class="header">
    ${organizationName ? `<h1>${organizationName}</h1><p style="font-size:12pt;font-weight:bold;margin:0.3rem 0">PAYSLIP</p>` : '<h1>PAYSLIP</h1>'}
    <p>${result.employee.name} · ${period}</p>
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
    result.adjustmentTotal > 0 ? row('Adj (+)', '+' + fmt(result.adjustmentTotal)) : '',
    row('Gross', fmt(result.grossSalary), 'subtotal')
  ].filter(Boolean).join(''))}
  
  ${section('Deductions', [
    ...applied.deductions.map(d => row(d.label, '-' + fmt(d.value))),
    result.adjustmentTotal < 0 ? row('Adj (-)', '-' + fmt(Math.abs(result.adjustmentTotal))) : ''
  ].filter(Boolean).join('') || row('None', '-'))}
  
  ${section('Summary', row('Net', fmt(result.finalSalary), 'total'))}
  
  <div class="footer">Generated ${new Date().toLocaleDateString()} · XPayroll</div>
</body>
</html>`

  const win = window.open('', '_blank', 'width=800,height=600')
  win.document.write(html)
  win.document.close()
  win.onafterprint = () => win.close()
  win.focus()
  win.print()
}
