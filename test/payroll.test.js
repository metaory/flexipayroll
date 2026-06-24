import assert from 'node:assert/strict'
import { applyRules } from '../src/rules.js'
import { calculateEmployeePayroll } from '../src/payroll.js'
import { normalizeProbationFields } from '../src/probation.js'
import { attendancePay } from '../src/core.js'

const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps

const run = () => {
  const employee = { dailySalary: 100 }
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
    undertimeRate: 0
  }

  {
    const attendanceItems = [{ hours: -6.5 }]
    const r = applyRules(employee, attendanceItems, [], baseConfig)
    const expected = employee.dailySalary * 30
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

  const hourlyProratedRule = {
    id: 'hp',
    label: 'Hourly Prorated',
    type: 'hourly_prorated',
    value: 3100,
    criteria: { appliesTo: [] },
    category: 'bonus',
    order: 2,
    enabled: true
  }
  const config31 = {
    workdayHours: 8,
    workingDaysPerMonth: 31,
    monthDays: 31,
    overtimeRate: 0,
    undertimeRate: 0
  }
  const rules31 = [fixedDailyRule, hourlyProratedRule]

  {
    const r = applyRules(employee, [], rules31, config31)
    assert.ok(near(r.effectiveDays, 31), `expected effectiveDays 31, got ${r.effectiveDays}`)
    assert.ok(near(r.bonuses.fdp.value, fixedDailyRule.value), `expected fixed_daily_prorated ${fixedDailyRule.value}, got ${r.bonuses.fdp.value}`)
    assert.ok(near(r.bonuses.hp.value, hourlyProratedRule.value), `expected hourly_prorated ${hourlyProratedRule.value}, got ${r.bonuses.hp.value}`)
  }

  {
    const attendanceItems = [{ hours: -5 }, { hours: 9 }]
    const r = applyRules(employee, attendanceItems, rules31, config31)
    assert.ok(near(r.effectiveDays, 31), `expected effectiveDays 31, got ${r.effectiveDays}`)
    assert.ok(near(r.bonuses.fdp.value, fixedDailyRule.value), `expected fixed_daily_prorated ${fixedDailyRule.value}, got ${r.bonuses.fdp.value}`)
    assert.ok(near(r.bonuses.hp.value, hourlyProratedRule.value), `expected hourly_prorated ${hourlyProratedRule.value}, got ${r.bonuses.hp.value}`)
  }

  {
    const attendanceItems = [{ hours: -8 }]
    const r = applyRules(employee, attendanceItems, rules31, config31)
    const expected = (fixedDailyRule.value * 30) / 31
    assert.ok(near(r.effectiveDays, 30), `expected effectiveDays 30, got ${r.effectiveDays}`)
    assert.ok(near(r.bonuses.fdp.value, expected), `expected fixed_daily_prorated ${expected}, got ${r.bonuses.fdp.value}`)
    assert.ok(near(r.bonuses.hp.value, (hourlyProratedRule.value * 30) / 31), `expected hourly_prorated ${(hourlyProratedRule.value * 30) / 31}, got ${r.bonuses.hp.value}`)
  }

  {
    const attendanceItems = [{ hours: -8 }, { hours: 9 }]
    const r = applyRules(employee, attendanceItems, rules31, config31)
    const expected = (fixedDailyRule.value * 30) / 31
    assert.ok(near(r.effectiveDays, 30), `expected effectiveDays 30, got ${r.effectiveDays}`)
    assert.ok(near(r.bonuses.fdp.value, expected), `expected fixed_daily_prorated ${expected}, got ${r.bonuses.fdp.value}`)
    assert.ok(near(r.bonuses.hp.value, (hourlyProratedRule.value * 30) / 31), `expected hourly_prorated ${(hourlyProratedRule.value * 30) / 31}, got ${r.bonuses.hp.value}`)
  }

  {
    const otConfig = { ...baseConfig, overtimeRate: 1.5, undertimeRate: 0.5 }
    const attendanceItems = [{ hours: 4 }, { hours: -2 }]
    const r = applyRules(employee, attendanceItems, [], otConfig)
    const expectedAdj = attendancePay(4, 1.5, employee.dailySalary, otConfig.workdayHours)
      - attendancePay(2, 0.5, employee.dailySalary, otConfig.workdayHours)
    assert.equal(r.attendanceAdjustment, expectedAdj, `expected attendanceAdjustment ${expectedAdj}, got ${r.attendanceAdjustment}`)
    assert.ok(near(r.grossSalary, r.baseSalary + expectedAdj), `expected gross ${r.baseSalary + expectedAdj}, got ${r.grossSalary}`)
  }

  {
    const fixedBonus = {
      id: 'fixed_bonus',
      label: 'Fixed Bonus',
      type: 'fixed',
      value: 5000,
      criteria: { appliesTo: [] },
      category: 'bonus',
      order: 3,
      enabled: true
    }
    const allRules = [fixedDailyRule, hourlyProratedRule, fixedBonus]
    const onProbationNoExclusions = { dailySalary: 100, probation: 'a', probationRulesA: [] }
    const r = applyRules(onProbationNoExclusions, [], allRules, config31)
    assert.ok(r.bonuses.fdp, 'probation with no exclusions should still apply rules')
    assert.ok(r.bonuses.fixed_bonus, 'fixed rule should apply when not excluded')
  }

  {
    const fixedBonus = {
      id: 'fixed_bonus',
      label: 'Fixed Bonus',
      type: 'fixed',
      value: 5000,
      criteria: { appliesTo: [] },
      category: 'bonus',
      order: 3,
      enabled: true
    }
    const excludeFixed = { dailySalary: 100, probation: 'b', probationRulesB: ['fixed_bonus'] }
    const r = applyRules(excludeFixed, [], [fixedDailyRule, hourlyProratedRule, fixedBonus], config31)
    assert.equal(r.bonuses.fixed_bonus, undefined, 'excluded fixed rule should not apply')
    assert.ok(r.bonuses.fdp, 'non-excluded rule should apply')
    assert.ok(r.bonuses.hp, 'non-excluded rule should apply')
  }

  {
    const probationExcludeFdp = { dailySalary: 100, probation: 'b', probationRulesB: ['fdp'] }
    const r = applyRules(probationExcludeFdp, [], [fixedDailyRule, hourlyProratedRule], config31)
    assert.equal(r.bonuses.fdp, undefined, 'excluded rule should not apply')
    assert.ok(r.bonuses.hp, 'non-excluded rule should apply')
  }

  {
    const maleBonus = {
      id: 'male_bonus',
      label: 'Male Bonus',
      type: 'fixed',
      value: 5000,
      criteria: { appliesTo: ['male'] },
      category: 'bonus',
      order: 4,
      enabled: true
    }
    const excludeMaleOnly = {
      dailySalary: 100,
      gender: 'male',
      probationRulesA: ['male_bonus'],
      probationRulesB: []
    }
    const r = applyRules(excludeMaleOnly, [], [fixedDailyRule, maleBonus], config31)
    assert.equal(r.bonuses.male_bonus, undefined, 'excluded male bonus should not apply')
    assert.ok(r.bonuses.fdp, 'non-excluded rule should apply')
  }

  {
    const bonus1 = { id: 'bonus_e', label: 'Bonus E', type: 'days_multiplier', value: 5, criteria: { appliesTo: [] }, category: 'bonus', order: 1, enabled: true }
    const bonus2 = { id: 'marital_bonus', label: 'Marital Bonus', type: 'fixed', value: 150000, criteria: { appliesTo: ['married'] }, category: 'bonus', order: 3, enabled: true }
    const bonus3 = { id: 'extra', label: 'Extra', type: 'fixed', value: 1000, criteria: { appliesTo: [] }, category: 'bonus', order: 4, enabled: true }
    const allBonuses = [bonus1, bonus2, bonus3]
    const employeeData = normalizeProbationFields({
      id: '1',
      name: 'Test',
      gender: 'male',
      maritalStatus: 'married',
      dailySalary: 100,
      probationRulesA: ['bonus_e', 'marital_bonus'],
      probationRulesB: []
    })
    const result = calculateEmployeePayroll(employeeData, [], [], allBonuses, config31)
    assert.equal(result.ruleResults.bonuses.bonus_e, undefined, 'excluded bonus_e should not apply')
    assert.equal(result.ruleResults.bonuses.marital_bonus, undefined, 'excluded fixed marital_bonus should not apply')
    assert.ok(result.ruleResults.bonuses.extra, 'non-excluded bonus should apply')
  }

  {
    const hourly = 3934000 / 8
    const ot = attendancePay(47.92, 0.6, 3934000, 8)
    const ut = attendancePay(12.73, 0.6, 3934000, 8)
    assert.ok(near(ot, (hourly / 0.6) * 47.92), `expected ot ${(hourly / 0.6) * 47.92}, got ${ot}`)
    assert.ok(near(ut, (hourly / 0.6) * 12.73), `expected ut ${(hourly / 0.6) * 12.73}, got ${ut}`)
    assert.ok(near(ot - ut, ((hourly / 0.6) * 47.92) - ((hourly / 0.6) * 12.73)), `expected ot-ut, got ${ot - ut}`)
  }
}

run()
