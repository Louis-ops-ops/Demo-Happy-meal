import { describe, expect, it } from 'vitest'
import {
  buildShoppingList,
  formatShoppingQuantity,
  groupByAisle,
  roundShoppingGrams,
  shoppingProgress,
  type ShoppingMeal,
} from './shopping'

const rice = { foodId: '1', label: 'riz', aisle: 'epicerie-salee', grams: 80 }
const chicken = { foodId: '2', label: 'poulet', aisle: 'boucherie', grams: 300 }
const apple = { foodId: '3', label: 'pomme', aisle: 'fruits-legumes', grams: 120 }

describe('roundShoppingGrams', () => {
  it('rounds up to 5 g, never below 5 g', () => {
    expect(roundShoppingGrams(37)).toBe(40)
    expect(roundShoppingGrams(40)).toBe(40)
    expect(roundShoppingGrams(0.4)).toBe(5)
  })
})

describe('buildShoppingList', () => {
  const meals: ShoppingMeal[] = [
    { servings: 2, portions: 1.5, ingredients: [chicken, rice] },
    { servings: 1, portions: 1, ingredients: [rice, apple] },
  ]

  it('sums by food: grams ÷ servings × portions × household', () => {
    const list = buildShoppingList(meals, 1)
    expect(list.find((l) => l.foodId === '2')!.grams).toBe(225) // 300 / 2 × 1.5
    expect(list.find((l) => l.foodId === '1')!.grams).toBe(140) // 80/2×1.5 = 60 + 80
    const family = buildShoppingList(meals, 3)
    expect(family.find((l) => l.foodId === '2')!.grams).toBe(675)
  })

  it('keeps the first label and aisle seen, sorted by label', () => {
    const list = buildShoppingList(meals, 1)
    expect(list.map((l) => l.label)).toEqual(['pomme', 'poulet', 'riz'])
    expect(list.find((l) => l.foodId === '1')).toMatchObject({ label: 'riz', aisle: 'epicerie-salee' })
  })

  it('is empty without meals', () => {
    expect(buildShoppingList([], 2)).toEqual([])
  })
})

describe('groupByAisle', () => {
  it('follows the aisle order, unknown aisles last, empty aisles left out', () => {
    const lines = [rice, chicken, apple, { foodId: '4', label: 'x', aisle: 'inconnu', grams: 5 }]
    const groups = groupByAisle(lines, ['fruits-legumes', 'boucherie', 'epicerie-salee', 'surgeles'])
    expect(groups.map((g) => g.aisle)).toEqual(['fruits-legumes', 'boucherie', 'epicerie-salee', 'inconnu'])
    expect(groups[0]!.lines).toEqual([apple])
  })
})

describe('shoppingProgress', () => {
  it('counts ticked lines and lines already at home', () => {
    const state = new Map([
      ['1', { checked: true, atHome: false }],
      ['2', { checked: false, atHome: true }],
      ['3', { checked: false, atHome: false }],
    ])
    expect(shoppingProgress([rice, chicken, apple, { foodId: '9' }], state)).toEqual({ done: 2, total: 4 })
    expect(shoppingProgress([], new Map())).toEqual({ done: 0, total: 0 })
  })
})

describe('formatShoppingQuantity', () => {
  it('uses grams under a kilo and kilos above', () => {
    expect(formatShoppingQuantity(250)).toBe('250 g')
    expect(formatShoppingQuantity(1000)).toBe('1 kg')
    expect(formatShoppingQuantity(1250)).toBe('1,25 kg')
  })
})
