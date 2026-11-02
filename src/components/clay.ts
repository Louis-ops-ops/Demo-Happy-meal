/** Clay illustrations available in public/clay/{1x,2x,3x}/{id}.webp (48, 96 and 144 px). */
export const clayIds = [
  'ail',
  'air-fryer',
  'aubergine',
  'blanc-de-poulet',
  'casserole',
  'cocotte',
  'courgette',
  'cuisse-de-poulet',
  'four',
  'huile-d-olive',
  'oeuf',
  'poele',
  'poivre',
  'salade',
  'sel',
  'steak',
  'steak-hache',
  'tomate',
] as const

export type ClayId = (typeof clayIds)[number]

/** Keyword (normalized, singular) → clay illustration, for chips showing an ingredient. */
const CLAY_BY_KEYWORD: ReadonlyArray<[RegExp, ClayId]> = [
  [/\btomate/, 'tomate'],
  [/\bcourgette/, 'courgette'],
  [/\baubergine/, 'aubergine'],
  [/\bail\b/, 'ail'],
  [/\b(salade|laitue)/, 'salade'],
  [/\boeuf/, 'oeuf'],
  [/\bpoivre\b/, 'poivre'],
  [/\bsel\b/, 'sel'],
  [/huile d.olive/, 'huile-d-olive'],
  [/\bsteak hache|boeuf hache/, 'steak-hache'],
  [/\b(steak|bavette)/, 'steak'],
  [/\b(poulet|dinde)/, 'blanc-de-poulet'],
]

/** Clay illustration matching an ingredient label, if any. */
export function clayForText(normalizedText: string): ClayId | undefined {
  return CLAY_BY_KEYWORD.find(([pattern]) => pattern.test(normalizedText))?.[1]
}
