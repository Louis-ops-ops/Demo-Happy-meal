import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { getCurrentPlan, db, type PlanMealRow, type PlanRow } from '../../data/db'
import type { ReferenceData } from '../../data/reference'
import { useReferenceData } from '../../data/useReferenceData'
import type { PlanInput } from '../../domain/plan'
import { toPlanRecipes } from './planRecipes'

export type PlanState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty' }
  | {
      status: 'ready'
      plan: PlanRow
      meals: PlanMealRow[]
      /** Inputs for the planner: the recipes the profile allows, plus any recipe already in the plan. */
      input: PlanInput
      /** Recipes the profile allows today (a swap never offers anything else). */
      allowed: ReadonlySet<string>
      data: ReferenceData
    }

/** The plan to show (draft, else active), with the reference data and what the planner needs for swaps. */
export function usePlan(): PlanState {
  const current = useLiveQuery(async () => (await getCurrentPlan()) ?? null)
  const profile = useLiveQuery(async () => (await db.profile.get('me')) ?? null)
  const reference = useReferenceData()
  const data = reference.status === 'ready' ? reference.data : null

  const ready = useMemo(() => {
    if (!current || !profile || !data) return null
    const allowedRecipes = toPlanRecipes(data, profile.diets, profile.exclusions)
    const allowed = new Set(allowedRecipes.map((r) => r.id))
    // Keep recipes the plan already uses even if the profile changed since: the planner needs them.
    const used = new Set(current.meals.map((m) => m.recipeId))
    const kept = toPlanRecipes(data, [], []).filter((r) => used.has(r.id) && !allowed.has(r.id))
    const { plan } = current
    const input: PlanInput = {
      recipes: [...allowedRecipes, ...kept],
      kcalTarget: plan.kcalTarget,
      mealsPerDay: plan.mealsPerDay,
      days: plan.days,
      have: plan.have,
    }
    return { plan, meals: current.meals.filter((m) => data.recipes.has(m.recipeId)), input, allowed, data }
  }, [current, profile, data])

  if (reference.status === 'error') return { status: 'error', message: reference.message }
  if (current === undefined || profile === undefined || reference.status === 'loading') return { status: 'loading' }
  if (current === null || !ready) return { status: 'empty' }
  return { status: 'ready', ...ready }
}
