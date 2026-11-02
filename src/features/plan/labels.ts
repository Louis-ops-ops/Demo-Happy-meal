import type { IsoDate, MealSlot } from '../../domain/types'
import { addDays } from '../../domain/dates'

export const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Petit-déjeuner',
  lunch: 'Déjeuner',
  snack: 'Collation',
  dinner: 'Dîner',
}

const weekday = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', timeZone: 'UTC' })
const weekdayLong = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
const dayMonth = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' })

const at = (date: IsoDate) => new Date(`${date}T00:00:00Z`)

/** "lun." */
export const formatWeekday = (date: IsoDate) => weekday.format(at(date))
/** "lundi 3 novembre" */
export const formatDayLong = (date: IsoDate) => weekdayLong.format(at(date))
/** "du 3 au 9 novembre" (or "du 28 octobre au 3 novembre") */
export function formatRange(start: IsoDate, days: number): string {
  const end = addDays(start, days - 1)
  const first = at(start)
  const last = at(end)
  const sameMonth = first.getUTCMonth() === last.getUTCMonth()
  return `du ${sameMonth ? first.getUTCDate() : dayMonth.format(first)} au ${dayMonth.format(last)}`
}

/** "1,25 portion" / "1 portion": French uses the singular below 2. */
export function formatPortions(portions: number): string {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(portions)} portion${portions >= 2 ? 's' : ''}`
}
