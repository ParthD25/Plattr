import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import type { Passport } from '../../passport/types'
import { foodGroupCoverage, missingGroups, nutrientTotals, pairingNotes, recommend } from './complement'

const all: Passport[] = JSON.parse(readFileSync('public/data/passports.json', 'utf8')).passports
const pick = (...ids: string[]) => ids.map(id => all.find(p => p.id === id)!)

test('coverage counts groups and missingGroups lists the rest', () => {
  const basket = pick('beef-sample-ridge', 'eggs-meadowlark', 'strawberry-riverbend')
  expect(foodGroupCoverage(basket)).toEqual({ protein: 2, vegetables: 0, fruits: 1, grains: 0, dairy: 0 })
  expect(missingGroups(basket)).toEqual(['vegetables', 'grains', 'dairy'])
  expect(missingGroups([])).toHaveLength(5)
})

test('recommend: only items of the missing group, best score first, max 3', () => {
  const [rec] = recommend(['protein'], all)
  expect(rec.items.length).toBeGreaterThan(0)
  expect(rec.items.length).toBeLessThanOrEqual(3)
  expect(rec.items.every(p => p.food_group === 'protein')).toBe(true)
  expect(recommend(['vegetables'], all)[0].items[0].id).toBe('romaine-valley-green')
})

test('nutrientTotals sums one serving each against the Daily Value', () => {
  const t = nutrientTotals(pick('strawberry-riverbend', 'apples-orchard-lane'))
  const vitC = t.find(x => x.key === 'vitamin_c_mg')!
  expect(vitC.total).toBe(97.4)
  expect(vitC.pct).toBe(108)
  expect(t.find(x => x.key === 'sodium_mg')!.dv).toBe(2300)
})

test('pairing notes need both sides', () => {
  expect(pairingNotes(pick('beef-sample-ridge'))).toEqual([])
  const both = pairingNotes(pick('beef-sample-ridge', 'strawberry-riverbend'))
  expect(both.map(n => n.id)).toEqual(['vitamin_c_with_plant_iron'])
  expect(both[0].text).toContain('Vitamin C foods help your body absorb the iron')
  const cinnamon = pairingNotes(pick('bread-stone-mill'))
  expect(cinnamon[0].id).toBe('cinnamon_with_carbs')
  expect(cinnamon[0].evidence).toBe('limited, mixed evidence')
})
