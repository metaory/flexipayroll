/**
 * Print utility for employee payroll reports
 * Black and white, clean formatting for PDF export
 */

import { formatCurrency, formatHours } from '../core.js'

const styles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; font-size: 12pt; line-height: 1.5; padding: 2rem; color: #000; }
  .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 1rem; margin-bottom: 1.5rem; }
  .header h1 { font-size: 18pt; margin-bottom: 0.25rem; }
  .header p { font-size: 10pt; color: #333; }
  .section { margin-bottom: 1.5rem; }
  .section-title { font-weight: bold; font-size: 11pt; border-bottom: 1px solid #000; padding-bottom: 0.25rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px; }
  .row { display: flex; justify-content: space-between; padding: 0.25rem 0; border-bottom: 1px dotted #ccc; }
  .row:last-child { border-bottom: none; }
  .row.subtotal { border-top: 1px solid #000; border-bottom: 1px solid #000; font-weight: bold; margin-top: 0.5rem; padding: 0.5rem 0; }
  .row.total { border-top: 2px solid #000; font-weight: bold; font-size: 14pt; margin-top: 0.5rem; padding: 0.75rem 0; }
  .label { color: #333; }
  .value { font-weight: 600; text-align: right; }
  .footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #000; font-size: 9pt; color: #666; text-align: center; }
  @media print { body { padding: 1rem; } }
`

const row = (label, value, cls = '') => `<div class="row ${cls}"><span class="label">${label}</span><span class="value">${value}</span></div>`

const section = (title, content) => `
  <div class="section">
    <div class="section-title">${title}</div>
    ${content}
  </div>`

const getAppliedRules = (result) => {
  const applied = { bonuses: [], deductions: [] }
  
  Object.entries(result.ruleResults).map(([category, rules]) => {
    if (category !== 'bonuses' && category !== 'deductions') return
    Object.entries(rules).map(([ruleId, ruleData]) => {
      const value = ruleData.finalValue !== undefined ? ruleData.finalValue : ruleData.value
      if (value > 0) {
        const rule = ruleData.rule
        const percentage = rule.type === 'percentage_monthly' || rule.type === 'percentage_base'
          ? ` (${(rule.value * 100).toFixed(1)}%)`
          : ''
        applied[category].push({ label: rule.label + percentage, value })
      }
    })
  })
  
  return applied
}

export const printEmployeeReport = (result, period, currencySymbol = '$') => {
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
    <h1>PAYSLIP</h1>
    <p>${result.employee.name} | ${period}</p>
  </div>
  
  ${section('Employee Information', [
    row('Name', result.employee.name),
    row('Daily Rate', fmt(result.dailyRate)),
    row('Hourly Rate', fmt(result.hourlyRate))
  ].join(''))}
  
  ${section('Attendance Summary', [
    row('Days Worked', result.actualDays),
    row('Hours Worked', formatHours(result.totalHours))
  ].join(''))}
  
  ${section('Earnings', [
    row('Base Salary', fmt(result.baseSalary)),
    ...applied.bonuses.map(b => row(b.label, '+' + fmt(b.value))),
    result.adjustmentTotal > 0 ? row('Adjustments (+)', '+' + fmt(result.adjustmentTotal)) : '',
    row('Gross Salary', fmt(result.grossSalary), 'subtotal')
  ].filter(Boolean).join(''))}
  
  ${section('Deductions', [
    ...applied.deductions.map(d => row(d.label, '-' + fmt(d.value))),
    result.adjustmentTotal < 0 ? row('Adjustments (-)', '-' + fmt(Math.abs(result.adjustmentTotal))) : ''
  ].filter(Boolean).join('') || row('No Deductions', '-'))}
  
  ${section('Summary', row('Take-Home Salary', fmt(result.finalSalary), 'total'))}
  
  <div class="footer">
    Generated on ${new Date().toLocaleDateString()} | XPayroll
  </div>
</body>
</html>`

  const win = window.open('', '_blank', 'width=800,height=600')
  win.document.write(html)
  win.document.close()
  win.focus()
  win.print()
}

