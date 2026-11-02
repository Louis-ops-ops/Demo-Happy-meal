import Dexie, { type EntityTable, type Table } from 'dexie'
import type { Diet } from '../domain/diet'
import type { PlannedMeal } from '../domain/plan'
import type { ActivityLevel, IsoDate, MacroTargets, MealSlot, Nutrients, Pace, Sex } from '../domain/types'

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

/** One thing eaten. Nutrients are stored (not recomputed) so the history stays true if recipes change. */
export type JournalEntry = {
  id?: number
  date: IsoDate
  slot: MealSlot
  label: string
  kind: 'plan' | 'recipe' | 'food'
  recipeId?: string
  foodId?: string
  /** Servings for a recipe, grams for a food. */
  quantity: number
  nutrients: Nutrients
  /** `${planId}:${day}:${index}` when this ticks a meal of the plan. */
  planKey?: string
}

/** What the person ticked on the shopping list of a plan. The lines themselves are derived from the plan. */
export type ShoppingStateRow = { planId: string; foodId: string; checked: boolean; atHome: boolean }

export const planKey = (planId: string, day: number, index: number) => `${planId}:${day}:${index}`

export type CurrentPlan = { plan: PlanRow; meals: PlanMealRow[] }

class HappyMealDb extends Dexie {
  profile!: EntityTable<Profile, 'id'>
  weighIns!: EntityTable<WeighInRow, 'date'>
  plans!: EntityTable<PlanRow, 'id'>
  planMeals!: Table<PlanMealRow, [string, number, number]>
  journal!: EntityTable<JournalEntry, 'id'>
  shoppingState!: Table<ShoppingStateRow, [string, string]>

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
    this.version(3).stores({
      journal: '++id, date, planKey',
    })
    this.version(4).stores({
      shoppingState: '[planId+foodId], planId',
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
  await db.shoppingState.where('planId').anyOf(ids).delete()
  await db.plans.bulkDelete(ids)
}

/** Saves a freshly generated plan as the draft, replacing any previous draft. */
export async function saveDraftPlan(plan: PlanRow, meals: readonly PlannedMeal[]): Promise<void> {
  await db.transaction('rw', db.plans, db.planMeals, db.shoppingState, async () => {
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
  await db.transaction('rw', db.plans, db.planMeals, db.shoppingState, async () => {
    const others = (await db.plans.toCollection().primaryKeys()).filter((id) => id !== planId)
    await deletePlans(others as string[])
    await db.plans.update(planId, { status: 'active' })
  })
}

export async function getActivePlan(): Promise<CurrentPlan | null> {
  const plan = (await db.plans.where('status').equals('active').first()) ?? null
  if (!plan) return null
  const meals = await db.planMeals.where('planId').equals(plan.id).toArray()
  return { plan, meals: meals.sort((a, b) => a.day - b.day || a.index - b.index) }
}

/** Ticks a meal of the plan as eaten (or removes the tick). One entry per plan meal. */
export async function setPlanMealEaten(entry: JournalEntry & { planKey: string }, eaten: boolean): Promise<void> {
  await db.transaction('rw', db.journal, async () => {
    await db.journal.where('planKey').equals(entry.planKey).delete()
    if (eaten) await db.journal.add(entry)
  })
}

export async function addJournalEntry(entry: JournalEntry): Promise<void> {
  await db.journal.add(entry)
}

export async function deleteJournalEntry(id: number): Promise<void> {
  await db.journal.delete(id)
}

/** Ticks a shopping line, or marks it as already at home. Only the given fields change. */
export async function setShoppingState(
  planId: string,
  foodId: string,
  patch: Partial<Pick<ShoppingStateRow, 'checked' | 'atHome'>>,
): Promise<void> {
  await db.transaction('rw', db.shoppingState, async () => {
    const current = (await db.shoppingState.get([planId, foodId])) ?? { planId, foodId, checked: false, atHome: false }
    await db.shoppingState.put({ ...current, ...patch })
  })
}

/** Records a weigh-in (one per day: the last one of a day wins). */
export async function saveWeighIn(date: IsoDate, kg: number): Promise<void> {
  await db.weighIns.put({ date, kg })
}

export async function deleteWeighIn(date: IsoDate): Promise<void> {
  await db.weighIns.delete(date)
}

/** Stores recalculated targets on the profile. */
export async function updateProfileTargets(
  kcalTarget: number,
  macros: MacroTargets,
  updatedAt: IsoDate,
): Promise<void> {
  await db.profile.update('me', { kcalTarget, macros, updatedAt })
}
