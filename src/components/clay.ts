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
