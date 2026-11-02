import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseBackup } from '../../data/backup'
import { buildReferenceData } from '../../data/reference'
import type { FoodsFile, RecipesFile } from '../../data/schemas'
import { addDays } from '../../domain/dates'
import { planAdherence } from '../../domain/tracking'
import { weightTrendKgPerWeek } from '../../domain/weight'
import { buildDemo } from './demoData'

const read = <T>(file: string) => JSON.parse(readFileSync(join(process.cwd(), 'public', 'data', file), 'utf8')) as T
const data = buildReferenceData(read<FoodsFile>('aliments.json'), read<RecipesFile>('recettes.json'))
const today = '2026-11-02'
const demo = buildDemo(data, today)

describe('demo profile', () => {
  it('is a valid backup', () => {
    expect(parseBackup(JSON.stringify(demo)).ok).toBe(true)
    expect(demo.profile).toMatchObject({ demo: true, planDays: 14, goal: { targetWeightKg: 76 } })
  })

  it('has an active 14-day plan that started 10 days ago', () => {
    expect(demo.plans).toEqual([expect.objectContaining({ status: 'active', days: 14, startDate: addDays(today, -10) })])
    expect(demo.planMeals).toHaveLength(14 * 4)
  })

  it('has ten days of history: meals eaten, a few skipped, nothing in the future', () => {
    const planEntries = demo.journal.filter((e) => e.kind === 'plan')
    const past = demo.planMeals.filter((m) => m.day < 10)
    const eatenPast = planEntries.filter((e) => e.date < today)
    expect(eatenPast.length).toBeLessThan(past.length)
    const adherence = planAdherence(eatenPast.length, past.length)!
    expect(adherence).toBeGreaterThanOrEqual(80)
    expect(adherence).toBeLessThanOrEqual(95)
    expect(demo.journal.every((e) => e.date <= today)).toBe(true)
    expect(demo.journal.filter((e) => e.date === today)).toHaveLength(1)
    expect(demo.journal.some((e) => e.kind === 'food')).toBe(true)
  })

  it('shows a slow, real weight loss', () => {
    const trend = weightTrendKgPerWeek(demo.weighIns)!
    expect(trend).toBeLessThan(-0.2)
    expect(trend).toBeGreaterThan(-1)
    expect(demo.shoppingState.length).toBeGreaterThan(0)
  })

  it('is deterministic', () => {
    const again = buildDemo(data, today)
    expect({ ...again, exportedAt: '' }).toEqual({ ...demo, exportedAt: '' })
  })
})
