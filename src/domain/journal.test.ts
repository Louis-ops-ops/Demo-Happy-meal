import { describe, expect, it } from 'vitest'
import { dayNutrients, defaultSlot, foodEntryNutrients, macroProgress, planDayIndex, recipeEntryNutrients } from './journal'
import type { Nutrients } from './types'

const n = (kcal: number, protein = 0, carbs = 0, fat = 0): Nutrients => ({ kcal, protein, carbs, fat, fiber: 0, salt: 0 })

describe('planDayIndex', () => {
  it('gives the day of the plan, or null outside of it', () => {
    expect(planDayIndex('2026-11-02', 7, '2026-11-02')).toBe(0)
    expect(planDayIndex('2026-11-02', 7, '2026-11-08')).toBe(6)
    expect(planDayIndex('2026-11-02', 7, '2026-11-09')).toBeNull()
    expect(planDayIndex('2026-11-02', 7, '2026-11-01')).toBeNull()
  })
})

describe('defaultSlot', () => {
  it('follows the hour of the day', () => {
    expect([7, 12, 16, 20].map(defaultSlot)).toEqual(['breakfast', 'lunch', 'snack', 'dinner'])
    expect(defaultSlot(10)).toBe('breakfast')
    expect(defaultSlot(11)).toBe('lunch')
    expect(defaultSlot(14)).toBe('lunch')
    expect(defaultSlot(15)).toBe('snack')
    expect(defaultSlot(17)).toBe('snack')
    expect(defaultSlot(18)).toBe('dinner')
  })
})

describe('entry nutrients', () => {
  it('scales a recipe by portions and a food by grams, rounded', () => {
    expect(recipeEntryNutrients(n(400.4, 20.1), 1.25)).toMatchObject({ kcal: 501, protein: 25.1 })
    expect(foodEntryNutrients(n(250, 10, 30, 5), 150)).toMatchObject({ kcal: 375, protein: 15, carbs: 45, fat: 7.5 })
  })

  it('sums a day', () => {
    expect(dayNutrients([])).toMatchObject({ kcal: 0 })
    expect(dayNutrients([{ nutrients: n(300, 10) }, { nutrients: n(200.5, 5.5) }])).toMatchObject({ kcal: 501, protein: 15.5 })
  })
})

describe('macroProgress', () => {
  it('pairs eaten and target for protein, carbs, fat', () => {
    expect(macroProgress(n(0, 50, 120, 30), { proteinG: 130, fatG: 63, carbsG: 240 })).toEqual([
      { key: 'proteinG', eaten: 50, target: 130 },
      { key: 'carbsG', eaten: 120, target: 240 },
      { key: 'fatG', eaten: 30, target: 63 },
    ])
  })
})
