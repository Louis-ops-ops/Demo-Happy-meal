import type { IsoDate } from './types'

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const DAY_MS = 86_400_000

/** Parses `YYYY-MM-DD` as a UTC day number, so arithmetic ignores time zones and DST. */
function toUtcDay(date: IsoDate): number {
  const match = ISO_DATE.exec(date)
  if (!match) throw new Error(`Invalid ISO date: ${date}`)
  const [, y, m, d] = match
  const time = Date.UTC(Number(y), Number(m) - 1, Number(d))
  const check = new Date(time)
  if (check.getUTCDate() !== Number(d) || check.getUTCMonth() !== Number(m) - 1) {
    throw new Error(`Invalid ISO date: ${date}`)
  }
  return time / DAY_MS
}

function fromUtcDay(day: number): IsoDate {
  return new Date(day * DAY_MS).toISOString().slice(0, 10)
}

export function isIsoDate(value: string): boolean {
  try {
    toUtcDay(value)
    return true
  } catch {
    return false
  }
}

export function addDays(date: IsoDate, days: number): IsoDate {
  return fromUtcDay(toUtcDay(date) + days)
}

/** Whole days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return toUtcDay(to) - toUtcDay(from)
}

/** Local calendar date of a JS Date, as `YYYY-MM-DD`. */
export function toIsoDate(date: Date): IsoDate {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
