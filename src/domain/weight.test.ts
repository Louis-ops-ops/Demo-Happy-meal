import { describe, expect, it } from 'vitest'
import { addDays } from './dates'
import {
  normalizeWeighIns,
  projectedGoalDate,
  smoothWeighIns,
  weightTrendKgPerWeek,
  type WeighIn,
} from './weight'

/** Daily weigh-ins from `start`, losing `perDay` kg each day. */
function linear(start: string, days: number, fromKg: number, perDay: number): WeighIn[] {
  return Array.from({ length: days }, (_, i) => ({ date: addDays(start, i), kg: fromKg - perDay * i }))
}

describe('normalizeWeighIns', () => {
  it('sorts by date and keeps the last weigh-in of a day', () => {
    expect(
      normalizeWeighIns([
        { date: '2026-01-03', kg: 79 },
        { date: '2026-01-01', kg: 80 },
        { date: '2026-01-03', kg: 78.5 },
      ]),
    ).toEqual([
      { date: '2026-01-01', kg: 80 },
      { date: '2026-01-03', kg: 78.5 },
    ])
  })
})

describe('smoothWeighIns (7-day moving average)', () => {
  it('averages the weigh-ins of the 7 days ending each day', () => {
    const entries = Array.from({ length: 8 }, (_, i) => ({ date: addDays('2026-01-01', i), kg: 80 + i }))
    const smoothed = smoothWeighIns(entries)
    expect(smoothed[0]!.avg7).toBe(80)
    expect(smoothed[6]!.avg7).toBe(83) // 80..86
    expect(smoothed[7]!.avg7).toBe(84) // 81..87
  })

  it('works with sparse weigh-ins (gaps leave the window)', () => {
    const smoothed = smoothWeighIns([
      { date: '2026-01-01', kg: 80 },
      { date: '2026-01-05', kg: 79 },
      { date: '2026-01-10', kg: 78 },
    ])
    expect(smoothed.map((s) => s.avg7)).toEqual([80, 79.5, 78.5])
  })

  it('returns an empty list without weigh-ins', () => {
    expect(smoothWeighIns([])).toEqual([])
  })
})

describe('weightTrendKgPerWeek', () => {
  it('measures the real trend on the smoothed curve', () => {
    expect(weightTrendKgPerWeek(linear('2026-01-01', 40, 90, 0.1))).toBeCloseTo(-0.7, 6)
    expect(weightTrendKgPerWeek(linear('2026-01-01', 40, 70, -0.05))).toBeCloseTo(0.35, 6)
  })

  it('ignores noise around the trend', () => {
    const noisy = linear('2026-01-01', 40, 90, 0.1).map((e, i) => ({ ...e, kg: e.kg + (i % 2 ? 0.6 : -0.6) }))
    expect(weightTrendKgPerWeek(noisy)).toBeCloseTo(-0.7, 1)
  })

  it('needs at least two weigh-ins a week apart', () => {
    expect(weightTrendKgPerWeek([])).toBeNull()
    expect(weightTrendKgPerWeek([{ date: '2026-01-01', kg: 80 }])).toBeNull()
    expect(weightTrendKgPerWeek(linear('2026-01-01', 7, 80, 0.1))).toBeNull()
    expect(weightTrendKgPerWeek(linear('2026-01-01', 8, 80, 0.1))).not.toBeNull()
  })
})

describe('projectedGoalDate', () => {
  it('projects the goal date at the real pace', () => {
    // Last smoothed value 86.4 kg on 2026-02-09, trend −0.7 kg/week:
    // (86.4 − 82.25) / 0.7 × 7 = 41.5 → 42 days.
    expect(projectedGoalDate(linear('2026-01-01', 40, 90, 0.1), 82.25)).toBe('2026-03-23')
  })

  it('returns the last date when the goal is already reached', () => {
    expect(projectedGoalDate(linear('2026-01-01', 40, 90, 0.1), 87)).toBe('2026-02-09')
  })

  it('returns null when not losing or without data', () => {
    expect(projectedGoalDate(linear('2026-01-01', 40, 70, -0.05), 65)).toBeNull()
    expect(projectedGoalDate([], 65)).toBeNull()
    expect(projectedGoalDate([{ date: '2026-01-01', kg: 80 }], 70)).toBeNull()
  })
})
