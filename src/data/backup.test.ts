import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { backupFileName, clearAllData, exportBackup, importBackup, parseBackup } from './backup'
import { db, type Profile } from './db'

const profile: Profile = {
  id: 'me',
  sex: 'female',
  birthDate: '1996-03-04',
  heightCm: 168,
  activity: 'light',
  goal: { targetWeightKg: 60, pace: 'gentle' },
  kcalTarget: 1650,
  macros: { proteinG: 100, fatG: 50, carbsG: 190 },
  diets: ['vegetarian'],
  exclusions: ['Tomate'],
  householdSize: 2,
  mealsPerDay: 4,
  planDays: 7,
  createdAt: '2026-11-02',
  updatedAt: '2026-11-02',
}
const nutrients = { kcal: 500, protein: 20, carbs: 60, fat: 15, fiber: 5, salt: 1 }

async function seed() {
  await db.profile.put(profile)
  await db.weighIns.bulkPut([{ date: '2026-11-01', kg: 64.2 }, { date: '2026-11-02', kg: 64 }])
  await db.plans.put({ id: 'p1', startDate: '2026-11-02', days: 7, mealsPerDay: 4, kcalTarget: 1650, have: ['riz'], status: 'active', createdAt: '2026-11-02' })
  await db.planMeals.put({ planId: 'p1', day: 0, index: 0, slot: 'breakfast', recipeId: 'porridge-pomme-cannelle', portions: 1.25 })
  await db.journal.add({ date: '2026-11-02', slot: 'breakfast', label: 'Porridge', kind: 'plan', quantity: 1.25, nutrients, planKey: 'p1:0:0' })
  await db.shoppingState.put({ planId: 'p1', foodId: '32140', checked: true, atHome: false })
}

beforeEach(async () => {
  await clearAllData()
})

describe('export and import', () => {
  it('round-trips every table through a JSON file', async () => {
    await seed()
    const text = JSON.stringify(await exportBackup(new Date('2026-11-02T10:00:00Z')))
    const parsed = parseBackup(text)
    expect(parsed.ok).toBe(true)

    await clearAllData()
    expect(await db.profile.count()).toBe(0)
    if (parsed.ok) await importBackup(parsed.backup)

    expect(await db.profile.get('me')).toEqual(profile)
    expect(await db.weighIns.count()).toBe(2)
    expect(await db.planMeals.get(['p1', 0, 0])).toMatchObject({ portions: 1.25 })
    expect((await db.journal.toArray())[0]).toMatchObject({ planKey: 'p1:0:0', nutrients })
    expect(await db.shoppingState.get(['p1', '32140'])).toMatchObject({ checked: true })
  })

  it('replaces what was there instead of merging', async () => {
    await seed()
    const backup = await exportBackup()
    await db.weighIns.put({ date: '2026-10-01', kg: 70 })
    await importBackup(backup)
    expect(await db.weighIns.count()).toBe(2)
  })

  it('exports an empty app and imports it back', async () => {
    const backup = await exportBackup()
    expect(backup.profile).toBeNull()
    await db.weighIns.put({ date: '2026-10-01', kg: 70 })
    await importBackup(backup)
    expect(await db.weighIns.count()).toBe(0)
    expect(await db.profile.count()).toBe(0)
  })
})

describe('parseBackup', () => {
  it('rejects text that is not JSON, another JSON, and a damaged backup', async () => {
    expect(parseBackup('pas du json')).toMatchObject({ ok: false })
    expect(parseBackup('{"format":"autre"}')).toMatchObject({ ok: false })
    expect(parseBackup('null')).toMatchObject({ ok: false })
    const damaged = { ...(await exportBackup()), weighIns: [{ date: 'hier', kg: -3 }] }
    const result = parseBackup(JSON.stringify(damaged))
    expect(result).toMatchObject({ ok: false })
    if (!result.ok) expect(result.message).toContain('rien n’a été modifié')
  })

  it('names the file after the day', () => {
    expect(backupFileName('2026-11-02')).toBe('happy-meal-2026-11-02.json')
  })
})
