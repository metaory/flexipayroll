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
    assert.ok(near(r.effectiveDays, 21), `1 undertime day block should reduce effectiveDays to 21, got ${r.effectiveDays}`)
    assert.ok(near(r.actualDays, 21), `actualDays should match effectiveDays, got ${r.actualDays}`)
    assert.ok(near(r.baseSalary, employee.dailySalary * 21), `expected baseSalary ${employee.dailySalary * 21}, got ${r.baseSalary}`)
  }

  {
    const attendanceItems = [{ hours: -22 }]
    const r = applyRules(employee, attendanceItems, [], { ...baseConfig, workdayHours: 8, workingDaysPerMonth: 31 })
    assert.ok(near(r.undertimeDayBlocks, 2), `22h / 8h should be 2 day blocks, got ${r.undertimeDayBlocks}`)
    assert.ok(near(r.effectiveDays, 29), `expected effectiveDays 29 (31 - 2), got ${r.effectiveDays}`)
    assert.ok(near(r.actualDays, 29), `report days should be 29, got ${r.actualDays}`)
  }

  {
    const attendanceItems = [{ hours: 6.5 * 20 }]
    const r = applyRules(employee, attendanceItems, [], baseConfig)
    assert.ok(near(r.cappedEffectiveDays, baseConfig.workingDaysPerMonth), `expected cappedEffectiveDays ${baseConfig.workingDaysPerMonth}, got ${r.cappedEffectiveDays}`)
    const expected = employee.dailySalary * baseConfig.workingDaysPerMonth
    assert.ok(near(r.baseFromDays, expected), `expected baseFromDays ${expected}, got ${r.baseFromDays}`)
    assert.ok(near(r.baseSalary, expected), `expected baseSalary ${expected}, got ${r.baseSalary}`)
  }

  {
    const attendanceItems = { items: [{ hours: -6.5 * 3 }], absent: 3 }
    const r = applyRules(employee, attendanceItems, [fixedDailyRule], baseConfig)
    assert.ok(near(r.undertimeDayBlocks, 3), `expected 3 undertime day blocks, got ${r.undertimeDayBlocks}`)
    assert.ok(near(r.effectiveDays, 16), `expected effectiveDays 16 (22 - 3 absent - 3 UT), got ${r.effectiveDays}`)
    assert.ok(near(r.bonuses.fdp.value, (fixedDailyRule.value * 16) / 30), `bonus should use same 16 days, got ${r.bonuses.fdp.value}`)
  }

  {
    const attendanceItems = [{ hours: 6.5 * 40 }]
    const r = applyRules(employee, attendanceItems, [fixedDailyRule], baseConfig)
    assert.ok(near(r.effectiveDays, 22), `expected effectiveDays 22, got ${r.effectiveDays}`)
    assert.ok(near(r.bonuses.fdp.value, (fixedDailyRule.value * 22) / 30), `bonus should use 22/30, got ${r.bonuses.fdp.value}`)
  }

  {
    const config30 = { ...baseConfig, workingDaysPerMonth: 30, monthDays: 30 }
    const r = applyRules(employee, { items: [], absent: 0 }, [fixedDailyRule], config30)
    assert.ok(near(r.bonuses.fdp.value, fixedDailyRule.value), `expected full bonus at 30 effective days, got ${r.bonuses.fdp.value}`)
  }

  {
    const config28 = { ...baseConfig, workingDaysPerMonth: 28, monthDays: 30 }
    const r = applyRules(employee, { items: [], absent: 0 }, [fixedDailyRule], config28)
    assert.ok(near(r.effectiveDays, 28), `expected effectiveDays 28 from config, got ${r.effectiveDays}`)
    assert.ok(near(r.bonuses.fdp.value, (fixedDailyRule.value * 28) / 30), `bonus should use 28/30, got ${r.bonuses.fdp.value}`)
  }

  {
    const config28 = { ...baseConfig, workingDaysPerMonth: 28, monthDays: 30 }
    const r = applyRules(employee, { items: [], absent: 3 }, [fixedDailyRule], config28)
    assert.ok(near(r.effectiveDays, 25), `base effectiveDays should be 28 - 3 from config, got ${r.effectiveDays}`)
    assert.ok(near(r.baseSalary, employee.dailySalary * 25), `base salary should use config days, got ${r.baseSalary}`)
    assert.ok(near(r.bonuses.fdp.value, (fixedDailyRule.value * 25) / 30), `bonus should use same 25 days ÷ 30, got ${r.bonuses.fdp.value}`)
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
    const r = applyRules(employee, { items: [], absent: 3 }, rules31, config31)
    assert.ok(near(r.effectiveDays, 28), `effectiveDays should be 31 - 3, got ${r.effectiveDays}`)
    assert.ok(near(r.bonuses.fdp.value, (fixedDailyRule.value * 28) / 30), `bonus should use 28/30, got ${r.bonuses.fdp.value}`)
    assert.ok(near(r.bonuses.hp.value, (hourlyProratedRule.value * 28) / 30), `hourly bonus should use 28/30, got ${r.bonuses.hp.value}`)
  }

  {
    const r = applyRules(employee, { items: [], absent: 5 }, rules31, config31)
    assert.ok(near(r.effectiveDays, 26), `effectiveDays should be 31 - 5, got ${r.effectiveDays}`)
    assert.ok(near(r.bonuses.fdp.value, (fixedDailyRule.value * 26) / 30), `bonus should use 26/30, got ${r.bonuses.fdp.value}`)
  }

  {
    const attendanceItems = [{ hours: -5 }, { hours: 9 }]
    const r = applyRules(employee, attendanceItems, rules31, config31)
    assert.ok(near(r.undertimeDayBlocks, 0), `5h undertime is less than 1 day, got ${r.undertimeDayBlocks}`)
    assert.ok(near(r.effectiveDays, 31), `expected effectiveDays 31, got ${r.effectiveDays}`)
    assert.ok(near(r.bonuses.fdp.value, fixedDailyRule.value), `expected fixed_daily_prorated ${fixedDailyRule.value}, got ${r.bonuses.fdp.value}`)
    assert.ok(near(r.bonuses.hp.value, hourlyProratedRule.value), `expected hourly_prorated ${hourlyProratedRule.value}, got ${r.bonuses.hp.value}`)
  }

  {
    const attendanceItems = [{ hours: -8 }]
    const r = applyRules(employee, attendanceItems, rules31, config31)
    assert.ok(near(r.undertimeDayBlocks, 1), `8h / 8h = 1 day block, got ${r.undertimeDayBlocks}`)
    assert.ok(near(r.effectiveDays, 30), `expected effectiveDays 30, got ${r.effectiveDays}`)
    assert.ok(near(r.actualDays, 30), `report days should be 30, got ${r.actualDays}`)
    assert.ok(near(r.baseSalary, employee.dailySalary * 30), `expected baseSalary ${employee.dailySalary * 30}, got ${r.baseSalary}`)
    assert.ok(near(r.bonuses.fdp.value, fixedDailyRule.value), `bonus at 30 effective days is full, got ${r.bonuses.fdp.value}`)
    assert.ok(near(r.bonuses.hp.value, hourlyProratedRule.value), `expected hourly_prorated ${hourlyProratedRule.value}, got ${r.bonuses.hp.value}`)
  }

  {
    const attendanceItems = [{ hours: -16 }]
    const r = applyRules(employee, attendanceItems, rules31, config31)
    assert.ok(near(r.undertimeDayBlocks, 2), `16h / 8h = 2 day blocks, got ${r.undertimeDayBlocks}`)
    assert.ok(near(r.effectiveDays, 29), `expected effectiveDays 29, got ${r.effectiveDays}`)
    assert.ok(near(r.bonuses.fdp.value, (fixedDailyRule.value * 29) / 30), `bonus must match employee days 29 not 30, got ${r.bonuses.fdp.value}`)
  }

  {
    const attendanceItems = [{ hours: -8 }, { hours: 9 }]
    const r = applyRules(employee, attendanceItems, rules31, config31)
    assert.ok(near(r.undertimeDayBlocks, 1), `undertime day blocks ignore OT, got ${r.undertimeDayBlocks}`)
    assert.ok(near(r.effectiveDays, 30), `expected effectiveDays 30, got ${r.effectiveDays}`)
    assert.ok(near(r.baseSalary, employee.dailySalary * 30), `expected baseSalary ${employee.dailySalary * 30}, got ${r.baseSalary}`)
    assert.ok(near(r.bonuses.fdp.value, fixedDailyRule.value), `expected fixed_daily_prorated ${fixedDailyRule.value}, got ${r.bonuses.fdp.value}`)
    assert.ok(near(r.bonuses.hp.value, hourlyProratedRule.value), `expected hourly_prorated ${hourlyProratedRule.value}, got ${r.bonuses.hp.value}`)
  }

  {
    const attendanceItems = { items: [{ hours: -21 }], absent: 2 }
    const r = applyRules(employee, attendanceItems, [], { ...config31, workdayHours: 8, workingDaysPerMonth: 22, monthDays: 30 })
    assert.ok(near(r.undertimeDayBlocks, 2), `floor(21/8)=2, got ${r.undertimeDayBlocks}`)
    assert.ok(near(r.effectiveDays, 18), `expected effectiveDays 18 (22 - 2 absent - 2 UT), got ${r.effectiveDays}`)
    assert.ok(near(r.baseSalary, employee.dailySalary * 18), `expected baseSalary ${employee.dailySalary * 18}, got ${r.baseSalary}`)
  }

  {
    const otConfig = { ...baseConfig, overtimeRate: 1.5, undertimeRate: 0.5 }
    const attendanceItems = [{ hours: 4 }, { hours: -2 }]
    const r = applyRules(employee, attendanceItems, [], otConfig)
    const expectedAdj = attendancePay(4, 1.5, employee.dailySalary)
      - attendancePay(2, 0.5, employee.dailySalary)
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
    assert.equal(r.bonuses.fixed_bonus.value, 0, 'excluded fixed rule should appear as zero')
    assert.ok(r.bonuses.fixed_bonus.probationExcluded, 'excluded fixed rule should be marked')
    assert.ok(r.bonuses.fdp, 'non-excluded rule should apply')
    assert.ok(r.bonuses.hp, 'non-excluded rule should apply')
  }

  {
    const probationExcludeFdp = { dailySalary: 100, probation: 'b', probationRulesB: ['fdp'] }
    const r = applyRules(probationExcludeFdp, [], [fixedDailyRule, hourlyProratedRule], config31)
    assert.equal(r.bonuses.fdp.value, 0, 'excluded rule should appear as zero')
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
    assert.equal(r.bonuses.male_bonus.value, 0, 'excluded male bonus should appear as zero')
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
    assert.equal(result.ruleResults.bonuses.bonus_e.value, 0, 'excluded bonus_e should appear as zero')
    assert.equal(result.ruleResults.bonuses.marital_bonus.value, 0, 'excluded marital_bonus should appear as zero')
    assert.ok(result.ruleResults.bonuses.extra, 'non-excluded bonus should apply')
  }

  {
    const daily = 3934000
    const ot = attendancePay(47.92, 0.6, daily)
    const ut = attendancePay(12.73, 0.6, daily)
    assert.ok(near(ot, (daily / 0.6) * 47.92), `expected ot ${(daily / 0.6) * 47.92}, got ${ot}`)
    assert.ok(near(ut, (daily / 0.6) * 12.73), `expected ut ${(daily / 0.6) * 12.73}, got ${ut}`)
    assert.ok(near(ot - ut, ((daily / 0.6) * 47.92) - ((daily / 0.6) * 12.73)), `expected ot-ut, got ${ot - ut}`)
  }

  {
    const emp = { id: 'adj1', dailySalary: 100000 }
    const config = { workdayHours: 8, workingDaysPerMonth: 22, monthDays: 30, overtimeRate: 0, undertimeRate: 0 }
    const none = calculateEmployeePayroll(emp, { items: [], absent: 0 }, [], [], config)
    const withAdj = calculateEmployeePayroll(emp, { items: [], absent: 0 }, [
      { id: 'a1', label: 'Loan', amount: 500000 },
      { id: 'a2', label: 'Advance', amount: -200000 }
    ], [], config)
    assert.ok(near(withAdj.adjustmentTotal, -700000), `adjustments must always deduct, got ${withAdj.adjustmentTotal}`)
    assert.ok(near(withAdj.grossSalary, none.grossSalary - 700000), `gross should fall by 700000, got ${withAdj.grossSalary} vs ${none.grossSalary}`)
    assert.ok(near(withAdj.finalSalary, none.finalSalary - 700000), `final should fall by 700000, got ${withAdj.finalSalary}`)
    assert.ok(withAdj.adjustments.every(a => a.amount < 0), 'stored adjustment amounts should be negative')
  }
}

run()
