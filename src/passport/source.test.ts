import { expect, test } from 'vitest'
import { scorePassport } from './score'
import { needsEstNumber, productionMethodLabel, withPlant, PLANT_NOTE } from './source'
import type { Passport } from './types'
import type { Plant } from '../types'

const base: Passport = {
  id: 'x', sample: false, name: 'Ground chuck', tagline: '', emoji: '🥩', category: 'beef', food_group: 'protein', badges: [],
  farm: { name: 'Brand', city: '', state: '', country: 'United States', lat: 39.8, lon: -98.6, approximate: true },
  origin: [{ label: 'Brand', value: 'Brand', evidence: 'community' }], soil: [], water: [], feed: [], animal_welfare: [], health_history: [], certifications: [], safety: [],
  hazards: [], nutrition: { serving: '', serving_g: 0, per_serving: {} }, allergens: [], gluten_free: false, dietary: [],
}
const plant = { number: 'M9714+P9714', name: 'Example Packing', city: 'Omaha', state: 'NE', lat: 41.2, lon: -96 } as Plant

test('meat without a plant number asks for one; everything else does not', () => {
  expect(needsEstNumber(base)).toBe(true)
  expect(needsEstNumber({ ...base, est_number: 'M9714' })).toBe(false)
  expect(needsEstNumber({ ...base, category: 'grain', name: 'Soup', ingredients: 'water, chicken, salt' })).toBe(true)
  expect(needsEstNumber({ ...base, category: 'produce', name: 'Beefsteak tomato' })).toBe(false)
})

test('fish always says wild or farmed', () => {
  expect(productionMethodLabel(base)).toBeNull()
  expect(productionMethodLabel({ ...base, category: 'fish' })).toBe('Wild or farmed: not recorded')
  expect(productionMethodLabel({ ...base, category: 'fish', production_method: 'wild_caught' })).toBe('Wild-caught')
})

test('a matched plant is written back as a verified origin fact and moves the map pin', () => {
  const next = withPlant(base, { plant, token: 'M9714' }, '2026-01-05')
  expect(next.est_number).toBe('M9714')
  expect(next.origin.at(-1)).toMatchObject({ label: 'Processing plant', value: 'Example Packing, Omaha, NE (EST. M9714)', evidence: 'verified', source: 'USDA FSIS MPI Directory', date: '2026-01-05' })
  expect(next.farm).toMatchObject({ city: 'Omaha', state: 'NE', lat: 41.2, lon: -96, approximate: false, about: PLANT_NOTE })
  expect(scorePassport(next).total).toBeGreaterThan(scorePassport(base).total)
  expect(withPlant(next, { plant, token: 'M9714' }, '2026-01-05').origin).toHaveLength(2)   // saving twice does not duplicate
  expect(withPlant(base, { plant: { ...plant, lat: null, lon: null }, token: 'M9714' }, '2026-01-05').farm).toMatchObject({ lat: 39.8, approximate: true })
})
