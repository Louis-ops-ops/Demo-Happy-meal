import type { ActivityLevel, IsoDate, Sex } from './types'

/** TDEE multipliers (sédentaire 1.2 · léger 1.375 · modéré 1.55 · très actif 1.725 · extrême 1.9). */
export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  extreme: 1.9,
}

export const MIN_AGE = 18
export const MIN_TARGET_BMI = 18.5
/** Upper bound of a "normal" BMI, used for the protein reference weight. */
export const NORMAL_BMI_MAX = 25

/** Basal metabolic rate, Mifflin-St Jeor: 10·kg + 6.25·cm − 5·age + 5 (man) or − 161 (woman). */
export function bmr({
  sex,
  weightKg,
  heightCm,
  age,
}: {
  sex: Sex
  weightKg: number
  heightCm: number
  age: number
}): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'male' ? 5 : -161)
}

/** Total daily energy expenditure = BMR × activity factor. */
export function tdee(bmrKcal: number, activity: ActivityLevel): number {
  return bmrKcal * ACTIVITY_FACTORS[activity]
}

export function bmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100
  return weightKg / (heightM * heightM)
}

/** Weight (kg) giving the requested BMI at this height. */
export function weightForBmi(targetBmi: number, heightCm: number): number {
  const heightM = heightCm / 100
  return targetBmi * heightM * heightM
}

/** Age in full years on `today`. Both dates are `YYYY-MM-DD`. */
export function ageOn(birthDate: IsoDate, today: IsoDate): number {
  const [by, bm, bd] = birthDate.split('-').map(Number) as [number, number, number]
  const [ty, tm, td] = today.split('-').map(Number) as [number, number, number]
  const hadBirthday = tm > bm || (tm === bm && td >= bd)
  return ty - by - (hadBirthday ? 0 : 1)
}
