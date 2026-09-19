import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import type { Passport } from '../passport/types'
import { FOOD_GROUPS, NUTRIENTS, nutrientSlug } from './nutrients'

const { passports } = JSON.parse(readFileSync('public/data/passports.json', 'utf8')) as { passports: Passport[] }

test('nutrientSlug resolves every nutrition key used in the sample passports', () => {
  const keys = new Set(passports.flatMap(p => Object.keys(p.nutrition.per_serving)))
  expect(keys.size).toBeGreaterThan(0)
  for (const k of keys) expect(nutrientSlug(k), k).toBeTruthy()
  expect(nutrientSlug('not_a_key')).toBeNull()
})

test('slugs are unique, cross-links resolve, and every sample food group has an entry', () => {
  const slugs = [...NUTRIENTS, ...FOOD_GROUPS].map(x => x.slug)
  expect(new Set(slugs).size).toBe(slugs.length)
  for (const g of FOOD_GROUPS) for (const s of g.nutrients) expect(NUTRIENTS.some(n => n.slug === s), s).toBe(true)
  for (const n of NUTRIENTS) for (const g of n.food_groups) expect(FOOD_GROUPS.some(x => x.group === g), g).toBe(true)
  for (const p of passports) expect(FOOD_GROUPS.some(x => x.group === p.food_group), p.id).toBe(true)
})
