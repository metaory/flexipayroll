/** Probation rule exclusions — checked rules are NOT entitled during probation */

export const probationRulesKey = (key) => key === 'a' ? 'probationRulesA' : 'probationRulesB'

const asArray = (v) => (Array.isArray(v) ? v : [])

export const resolveProbation = (employee) => {
  const a = asArray(employee?.probationRulesA)
  const b = asArray(employee?.probationRulesB)
  if (a.length > 0) return 'a'
  if (b.length > 0) return 'b'
  if (employee?.probation === 'a' || employee?.probation === 'b') return employee.probation
  return null
}

export const isOnProbation = (employee) => !!resolveProbation(employee)

export const getProbationRulesFor = (employee, key) =>
  asArray(employee?.[probationRulesKey(key)])

export const getActiveProbationRules = (employee) => {
  const key = resolveProbation(employee)
  return key ? getProbationRulesFor(employee, key) : []
}

export const hasProbationRules = (employee, key) =>
  getProbationRulesFor(employee, key).length > 0

export const PROBATION_LABELS = { a: '3 months', b: '6 months' }
export const PROBATION_BG = { a: 'var(--info)', b: 'var(--warning)' }

export const getProbationLabel = (employee) => {
  const key = resolveProbation(employee)
  return key ? PROBATION_LABELS[key] ?? null : null
}

export const ruleMatchesProbationList = (rule, ids) =>
  ids.some(id => id === rule.id || id === rule.label)

/** null = not on probation; [] = on probation, nothing excluded */
export const getProbationExclusions = (employee) =>
  isOnProbation(employee) ? getActiveProbationRules(employee) : null

export const filterRulesForEmployee = (employee, rules) => {
  const excluded = getProbationExclusions(employee)
  if (excluded === null) return rules
  return rules.filter(r => !ruleMatchesProbationList(r, excluded))
}

export const normalizeProbationFields = (employee) => {
  const { probationary, probationRules, probation, ...rest } = employee ?? {}
  const legacy = asArray(probationRules)
  let probationRulesA = asArray(rest.probationRulesA)
  let probationRulesB = asArray(rest.probationRulesB)
  if (!probationRulesA.length && !probationRulesB.length && legacy.length) {
    probationRulesA = probation === 'b' ? [] : legacy
    probationRulesB = probation === 'b' ? legacy : []
  }
  if (probationRulesA.length && probationRulesB.length) {
    probationRulesB = probation === 'b' ? probationRulesB : []
    probationRulesA = probation === 'b' ? [] : probationRulesA
  }
  const resolved = probationRulesA.length > 0 ? 'a' : probationRulesB.length > 0 ? 'b' : (probation === 'a' || probation === 'b' ? probation : null)
  return { ...rest, probation: resolved, probationRulesA, probationRulesB }
}
