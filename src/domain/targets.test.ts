import { describe, expect, it } from 'vitest'
import {
  computeTargets,
  dailyDeficit,
  kgPerWeekFromDeficit,
  macroTargets,
  type ProfileInput,
  type Targets,
  type TargetsResult,
} from './targets'

const TODAY = '2026-11-02'

const man: ProfileInput = {
  sex: 'male',
  birthDate: '1996-05-10', // 30 years old
  heightCm: 180,
  weightKg: 80,
  activity: 'moderate',
  targetWeightKg: 72,
  pace: 'moderate',
}

const woman: ProfileInput = {
  sex: 'female',
  birthDate: '1996-05-10',
  heightCm: 165,
  weightKg: 65,
  activity: 'sedentary',
  targetWeightKg: 60,
  pace: 'moderate',
}

function ok(result: TargetsResult): Targets {
  if (!result.ok) throw new Error(`Expected targets, got ${JSON.stringify(result.error)}`)
  return result.targets
}

describe('dailyDeficit', () => {
  it('converts kg per week to kcal per day (× 7700 / 7)', () => {
    expect(dailyDeficit(0.25)).toBeCloseTo(275)
    expect(dailyDeficit(0.5)).toBeCloseTo(550)
    expect(dailyDeficit(0.75)).toBeCloseTo(825)
    expect(kgPerWeekFromDeficit(550)).toBeCloseTo(0.5)
  })
})

describe('computeTargets: nominal case', () => {
  it('computes the full recap for a man, moderate pace', () => {
    const t = ok(computeTargets(man, TODAY))
    expect(t).toMatchObject({
      age: 30,
      bmr: 1780,
      tdee: 2759,
      deficit: 550,
      kcalTarget: 2209,
      kgPerWeek: 0.5,
      currentBmi: 24.7,
      targetBmi: 22.2,
      estimatedWeeks: 16,
      estimatedEndDate: '2027-02-22',
      warnings: [],
    })
    expect(t.macros).toEqual({ proteinG: 144, fatG: 67, carbsG: 256 })
  })

  it('maps each pace to its deficit', () => {
    expect(ok(computeTargets({ ...man, pace: 'gentle' }, TODAY)).deficit).toBe(275)
    expect(ok(computeTargets({ ...man, pace: 'steady' }, TODAY)).deficit).toBe(825)
  })
})

describe('computeTargets: guardrails', () => {
  it('never goes below BMR, and says so', () => {
    const t = ok(computeTargets(woman, TODAY))
    expect(t.bmr).toBe(1370)
    expect(t.kcalTarget).toBe(1370)
    expect(t.warnings).toEqual([{ code: 'kcal_floor', floorKcal: 1370, reason: 'bmr' }])
    expect(t.deficit).toBe(274)
    expect(t.kgPerWeek).toBe(0.25)
    expect(t.estimatedWeeks).toBe(21)
  })

  it('never goes below 1200 kcal for a woman', () => {
    const t = ok(
      computeTargets(
        { ...woman, birthDate: '1966-01-01', weightKg: 50, heightCm: 155, targetWeightKg: 48, pace: 'gentle' },
        TODAY,
      ),
    )
    expect(t.bmr).toBe(1008)
    expect(t.kcalTarget).toBe(1200)
    expect(t.warnings).toEqual([{ code: 'kcal_floor', floorKcal: 1200, reason: 'sex_minimum' }])
  })

  it('never goes below 1500 kcal for a man', () => {
    const t = ok(
      computeTargets(
        { ...man, birthDate: '1950-01-01', weightKg: 58, heightCm: 160, targetWeightKg: 55, activity: 'sedentary' },
        TODAY,
      ),
    )
    expect(t.kcalTarget).toBeGreaterThanOrEqual(1500)
    expect(t.warnings).toContainEqual({ code: 'kcal_floor', floorKcal: 1500, reason: 'sex_minimum' })
  })

  it('reports when no deficit is possible instead of eating under the floor', () => {
    const t = ok(
      computeTargets(
        { ...woman, birthDate: '1956-01-01', weightKg: 45, heightCm: 150, targetWeightKg: 43, pace: 'gentle' },
        TODAY,
      ),
    )
    expect(t.kcalTarget).toBe(1200)
    expect(t.deficit).toBe(0)
    expect(t.kgPerWeek).toBe(0)
    expect(t.estimatedWeeks).toBeNull()
    expect(t.estimatedEndDate).toBeNull()
    expect(t.warnings.map((w) => w.code)).toEqual(['kcal_floor', 'no_deficit'])
  })

  it('caps the pace at about 1 % of body weight per week', () => {
    const t = ok(
      computeTargets(
        { ...man, weightKg: 60, heightCm: 175, targetWeightKg: 58, activity: 'active', pace: 'steady' },
        TODAY,
      ),
    )
    expect(t.warnings).toEqual([{ code: 'pace_capped', requestedKgPerWeek: 0.75, cappedKgPerWeek: 0.6 }])
    expect(t.deficit).toBe(660)
    expect(t.kgPerWeek).toBe(0.6)
    expect(t.kcalTarget).toBe(2012)
  })

  it('refuses under 18, on the day before the 18th birthday', () => {
    expect(computeTargets({ ...man, birthDate: '2008-11-03' }, TODAY)).toEqual({
      ok: false,
      error: { code: 'underage', minAge: 18 },
    })
    expect(computeTargets({ ...man, birthDate: '2008-11-02' }, TODAY).ok).toBe(true)
  })

  it('refuses a target BMI under 18.5 and gives the lowest allowed weight', () => {
    expect(computeTargets({ ...woman, targetWeightKg: 50 }, TODAY)).toEqual({
      ok: false,
      error: { code: 'target_bmi_too_low', minBmi: 18.5, minTargetWeightKg: 50.4 },
    })
    expect(computeTargets({ ...woman, targetWeightKg: 50.4 }, TODAY).ok).toBe(true)
  })

  it('only handles weight loss (MVP)', () => {
    expect(computeTargets({ ...man, targetWeightKg: 80 }, TODAY)).toEqual({
      ok: false,
      error: { code: 'not_weight_loss' },
    })
    expect(computeTargets({ ...man, targetWeightKg: 85 }, TODAY).ok).toBe(false)
  })

  it.each([
    ['heightCm', { heightCm: 0 }],
    ['heightCm', { heightCm: 300 }],
    ['weightKg', { weightKg: Number.NaN }],
    ['weightKg', { weightKg: 20 }],
    ['targetWeightKg', { targetWeightKg: -1 }],
    ['birthDate', { birthDate: 'abc' }],
    ['birthDate', { birthDate: '2027-01-01' }],
    ['birthDate', { birthDate: '1900-01-01' }],
  ] as const)('rejects an invalid %s', (field, patch) => {
    expect(computeTargets({ ...man, ...patch }, TODAY)).toEqual({
      ok: false,
      error: { code: 'invalid_input', field },
    })
  })
})

describe('macroTargets', () => {
  it('uses 1.8 g/kg of protein and 27.5 % of kcal from fat, carbs for the rest', () => {
    expect(macroTargets({ kcal: 2209, weightKg: 80, heightCm: 180 })).toEqual({
      proteinG: 144,
      fatG: 67,
      carbsG: 256,
    })
  })

  it('caps the protein reference weight at BMI 25', () => {
    // 165 cm at BMI 25 = 68.06 kg → 122.5 g, not 216 g for 120 kg.
    expect(macroTargets({ kcal: 1500, weightKg: 120, heightCm: 165 })).toEqual({
      proteinG: 123,
      fatG: 46,
      carbsG: 149,
    })
  })

  it('never returns negative carbs', () => {
    const macros = macroTargets({ kcal: 600, weightKg: 80, heightCm: 180 })
    expect(macros.carbsG).toBe(0)
    expect(macros.proteinG * 4 + macros.fatG * 9).toBeLessThanOrEqual(602)
  })

  it('keeps total macro kcal close to the target', () => {
    const { proteinG, fatG, carbsG } = macroTargets({ kcal: 1850, weightKg: 70, heightCm: 170 })
    expect(proteinG * 4 + carbsG * 4 + fatG * 9).toBeGreaterThan(1840)
    expect(proteinG * 4 + carbsG * 4 + fatG * 9).toBeLessThan(1860)
  })
})
