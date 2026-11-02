import { useLiveQuery } from 'dexie-react-hooks'
import { db, getActivePlan, type CurrentPlan, type Profile, type WeighInRow } from '../../data/db'
import { addDays, toIsoDate } from '../../domain/dates'
import { planDayIndex } from '../../domain/journal'
import { averageLoggedKcal, dailyKcalSeries, planAdherence, type DayKcal } from '../../domain/tracking'
import { projectedGoalDate, smoothWeighIns, weightTrendKgPerWeek, type SmoothedWeighIn } from '../../domain/weight'
import type { IsoDate } from '../../domain/types'

export const HISTORY_DAYS = 30

export type Tracking = {
  today: IsoDate
  profile: Profile
  weighIns: WeighInRow[]
  smoothed: SmoothedWeighIn[]
  /** kg per week, negative = losing; null without enough data. */
  trend: number | null
  goalDate: IsoDate | null
  /** Last 30 days of kcal, oldest first. */
  kcal: DayKcal[]
  averageKcal: number | null
  adherence: number | null
}

/** Everything the Suivi screen shows, from the local database. null while loading. */
export function useTracking(): Tracking | null {
  const today = toIsoDate(new Date())
  const profile = useLiveQuery(async () => (await db.profile.get('me')) ?? null)
  const weighIns = useLiveQuery(() => db.weighIns.orderBy('date').toArray())
  const journal = useLiveQuery(
    () => db.journal.where('date').aboveOrEqual(addDays(today, -(HISTORY_DAYS - 1))).toArray(),
    [today],
  )
  const active = useLiveQuery(async () => (await getActivePlan()) ?? null)
  const planEaten = useLiveQuery(() => db.journal.where('planKey').notEqual('').toArray())

  if (!profile || !weighIns || !journal || active === undefined || !planEaten) return null

  const kcal = dailyKcalSeries(
    journal.map((e) => ({ date: e.date, kcal: e.nutrients.kcal })),
    today,
    HISTORY_DAYS,
  )
  return {
    today,
    profile,
    weighIns,
    smoothed: smoothWeighIns(weighIns),
    trend: weightTrendKgPerWeek(weighIns),
    goalDate: profile.goal ? projectedGoalDate(weighIns, profile.goal.targetWeightKg) : null,
    kcal,
    averageKcal: averageLoggedKcal(kcal.slice(-7)),
    adherence: adherenceOf(active, planEaten, today),
  }
}

/** Planned meals eaten among those of the days before today (today is still in progress). */
function adherenceOf(active: CurrentPlan | null, eaten: Array<{ planKey?: string }>, today: IsoDate): number | null {
  if (!active) return null
  const last = planDayIndex(active.plan.startDate, active.plan.days, today)
  // Before the plan starts nothing is due; once it is over, every day is.
  const through = last !== null ? last - 1 : today > active.plan.startDate ? active.plan.days - 1 : -1
  const due = active.meals.filter((m) => m.day <= through)
  const keys = new Set(eaten.flatMap((e) => (e.planKey ? [e.planKey] : [])))
  const eatenCount = due.filter((m) => keys.has(`${m.planId}:${m.day}:${m.index}`)).length
  return planAdherence(eatenCount, due.length)
}
