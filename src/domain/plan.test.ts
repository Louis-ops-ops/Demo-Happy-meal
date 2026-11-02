import { describe, expect, it } from 'vitest'
import {
  applySwap,
  bestPortion,
  dayKcal,
  DAY_TOLERANCE,
  generatePlan,
  haveMatches,
  NO_REPEAT_DAYS,
  SLOT_LAYOUTS,
  slotLayout,
  swapCandidates,
  type PlanInput,
  type PlannedMeal,
  type PlanRecipe,
} from './plan'

const main = (id: string, kcal: number, protein: string | null, texts: string[] = []): PlanRecipe => ({
  id,
  slots: ['lunch', 'dinner'],
  kcal,
  protein,
  ingredientTexts: texts,
})

const recipes: PlanRecipe[] = [
  { id: 'b1', slots: ['breakfast'], kcal: 350, protein: null, ingredientTexts: ['flocons d’avoine'] },
  { id: 'b2', slots: ['breakfast'], kcal: 400, protein: 'oeuf', ingredientTexts: ['œufs'] },
  { id: 'b3', slots: ['breakfast'], kcal: 380, protein: null, ingredientTexts: ['pain complet'] },
  { id: 's1', slots: ['snack'], kcal: 160, protein: null, ingredientTexts: ['pomme'] },
  { id: 's2', slots: ['snack'], kcal: 200, protein: null, ingredientTexts: ['yaourt'] },
  { id: 's3', slots: ['snack'], kcal: 180, protein: null, ingredientTexts: ['amandes'] },
  main('curry', 520, 'legumineuses', ['lentilles corail', 'lait de coco']),
  main('poulet', 480, 'volaille', ['filets de poulet', 'tomates pelées']),
  main('saumon', 500, 'poisson', ['saumon', 'courgette']),
  main('bolo', 550, 'boeuf', ['bœuf haché', 'tomates pelées']),
  main('chili', 470, 'legumineuses', ['haricots rouges', 'tomates pelées']),
  main('wok', 510, 'volaille', ['escalopes de dinde', 'brocoli']),
  main('risotto', 440, 'laitier', ['riz', 'champignons']),
  main('soupe', 420, null, ['courge butternut']),
]

const input: PlanInput = { recipes, kcalTarget: 2000, mealsPerDay: 4, days: 7 }

const byId = new Map(recipes.map((r) => [r.id, r]))

function repeatsTooSoon(meals: readonly PlannedMeal[]): boolean {
  return meals.some((a) => meals.some((b) => a !== b && a.recipeId === b.recipeId && Math.abs(a.day - b.day) < NO_REPEAT_DAYS))
}

describe('slot layouts', () => {
  it('shares add up to 100 % for 2 to 5 meals', () => {
    for (const meals of [2, 3, 4, 5]) {
      expect(SLOT_LAYOUTS[meals]!.reduce((sum, s) => sum + s.share, 0)).toBeCloseTo(1)
    }
    expect(slotLayout(4).map((s) => s.share)).toEqual([0.25, 0.35, 0.1, 0.3])
    expect(() => slotLayout(6)).toThrow()
  })
})

describe('bestPortion', () => {
  it('rounds to quarters within 0.75 and 1.5', () => {
    expect(bestPortion(400, 500)).toBe(1.25)
    expect(bestPortion(400, 100)).toBe(0.75)
    expect(bestPortion(200, 900)).toBe(1.5)
  })
})

describe('haveMatches', () => {
  it('counts the "Ce que j’ai déjà" keywords found in the ingredients', () => {
    expect(haveMatches(byId.get('poulet')!, ['tomate', 'poulet', 'riz'])).toBe(2)
  })
})

describe('generatePlan', () => {
  const meals = generatePlan(input)

  it('fills every slot of every day, in layout order', () => {
    expect(meals).toHaveLength(28)
    for (let day = 0; day < 7; day++) {
      expect(meals.filter((m) => m.day === day).map((m) => m.slot)).toEqual(['breakfast', 'lunch', 'snack', 'dinner'])
    }
  })

  it('keeps each day within ±5 % of the target', () => {
    for (let day = 0; day < 7; day++) {
      expect(Math.abs(dayKcal(recipes, meals, day) - 2000)).toBeLessThanOrEqual(2000 * DAY_TOLERANCE)
    }
  })

  it('never repeats a recipe within 3 days', () => {
    expect(repeatsTooSoon(meals)).toBe(false)
  })

  it('varies the protein of lunch and dinner on the same day', () => {
    for (let day = 0; day < 7; day++) {
      const proteins = meals.filter((m) => m.day === day && m.slot !== 'breakfast' && m.slot !== 'snack').map((m) => byId.get(m.recipeId)!.protein)
      expect(new Set(proteins).size).toBe(proteins.length)
    }
  })

  it('keeps portions between 0.75 and 1.5, by quarters', () => {
    for (const meal of meals) {
      expect(meal.portions).toBeGreaterThanOrEqual(0.75)
      expect(meal.portions).toBeLessThanOrEqual(1.5)
      expect((meal.portions * 4) % 1).toBe(0)
    }
  })

  it('is deterministic', () => {
    expect(generatePlan(input)).toEqual(meals)
  })

  it('favors recipes using "Ce que j’ai déjà"', () => {
    const count = (plan: PlannedMeal[], id: string) => plan.filter((m) => m.recipeId === id).length
    const withHave = generatePlan({ ...input, have: ['courge', 'butternut'] })
    expect(count(withHave, 'soupe')).toBeGreaterThan(count(meals, 'soupe'))
    expect(withHave.find((m) => m.slot === 'lunch')!.recipeId).toBe('soupe')
  })

  it('repeats a recipe only when nothing else fits the slot', () => {
    const plan = generatePlan({ ...input, recipes: recipes.filter((r) => r.id !== 'b2' && r.id !== 'b3') })
    expect(plan.filter((m) => m.slot === 'breakfast').every((m) => m.recipeId === 'b1')).toBe(true)
  })

  it('skips a slot without any recipe', () => {
    const plan = generatePlan({ ...input, days: 2, recipes: recipes.filter((r) => !r.slots.includes('snack')) })
    expect(plan.filter((m) => m.day === 0).map((m) => m.slot)).toEqual(['breakfast', 'lunch', 'dinner'])
  })

  it('stops rebalancing at the portion limits', () => {
    const plan = generatePlan({ ...input, kcalTarget: 6000, days: 1 })
    expect(plan.every((m) => m.portions === 1.5)).toBe(true)
    const low = generatePlan({ ...input, kcalTarget: 600, days: 1 })
    expect(low.every((m) => m.portions === 0.75)).toBe(true)
  })

  it('supports 2, 3 and 5 meals a day', () => {
    for (const mealsPerDay of [2, 3, 5]) {
      const plan = generatePlan({ ...input, mealsPerDay, days: 3, kcalTarget: 1800 })
      expect(plan).toHaveLength(mealsPerDay * 3)
    }
  })
})

describe('swap', () => {
  const meals = generatePlan(input)
  const lunch = meals.find((m) => m.day === 3 && m.slot === 'lunch')!

  it('proposes other recipes for the same slot, without repeats within 3 days', () => {
    // 3 days: enough unused mains remain for day 1, so no fallback is needed.
    const short = { ...input, days: 3 }
    const shortMeals = generatePlan(short)
    for (const candidate of swapCandidates(short, shortMeals, 1, lunch.index)) {
      expect(repeatsTooSoon(applySwap(short, shortMeals, 1, lunch.index, candidate.recipeId))).toBe(false)
    }

    const candidates = swapCandidates(input, meals, 3, lunch.index)
    expect(candidates.length).toBeGreaterThan(0)
    expect(candidates.length).toBeLessThanOrEqual(5)
    for (const candidate of candidates) {
      expect(candidate.recipeId).not.toBe(lunch.recipeId)
      expect(byId.get(candidate.recipeId)!.slots).toContain('lunch')
      expect(candidate.kcal).toBeCloseTo(byId.get(candidate.recipeId)!.kcal * candidate.portions)
    }
    expect(swapCandidates(input, meals, 99, 0)).toEqual([])
  })

  it('replaces the meal and keeps the day within ±5 %', () => {
    const [first] = swapCandidates(input, meals, 3, lunch.index)
    const swapped = applySwap(input, meals, 3, lunch.index, first!.recipeId)
    expect(swapped.find((m) => m.day === 3 && m.index === lunch.index)!.recipeId).toBe(first!.recipeId)
    expect(Math.abs(dayKcal(recipes, swapped, 3) - 2000)).toBeLessThanOrEqual(100)
    expect(swapped.filter((m) => m.day !== 3)).toEqual(meals.filter((m) => m.day !== 3))
    expect(meals.find((m) => m.day === 3 && m.index === lunch.index)!.recipeId).toBe(lunch.recipeId)
  })

  it('rejects an unknown recipe', () => {
    expect(() => applySwap(input, meals, 3, lunch.index, 'nope')).toThrow()
  })
})

describe('swap with few recipes', () => {
  it('falls back to recent recipes rather than offering nothing', () => {
    const few = { ...input, mealsPerDay: 3, days: 2, recipes: recipes.filter((r) => ['b1', 'curry', 'poulet', 'saumon'].includes(r.id)) }
    const meals = generatePlan(few)
    const candidates = swapCandidates(few, meals, 1, 1)
    expect(candidates.length).toBe(2)
    expect(candidates.map((c) => c.recipeId)).not.toContain(meals.find((m) => m.day === 1 && m.index === 1)!.recipeId)
  })
})
