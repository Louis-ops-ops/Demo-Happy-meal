import { describe, expect, it } from 'vitest'
import { ACTIVITY_FACTORS, ageOn, bmi, bmr, tdee, weightForBmi } from './body'

describe('bmr (Mifflin-St Jeor)', () => {
  it('computes a man: 10·kg + 6.25·cm − 5·age + 5', () => {
    expect(bmr({ sex: 'male', weightKg: 80, heightCm: 180, age: 30 })).toBe(1780)
  })

  it('computes a woman: 10·kg + 6.25·cm − 5·age − 161', () => {
    expect(bmr({ sex: 'female', weightKg: 65, heightCm: 165, age: 30 })).toBe(1370.25)
  })
})

describe('tdee', () => {
  it('uses the five activity factors', () => {
    expect(ACTIVITY_FACTORS).toEqual({ sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, extreme: 1.9 })
    expect(tdee(1780, 'moderate')).toBeCloseTo(2759)
    expect(tdee(1000, 'sedentary')).toBeCloseTo(1200)
    expect(tdee(1000, 'extreme')).toBeCloseTo(1900)
  })
})

describe('bmi', () => {
  it('computes and inverts the BMI', () => {
    expect(bmi(80, 180)).toBeCloseTo(24.69, 2)
    expect(weightForBmi(25, 180)).toBeCloseTo(81)
  })
})

describe('ageOn', () => {
  it('counts full years, the birthday included', () => {
    expect(ageOn('2008-11-02', '2026-11-02')).toBe(18)
    expect(ageOn('2008-11-03', '2026-11-02')).toBe(17)
    expect(ageOn('2008-12-01', '2026-11-02')).toBe(17)
    expect(ageOn('1996-05-10', '2026-11-02')).toBe(30)
  })

  it('handles 29 February in a non-leap year', () => {
    expect(ageOn('2004-02-29', '2026-02-28')).toBe(21)
    expect(ageOn('2004-02-29', '2026-03-01')).toBe(22)
  })
})
