import { z } from 'zod'
import { clayIds } from '../components/clay'
import { buildReferenceData } from './reference'
import { foodsFileSchema, recipesFileSchema, type MealSlot } from './schemas'

/** kcal per serving a recipe must fall in for each slot (portions are then adjusted 0.75–1.5×). */
export const KCAL_RANGE_BY_SLOT: Record<MealSlot, { min: number; max: number }> = {
  breakfast: { min: 250, max: 550 },
  snack: { min: 80, max: 300 },
  lunch: { min: 350, max: 700 },
  dinner: { min: 350, max: 700 },
}

const MEAT_PROTEINS = new Set(['volaille', 'boeuf', 'porc'])

/**
 * Checks the reference data files: schemas, unique ids, every recipe ingredient exists,
 * clay ids exist, kcal per serving fits the slots, the declared protein matches the ingredients.
 * Returns a list of readable problems (empty when everything is fine).
 */
export function checkReferenceData(foodsJson: unknown, recipesJson: unknown): string[] {
  const problems: string[] = []

  const foodsResult = foodsFileSchema.safeParse(foodsJson)
  const recipesResult = recipesFileSchema.safeParse(recipesJson)
  if (!foodsResult.success) problems.push(`aliments.json : ${z.prettifyError(foodsResult.error)}`)
  if (!recipesResult.success) problems.push(`recettes.json : ${z.prettifyError(recipesResult.error)}`)
  if (!foodsResult.success || !recipesResult.success) return problems

  const foodsFile = foodsResult.data
  const recipesFile = recipesResult.data

  const duplicates = (ids: string[]) => ids.filter((id, i) => ids.indexOf(id) !== i)
  for (const id of duplicates(foodsFile.foods.map((f) => f.id))) problems.push(`aliment en double : ${id}`)
  for (const id of duplicates(recipesFile.recipes.map((r) => r.id))) problems.push(`recette en double : ${id}`)

  const foodIds = new Set(foodsFile.foods.map((f) => f.id))
  for (const recipe of recipesFile.recipes) {
    for (const ingredient of recipe.ingredients) {
      if (!foodIds.has(ingredient.foodId)) {
        problems.push(`${recipe.id} : l'aliment ${ingredient.foodId} (${ingredient.label}) n'existe pas`)
      }
    }
    if (recipe.clay && !(clayIds as readonly string[]).includes(recipe.clay)) {
      problems.push(`${recipe.id} : illustration clay inconnue "${recipe.clay}"`)
    }
  }
  if (problems.length > 0) return problems

  const data = buildReferenceData(foodsFile, recipesFile)
  for (const recipe of data.recipes.values()) {
    const kcal = Math.round(recipe.nutrition.kcal)
    for (const slot of recipe.slots) {
      const { min, max } = KCAL_RANGE_BY_SLOT[slot]
      if (kcal < min || kcal > max) problems.push(`${recipe.id} : ${kcal} kcal par portion, hors de ${min}–${max} pour ${slot}`)
    }

    const hasMeat = recipe.tags.includes('viande')
    const hasFish = recipe.tags.includes('poisson')
    if (recipe.protein && MEAT_PROTEINS.has(recipe.protein) && !hasMeat) {
      problems.push(`${recipe.id} : protéine "${recipe.protein}" mais aucun ingrédient marqué viande`)
    }
    if (recipe.protein === 'porc' && !recipe.tags.includes('porc')) {
      problems.push(`${recipe.id} : protéine "porc" mais aucun ingrédient marqué porc`)
    }
    if (recipe.protein === 'poisson' && !hasFish) {
      problems.push(`${recipe.id} : protéine "poisson" mais aucun ingrédient marqué poisson`)
    }
    if ((recipe.protein === null || !MEAT_PROTEINS.has(recipe.protein)) && hasMeat) {
      problems.push(`${recipe.id} : contient de la viande mais la protéine déclarée est "${recipe.protein}"`)
    }
  }

  return problems
}
