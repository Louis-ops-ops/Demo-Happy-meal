import { addDays, daysBetween } from './dates'
import type { IsoDate } from './types'

export type WeighIn = { date: IsoDate; kg: number }
export type SmoothedWeighIn = WeighIn & { avg7: number }

export const SMOOTHING_DAYS = 7
/** Window used to measure the real trend. */
export const TREND_WINDOW_DAYS = 28
/** Below this span, a trend is just noise (water, digestion). */
export const MIN_TREND_SPAN_DAYS = 7

/** Sorts by date and keeps the last weigh-in of each day. */
export function normalizeWeighIns(entries: ReadonlyArray<WeighIn>): WeighIn[] {
  const byDate = new Map<IsoDate, number>()
  for (const entry of entries) byDate.set(entry.date, entry.kg)
  return [...byDate.entries()]
    .map(([date, kg]) => ({ date, kg }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * 7-day moving average: for each weigh-in, the mean of weigh-ins in the 7 days ending that day.
 * Weigh-ins are optional, so the window may hold fewer than 7 values.
 */
export function smoothWeighIns(entries: ReadonlyArray<WeighIn>): SmoothedWeighIn[] {
  const sorted = normalizeWeighIns(entries)
  return sorted.map((entry, index) => {
    let sum = 0
    let count = 0
    for (let i = index; i >= 0; i--) {
      const previous = sorted[i]!
      if (daysBetween(previous.date, entry.date) >= SMOOTHING_DAYS) break
      sum += previous.kg
      count++
    }
    return { ...entry, avg7: sum / count }
  })
}

/**
 * Real trend in kg per week (negative = losing), from a least-squares line through the
 * smoothed values of the last 28 days. null if there is not enough data.
 */
export function weightTrendKgPerWeek(entries: ReadonlyArray<WeighIn>): number | null {
  const smoothed = smoothWeighIns(entries)
  const last = smoothed.at(-1)
  if (!last) return null
  const windowStart = addDays(last.date, -(TREND_WINDOW_DAYS - 1))
  const points = smoothed.filter((p) => p.date >= windowStart)
  const first = points[0]!
  if (points.length < 2 || daysBetween(first.date, last.date) < MIN_TREND_SPAN_DAYS) return null

  const xs = points.map((p) => daysBetween(first.date, p.date))
  const ys = points.map((p) => p.avg7)
  const meanX = xs.reduce((a, b) => a + b, 0) / xs.length
  const meanY = ys.reduce((a, b) => a + b, 0) / ys.length
  let num = 0
  let den = 0
  xs.forEach((x, i) => {
    num += (x - meanX) * (ys[i]! - meanY)
    den += (x - meanX) ** 2
  })
  return (num / den) * 7
}

/**
 * Date the goal would be reached at the real trend. null if not losing or not enough data.
 * Already at or under the goal returns the last weigh-in date.
 */
export function projectedGoalDate(entries: ReadonlyArray<WeighIn>, targetKg: number): IsoDate | null {
  const last = smoothWeighIns(entries).at(-1)
  if (!last) return null
  if (last.avg7 <= targetKg) return last.date
  const trend = weightTrendKgPerWeek(entries)
  if (trend === null || trend >= 0) return null
  const days = Math.ceil(((last.avg7 - targetKg) / -trend) * 7)
  return addDays(last.date, days)
}
