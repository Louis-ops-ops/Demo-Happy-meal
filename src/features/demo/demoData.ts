import { BACKUP_FORMAT, BACKUP_VERSION, importBackup, type Backup } from '../../data/backup'
import type { JournalEntry, PlanMealRow, Profile } from '../../data/db'
import { loadReferenceData, type ReferenceData } from '../../data/reference'
import { searchFoods } from '../../data/search'
import { addDays, toIsoDate } from '../../domain/dates'
import { foodEntryNutrients } from '../../domain/journal'
import { generatePlan } from '../../domain/plan'
import { computeTargets } from '../../domain/targets'
import type { IsoDate } from '../../domain/types'
import { planMealEntry } from '../today/entries'
import { toPlanRecipes } from '../plan/planRecipes'

export const DEMO_PLAN_ID = 'demo-plan'
const PLAN_DAYS = 14
/** Days of history behind today: the plan started this many days ago. */
const HISTORY_DAYS = 10

/**
 * Demo profile: a 14-day plan started 10 days ago, with the meals eaten since (a few skipped, a few extras),
 * a weigh-in most days and part of the shopping list ticked. Fully deterministic for a given day.
 */
export function buildDemo(data: ReferenceData, today: IsoDate): Backup {
  const start = addDays(today, -HISTORY_DAYS)
  const targets = computeTargets(
    { sex: 'male', birthDate: '1996-05-14', heightCm: 178, weightKg: 84, activity: 'moderate', targetWeightKg: 76, pace: 'moderate' },
    today,
  )
  if (!targets.ok) throw new Error('Demo profile is invalid')

  const profile: Profile = {
    id: 'me',
    sex: 'male',
    birthDate: '1996-05-14',
    heightCm: 178,
    activity: 'moderate',
    goal: { targetWeightKg: 76, pace: 'moderate' },
    kcalTarget: targets.targets.kcalTarget,
    macros: targets.targets.macros,
    diets: [],
    exclusions: [],
    householdSize: 1,
    mealsPerDay: 4,
    planDays: PLAN_DAYS,
    demo: true,
    createdAt: start,
    updatedAt: start,
  }

  const have = ['poulet', 'riz']
  const recipes = toPlanRecipes(data, [], [])
  const planned = generatePlan({ recipes, kcalTarget: profile.kcalTarget, mealsPerDay: 4, days: PLAN_DAYS, have })
  const planMeals: PlanMealRow[] = planned.map((meal) => ({ ...meal, planId: DEMO_PLAN_ID }))

  const journal: JournalEntry[] = []
  for (const meal of planMeals) {
    const date = addDays(start, meal.day)
    const past = meal.day < HISTORY_DAYS
    const skipped = (meal.day * 4 + meal.index) % 9 === 4
    // Today: only breakfast is ticked so far.
    if ((past && !skipped) || (meal.day === HISTORY_DAYS && meal.index === 0)) {
      journal.push(planMealEntry(meal, data.recipes.get(meal.recipeId)!, date))
    }
  }
  const treat = searchFoods(data.foods.values(), 'pomme', 1)[0]
  if (treat) {
    for (const day of [2, 6]) {
      journal.push({
        date: addDays(start, day),
        slot: 'snack',
        label: treat.name,
        kind: 'food',
        foodId: treat.id,
        quantity: 150,
        nutrients: foodEntryNutrients(treat.per100g, 150),
      })
    }
  }

  // About -0.5 kg a week with a little daily noise; no weigh-in every third day.
  const weighIns = Array.from({ length: HISTORY_DAYS + 1 }, (_, n) => n)
    .filter((n) => n % 3 !== 2)
    .map((n) => ({ date: addDays(start, n), kg: Math.round((84 - n * 0.07 + Math.sin(n * 2.1) * 0.25) * 10) / 10 }))

  const shoppingState = planMeals
    .filter((m) => m.day === 0)
    .flatMap((m) => data.recipes.get(m.recipeId)!.ingredients.slice(0, 2))
    .map((i) => ({ planId: DEMO_PLAN_ID, foodId: i.foodId, checked: true, atHome: false }))

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    profile,
    weighIns,
    plans: [
      { id: DEMO_PLAN_ID, startDate: start, days: PLAN_DAYS, mealsPerDay: 4, kcalTarget: profile.kcalTarget, have, status: 'active', createdAt: start },
    ],
    planMeals,
    journal,
    shoppingState,
  }
}

/** Replaces everything stored by the demo profile (also used to reset the demo). */
export async function loadDemo(today = toIsoDate(new Date())): Promise<void> {
  await importBackup(buildDemo(await loadReferenceData(), today))
}
