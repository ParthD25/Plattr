import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import type { ClaimsFile, PlantsFile } from '../types'
import { beefPlant, checkProcessor, listedKey, type ClaimDefQ } from './check'

const plants: PlantsFile = JSON.parse(readFileSync('public/data/plants.json', 'utf8'))
const claims: ClaimsFile = JSON.parse(readFileSync('public/data/claims.json', 'utf8'))
const def = (key: string) => claims.claims.find(c => c.key === key) as ClaimDefQ

test('the three processor outcomes', () => {
  expect(checkProcessor(plants, 'M9714')).toBe('cattle_slaughter')
  expect(beefPlant(plants, 'M9714')?.plant.name).toBe('Thoma Meat Market')
  expect(checkProcessor(plants, 'EST. 21888')).toBe('inspected_no_cattle_slaughter')   // Fiore Meats: processing only
  expect(beefPlant(plants, 'EST. 21888')?.plant.name).toBe('Fiore Meats LLC')
  expect(checkProcessor(plants, '99999')).toBe('not_found')
  expect(checkProcessor(plants, 'not a number')).toBe('not_found')
})

test('a bare number that is two different plants means the M one for beef', () => {
  expect(beefPlant(plants, '96')?.token).toBe('M96')   // M96 Florida Beef, P96 Knauss Foods
  expect(checkProcessor(plants, '96')).toBe('cattle_slaughter')
})

test('a yes to a follow-up question re-keys or drops the claim', () => {
  expect(listedKey(def('grass_fed'), { ever_fed_grain: 'no', ever_in_feedlot: 'no' })).toBe('grass_fed')
  expect(listedKey(def('grass_fed'), { ever_fed_grain: 'yes', ever_in_feedlot: 'no' })).toBe('grass_finished')
  expect(listedKey(def('grass_fed'), { ever_fed_grain: 'no', ever_in_feedlot: 'yes' })).toBe('grass_finished')
  expect(listedKey(def('raised_without_antibiotics'), { ionophores: 'yes' })).toBeNull()
  expect(listedKey(def('pasture_raised'), {})).toBe('pasture_raised')
})
