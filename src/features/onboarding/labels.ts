import type { Choice } from '../../components/ChoiceCard'
import type { Diet } from '../../domain/diet'
import { dailyDeficit, PACE_KG_PER_WEEK } from '../../domain/targets'
import type { ActivityLevel, Pace } from '../../domain/types'
import { formatDecimal, formatInt } from '../format'

export const ACTIVITIES: ReadonlyArray<Choice<ActivityLevel>> = [
  { value: 'sedentary', title: 'Sédentaire', description: 'Travail assis, peu de marche' },
  { value: 'light', title: 'Légère', description: 'Marche régulière ou sport 1 à 2 fois par semaine' },
  { value: 'moderate', title: 'Modérée', description: 'Sport 3 à 5 fois par semaine' },
  { value: 'active', title: 'Très active', description: 'Sport presque tous les jours ou métier physique' },
  { value: 'extreme', title: 'Intense', description: 'Entraînement soutenu chaque jour ou métier très physique' },
]

export const PACE_TITLES: Record<Pace, string> = { gentle: 'Doux', moderate: 'Modéré', steady: 'Soutenu' }

export const PACES: ReadonlyArray<Choice<Pace>> = (Object.keys(PACE_KG_PER_WEEK) as Pace[]).map((pace) => ({
  value: pace,
  title: `${PACE_TITLES[pace]} · ${formatDecimal(PACE_KG_PER_WEEK[pace])} kg par semaine`,
  description: `Environ ${formatInt(dailyDeficit(PACE_KG_PER_WEEK[pace]))} kcal de moins par jour`,
}))

/** Order of the chips. "Sans porc" replaces Figma's Halal / Casher: only the absence of pork can be guaranteed. */
export const DIET_LABELS: Record<Diet, string> = {
  vegetarian: 'Végétarien',
  vegan: 'Vegan',
  'no-pork': 'Sans porc',
  'gluten-free': 'Sans gluten',
  'lactose-free': 'Sans lactose',
  'no-alcohol': 'Sans alcool',
}

/** Which meals a day count covers (2 to 5). */
export const MEALS_PER_DAY_LABELS: Record<number, string> = {
  2: 'Déjeuner et dîner',
  3: 'Petit-déjeuner, déjeuner et dîner',
  4: '3 repas et une collation',
  5: '3 repas et deux collations',
}
