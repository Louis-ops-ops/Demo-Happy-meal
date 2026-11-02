import { describe, expect, it } from 'vitest'
import { checkReferenceData } from './integrity'
import { buildReferenceData } from './reference'
import type { FoodsFile, RecipesFile } from './schemas'
import { searchFoods } from './search'

const zero = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, salt: 0 }

const foodsFile: FoodsFile = {
  source: { name: 'ANSES-Ciqual', version: 'test', doi: 'x', license: 'Etalab 2.0' },
  foods: [
    { id: '1', name: 'Lentille corail, sèche', per100g: { ...zero, kcal: 328, protein: 24 }, aisle: 'epicerie-salee', tags: [] },
    { id: '2', name: 'Lait de coco', per100g: { ...zero, kcal: 199, fat: 20 }, aisle: 'epicerie-salee', tags: [] },
    { id: '3', name: 'Poulet, filet sans peau cru', per100g: { ...zero, kcal: 110, protein: 23 }, aisle: 'boucherie', tags: ['viande'] },
    { id: '4', name: 'Pâtes sèches, standard, crues', per100g: { ...zero, kcal: 364 }, aisle: 'epicerie-salee', tags: ['gluten'] },
    { id: '5', name: 'Tomate ronde, crue', per100g: { ...zero, kcal: 18 }, aisle: 'fruits-legumes', tags: [] },
    { id: '6', name: 'Tomate, pelée, appertisée, au jus', per100g: { ...zero, kcal: 22 }, aisle: 'epicerie-salee', tags: [] },
    { id: '7', name: 'Pizza tomate, mozzarella, préemballée', per100g: { ...zero, kcal: 240 }, aisle: 'frais', tags: ['gluten', 'lait'] },
  ],
}

const step = { text: 'Fais cuire doucement.' }
const recipe = (id: string, ingredients: RecipesFile['recipes'][number]['ingredients'], protein: RecipesFile['recipes'][number]['protein']) => ({
  id,
  title: `Recette ${id}`,
  minutes: 20,
  servings: 2,
  slots: ['dinner' as const],
  protein,
  ingredients,
  steps: [step],
  equipment: [],
})

const recipesFile = {
  license: 'CC0-1.0' as const,
  recipes: [
    recipe('curry', [
      { foodId: '1', grams: 200, label: 'lentilles' },
      { foodId: '2', grams: 200, label: 'lait de coco' },
    ], 'legumineuses'),
    recipe('poulet-pates', [
      { foodId: '3', grams: 300, label: 'poulet' },
      { foodId: '4', grams: 200, label: 'pâtes' },
    ], 'volaille'),
  ],
}

describe('buildReferenceData', () => {
  it('computes nutrition per serving and tags from the ingredients', () => {
    const data = buildReferenceData(foodsFile, recipesFile)
    const curry = data.recipes.get('curry')!
    expect(curry.nutrition.kcal).toBeCloseTo((328 * 2 + 199 * 2) / 2)
    expect(curry.nutrition.protein).toBeCloseTo(24)
    expect(curry.tags).toEqual([])
    expect(data.recipes.get('poulet-pates')!.tags).toEqual(['gluten', 'viande'])
    expect(data.foods.get('1')!.search).toBe('lentille corail, seche')
  })

  it('throws on an unknown food', () => {
    const broken = { ...recipesFile, recipes: [recipe('x', [{ foodId: '999', grams: 10, label: '?' }], null)] }
    expect(() => buildReferenceData(foodsFile, broken)).toThrow(/unknown food 999/)
  })
})

describe('checkReferenceData', () => {
  const many = (r: ReturnType<typeof recipe>) => ({ ...recipesFile, recipes: Array.from({ length: 30 }, (_, i) => ({ ...r, id: `r-${i}` })) })
  const okRecipe = recipe('ok', [{ foodId: '1', grams: 250, label: 'lentilles' }], 'legumineuses') // 410 kcal

  it('accepts consistent data', () => {
    expect(checkReferenceData(foodsFile, many(okRecipe))).toEqual([])
  })

  it('reports schema errors, missing foods, unknown clay, kcal out of range and wrong protein', () => {
    expect(checkReferenceData({}, many(okRecipe))[0]).toMatch(/^aliments\.json/)
    expect(checkReferenceData(foodsFile, { ...recipesFile, recipes: [] })[0]).toMatch(/^recettes\.json/)
    expect(checkReferenceData(foodsFile, many({ ...okRecipe, ingredients: [{ foodId: '999', grams: 1, label: '?' }] }))).toContain(
      "r-0 : l'aliment 999 (?) n'existe pas",
    )
    expect(checkReferenceData(foodsFile, many({ ...okRecipe, clay: 'licorne' } as typeof okRecipe))).toContain(
      'r-0 : illustration clay inconnue "licorne"',
    )
    expect(checkReferenceData(foodsFile, many({ ...okRecipe, servings: 10 })).at(0)).toMatch(/hors de 350–700/)
    expect(checkReferenceData(foodsFile, many({ ...okRecipe, protein: 'boeuf' }))).toContain(
      'r-0 : protéine "boeuf" mais aucun ingrédient marqué viande',
    )
    expect(checkReferenceData(foodsFile, many({ ...okRecipe, protein: 'poisson' }))).toContain(
      'r-0 : protéine "poisson" mais aucun ingrédient marqué poisson',
    )
    const chicken = recipe('c', [{ foodId: '3', grams: 700, label: 'poulet' }], 'legumineuses')
    expect(checkReferenceData(foodsFile, many(chicken))).toContain('r-0 : contient de la viande mais la protéine déclarée est "legumineuses"')
    const dup = { ...recipesFile, recipes: Array.from({ length: 30 }, () => okRecipe) }
    expect(checkReferenceData(foodsFile, dup)).toContain('recette en double : ok')
  })
})

describe('searchFoods', () => {
  const foods = [...buildReferenceData(foodsFile, recipesFile).foods.values()]

  it('ignores accents and case, and matches word starts', () => {
    expect(searchFoods(foods, 'PATES').map((f) => f.id)).toEqual(['4'])
    expect(searchFoods(foods, 'lent cor').map((f) => f.id)).toEqual(['1'])
    expect(searchFoods(foods, 'oco').map((f) => f.id)).toEqual([])
  })

  it('ranks names starting with the query, then simpler foods', () => {
    expect(searchFoods(foods, 'tomate').map((f) => f.id)).toEqual(['5', '6', '7'])
  })

  it('returns nothing for an empty query and respects the limit', () => {
    expect(searchFoods(foods, '  ')).toEqual([])
    expect(searchFoods(foods, 'tomate', 1)).toHaveLength(1)
    expect(searchFoods(foods, 'zzz')).toEqual([])
  })
})
