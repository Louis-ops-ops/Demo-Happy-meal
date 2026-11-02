import type { ClayId } from '../../components/clay'

export const EQUIPMENT_LABELS: Record<string, { label: string; clay?: ClayId }> = {
  poele: { label: 'Poêle', clay: 'poele' },
  casserole: { label: 'Casserole', clay: 'casserole' },
  cocotte: { label: 'Cocotte', clay: 'cocotte' },
  four: { label: 'Four', clay: 'four' },
  'air-fryer': { label: 'Air fryer', clay: 'air-fryer' },
  mixeur: { label: 'Mixeur' },
  saladier: { label: 'Saladier' },
  'plat-a-four': { label: 'Plat à four' },
}
