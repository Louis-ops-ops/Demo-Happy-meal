/**
 * Imports the ANSES-Ciqual table into public/data/aliments.json.
 *
 *   npm run data:ciqual
 *
 * Source: Table de composition nutritionnelle des aliments Ciqual 2025, ANSES,
 * doi:10.57745/RDMHWY, Licence Ouverte Etalab 2.0. Raw XML files are cached in scripts/.cache (not committed).
 */
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { foodsFileSchema, type Food, type FoodsFile } from '../src/data/schemas.ts'
import { aisleFor, CONSTITUENTS, decodeXml, parseCiqualValue, tagsFor } from './ciqual-lib.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CACHE = join(ROOT, 'scripts', '.cache')
const OUTPUT = join(ROOT, 'public', 'data', 'aliments.json')

const SOURCE = {
  name: 'ANSES-Ciqual',
  version: 'Ciqual 2025 (2025-11-03)',
  doi: '10.57745/RDMHWY',
  license: 'Licence Ouverte / Etalab 2.0',
} as const

const API = 'https://entrepot.recherche.data.gouv.fr/api/access/datafile'
const FILES = {
  alim: { id: 666252, name: 'alim_2025_11_03.xml' },
  compo: { id: 666249, name: 'compo_2025_11_03.xml' },
} as const

/** Infant foods (group 11) are not relevant for this app. */
const EXCLUDED_GROUPS = new Set(['11'])

async function load(file: { id: number; name: string }): Promise<string> {
  const path = join(CACHE, file.name)
  if (!existsSync(path)) {
    console.log(`Téléchargement de ${file.name}…`)
    const response = await fetch(`${API}/${file.id}`)
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${file.name}`)
    await mkdir(CACHE, { recursive: true })
    await writeFile(path, Buffer.from(await response.arrayBuffer()))
  }
  return (await readFile(path, 'utf8')).replace(/^\uFEFF/, '')
}

function field(record: string, tag: string): string | undefined {
  const match = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`).exec(record)
  return match ? decodeXml(match[1]!.trim()) : undefined
}

async function main() {
  const [alimXml, compoXml] = await Promise.all([load(FILES.alim), load(FILES.compo)])

  // alim_code → { const_code → raw value }, only for the constituents we keep.
  const wanted = new Set<string>(Object.values(CONSTITUENTS))
  const compo = new Map<string, Map<string, string>>()
  const compoRe = /<alim_code>\s*(\d+)\s*<\/alim_code>\s*<const_code>\s*(\d+)\s*<\/const_code>\s*<teneur>([^<]*)<\/teneur>/g
  for (const [, alimCode, constCode, value] of compoXml.matchAll(compoRe)) {
    if (!wanted.has(constCode!)) continue
    let values = compo.get(alimCode!)
    if (!values) compo.set(alimCode!, (values = new Map()))
    values.set(constCode!, value!)
  }

  const foods: Food[] = []
  let skippedNoEnergy = 0
  let missingValues = 0

  for (const [, record] of alimXml.matchAll(/<ALIM>([\s\S]*?)<\/ALIM>/g)) {
    const id = field(record!, 'alim_code')!
    const name = field(record!, 'alim_nom_fr')!
    const group = field(record!, 'alim_grp_code')!
    const subgroup = field(record!, 'alim_ssgrp_code')!
    if (EXCLUDED_GROUPS.has(group)) continue

    const values = compo.get(id)
    const get = (code: string) => parseCiqualValue(values?.get(code))
    const kcal = get(CONSTITUENTS.kcal)
    if (kcal === null) {
      skippedNoEnergy++
      continue
    }
    const value = (code: string) => {
      const v = get(code)
      if (v === null) missingValues++
      return Math.round((v ?? 0) * 100) / 100
    }

    foods.push({
      id,
      name,
      per100g: {
        kcal: Math.round(kcal),
        protein: value(CONSTITUENTS.protein),
        carbs: value(CONSTITUENTS.carbs),
        fat: value(CONSTITUENTS.fat),
        fiber: value(CONSTITUENTS.fiber),
        salt: value(CONSTITUENTS.salt),
      },
      aisle: aisleFor(group, subgroup),
      tags: tagsFor(name, group, subgroup),
    })
  }

  foods.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  const file: FoodsFile = foodsFileSchema.parse({ source: SOURCE, foods })

  // One food per line: readable diffs, still compact.
  const lines = file.foods.map((f) => `    ${JSON.stringify(f)}`)
  const json = `{\n  "source": ${JSON.stringify(file.source)},\n  "foods": [\n${lines.join(',\n')}\n  ]\n}\n`
  await writeFile(OUTPUT, json)

  console.log(`${foods.length} aliments écrits dans public/data/aliments.json (${Math.round(json.length / 1024)} Ko)`)
  console.log(`${skippedNoEnergy} aliments ignorés sans énergie, ${missingValues} valeurs manquantes mises à 0`)
}

await main()
