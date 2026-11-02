import { describe, expect, it } from 'vitest'
import {
  nutrientsForGrams,
  recipeNutritionPerServing,
  roundNutrients,
  scaleNutrients,
  sumNutrients,
  ZERO_NUTRIENTS,
} from './nutrition'
import type { Nutrients } from './types'

const lentils: Nutrients = { kcal: 350, protein: 24, carbs: 50, fat: 1.5, fiber: 11, salt: 0.05 }
const coconutMilk: Nutrients = { kcal: 200, protein: 2, carbs: 3, fat: 20, fiber: 0, salt: 0.05 }

function expectClose(actual: Nutrients, expected: Nutrients) {
  for (const key of Object.keys(expected) as Array<keyof Nutrients>) {
    expect(actual[key], key).toBeCloseTo(expected[key], 6)
  }
}

describe('nutrition', () => {
  it('scales values given per 100 g', () => {
    expectClose(nutrientsForGrams(lentils, 200), { kcal: 700, protein: 48, carbs: 100, fat: 3, fiber: 22, salt: 0.1 })
    expectClose(nutrientsForGrams(lentils, 0), ZERO_NUTRIENTS)
  })

  it('sums and scales', () => {
    expectClose(sumNutrients([lentils, coconutMilk]), {
      kcal: 550,
      protein: 26,
      carbs: 53,
      fat: 21.5,
      fiber: 11,
      salt: 0.1,
    })
    expect(sumNutrients([])).toEqual(ZERO_NUTRIENTS)
    expectClose(scaleNutrients(lentils, 1.5), { kcal: 525, protein: 36, carbs: 75, fat: 2.25, fiber: 16.5, salt: 0.075 })
  })

  it('computes a recipe per serving: Σ (per 100 g × g / 100) ÷ servings', () => {
    const perServing = recipeNutritionPerServing(
      [
        { per100g: lentils, grams: 200 },
        { per100g: coconutMilk, grams: 400 },
      ],
      4,
    )
    expectClose(perServing, { kcal: 375, protein: 14, carbs: 28, fat: 20.75, fiber: 5.5, salt: 0.075 })
  })

  it('rejects a recipe without servings', () => {
    expect(() => recipeNutritionPerServing([{ per100g: lentils, grams: 100 }], 0)).toThrow()
    expect(() => recipeNutritionPerServing([{ per100g: lentils, grams: 100 }], Number.NaN)).toThrow()
  })

  it('rounds for display without float artefacts', () => {
    expect(roundNutrients({ kcal: 374.6, protein: 12.345, carbs: 0.04, fat: 20.75, fiber: 5.55, salt: 0.126 })).toEqual({
      kcal: 375,
      protein: 12.3,
      carbs: 0,
      fat: 20.8,
      fiber: 5.6,
      salt: 0.13,
    })
  })
})
