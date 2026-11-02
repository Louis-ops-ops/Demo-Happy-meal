import { normalize } from './text'

/** Diets offered in the onboarding and the food tags each one forbids. */
export const DIETS = {
  vegetarian: ['viande', 'poisson'],
  vegan: ['viande', 'poisson', 'oeuf', 'lait'],
  'no-pork': ['porc'],
  'gluten-free': ['gluten'],
  'lactose-free': ['lait'],
  'no-alcohol': ['alcool'],
} as const satisfies Record<string, readonly string[]>

export type Diet = keyof typeof DIETS

/** Exclusion keyword, normalized and without a plural "s" on words over 4 letters (tomates → tomate, pois stays). */
export function exclusionKey(text: string): string {
  return normalize(text)
    .trim()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((word) => (word.length > 4 && word.endsWith('s') ? word.slice(0, -1) : word))
    .join(' ')
}

export type RecipeForDiet = {
  tags: readonly string[]
  /** Texts describing the ingredients (display labels and food names). */
  ingredientTexts: readonly string[]
}

/** True when an ingredient text contains the exclusion as whole words (tomate matches "tomates pelées", ail not "aile"). */
function matchesExclusion(texts: readonly string[], exclusion: string): boolean {
  const key = exclusionKey(exclusion)
  if (!key) return false
  return texts.some((text) => ` ${exclusionKey(text)} `.includes(` ${key} `))
}

/** A recipe is allowed when no diet forbids one of its tags and no exclusion matches an ingredient. */
export function isRecipeAllowed(
  recipe: RecipeForDiet,
  diets: readonly Diet[],
  exclusions: readonly string[],
): boolean {
  const forbidden = new Set<string>(diets.flatMap((diet) => DIETS[diet]))
  if (recipe.tags.some((tag) => forbidden.has(tag))) return false
  return !exclusions.some((exclusion) => matchesExclusion(recipe.ingredientTexts, exclusion))
}
