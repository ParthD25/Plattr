import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import type { Passport } from '../passport/types'
import { cartTotal, logServings } from './trip'

const { passports } = JSON.parse(readFileSync('public/data/passports.json', 'utf8')) as { passports: Passport[] }
const pick = (...ids: string[]) => ids.map(id => passports.find(p => p.id === id)!)

test('logging servings adds to what was already logged and leaves other fields alone', () => {
  const next = logServings({ sodium_mg: 1400, exercise_min: 30 }, pick('eggs-meadowlark', 'bread-stone-mill'))
  expect(next.sodium_mg).toBe(1400 + 71 + 190)
  expect(next.protein_g).toBe(11.3)          // nothing logged before: 6.3 + 5
  expect(next.exercise_min).toBe(30)
  expect(next.added_sugars_g).toBeUndefined() // passports do not record added sugars - stays unknown, never 0
})

test('cart total sums prices', () => {
  expect(cartTotal(pick('strawberry-riverbend', 'eggs-meadowlark'))).toBe(12.28)
})
