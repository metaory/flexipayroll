import assert from 'node:assert/strict'
import { applyRules } from '../src/rules.js'

const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps

const run = () => {
  const employee = { dailySalary: 100, probationary: false }
  const fixedDailyRule = {
    id: 'fdp',
    label: 'Fixed Daily Prorated',
    type: 'fixed_daily_prorated',
    value: 3000,
    criteria: { appliesTo: [] },
    category: 'bonus',
    order: 1,
    enabled: true
  }
  const baseConfig = {
    workdayHours: 6.5,
    workingDaysPerMonth: 22,
    monthDays: 30,
    overtimeRate: 0,
    undertimeDeductionRate: 0
  }

  {
    const attendanceItems = [{ hours: -6.5 }]
    const r = applyRules(employee, attendanceItems, [], baseConfig)
    const expected = employee.dailySalary * 29
    assert.ok(near(r.baseFromDays, expected), `expected baseFromDays ${expected}, got ${r.baseFromDays}`)
    assert.ok(near(r.baseSalary, expected), `expected baseSalary ${expected}, got ${r.baseSalary}`)
  }

  {
    const attendanceItems = [{ hours: 6.5 * 20 }]
    const r = applyRules(employee, attendanceItems, [], baseConfig)
    assert.ok(near(r.cappedEffectiveDays, baseConfig.monthDays), `expected cappedEffectiveDays ${baseConfig.monthDays}, got ${r.cappedEffectiveDays}`)
    const expected = employee.dailySalary * baseConfig.monthDays
    assert.ok(near(r.baseFromDays, expected), `expected baseFromDays ${expected}, got ${r.baseFromDays}`)
    assert.ok(near(r.baseSalary, expected), `expected baseSalary ${expected}, got ${r.baseSalary}`)
  }

  {
    const attendanceItems = [{ hours: -6.5 * 3 }]
    const r = applyRules(employee, attendanceItems, [fixedDailyRule], baseConfig)
    assert.ok(near(r.effectiveDays, 27), `expected effectiveDays 27, got ${r.effectiveDays}`)
    const expectedRuleValue = (fixedDailyRule.value * 27) / 30
    assert.ok(near(r.bonuses.fdp.value, expectedRuleValue), `expected fixed_daily_prorated ${expectedRuleValue}, got ${r.bonuses.fdp.value}`)
  }

  {
    const attendanceItems = [{ hours: 6.5 * 40 }]
    const r = applyRules(employee, attendanceItems, [fixedDailyRule], baseConfig)
    assert.ok(near(r.effectiveDays, 30), `expected capped effectiveDays 30, got ${r.effectiveDays}`)
    assert.ok(near(r.bonuses.fdp.value, fixedDailyRule.value), `expected fixed_daily_prorated ${fixedDailyRule.value}, got ${r.bonuses.fdp.value}`)
  }
}

run()
