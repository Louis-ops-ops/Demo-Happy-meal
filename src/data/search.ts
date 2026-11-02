import type { IndexedFood } from './reference'
import { normalize } from '../domain/text'

/**
 * Searches foods for the "j'ai mangé autre chose" flow (< 10 s entry): every word of the query must match
 * the start of a word in the name. Ranking: name starts with the query, then raw / plain foods (fewer commas),
 * then shorter names.
 */
export function searchFoods(foods: Iterable<IndexedFood>, query: string, limit = 20): IndexedFood[] {
  const words = normalize(query).split(/[^a-z0-9%]+/).filter(Boolean)
  if (words.length === 0) return []
  const patterns = words.map((word) => new RegExp(`(^|[^a-z0-9])${escape(word)}`))
  const first = words.join(' ')

  const matches: Array<{ food: IndexedFood; score: number }> = []
  for (const food of foods) {
    if (!patterns.every((pattern) => pattern.test(food.search))) continue
    const startsWith = food.search.startsWith(first) ? 0 : 1
    const complexity = food.search.split(',').length
    matches.push({ food, score: startsWith * 10_000 + complexity * 1_000 + food.search.length })
  }

  return matches
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((match) => match.food)
}

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
