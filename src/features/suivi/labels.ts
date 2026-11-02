import type { IsoDate } from '../../domain/types'

const short = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const long = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const at = (date: IsoDate) => new Date(`${date}T00:00:00Z`)

/** "2 nov." */
export const formatShortDate = (date: IsoDate) => short.format(at(date))
/** "14 janvier 2027" */
export const formatLongDate = (date: IsoDate) => long.format(at(date))
