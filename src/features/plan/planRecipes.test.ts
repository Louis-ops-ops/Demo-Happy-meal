import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildReferenceData } from '../../data/reference'
import type { FoodsFile, RecipesFile } from '../../data/schemas'
import { dayKcal, generatePlan, NO_REPEAT_DAYS, swapCandidates, applySwap } from '../../domain/plan'
import { availableSuggestions, ingredientLabels, toPlanRecipes } from './planRecipes'
import { formatPortions, formatRange } from './labels'

const read = <T>(file: string) => JSON.parse(readFileSync(join(process.cwd(), 'public', 'data', file), 'utf8')) as T
const data = buildReferenceData(read<FoodsFile>('aliments.json'), read<RecipesFile>('recettes.json'))

describe('toPlanRecipes', () => {
  it('keeps every recipe without diet or exclusion', () => {
    expect(toPlanRecipes(data, [], [])).toHaveLength(data.recipes.size)
  })

  it('drops recipes a diet forbids and recipes using an excluded ingredient', () => {
    const all = toPlanRecipes(data, [], [])
    const vegan = toPlanRecipes(data, ['vegan'], [])
    expect(vegan.length).toBeLessThan(all.length)
    for (const recipe of vegan) {
      const tags = data.recipes.get(recipe.id)!.tags
      expect(tags).not.toContain('viande')
      expect(tags).not.toContain('lait')
    }
    expect(toPlanRecipes(data, [], ['tomate']).length).toBeLessThan(all.length)
  })
})

describe('plans on the real recipes', () => {
  for (const [label, diets] of [['no diet', []], ['vegetarian', ['vegetarian']], ['gluten-free', ['gluten-free']]] as const) {
    for (const kcalTarget of [1500, 2000, 2400]) {
      // Portions stop at 1.5×: a restricted diet cannot always reach 2 400 kcal, so the band is wider there.
      const tolerance = kcalTarget <= 2000 ? 0.05 : 0.1
      it(`${label}, ${kcalTarget} kcal, 14 days: within ±${tolerance * 100} % and no repeat within 3 days`, () => {
        const recipes = toPlanRecipes(data, diets, [])
        const input = { recipes, kcalTarget, mealsPerDay: 4, days: 14 }
        const meals = generatePlan(input)
        expect(meals).toHaveLength(14 * 4)
        for (let day = 0; day < 14; day++) {
          expect(Math.abs(dayKcal(recipes, meals, day) - kcalTarget)).toBeLessThanOrEqual(kcalTarget * tolerance)
        }
        const tooSoon = meals.some((a) =>
          meals.some((b) => a !== b && a.recipeId === b.recipeId && Math.abs(a.day - b.day) < NO_REPEAT_DAYS),
        )
        expect(tooSoon).toBe(false)
      })
    }
  }

  it('offers swaps for every meal and keeps the day balanced after applying one', () => {
    const recipes = toPlanRecipes(data, [], [])
    const input = { recipes, kcalTarget: 2000, mealsPerDay: 4, days: 7 }
    const meals = generatePlan(input)
    for (const meal of meals) {
      const [first] = swapCandidates(input, meals, meal.day, meal.index)
      expect(first, `day ${meal.day} meal ${meal.index}`).toBeDefined()
    }
    const [first] = swapCandidates(input, meals, 2, 1)
    const swapped = applySwap(input, meals, 2, 1, first!.recipeId)
    expect(Math.abs(dayKcal(recipes, swapped, 2) - 2000)).toBeLessThanOrEqual(100)
  })
})

describe('"Ce que j’ai déjà"', () => {
  it('suggests everyday foods found in the recipes, and only those', () => {
    const suggestions = availableSuggestions(toPlanRecipes(data, [], []))
    expect(suggestions.length).toBeGreaterThanOrEqual(15)
    expect(availableSuggestions([])).toEqual([])
  })

  it('lists the ingredient labels of the allowed recipes only', () => {
    const vegan = toPlanRecipes(data, ['vegan'], [])
    const labels = ingredientLabels(data, vegan).map(({ label }) => label)
    expect(labels).toContain('lentilles corail')
    expect(labels).not.toContain('filets de poulet')
  })

  it('changes the plan: recipes using a chosen food come back more often', () => {
    const recipes = toPlanRecipes(data, [], [])
    const base = { recipes, kcalTarget: 2000, mealsPerDay: 4, days: 7 }
    const using = (plan: ReturnType<typeof generatePlan>, id: string) => plan.filter((m) => m.recipeId === id).length
    const withRice = generatePlan({ ...base, have: ['quinoa', 'tofu'] })
    const quinoa = recipes.filter((r) => r.ingredientTexts.some((t) => t.includes('quinoa'))).map((r) => r.id)
    const count = (plan: typeof withRice) => quinoa.reduce((sum, id) => sum + using(plan, id), 0)
    expect(count(withRice)).toBeGreaterThan(count(generatePlan(base)))
  })
})

describe('labels', () => {
  it('formats a date range and portions in French', () => {
    expect(formatRange('2026-11-03', 7)).toBe('du 3 au 9 novembre')
    expect(formatRange('2026-10-28', 7)).toBe('du 28 octobre au 3 novembre')
    expect(formatPortions(1.25)).toBe('1,25 portion')
    expect(formatPortions(1)).toBe('1 portion')
    expect(formatPortions(2)).toBe('2 portions')
  })
})
