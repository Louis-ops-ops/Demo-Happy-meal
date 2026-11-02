import type { IsoDate } from '../domain/types'

const integer = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
const decimal = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })
const monthYear = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' })

/** 2209 → "2 209" (narrow no-break space, as French typography expects). */
export function formatInt(value: number): string {
  return integer.format(Math.round(value))
}

/** 0.5 → "0,5" */
export function formatDecimal(value: number): string {
  return decimal.format(value)
}

/** "2027-02-22" → "février 2027" */
export function formatMonthYear(date: IsoDate): string {
  return monthYear.format(new Date(`${date}T00:00:00Z`))
}
