import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { db, getActivePlan, type PlanRow } from '../../data/db'
import { useReferenceData } from '../../data/useReferenceData'
import { AISLES } from '../../data/schemas'
import { buildShoppingList, groupByAisle, shoppingProgress, type AisleGroup, type ShoppingLine, type ShoppingProgress } from '../../domain/shopping'

export type ShoppingItemState = { checked: boolean; atHome: boolean }

export type ShoppingState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'none'; hasDraft: boolean }
  | {
      status: 'ready'
      plan: PlanRow
      groups: AisleGroup<ShoppingLine>[]
      state: ReadonlyMap<string, ShoppingItemState>
      progress: ShoppingProgress
    }

/** Shopping list of the active plan: derived from its meals (so a swap updates it), plus what was ticked. */
export function useShopping(): ShoppingState {
  const active = useLiveQuery(async () => (await getActivePlan()) ?? null)
  const profile = useLiveQuery(async () => (await db.profile.get('me')) ?? null)
  const hasDraft = useLiveQuery(async () => (await db.plans.where('status').equals('draft').count()) > 0)
  const rows = useLiveQuery(
    async () => (active ? await db.shoppingState.where('planId').equals(active.plan.id).toArray() : []),
    [active?.plan.id],
  )
  const reference = useReferenceData()
  const data = reference.status === 'ready' ? reference.data : null

  const lines = useMemo(() => {
    if (!active || !profile || !data) return null
    const meals = active.meals.flatMap((meal) => {
      const recipe = data.recipes.get(meal.recipeId)
      if (!recipe) return []
      return [
        {
          servings: recipe.servings,
          portions: meal.portions,
          ingredients: recipe.ingredients.map((i) => ({
            foodId: i.foodId,
            label: i.label,
            aisle: data.foods.get(i.foodId)?.aisle ?? 'epicerie-salee',
            grams: i.grams,
          })),
        },
      ]
    })
    return buildShoppingList(meals, profile.householdSize)
  }, [active, profile, data])

  if (reference.status === 'error') return { status: 'error', message: reference.message }
  if (active === undefined || !profile || hasDraft === undefined || !rows || reference.status !== 'ready') {
    return { status: 'loading' }
  }
  if (!active || !lines) return { status: 'none', hasDraft }

  const state = new Map(rows.map((r) => [r.foodId, { checked: r.checked, atHome: r.atHome }]))
  return {
    status: 'ready',
    plan: active.plan,
    groups: groupByAisle(lines, AISLES),
    state,
    progress: shoppingProgress(lines, state),
  }
}
