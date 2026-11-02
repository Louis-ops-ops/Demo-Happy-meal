import { z } from 'zod'

/**
 * Schemas of the static reference data (public/data/*.json).
 * Used by the import script, the build-time validation and the tests. The app trusts the files at runtime.
 */

export const nutrientsSchema = z.object({
  kcal: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  fiber: z.number().nonnegative(),
  salt: z.number().nonnegative(),
})

/** Supermarket aisles, in the order of a typical shop walk. */
export const AISLES = [
  'fruits-legumes',
  'boulangerie',
  'boucherie',
  'poissonnerie',
  'cremerie',
  'frais',
  'epicerie-salee',
  'condiments',
  'epicerie-sucree',
  'surgeles',
  'boissons',
] as const
export const aisleSchema = z.enum(AISLES)

/** What a food contains, for diets and exclusions. Recipes get the union of their ingredients' tags. */
export const FOOD_TAGS = ['viande', 'porc', 'poisson', 'oeuf', 'lait', 'gluten', 'alcool'] as const
export const foodTagSchema = z.enum(FOOD_TAGS)

export const foodSchema = z.object({
  /** Ciqual alim_code. */
  id: z.string().regex(/^\d+$/),
  name: z.string().min(1),
  per100g: nutrientsSchema,
  aisle: aisleSchema,
  tags: z.array(foodTagSchema),
})

export const foodsFileSchema = z.object({
  source: z.object({
    name: z.literal('ANSES-Ciqual'),
    version: z.string(),
    doi: z.string(),
    license: z.string(),
  }),
  foods: z.array(foodSchema).min(1),
})

export const MEAL_SLOTS = ['breakfast', 'lunch', 'snack', 'dinner'] as const
export const mealSlotSchema = z.enum(MEAL_SLOTS)

/** Main protein source, used for variety in the plan. */
export const PROTEIN_SOURCES = ['volaille', 'boeuf', 'porc', 'poisson', 'oeuf', 'legumineuses', 'laitier', 'tofu'] as const

export const EQUIPMENT = ['poele', 'casserole', 'cocotte', 'four', 'air-fryer', 'mixeur', 'saladier', 'plat-a-four'] as const

const kebabId = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)

export const recipeSchema = z.object({
  id: kebabId,
  title: z.string().min(3),
  /** Total time, prep included. */
  minutes: z.number().int().positive(),
  servings: z.number().int().positive(),
  slots: z.array(mealSlotSchema).min(1),
  protein: z.enum(PROTEIN_SOURCES).nullable(),
  /** Clay illustration id for the thumbnail (public/clay). */
  clay: z.string().optional(),
  ingredients: z
    .array(
      z.object({
        foodId: z.string().regex(/^\d+$/),
        grams: z.number().positive(),
        /** Short display name, e.g. "lentilles corail". */
        label: z.string().min(1),
        /** Household quantity when grams are not natural, e.g. "2 œufs". */
        display: z.string().optional(),
      }),
    )
    .min(1),
  steps: z
    .array(
      z.object({
        text: z.string().min(10),
        timerMinutes: z.number().positive().optional(),
      }),
    )
    .min(1),
  equipment: z.array(z.enum(EQUIPMENT)),
})

export const recipesFileSchema = z.object({
  license: z.literal('CC0-1.0'),
  recipes: z.array(recipeSchema).min(30).max(50),
})

export type Aisle = z.infer<typeof aisleSchema>
export type FoodTag = z.infer<typeof foodTagSchema>
export type Food = z.infer<typeof foodSchema>
export type FoodsFile = z.infer<typeof foodsFileSchema>
export type MealSlot = z.infer<typeof mealSlotSchema>
export type Recipe = z.infer<typeof recipeSchema>
export type RecipesFile = z.infer<typeof recipesFileSchema>
