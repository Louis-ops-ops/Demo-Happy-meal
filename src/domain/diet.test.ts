import { describe, expect, it } from 'vitest'
import { exclusionKey, isRecipeAllowed } from './diet'
import { normalize } from './text'

const curry = { tags: [], ingredientTexts: ['lentilles corail', 'Lentille corail, sèche', 'tomates pelées', 'lait de coco'] }
const chicken = { tags: ['gluten', 'viande'], ingredientTexts: ['filets de poulet', 'tortillas de blé', "aile de poulet"] }
const omelette = { tags: ['lait', 'oeuf'], ingredientTexts: ['œufs', 'feta', 'jeunes pousses d’épinards'] }

describe('normalize', () => {
  it('removes accents, case and ligatures', () => {
    expect(normalize('Œufs à la Crème')).toBe('oeufs a la creme')
  })
})

describe('exclusionKey', () => {
  it('normalizes and removes plural s on long words', () => {
    expect(exclusionKey('  Tomates Pelées ')).toBe('tomate pelee')
    expect(exclusionKey('Lait de coco')).toBe('lait de coco')
    expect(exclusionKey('pois')).toBe('pois')
  })
})

describe('isRecipeAllowed', () => {
  it('allows everything without diets nor exclusions', () => {
    expect(isRecipeAllowed(chicken, [], [])).toBe(true)
  })

  it('applies diet tags', () => {
    expect(isRecipeAllowed(chicken, ['vegetarian'], [])).toBe(false)
    expect(isRecipeAllowed(curry, ['vegetarian', 'vegan', 'gluten-free'], [])).toBe(true)
    expect(isRecipeAllowed(omelette, ['vegetarian'], [])).toBe(true)
    expect(isRecipeAllowed(omelette, ['vegan'], [])).toBe(false)
    expect(isRecipeAllowed(omelette, ['lactose-free'], [])).toBe(false)
    expect(isRecipeAllowed(chicken, ['gluten-free'], [])).toBe(false)
    expect(isRecipeAllowed({ tags: ['porc', 'viande'], ingredientTexts: [] }, ['no-pork'], [])).toBe(false)
    expect(isRecipeAllowed({ tags: ['alcool'], ingredientTexts: [] }, ['no-alcohol'], [])).toBe(false)
  })

  it('excludes ingredients by whole words, singular or plural', () => {
    expect(isRecipeAllowed(curry, [], ['tomate'])).toBe(false)
    expect(isRecipeAllowed(curry, [], ['Lentilles'])).toBe(false)
    expect(isRecipeAllowed(curry, [], ['lait de coco'])).toBe(false)
    expect(isRecipeAllowed(curry, [], ['coco'])).toBe(false)
    expect(isRecipeAllowed(omelette, [], ['oeuf'])).toBe(false)
    expect(isRecipeAllowed(omelette, [], ['épinards'])).toBe(false)
  })

  it('does not exclude look-alike words', () => {
    expect(isRecipeAllowed(chicken, [], ['ail'])).toBe(true)
    expect(isRecipeAllowed(curry, [], ['lait demi-écrémé'])).toBe(true)
    expect(isRecipeAllowed(curry, [], ['  '])).toBe(true)
  })
})
