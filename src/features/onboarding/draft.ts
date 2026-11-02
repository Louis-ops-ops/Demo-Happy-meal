import type { Profile } from '../../data/db'
import type { Diet } from '../../domain/diet'
import {
  computeMaintenance,
  computeTargets,
  type MaintenanceTargets,
  type Targets,
  type TargetsError,
} from '../../domain/targets'
import type { ActivityLevel, IsoDate, Pace, Sex } from '../../domain/types'

/** Onboarding answers as typed by the user (numbers kept as text until validated). */
export type OnboardingDraft = {
  sex: Sex | null
  birthDate: string
  heightCm: string
  weightKg: string
  activity: ActivityLevel | null
  /** false when the user skipped the weight goal. */
  hasGoal: boolean
  targetWeightKg: string
  pace: Pace
  diets: Diet[]
  exclusions: string[]
  householdSize: number
  mealsPerDay: number
  planDays: 7 | 14
}

export const EMPTY_DRAFT: OnboardingDraft = {
  sex: null,
  birthDate: '',
  heightCm: '',
  weightKg: '',
  activity: null,
  hasGoal: true,
  targetWeightKg: '',
  pace: 'moderate',
  diets: [],
  exclusions: [],
  householdSize: 1,
  mealsPerDay: 4,
  planDays: 7,
}

/** Parses "78,5" or "78.5". Returns NaN for anything else. */
export function parseDecimal(text: string): number {
  const cleaned = text.trim().replace(',', '.')
  return /^\d+(\.\d+)?$/.test(cleaned) ? Number(cleaned) : Number.NaN
}

export type MetricsField = 'sex' | 'birthDate' | 'heightCm' | 'weightKg' | 'activity'

/** Fields still missing on the metrics step (the only mandatory one). */
export function missingMetrics(draft: OnboardingDraft): MetricsField[] {
  const missing: MetricsField[] = []
  if (!draft.sex) missing.push('sex')
  if (!draft.birthDate) missing.push('birthDate')
  if (!Number.isFinite(parseDecimal(draft.heightCm))) missing.push('heightCm')
  if (!Number.isFinite(parseDecimal(draft.weightKg))) missing.push('weightKg')
  if (!draft.activity) missing.push('activity')
  return missing
}

export type Recap =
  | { ok: true; kind: 'loss'; targets: Targets }
  | { ok: true; kind: 'maintenance'; targets: MaintenanceTargets }
  | { ok: false; error: TargetsError | { code: 'incomplete' } }

/** Computes the recap from the draft: weight loss targets, or maintenance if the goal was skipped. */
export function computeRecap(draft: OnboardingDraft, today: IsoDate): Recap {
  if (missingMetrics(draft).length > 0 || !draft.sex || !draft.activity) {
    return { ok: false, error: { code: 'incomplete' } }
  }
  const base = {
    sex: draft.sex,
    birthDate: draft.birthDate,
    heightCm: parseDecimal(draft.heightCm),
    weightKg: parseDecimal(draft.weightKg),
    activity: draft.activity,
  }
  if (!draft.hasGoal) {
    const result = computeMaintenance(base, today)
    return result.ok ? { ok: true, kind: 'maintenance', targets: result.targets } : result
  }
  const result = computeTargets(
    { ...base, targetWeightKg: parseDecimal(draft.targetWeightKg), pace: draft.pace },
    today,
  )
  return result.ok ? { ok: true, kind: 'loss', targets: result.targets } : result
}

/** Builds the profile to save. Throws if the recap is not valid (the UI prevents it). */
export function toProfile(draft: OnboardingDraft, today: IsoDate): { profile: Profile; weightKg: number } {
  const recap = computeRecap(draft, today)
  if (!recap.ok || !draft.sex || !draft.activity) throw new Error('Onboarding incomplete')
  return {
    weightKg: parseDecimal(draft.weightKg),
    profile: {
      id: 'me',
      sex: draft.sex,
      birthDate: draft.birthDate,
      heightCm: parseDecimal(draft.heightCm),
      activity: draft.activity,
      goal: recap.kind === 'loss' ? { targetWeightKg: parseDecimal(draft.targetWeightKg), pace: draft.pace } : null,
      kcalTarget: recap.targets.kcalTarget,
      macros: recap.targets.macros,
      diets: draft.diets,
      exclusions: draft.exclusions,
      householdSize: draft.householdSize,
      mealsPerDay: draft.mealsPerDay,
      planDays: draft.planDays,
      createdAt: today,
      updatedAt: today,
    },
  }
}
