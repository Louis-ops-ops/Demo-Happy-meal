import { describe, expect, it } from 'vitest'
import { normalize } from '../src/domain/text'
import { aisleFor, decodeXml, parseCiqualValue, tagsFor } from './ciqual-lib'

describe('parseCiqualValue', () => {
  it('reads French decimals, traces and limits', () => {
    expect(parseCiqualValue(' 59,7 ')).toBe(59.7)
    expect(parseCiqualValue('0')).toBe(0)
    expect(parseCiqualValue('traces')).toBe(0)
    expect(parseCiqualValue('< 0,5')).toBe(0.25)
    expect(parseCiqualValue('-')).toBeNull()
    expect(parseCiqualValue('')).toBeNull()
    expect(parseCiqualValue(undefined)).toBeNull()
    expect(parseCiqualValue('n.d.')).toBeNull()
  })
})

describe('text helpers', () => {
  it('decodes XML entities and normalizes accents', () => {
    expect(decodeXml('Huile d&apos;olive &amp; ail')).toBe("Huile d'olive & ail")
    expect(normalize('Œuf de poule, crème fraîche')).toBe('oeuf de poule, creme fraiche')
  })
})

describe('aisleFor', () => {
  it('maps Ciqual sub-groups to aisles', () => {
    expect(aisleFor('02', '0201')).toBe('fruits-legumes')
    expect(aisleFor('04', '0402')).toBe('boucherie')
    expect(aisleFor('04', '0406')).toBe('poissonnerie')
    expect(aisleFor('05', '0503')).toBe('cremerie')
    expect(aisleFor('08', '0000')).toBe('surgeles')
    expect(aisleFor('99', '9999')).toBe('epicerie-salee')
  })
})

describe('tagsFor', () => {
  it('tags meat, pork, fish and eggs', () => {
    expect(tagsFor('Boeuf, steak haché 5% MG cru', '04', '0402')).toEqual(['viande'])
    expect(tagsFor('Lardon nature, cru', '04', '0403')).toEqual(['porc', 'viande'])
    expect(tagsFor('Omelette aux lardons, faite maison', '04', '0410')).toEqual(['oeuf', 'porc', 'viande'])
    expect(tagsFor('Saumon, cru, élevage', '04', '0406')).toEqual(['poisson'])
    expect(tagsFor('Oeuf, cru', '04', '0410')).toEqual(['oeuf'])
  })

  it('does not mistake look-alike names', () => {
    expect(tagsFor('Pélardon (fromage de chèvre)', '05', '0503')).toEqual(['lait'])
    expect(tagsFor('Lait de coco', '10', '1003')).toEqual([])
    expect(tagsFor('Boisson à base de soja, nature', '06', '0602')).toEqual([])
    expect(tagsFor('Saucisse végétale au tofu', '04', '0403')).toEqual([])
    expect(tagsFor('Riz blanc, cuit', '03', '0301')).toEqual([])
  })

  it('tags milk, gluten and alcohol', () => {
    expect(tagsFor('Lait demi-écrémé, UHT', '05', '0501')).toEqual(['lait'])
    expect(tagsFor('Riz au lait vanille, rayon frais', '07', '0709')).toEqual(['lait'])
    expect(tagsFor('Beurre doux', '09', '0901')).toEqual(['lait'])
    expect(tagsFor('Pâtes sèches, cuites', '03', '0301')).toEqual(['gluten'])
    expect(tagsFor('Pain de mie blanc sans gluten', '03', '0302')).toEqual([])
    expect(tagsFor('Sauce soja, préemballée', '10', '1001')).toEqual(['gluten'])
    expect(tagsFor('Vin rouge 12°', '06', '0603')).toEqual(['alcool'])
  })
})

describe('tagsFor: regressions', () => {
  it('does not read "doubeurre" or the Spanish tortilla as dairy or gluten', () => {
    expect(tagsFor('Courge butternut (doubeurre), chair sans peau, crue', '02', '0201')).toEqual([])
    expect(tagsFor("Tortilla espagnole aux oignons (omelette aux pommes de terre et oignons)", '01', '0103')).toEqual(['oeuf'])
    expect(tagsFor('Tortilla souple (à garnir), à base de blé', '03', '0302')).toEqual(['gluten'])
    expect(tagsFor('Crème fraîche épaisse, 30% MG', '05', '0504')).toEqual(['lait'])
  })

  it('handles squash spaghetti, poultry ham and sandwiches', () => {
    expect(tagsFor('Courge spaghetti, chair sans peau, crue', '02', '0201')).toEqual([])
    expect(tagsFor('Jambon de poulet ou blanc de poulet en tranche', '04', '0403')).toEqual(['viande'])
    expect(tagsFor('Sandwich baguette (aliment moyen)', '01', '0105')).toEqual(['gluten'])
  })
})
