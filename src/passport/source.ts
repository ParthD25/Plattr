// Pure helpers behind the "Where this comes from" panel: which products should carry a USDA plant number, and how a matched plant is written back.
import type { EstMatch } from '../est/normalize'
import type { Fact, Passport } from './types'

export const PLANT_NOTE = 'Location is the USDA-inspected processing plant, not a farm.'
const FSIS_URL = 'https://www.fsis.usda.gov/inspection/establishments/meat-poultry-and-egg-product-inspection-directory'

// ponytail: keyword match on name + ingredients ("chicken flavour" crisps would also get the form). Use Open Food Facts category tags if this gets noisy.
const MEAT_WORDS = /\b(beef|pork|chicken|turkey)\b/i

/** Meat or poultry with no USDA establishment number recorded - the shopper can type the one on the pack. */
export function needsEstNumber(p: Passport): boolean {
  if (p.est_number) return false
  return p.category === 'beef' || p.category === 'poultry' || MEAT_WORDS.test(`${p.name} ${p.ingredients ?? ''}`)
}

/** Fish must always say which; anything else returns null. Text, never colour alone. */
export function productionMethodLabel(p: Passport): string | null {
  if (p.category !== 'fish') return null
  return p.production_method === 'wild_caught' ? 'Wild-caught' : p.production_method === 'farm_raised' ? 'Farm-raised' : 'Wild or farmed: not recorded'
}

/** The passport with the matched plant written in: est_number, a verified origin fact, and the plant's location on the map. */
export function withPlant(p: Passport, { plant, token }: EstMatch, retrieved: string): Passport {
  const fact: Fact = {
    label: 'Processing plant', value: `${plant.name}, ${plant.city}, ${plant.state} (EST. ${token})`,
    evidence: 'verified', source: 'USDA FSIS MPI Directory', url: FSIS_URL, date: retrieved,
  }
  const located = plant.lat != null && plant.lon != null   // a few directory rows have no coordinates: keep what we had
  const about = p.farm.about?.includes(PLANT_NOTE) ? p.farm.about : [p.farm.about, PLANT_NOTE].filter(Boolean).join(' ')
  return {
    ...p,
    est_number: token,
    origin: [...(p.origin ?? []).filter(f => f.label !== fact.label), fact],
    farm: { ...p.farm, city: plant.city, state: plant.state, country: 'United States', about, ...(located ? { lat: plant.lat!, lon: plant.lon!, approximate: false } : {}) },
  }
}
