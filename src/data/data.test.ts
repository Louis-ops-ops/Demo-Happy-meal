import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { checkReferenceData } from './integrity'
import { buildReferenceData } from './reference'
import type { FoodsFile, RecipesFile } from './schemas'

// Reads the real files shipped in public/data (also run by `npm run data:validate` before each build).
const read = (file: string): unknown =>
  JSON.parse(readFileSync(join(process.cwd(), 'public', 'data', file), 'utf8'))

const foodsJson = read('aliments.json')
const recipesJson = read('recettes.json')

describe('public/data', () => {
  it('passes every integrity check', () => {
    expect(checkReferenceData(foodsJson, recipesJson)).toEqual([])
  })

  it('cites the Ciqual source', () => {
    expect((foodsJson as FoodsFile).source).toMatchObject({ name: 'ANSES-Ciqual', doi: '10.57745/RDMHWY' })
  })

  it('offers 30 to 50 recipes covering every slot and diet', () => {
    const data = buildReferenceData(foodsJson as FoodsFile, recipesJson as RecipesFile)
    const recipes = [...data.recipes.values()]
    expect(recipes.length).toBeGreaterThanOrEqual(30)
    expect(recipes.length).toBeLessThanOrEqual(50)

    const count = (predicate: (r: (typeof recipes)[number]) => boolean) => recipes.filter(predicate).length
    expect(count((r) => r.slots.includes('breakfast'))).toBeGreaterThanOrEqual(6)
    expect(count((r) => r.slots.includes('snack'))).toBeGreaterThanOrEqual(4)
    expect(count((r) => r.slots.includes('dinner'))).toBeGreaterThanOrEqual(14)

    const mains = recipes.filter((r) => r.slots.includes('dinner'))
    const vegetarian = mains.filter((r) => !r.tags.includes('viande') && !r.tags.includes('poisson'))
    const glutenFree = mains.filter((r) => !r.tags.includes('gluten'))
    const noDairy = mains.filter((r) => !r.tags.includes('lait'))
    // Enough options to fill 14 days without repeating within 3 days.
    expect(vegetarian.length).toBeGreaterThanOrEqual(6)
    expect(glutenFree.length).toBeGreaterThanOrEqual(6)
    expect(noDairy.length).toBeGreaterThanOrEqual(6)
  })
})
