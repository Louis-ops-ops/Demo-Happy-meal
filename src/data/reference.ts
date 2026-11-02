import { recipeNutritionPerServing } from '../domain/nutrition'
import type { Nutrients } from '../domain/types'
import type { Food, FoodsFile, FoodTag, Recipe, RecipesFile } from './schemas'
import { normalize } from '../domain/text'

/** A recipe with everything the code derives from its ingredients. */
export type IndexedRecipe = Recipe & {
  /** Per serving, always computed from the ingredients (never typed by hand). */
  nutrition: Nutrients
  /** Union of the ingredients' tags (meat, gluten…), for diets and exclusions. */
  tags: FoodTag[]
}

export type IndexedFood = Food & { search: string }

export type ReferenceData = {
  source: FoodsFile['source']
  foods: Map<string, IndexedFood>
  recipes: Map<string, IndexedRecipe>
}

/** Builds the in-memory index. Throws if a recipe references an unknown food. */
export function buildReferenceData(foodsFile: FoodsFile, recipesFile: RecipesFile): ReferenceData {
  const foods = new Map<string, IndexedFood>(
    foodsFile.foods.map((food) => [food.id, { ...food, search: normalize(food.name) }]),
  )

  const recipes = new Map<string, IndexedRecipe>()
  for (const recipe of recipesFile.recipes) {
    const ingredients = recipe.ingredients.map((ingredient) => {
      const food = foods.get(ingredient.foodId)
      if (!food) throw new Error(`Recipe "${recipe.id}" uses unknown food ${ingredient.foodId}`)
      return { food, grams: ingredient.grams }
    })
    const tags = new Set(ingredients.flatMap(({ food }) => food.tags))
    recipes.set(recipe.id, {
      ...recipe,
      nutrition: recipeNutritionPerServing(
        ingredients.map(({ food, grams }) => ({ per100g: food.per100g, grams })),
        recipe.servings,
      ),
      tags: [...tags].sort(),
    })
  }

  return { source: foodsFile.source, foods, recipes }
}

let cache: Promise<ReferenceData> | undefined

/** Loads aliments.json and recettes.json once (served from public/data, cached by the service worker). */
export function loadReferenceData(): Promise<ReferenceData> {
  cache ??= Promise.all([fetchJson<FoodsFile>('aliments.json'), fetchJson<RecipesFile>('recettes.json')])
    .then(([foods, recipes]) => buildReferenceData(foods, recipes))
    .catch((error: unknown) => {
      cache = undefined
      throw error
    })
  return cache
}

async function fetchJson<T>(file: string): Promise<T> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/${file}`)
  if (!response.ok) throw new Error(`Impossible de charger ${file} (${response.status})`)
  return (await response.json()) as T
}
