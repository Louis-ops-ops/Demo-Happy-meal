import type { Aisle, FoodTag } from '../src/data/schemas.ts'
import { normalize } from '../src/domain/text.ts'

/** Ciqual constituent codes used by the app. */
export const CONSTITUENTS = {
  kcal: '328', // Energie, Règlement UE N° 1169/2011 (kcal/100 g)
  protein: '25000', // Protéines, N x facteur de Jones (g/100 g)
  carbs: '31000', // Glucides (g/100 g)
  fat: '40000', // Lipides (g/100 g)
  fiber: '34100', // Fibres alimentaires (g/100 g)
  salt: '10004', // Sel chlorure de sodium (g/100 g)
} as const

/**
 * Parses a Ciqual "teneur": "12,5" → 12.5, "traces" → 0, "< 0,5" → 0.25 (half the limit), "-" → null.
 */
export function parseCiqualValue(raw: string | undefined): number | null {
  if (raw === undefined) return null
  const value = raw.trim().toLowerCase()
  if (value === '' || value === '-') return null
  if (value === 'traces') return 0
  const lessThan = /^<\s*([\d,.]+)$/.exec(value)
  if (lessThan) return Number(lessThan[1]!.replace(',', '.')) / 2
  const n = Number(value.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

export function decodeXml(text: string): string {
  return text
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

/** Ciqual sub-group (alim_ssgrp_code) → supermarket aisle. */
const AISLE_BY_SUBGROUP: Record<string, Aisle> = {
  '0101': 'frais', '0102': 'frais', '0103': 'frais', '0104': 'frais', '0105': 'frais', '0106': 'frais',
  '0201': 'fruits-legumes', '0202': 'fruits-legumes', '0203': 'epicerie-salee', '0204': 'fruits-legumes', '0205': 'epicerie-salee',
  '0301': 'epicerie-salee', '0302': 'boulangerie', '0303': 'epicerie-salee', '0304': 'epicerie-salee', '0305': 'frais',
  '0401': 'boucherie', '0402': 'boucherie', '0403': 'boucherie', '0404': 'boucherie',
  '0405': 'poissonnerie', '0406': 'poissonnerie', '0407': 'poissonnerie', '0408': 'poissonnerie', '0409': 'poissonnerie',
  '0410': 'cremerie', '0411': 'frais',
  '0501': 'cremerie', '0502': 'cremerie', '0503': 'cremerie', '0504': 'cremerie',
  '0601': 'boissons', '0602': 'boissons', '0603': 'boissons',
  '0701': 'epicerie-sucree', '0702': 'epicerie-sucree', '0703': 'epicerie-sucree', '0704': 'epicerie-sucree',
  '0705': 'boulangerie', '0706': 'epicerie-sucree', '0707': 'epicerie-sucree', '0708': 'epicerie-sucree', '0709': 'boulangerie',
  '0801': 'surgeles', '0802': 'surgeles', '0803': 'surgeles',
  '0901': 'cremerie', '0902': 'epicerie-salee', '0903': 'cremerie', '0904': 'epicerie-salee', '0905': 'epicerie-salee',
  '1001': 'epicerie-salee', '1002': 'condiments', '1003': 'condiments', '1004': 'condiments', '1005': 'condiments',
  '1006': 'condiments', '1007': 'epicerie-salee', '1008': 'epicerie-salee', '1009': 'frais', '1010': 'frais',
}

export function aisleFor(groupCode: string, subgroupCode: string): Aisle {
  return AISLE_BY_SUBGROUP[subgroupCode] ?? (groupCode === '08' ? 'surgeles' : 'epicerie-salee')
}

const has = (name: string, words: RegExp) => words.test(name)

const PLANT_BASED = /vegetal|vegan|soja|tofu|(lait|boisson|creme|dessert|yaourt)[^,]*(amande|avoine|noisette|coco|riz|epeautre)/
const PORK = /porc|jambon|\blardon|bacon|saucisse|saucisson|chorizo|rillette|andouill|boudin|pate de campagne|coppa|pancetta|merguez/
const NO_GLUTEN = /sans gluten|courge spaghetti|farine de (riz|mais|sarrasin|pois|chataigne|coco)|riz|mais|sarrasin|quinoa|millet/
const GLUTEN =
  /\bble\b|froment|farine|\bpain|pates|spaghetti|penne|macaroni|tagliatelle|lasagne|ravioli|nouille|semoule|boulgour|couscous|seigle|orge|epeautre|avoine|biscuit|gateau|pizza|tarte|quiche|crepe|brioche|viennoiserie|croissant|chapelure|pane\b|panee|sauce soja|biere|seitan|wrap|gnocchi|cereales|baguette|sandwich|burger|hamburger|kebab|panini|nem\b|samoussa/
const DAIRY =
  /\blait\b|laitier|fromage|creme|\bbeurre|yaourt|yoghourt|emmental|comte|mozzarella|parmesan|feta|ricotta|chevre|camembert|bechamel|gruyere|mascarpone|skyr|faisselle|petit-suisse/

/**
 * Derives diet tags from the Ciqual group and name. Group-based tags (meat, fish, egg) are reliable;
 * keyword tags (gluten, milk, pork) are a best effort and err on the side of tagging.
 */
export function tagsFor(name: string, groupCode: string, subgroupCode: string): FoodTag[] {
  const n = normalize(name)
  const tags = new Set<FoodTag>()
  const plant = has(n, PLANT_BASED) && !has(n, /lait de vache|beurre/)

  if (['0401', '0402', '0403', '0404'].includes(subgroupCode) && !has(n, /vegetal/)) tags.add('viande')
  if (groupCode === '01' && has(n, /poulet|boeuf|porc|jambon|lardon|viande|canard|dinde|veau|agneau|lapin|saucisse|bolognaise|chorizo/)) {
    tags.add('viande')
  }
  if (has(n, PORK) && !has(n, /vegetal|jambon de (poulet|dinde)|(poulet|dinde)[^,]*jambon|rillettes? de (saumon|thon|sardine|maquereau|crabe)/)) {
    tags.add('porc')
    tags.add('viande')
  }

  if (['0405', '0406', '0407', '0408', '0409', '0904'].includes(subgroupCode)) tags.add('poisson')
  if (groupCode === '01' && has(n, /poisson|saumon|thon|cabillaud|crevette|moule|sardine|surimi|fruits de mer/)) tags.add('poisson')

  if (subgroupCode === '0410' || has(n, /\boeuf|mayonnaise|omelette/)) tags.add('oeuf')

  const dairyGroup = groupCode === '05' || subgroupCode === '0901'
  if ((dairyGroup && !plant) || (has(n, DAIRY) && !(plant && !has(n, /fromage|beurre|creme fraiche/)))) {
    if (!has(n, /lait de coco|creme de coco|beurre de cacahuete|beurre d'arachide/)) tags.add('lait')
  }

  if (has(n, GLUTEN) && !has(n, NO_GLUTEN)) tags.add('gluten')
  if (subgroupCode === '0603' || has(n, /\bvin\b|biere|alcool|rhum|liqueur/)) tags.add('alcool')

  return [...tags].sort()
}
