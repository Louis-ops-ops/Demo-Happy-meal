import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { db, getProfile, latestWeighIn, saveOnboarding } from '../../data/db'
import { computeRecap, EMPTY_DRAFT, missingMetrics, parseDecimal, toProfile, type OnboardingDraft } from './draft'

const TODAY = '2026-11-02'

const filled: OnboardingDraft = {
  ...EMPTY_DRAFT,
  sex: 'male',
  birthDate: '1996-05-10',
  heightCm: '180',
  weightKg: '80',
  activity: 'moderate',
  targetWeightKg: '72',
  diets: ['vegetarian'],
  exclusions: ['aubergine'],
}

describe('parseDecimal', () => {
  it('accepts French and English decimals only', () => {
    expect(parseDecimal('78,5')).toBe(78.5)
    expect(parseDecimal(' 80 ')).toBe(80)
    expect(parseDecimal('80kg')).toBeNaN()
    expect(parseDecimal('')).toBeNaN()
  })
})

describe('missingMetrics', () => {
  it('lists the mandatory fields still empty', () => {
    expect(missingMetrics(EMPTY_DRAFT)).toEqual(['sex', 'birthDate', 'heightCm', 'weightKg', 'activity'])
    expect(missingMetrics(filled)).toEqual([])
  })
})

describe('computeRecap', () => {
  it('needs the metrics', () => {
    expect(computeRecap(EMPTY_DRAFT, TODAY)).toEqual({ ok: false, error: { code: 'incomplete' } })
  })

  it('computes weight-loss targets', () => {
    const recap = computeRecap(filled, TODAY)
    expect(recap.ok && recap.kind).toBe('loss')
    expect(recap.ok && recap.targets.kcalTarget).toBe(2209)
  })

  it('falls back to maintenance when the goal is skipped', () => {
    const recap = computeRecap({ ...filled, hasGoal: false, targetWeightKg: '' }, TODAY)
    expect(recap.ok && recap.kind).toBe('maintenance')
    expect(recap.ok && recap.targets.kcalTarget).toBe(2759)
  })

  it('surfaces guardrail errors', () => {
    expect(computeRecap({ ...filled, targetWeightKg: '50' }, TODAY)).toMatchObject({
      ok: false,
      error: { code: 'target_bmi_too_low' },
    })
    expect(computeRecap({ ...filled, hasGoal: false, birthDate: '2012-01-01' }, TODAY)).toMatchObject({
      ok: false,
      error: { code: 'underage' },
    })
  })
})

describe('toProfile and saveOnboarding', () => {
  it('builds and saves the profile with the first weigh-in', async () => {
    const { profile, weightKg } = toProfile(filled, TODAY)
    expect(profile).toMatchObject({ goal: { targetWeightKg: 72, pace: 'moderate' }, kcalTarget: 2209, diets: ['vegetarian'] })

    await saveOnboarding(profile, weightKg)
    expect(await getProfile()).toEqual(profile)
    expect(await latestWeighIn()).toEqual({ date: TODAY, kg: 80 })
    await db.delete()
  })

  it('stores no goal for maintenance, and refuses an incomplete draft', () => {
    expect(toProfile({ ...filled, hasGoal: false }, TODAY).profile.goal).toBeNull()
    expect(() => toProfile(EMPTY_DRAFT, TODAY)).toThrow()
  })
})

describe('profileToDraft', () => {
  it('gives back the same profile once the onboarding is finished', async () => {
    const { profileToDraft } = await import('./draft')
    const { profile, weightKg } = toProfile(
      { ...EMPTY_DRAFT, sex: 'male', birthDate: '1990-01-01', heightCm: '180', weightKg: '85', activity: 'light', targetWeightKg: '78', diets: ['vegan'], exclusions: ['Ail'], householdSize: 2 },
      '2026-11-02',
    )
    expect(toProfile(profileToDraft(profile, weightKg), '2026-11-02')).toEqual({ profile, weightKg })
    const maintenance = { ...profile, goal: null }
    expect(profileToDraft(maintenance, 85)).toMatchObject({ hasGoal: false, targetWeightKg: '', pace: 'moderate' })
  })
})
