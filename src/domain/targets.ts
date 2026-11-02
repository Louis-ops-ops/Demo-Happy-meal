import {
  ageOn,
  bmi,
  bmr as computeBmr,
  MIN_AGE,
  MIN_TARGET_BMI,
  NORMAL_BMI_MAX,
  tdee as computeTdee,
  weightForBmi,
} from './body'
import { addDays, isIsoDate } from './dates'
import type { ActivityLevel, IsoDate, MacroTargets, Pace, Sex } from './types'

/** kcal stored in 1 kg of body fat (rule of thumb used for the deficit). */
export const KCAL_PER_KG = 7700

/** Weekly loss for each pace: doux, modéré, soutenu. */
export const PACE_KG_PER_WEEK: Record<Pace, number> = {
  gentle: 0.25,
  moderate: 0.5,
  steady: 0.75,
}

/** Daily kcal target never goes below these, nor below BMR. */
export const MIN_KCAL: Record<Sex, number> = { male: 1500, female: 1200 }

/** Max weekly loss as a share of current weight (≈ 1 %). */
export const MAX_WEEKLY_LOSS_RATIO = 0.01

/** Protein g per kg of reference weight (range 1.6 to 2.0). */
export const PROTEIN_G_PER_KG = { min: 1.6, default: 1.8, max: 2.0 } as const
/** Share of kcal from fat (range 25 to 30 %). */
export const FAT_KCAL_SHARE = { min: 0.25, default: 0.275, max: 0.3 } as const
export const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const

/** Plausible input ranges; anything outside is treated as a typo. */
export const INPUT_LIMITS = {
  heightCm: { min: 120, max: 230 },
  weightKg: { min: 30, max: 300 },
  age: { max: 110 },
} as const

export type ProfileInput = {
  sex: Sex
  birthDate: IsoDate
  heightCm: number
  weightKg: number
  activity: ActivityLevel
  targetWeightKg: number
  pace: Pace
}

export type TargetsError =
  | { code: 'invalid_input'; field: keyof ProfileInput }
  | { code: 'underage'; minAge: number }
  | { code: 'not_weight_loss' }
  | { code: 'target_bmi_too_low'; minBmi: number; minTargetWeightKg: number }

export type TargetsWarning =
  /** The chosen pace was above ~1 % of body weight per week, it was lowered. */
  | { code: 'pace_capped'; requestedKgPerWeek: number; cappedKgPerWeek: number }
  /** kcal target raised to the floor (sex minimum or BMR), so the loss is slower than the pace. */
  | { code: 'kcal_floor'; floorKcal: number; reason: 'sex_minimum' | 'bmr' }
  /** Even the floor is at or above maintenance: no deficit is possible with these settings. */
  | { code: 'no_deficit' }

export type Targets = {
  age: number
  bmr: number
  tdee: number
  /** Daily deficit actually applied (kcal). */
  deficit: number
  kcalTarget: number
  /** Weekly loss expected from the applied deficit. */
  kgPerWeek: number
  macros: MacroTargets
  currentBmi: number
  targetBmi: number
  /** null when no deficit is possible. */
  estimatedWeeks: number | null
  estimatedEndDate: IsoDate | null
  warnings: TargetsWarning[]
}

export type TargetsResult = { ok: true; targets: Targets } | { ok: false; error: TargetsError }

export type MaintenanceTargets = {
  age: number
  bmr: number
  tdee: number
  kcalTarget: number
  macros: MacroTargets
  currentBmi: number
}

export type MaintenanceResult = { ok: true; targets: MaintenanceTargets } | { ok: false; error: TargetsError }

/**
 * Targets without a weight goal (the user skipped it): eat at maintenance.
 * Same input checks as computeTargets, minus the goal-related ones.
 */
export function computeMaintenance(
  input: Omit<ProfileInput, 'targetWeightKg' | 'pace'>,
  today: IsoDate,
): MaintenanceResult {
  // Reuse the full validation with a neutral goal just under the current weight.
  const error = validate({ ...input, targetWeightKg: input.weightKg - 0.1, pace: 'gentle' }, today)
  if (error && error.code !== 'target_bmi_too_low') return { ok: false, error }

  const age = ageOn(input.birthDate, today)
  const bmrKcal = computeBmr({ sex: input.sex, weightKg: input.weightKg, heightCm: input.heightCm, age })
  const tdeeKcal = computeTdee(bmrKcal, input.activity)
  const kcalTarget = Math.max(tdeeKcal, MIN_KCAL[input.sex])
  return {
    ok: true,
    targets: {
      age,
      bmr: Math.round(bmrKcal),
      tdee: Math.round(tdeeKcal),
      kcalTarget: Math.round(kcalTarget),
      macros: macroTargets({ kcal: kcalTarget, weightKg: input.weightKg, heightCm: input.heightCm }),
      currentBmi: Math.round(bmi(input.weightKg, input.heightCm) * 10) / 10,
    },
  }
}

/** Daily deficit for a weekly loss: kg/week × 7700 / 7. */
export function dailyDeficit(kgPerWeek: number): number {
  return (kgPerWeek * KCAL_PER_KG) / 7
}

/** Weekly loss produced by a daily deficit (inverse of dailyDeficit). */
export function kgPerWeekFromDeficit(deficitKcal: number): number {
  return (deficitKcal * 7) / KCAL_PER_KG
}

/**
 * Default macros: protein 1.8 g/kg, fat 27.5 % of kcal, carbs = the rest.
 * Protein uses a reference weight capped at BMI 25, so it stays realistic for heavier people.
 */
export function macroTargets({
  kcal,
  weightKg,
  heightCm,
}: {
  kcal: number
  weightKg: number
  heightCm: number
}): MacroTargets {
  const referenceWeight = Math.min(weightKg, weightForBmi(NORMAL_BMI_MAX, heightCm))
  const fatG = (kcal * FAT_KCAL_SHARE.default) / KCAL_PER_G.fat
  // Protein is lowered toward the 1.6 g/kg bound only if it would leave no room for carbs.
  const maxProteinG = (kcal - fatG * KCAL_PER_G.fat) / KCAL_PER_G.protein
  const proteinG = Math.min(referenceWeight * PROTEIN_G_PER_KG.default, Math.max(0, maxProteinG))
  const carbsKcal = kcal - proteinG * KCAL_PER_G.protein - fatG * KCAL_PER_G.fat
  return {
    proteinG: Math.round(proteinG),
    fatG: Math.round(fatG),
    carbsG: Math.round(Math.max(0, carbsKcal) / KCAL_PER_G.carbs),
  }
}

function validate(input: ProfileInput, today: IsoDate): TargetsError | null {
  const { heightCm, weightKg, targetWeightKg } = input
  const inRange = (value: number, { min, max }: { min: number; max: number }) =>
    Number.isFinite(value) && value >= min && value <= max

  if (!isIsoDate(input.birthDate) || input.birthDate > today) return { code: 'invalid_input', field: 'birthDate' }
  if (!inRange(heightCm, INPUT_LIMITS.heightCm)) return { code: 'invalid_input', field: 'heightCm' }
  if (!inRange(weightKg, INPUT_LIMITS.weightKg)) return { code: 'invalid_input', field: 'weightKg' }
  if (!inRange(targetWeightKg, INPUT_LIMITS.weightKg)) return { code: 'invalid_input', field: 'targetWeightKg' }

  const age = ageOn(input.birthDate, today)
  if (age > INPUT_LIMITS.age.max) return { code: 'invalid_input', field: 'birthDate' }
  if (age < MIN_AGE) return { code: 'underage', minAge: MIN_AGE }
  if (targetWeightKg >= weightKg) return { code: 'not_weight_loss' }
  if (bmi(targetWeightKg, heightCm) < MIN_TARGET_BMI) {
    return {
      code: 'target_bmi_too_low',
      minBmi: MIN_TARGET_BMI,
      minTargetWeightKg: Math.ceil(weightForBmi(MIN_TARGET_BMI, heightCm) * 10) / 10,
    }
  }
  return null
}

/**
 * Everything the onboarding recap shows: BMR, TDEE, kcal target, macros and estimated duration.
 * Guardrails (mandatory): refuse under 18, refuse a target BMI under 18.5, weight loss only,
 * cap the pace at ~1 % of weight per week, never go below 1500 (man) / 1200 (woman) kcal nor below BMR.
 */
export function computeTargets(input: ProfileInput, today: IsoDate): TargetsResult {
  const error = validate(input, today)
  if (error) return { ok: false, error }

  const { sex, heightCm, weightKg, targetWeightKg, activity, pace } = input
  const warnings: TargetsWarning[] = []
  const age = ageOn(input.birthDate, today)
  const bmrKcal = computeBmr({ sex, weightKg, heightCm, age })
  const tdeeKcal = computeTdee(bmrKcal, activity)

  const requestedKgPerWeek = PACE_KG_PER_WEEK[pace]
  const maxKgPerWeek = weightKg * MAX_WEEKLY_LOSS_RATIO
  let plannedKgPerWeek = requestedKgPerWeek
  if (requestedKgPerWeek > maxKgPerWeek) {
    plannedKgPerWeek = Math.floor(maxKgPerWeek * 100) / 100
    warnings.push({ code: 'pace_capped', requestedKgPerWeek, cappedKgPerWeek: plannedKgPerWeek })
  }

  const sexMinimum = MIN_KCAL[sex]
  const floorKcal = Math.max(sexMinimum, bmrKcal)
  let kcalTarget = tdeeKcal - dailyDeficit(plannedKgPerWeek)
  if (kcalTarget < floorKcal) {
    kcalTarget = floorKcal
    warnings.push({
      code: 'kcal_floor',
      floorKcal: Math.round(floorKcal),
      reason: bmrKcal > sexMinimum ? 'bmr' : 'sex_minimum',
    })
  }

  const deficit = Math.max(0, tdeeKcal - kcalTarget)
  if (deficit === 0) warnings.push({ code: 'no_deficit' })

  const kgPerWeek = kgPerWeekFromDeficit(deficit)
  const estimatedWeeks = kgPerWeek > 0 ? Math.ceil((weightKg - targetWeightKg) / kgPerWeek) : null

  return {
    ok: true,
    targets: {
      age,
      bmr: Math.round(bmrKcal),
      tdee: Math.round(tdeeKcal),
      deficit: Math.round(deficit),
      kcalTarget: Math.round(kcalTarget),
      kgPerWeek: Math.round(kgPerWeek * 100) / 100,
      macros: macroTargets({ kcal: kcalTarget, weightKg, heightCm }),
      currentBmi: Math.round(bmi(weightKg, heightCm) * 10) / 10,
      targetBmi: Math.round(bmi(targetWeightKg, heightCm) * 10) / 10,
      estimatedWeeks,
      estimatedEndDate: estimatedWeeks === null ? null : addDays(today, estimatedWeeks * 7),
      warnings,
    },
  }
}
