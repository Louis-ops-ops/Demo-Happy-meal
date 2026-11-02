import { z } from 'zod'
import { DIETS } from '../domain/diet'
import { db, type Profile } from './db'
import { mealSlotSchema, nutrientsSchema } from './schemas'

export const BACKUP_FORMAT = 'happy-meal-backup'
export const BACKUP_VERSION = 1

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

const profileSchema = z.object({
  id: z.literal('me'),
  sex: z.enum(['male', 'female']),
  birthDate: isoDate,
  heightCm: z.number().positive(),
  activity: z.enum(['sedentary', 'light', 'moderate', 'active', 'extreme']),
  goal: z.object({ targetWeightKg: z.number().positive(), pace: z.enum(['gentle', 'moderate', 'steady']) }).nullable(),
  kcalTarget: z.number().positive(),
  macros: z.object({ proteinG: z.number(), fatG: z.number(), carbsG: z.number() }),
  diets: z.array(z.enum(Object.keys(DIETS) as [keyof typeof DIETS, ...Array<keyof typeof DIETS>])),
  exclusions: z.array(z.string()),
  householdSize: z.number().int().positive(),
  mealsPerDay: z.number().int().min(2).max(5),
  planDays: z.union([z.literal(7), z.literal(14)]),
  demo: z.boolean().optional(),
  createdAt: isoDate,
  updatedAt: isoDate,
})

const planSchema = z.object({
  id: z.string().min(1),
  startDate: isoDate,
  days: z.number().int().positive(),
  mealsPerDay: z.number().int().min(2).max(5),
  kcalTarget: z.number().positive(),
  have: z.array(z.string()),
  status: z.enum(['draft', 'active']),
  createdAt: isoDate,
})

const planMealSchema = z.object({
  planId: z.string().min(1),
  day: z.number().int().min(0),
  index: z.number().int().min(0),
  slot: mealSlotSchema,
  recipeId: z.string().min(1),
  portions: z.number().positive(),
})

const journalSchema = z.object({
  id: z.number().int().optional(),
  date: isoDate,
  slot: mealSlotSchema,
  label: z.string(),
  kind: z.enum(['plan', 'recipe', 'food']),
  recipeId: z.string().optional(),
  foodId: z.string().optional(),
  quantity: z.number().positive(),
  nutrients: nutrientsSchema,
  planKey: z.string().optional(),
})

export const backupSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.string(),
  profile: profileSchema.nullable(),
  weighIns: z.array(z.object({ date: isoDate, kg: z.number().positive() })),
  plans: z.array(planSchema),
  planMeals: z.array(planMealSchema),
  journal: z.array(journalSchema),
  shoppingState: z.array(
    z.object({ planId: z.string().min(1), foodId: z.string().min(1), checked: z.boolean(), atHome: z.boolean() }),
  ),
})

export type Backup = z.infer<typeof backupSchema>

export type ParsedBackup = { ok: true; backup: Backup } | { ok: false; message: string }

/** Reads a backup file's text. Never throws: the message is meant for the person. */
export function parseBackup(text: string): ParsedBackup {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return { ok: false, message: 'Ce fichier n’est pas une sauvegarde Happy meal (JSON illisible).' }
  }
  if (typeof json === 'object' && json !== null && (json as { format?: unknown }).format !== BACKUP_FORMAT) {
    return { ok: false, message: 'Ce fichier n’est pas une sauvegarde Happy meal.' }
  }
  const result = backupSchema.safeParse(json)
  if (!result.success) {
    return { ok: false, message: 'Cette sauvegarde est incomplète ou abîmée, rien n’a été modifié.' }
  }
  return { ok: true, backup: result.data }
}

export const backupFileName = (date: string) => `happy-meal-${date}.json`

/** Everything the person stored, as one object. */
export async function exportBackup(now = new Date()): Promise<Backup> {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    profile: ((await db.profile.get('me')) as Profile | undefined) ?? null,
    weighIns: await db.weighIns.toArray(),
    plans: await db.plans.toArray(),
    planMeals: await db.planMeals.toArray(),
    journal: await db.journal.toArray(),
    shoppingState: await db.shoppingState.toArray(),
  }
}

/** Removes every stored row. */
export async function clearAllData(): Promise<void> {
  await db.transaction('rw', [db.profile, db.weighIns, db.plans, db.planMeals, db.journal, db.shoppingState], async () => {
    await Promise.all([
      db.profile.clear(),
      db.weighIns.clear(),
      db.plans.clear(),
      db.planMeals.clear(),
      db.journal.clear(),
      db.shoppingState.clear(),
    ])
  })
}

/** Replaces all stored data by the backup, in one transaction (all or nothing). */
export async function importBackup(backup: Backup): Promise<void> {
  await db.transaction('rw', [db.profile, db.weighIns, db.plans, db.planMeals, db.journal, db.shoppingState], async () => {
    await clearAllData()
    if (backup.profile) await db.profile.put(backup.profile)
    await db.weighIns.bulkPut(backup.weighIns)
    await db.plans.bulkPut(backup.plans)
    await db.planMeals.bulkPut(backup.planMeals)
    await db.journal.bulkPut(backup.journal)
    await db.shoppingState.bulkPut(backup.shoppingState)
  })
}
