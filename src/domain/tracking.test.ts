import { describe, expect, it } from 'vitest'
import { averageLoggedKcal, dailyKcalSeries, planAdherence, recalcDue } from './tracking'

describe('dailyKcalSeries', () => {
  it('sums entries per day over the window ending on the given day, oldest first', () => {
    const series = dailyKcalSeries(
      [
        { date: '2026-11-02', kcal: 500.4 },
        { date: '2026-11-02', kcal: 700 },
        { date: '2026-10-31', kcal: 1800 },
        { date: '2026-10-01', kcal: 999 },
      ],
      '2026-11-02',
      4,
    )
    expect(series).toEqual([
      { date: '2026-10-30', kcal: 0 },
      { date: '2026-10-31', kcal: 1800 },
      { date: '2026-11-01', kcal: 0 },
      { date: '2026-11-02', kcal: 1200 },
    ])
  })
})

describe('averageLoggedKcal', () => {
  it('averages only the days with something logged', () => {
    expect(averageLoggedKcal([{ date: 'a', kcal: 2000 }, { date: 'b', kcal: 0 }, { date: 'c', kcal: 1000 }])).toBe(1500)
    expect(averageLoggedKcal([{ date: 'a', kcal: 0 }])).toBeNull()
    expect(averageLoggedKcal([])).toBeNull()
  })
})

describe('planAdherence', () => {
  it('is the share of due meals eaten, capped at 100 %', () => {
    expect(planAdherence(18, 24)).toBe(75)
    expect(planAdherence(30, 24)).toBe(100)
    expect(planAdherence(0, 8)).toBe(0)
    expect(planAdherence(0, 0)).toBeNull()
  })
})

describe('recalcDue', () => {
  it('is due after 14 days', () => {
    expect(recalcDue('2026-10-19', '2026-11-02')).toBe(true)
    expect(recalcDue('2026-10-20', '2026-11-02')).toBe(false)
  })
})
