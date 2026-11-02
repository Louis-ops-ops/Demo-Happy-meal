import { matchesIngredient } from './diet'
import type { MealSlot } from './types'

/** A recipe as the planner sees it (already filtered by diets and exclusions). */
export type PlanRecipe = {
  id: string
  slots: readonly MealSlot[]
  /** kcal per serving. */
  kcal: number
  /** Main protein source, for variety (null = none). */
  protein: string | null
  /** Ingredient labels and food names, matched against "Ce que j'ai déjà". */
  ingredientTexts: readonly string[]
}

export type SlotShare = { slot: MealSlot; share: number }

/** Share of the daily kcal for each meal, by meals per day (2 to 5). 4 meals = 25/35/10/30 %. */
export const SLOT_LAYOUTS: Record<number, readonly SlotShare[]> = {
  2: [
    { slot: 'lunch', share: 0.5 },
    { slot: 'dinner', share: 0.5 },
  ],
  3: [
    { slot: 'breakfast', share: 0.25 },
    { slot: 'lunch', share: 0.4 },
    { slot: 'dinner', share: 0.35 },
  ],
  4: [
    { slot: 'breakfast', share: 0.25 },
    { slot: 'lunch', share: 0.35 },
    { slot: 'snack', share: 0.1 },
    { slot: 'dinner', share: 0.3 },
  ],
  5: [
    { slot: 'breakfast', share: 0.22 },
    { slot: 'snack', share: 0.08 },
    { slot: 'lunch', share: 0.3 },
    { slot: 'snack', share: 0.08 },
    { slot: 'dinner', share: 0.32 },
  ],
}

export const PORTION = { min: 0.75, max: 1.5, step: 0.25 } as const
/** A recipe is not repeated within this many days (used on day d → free again on d + 3). */
export const NO_REPEAT_DAYS = 3
export const SLOT_TOLERANCE = 0.1
export const DAY_TOLERANCE = 0.05

const MAIN_SLOTS: ReadonlySet<MealSlot> = new Set(['lunch', 'dinner'])
const SCORE = {
  outOfTolerance: 1,
  sameProteinSameDay: 0.15,
  sameProteinPreviousDay: 0.05,
  perPreviousUse: 0.02,
  perHaveMatch: 0.05,
  maxHaveBonus: 0.15,
} as const

export type PlannedMeal = {
  /** 0-based day of the plan. */
  day: number
  /** Position of the meal in the day (index in the slot layout). */
  index: number
  slot: MealSlot
  recipeId: string
  portions: number
}

export type PlanInput = {
  recipes: readonly PlanRecipe[]
  kcalTarget: number
  mealsPerDay: number
  days: number
  /** "Ce que j'ai déjà": ingredient keywords to favor. */
  have?: readonly string[]
}

export function slotLayout(mealsPerDay: number): readonly SlotShare[] {
  const layout = SLOT_LAYOUTS[mealsPerDay]
  if (!layout) throw new Error(`Unsupported meals per day: ${mealsPerDay}`)
  return layout
}

function clampPortion(value: number): number {
  const stepped = Math.round(value / PORTION.step) * PORTION.step
  return Math.min(PORTION.max, Math.max(PORTION.min, stepped))
}

/** Portion (0.75–1.5, by quarters) bringing a recipe closest to a kcal target. */
export function bestPortion(kcalPerServing: number, target: number): number {
  return clampPortion(target / kcalPerServing)
}

/** Number of "Ce que j'ai déjà" keywords found in a recipe's ingredients. */
export function haveMatches(recipe: PlanRecipe, have: readonly string[]): number {
  return have.filter((keyword) => matchesIngredient(recipe.ingredientTexts, keyword)).length
}

type Context = {
  input: PlanInput
  byId: Map<string, PlanRecipe>
  meals: PlannedMeal[]
}

function scoreCandidate(ctx: Context, recipe: PlanRecipe, day: number, slot: MealSlot, target: number): number {
  const portions = bestPortion(recipe.kcal, target)
  const error = Math.abs(recipe.kcal * portions - target) / target
  let score = error + (error > SLOT_TOLERANCE ? SCORE.outOfTolerance : 0)

  if (MAIN_SLOTS.has(slot) && recipe.protein) {
    const proteinsOn = (d: number) =>
      ctx.meals
        .filter((m) => m.day === d && MAIN_SLOTS.has(m.slot))
        .map((m) => ctx.byId.get(m.recipeId)!.protein)
    if (proteinsOn(day).includes(recipe.protein)) score += SCORE.sameProteinSameDay
    if (proteinsOn(day - 1).includes(recipe.protein)) score += SCORE.sameProteinPreviousDay
  }

  score += SCORE.perPreviousUse * ctx.meals.filter((m) => m.recipeId === recipe.id).length
  score -= Math.min(SCORE.maxHaveBonus, SCORE.perHaveMatch * haveMatches(recipe, ctx.input.have ?? []))
  return score
}

/** Recipes used too recently to appear on `day` (same day included). */
function recentlyUsed(meals: readonly PlannedMeal[], day: number): Set<string> {
  return new Set(meals.filter((m) => Math.abs(m.day - day) < NO_REPEAT_DAYS).map((m) => m.recipeId))
}

/** Candidates for a slot, best first. Falls back to recent recipes only if nothing else fits the slot. */
function rankCandidates(ctx: Context, day: number, slot: MealSlot, target: number, excludeId?: string) {
  const forSlot = ctx.input.recipes.filter((r) => r.slots.includes(slot) && r.id !== excludeId)
  const recent = recentlyUsed(ctx.meals, day)
  const fresh = forSlot.filter((r) => !recent.has(r.id))
  const pool = fresh.length > 0 ? fresh : forSlot
  return pool
    .map((recipe) => ({ recipe, score: scoreCandidate(ctx, recipe, day, slot, target) }))
    .sort((a, b) => a.score - b.score || a.recipe.id.localeCompare(b.recipe.id))
}

function kcalOf(byId: Map<string, PlanRecipe>, meal: PlannedMeal): number {
  return byId.get(meal.recipeId)!.kcal * meal.portions
}

/** Total kcal planned for a day. */
export function dayKcal(recipes: readonly PlanRecipe[], meals: readonly PlannedMeal[], day: number): number {
  const byId = new Map(recipes.map((r) => [r.id, r]))
  return meals.filter((m) => m.day === day).reduce((sum, m) => sum + kcalOf(byId, m), 0)
}

/** Nudges portions by quarters until the day total is within ±5 % of the target (or cannot improve). */
function rebalanceDay(byId: Map<string, PlanRecipe>, meals: PlannedMeal[], day: number, target: number): void {
  const ofDay = meals.filter((m) => m.day === day)
  // Each step strictly reduces the gap, so the loop ends.
  for (;;) {
    const diff = ofDay.reduce((sum, m) => sum + kcalOf(byId, m), 0) - target
    if (Math.abs(diff) <= target * DAY_TOLERANCE) return
    let best: { meal: PlannedMeal; portions: number; gap: number } | null = null
    for (const meal of ofDay) {
      const portions = meal.portions + (diff > 0 ? -PORTION.step : PORTION.step)
      if (portions < PORTION.min || portions > PORTION.max) continue
      const gap = Math.abs(diff + (portions - meal.portions) * byId.get(meal.recipeId)!.kcal)
      if (!best || gap < best.gap) best = { meal, portions, gap }
    }
    if (!best || best.gap >= Math.abs(diff)) return
    best.meal.portions = best.portions
  }
}

/**
 * Deterministic plan: for each day and slot, the best scored recipe (kcal close to the slot share,
 * no repeat within 3 days, protein variety, bonus for "Ce que j'ai déjà"), then day totals rebalanced to ±5 %.
 */
export function generatePlan(input: PlanInput): PlannedMeal[] {
  const layout = slotLayout(input.mealsPerDay)
  const ctx: Context = { input, byId: new Map(input.recipes.map((r) => [r.id, r])), meals: [] }

  for (let day = 0; day < input.days; day++) {
    layout.forEach(({ slot, share }, index) => {
      const target = input.kcalTarget * share
      const best = rankCandidates(ctx, day, slot, target)[0]
      if (!best) return
      ctx.meals.push({ day, index, slot, recipeId: best.recipe.id, portions: bestPortion(best.recipe.kcal, target) })
    })
    rebalanceDay(ctx.byId, ctx.meals, day, input.kcalTarget)
  }
  return ctx.meals
}

export type SwapCandidate = { recipeId: string; portions: number; kcal: number; haveMatches: number }

const isAt = (day: number, index: number) => (m: PlannedMeal) => m.day === day && m.index === index

/** Alternatives for one planned meal: same slot, equivalent kcal, not repeated within 3 days. */
export function swapCandidates(
  input: PlanInput,
  meals: readonly PlannedMeal[],
  day: number,
  index: number,
  limit = 5,
): SwapCandidate[] {
  const meal = meals.find(isAt(day, index))
  if (!meal) return []
  const target = input.kcalTarget * slotLayout(input.mealsPerDay)[index]!.share
  const ctx: Context = {
    input,
    byId: new Map(input.recipes.map((r) => [r.id, r])),
    meals: meals.filter((m) => !isAt(day, index)(m)),
  }
  return rankCandidates(ctx, day, meal.slot, target, meal.recipeId)
    .slice(0, limit)
    .map(({ recipe }) => {
      const portions = bestPortion(recipe.kcal, target)
      return { recipeId: recipe.id, portions, kcal: recipe.kcal * portions, haveMatches: haveMatches(recipe, input.have ?? []) }
    })
}

/** Replaces one meal's recipe, then rebalances that day. Returns a new list. */
export function applySwap(
  input: PlanInput,
  meals: readonly PlannedMeal[],
  day: number,
  index: number,
  recipeId: string,
): PlannedMeal[] {
  const byId = new Map(input.recipes.map((r) => [r.id, r]))
  const recipe = byId.get(recipeId)
  if (!recipe) throw new Error(`Unknown recipe ${recipeId}`)
  const target = input.kcalTarget * slotLayout(input.mealsPerDay)[index]!.share
  const at = isAt(day, index)
  const next = meals.map((m) => (at(m) ? { ...m, recipeId, portions: bestPortion(recipe.kcal, target) } : { ...m }))
  rebalanceDay(byId, next, day, input.kcalTarget)
  return next
}
