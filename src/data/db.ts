import Dexie, { type EntityTable, type Table } from 'dexie'
import type { Diet } from '../domain/diet'
import type { PlannedMeal } from '../domain/plan'
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

/** A generated plan. A draft is a preview: validating it makes it the active plan and removes the previous one. */
export type PlanRow = {
  id: string
  startDate: IsoDate
  days: number
  mealsPerDay: number
  kcalTarget: number
  /** "Ce que j'ai déjà": ingredient keywords the plan favored. Only kept for the swaps of this plan. */
  have: string[]
  status: 'draft' | 'active'
  createdAt: IsoDate
}

export type PlanMealRow = PlannedMeal & { planId: string }

export type CurrentPlan = { plan: PlanRow; meals: PlanMealRow[] }

class HappyMealDb extends Dexie {
  profile!: EntityTable<Profile, 'id'>
  weighIns!: EntityTable<WeighInRow, 'date'>
  plans!: EntityTable<PlanRow, 'id'>
  planMeals!: Table<PlanMealRow, [string, number, number]>

  constructor() {
    super('happy-meal')
    this.version(1).stores({
      profile: 'id',
      weighIns: 'date',
    })
    this.version(2).stores({
      plans: 'id, status',
      planMeals: '[planId+day+index], planId',
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

/** The plan to show: the draft being previewed, else the active one. */
export async function getCurrentPlan(): Promise<CurrentPlan | null> {
  const plans = await db.plans.toArray()
  const plan = plans.find((p) => p.status === 'draft') ?? plans.find((p) => p.status === 'active')
  if (!plan) return null
  const meals = await db.planMeals.where('planId').equals(plan.id).toArray()
  return { plan, meals: meals.sort((a, b) => a.day - b.day || a.index - b.index) }
}

async function deletePlans(ids: string[]): Promise<void> {
  await db.planMeals.where('planId').anyOf(ids).delete()
  await db.plans.bulkDelete(ids)
}

/** Saves a freshly generated plan as the draft, replacing any previous draft. */
export async function saveDraftPlan(plan: PlanRow, meals: readonly PlannedMeal[]): Promise<void> {
  await db.transaction('rw', db.plans, db.planMeals, async () => {
    await deletePlans((await db.plans.where('status').equals('draft').primaryKeys()) as string[])
    await db.plans.put(plan)
    await db.planMeals.bulkPut(meals.map((meal) => ({ ...meal, planId: plan.id })))
  })
}

/** Writes the meals of one day (after a swap, which also rebalances the portions of that day). */
export async function saveDayMeals(planId: string, day: number, meals: readonly PlannedMeal[]): Promise<void> {
  await db.planMeals.bulkPut(meals.filter((m) => m.day === day).map((m) => ({ ...m, planId })))
}

/** Validates a plan: it becomes the only active one. */
export async function activatePlan(planId: string): Promise<void> {
  await db.transaction('rw', db.plans, db.planMeals, async () => {
    const others = (await db.plans.toCollection().primaryKeys()).filter((id) => id !== planId)
    await deletePlans(others as string[])
    await db.plans.update(planId, { status: 'active' })
  })
}
