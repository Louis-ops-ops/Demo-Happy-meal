/** Domain vocabulary. Code is in English, UI labels live in the features. */

export type Sex = 'male' | 'female'

/** Activity levels and their TDEE multipliers (sédentaire → extrême). */
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'extreme'

/** Weight-loss pace: doux, modéré, soutenu. */
export type Pace = 'gentle' | 'moderate' | 'steady'

/** Calendar date as `YYYY-MM-DD` (no time zone, no time). */
export type IsoDate = string

/** Nutrition values. For foods: per 100 g. For recipes: per serving. */
export type Nutrients = {
  kcal: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  salt: number
}

export type MacroTargets = {
  proteinG: number
  fatG: number
  carbsG: number
}

/** Meal slots of a day. */
export type MealSlot = 'breakfast' | 'lunch' | 'snack' | 'dinner'
