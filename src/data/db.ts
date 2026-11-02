import Dexie, { type EntityTable } from 'dexie'
import type { Diet } from '../domain/diet'
import type { ActivityLevel, IsoDate, MacroTargets, Pace, Sex } from '../domain/types'

/** The single user profile (id "me"). Current weight lives in weighIns. */
export type Profile = {
  id: 'me'
  sex: Sex
  birthDate: IsoDate
  heightCm: number
  activity: ActivityLevel
  /** null when the user skipped the weight goal (maintenance). */
  goal: { targetWeightKg: number; pace: Pace } | null
  kcalTarget: number
  macros: MacroTargets
  diets: Diet[]
  /** Ingredient keywords to avoid (allergies, dislikes). */
  exclusions: string[]
  householdSize: number
  /** 2 to 5: lunch + dinner, then breakfast, then one or two snacks. */
  mealsPerDay: number
  planDays: 7 | 14
  createdAt: IsoDate
  updatedAt: IsoDate
}

export type WeighInRow = { date: IsoDate; kg: number }

class HappyMealDb extends Dexie {
  profile!: EntityTable<Profile, 'id'>
  weighIns!: EntityTable<WeighInRow, 'date'>

  constructor() {
    super('happy-meal')
    this.version(1).stores({
      profile: 'id',
      weighIns: 'date',
    })
  }
}

export const db = new HappyMealDb()

/** Saves the onboarding result: profile plus the first weigh-in, in one transaction. */
export async function saveOnboarding(profile: Profile, weightKg: number): Promise<void> {
  await db.transaction('rw', db.profile, db.weighIns, async () => {
    await db.profile.put(profile)
    await db.weighIns.put({ date: profile.updatedAt, kg: weightKg })
  })
}

export async function getProfile(): Promise<Profile | undefined> {
  return db.profile.get('me')
}

export async function latestWeighIn(): Promise<WeighInRow | undefined> {
  return db.weighIns.orderBy('date').last()
}
