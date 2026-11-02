import { addDays } from './dates'
import type { IsoDate } from './types'

export type DayKcal = { date: IsoDate; kcal: number }

/** The target is looked at again after this many days. */
export const RECALC_AFTER_DAYS = 14

/**
 * kcal eaten for each of the `days` days ending on `end` (inclusive), oldest first.
 * A day without any entry is 0: it means nothing was logged, not that nothing was eaten.
 */
export function dailyKcalSeries(
  entries: ReadonlyArray<{ date: IsoDate; kcal: number }>,
  end: IsoDate,
  days: number,
): DayKcal[] {
  const totals = new Map<IsoDate, number>()
  for (const entry of entries) totals.set(entry.date, (totals.get(entry.date) ?? 0) + entry.kcal)
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(end, i - (days - 1))
    return { date, kcal: Math.round(totals.get(date) ?? 0) }
  })
}

/** Average kcal over the days that have something logged. null if none. */
export function averageLoggedKcal(series: ReadonlyArray<DayKcal>): number | null {
  const logged = series.filter((day) => day.kcal > 0)
  if (logged.length === 0) return null
  return Math.round(logged.reduce((sum, day) => sum + day.kcal, 0) / logged.length)
}

/** Share (0–100) of the planned meals already eaten, among the meals of the days up to today. null if none were due. */
export function planAdherence(eatenMeals: number, dueMeals: number): number | null {
  if (dueMeals <= 0) return null
  return Math.min(100, Math.round((eatenMeals / dueMeals) * 100))
}

/** True once the profile is 14 days old (or more): time to propose a new calculation. */
export function recalcDue(updatedAt: IsoDate, today: IsoDate): boolean {
  return addDays(updatedAt, RECALC_AFTER_DAYS) <= today
}
