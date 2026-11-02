import { describe, expect, it } from 'vitest'
import { keepsOriginalWording, recipeScale, scaledIngredientGrams } from './recipe'

describe('recipeScale', () => {
  it('combines the plan scale, the household and the recipe servings', () => {
    expect(recipeScale(2, 1.5, 1)).toBe(0.75)
    expect(recipeScale(1, 1, 3)).toBe(3)
    expect(recipeScale(4, 1, 2)).toBe(0.5)
  })
})

describe('scaledIngredientGrams', () => {
  it('rounds to 1 g under 10 g (never below 1 g) and to 5 g above', () => {
    expect(scaledIngredientGrams(1, 0.75)).toBe(1)
    expect(scaledIngredientGrams(6, 1.25)).toBe(8)
    expect(scaledIngredientGrams(160, 0.75)).toBe(120)
    expect(scaledIngredientGrams(150, 1.25)).toBe(190)
  })
})

describe('keepsOriginalWording', () => {
  it('holds within 12 % of the original quantity', () => {
    expect(keepsOriginalWording(1)).toBe(true)
    expect(keepsOriginalWording(1.1)).toBe(true)
    expect(keepsOriginalWording(0.9)).toBe(true)
    expect(keepsOriginalWording(1.25)).toBe(false)
    expect(keepsOriginalWording(0.75)).toBe(false)
  })
})
