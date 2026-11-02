import { useLiveQuery } from 'dexie-react-hooks'
import { db, getActivePlan, type CurrentPlan, type JournalEntry, type Profile } from '../../data/db'
import type { ReferenceData } from '../../data/reference'
import { useReferenceData } from '../../data/useReferenceData'
import { toIsoDate } from '../../domain/dates'
import { dayNutrients, planDayIndex } from '../../domain/journal'
import type { IsoDate, Nutrients } from '../../domain/types'

export type TodayState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready'
      today: IsoDate
      profile: Profile
      data: ReferenceData
      /** Active plan, if any. */
      current: CurrentPlan | null
      /** Index of today in the plan; null when there is no plan or today is outside of it. */
      day: number | null
      /** A draft is waiting for validation. */
      hasDraft: boolean
      entries: JournalEntry[]
      eaten: Nutrients
    }

/** Everything the Today screen needs: profile, active plan, today's journal and the reference data. */
export function useToday(): TodayState {
  const today = toIsoDate(new Date())
  const profile = useLiveQuery(async () => (await db.profile.get('me')) ?? null)
  const current = useLiveQuery(async () => (await getActivePlan()) ?? null)
  const hasDraft = useLiveQuery(async () => (await db.plans.where('status').equals('draft').count()) > 0)
  const entries = useLiveQuery(() => db.journal.where('date').equals(today).toArray(), [today])
  const reference = useReferenceData()

  if (reference.status === 'error') return { status: 'error', message: reference.message }
  if (!profile || current === undefined || hasDraft === undefined || !entries || reference.status !== 'ready') {
    return { status: 'loading' }
  }
  return {
    status: 'ready',
    today,
    profile,
    data: reference.data,
    current,
    day: current ? planDayIndex(current.plan.startDate, current.plan.days, today) : null,
    hasDraft,
    entries,
    eaten: dayNutrients(entries),
  }
}
