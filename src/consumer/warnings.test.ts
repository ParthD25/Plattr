import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import type { Passport } from '../passport/types'
import type { ConsumerProfile } from '../store'
import { dailyIntake, personalWarnings } from './warnings'

const passports: Passport[] = JSON.parse(readFileSync('public/data/passports.json', 'utf8')).passports
const passport = (id: string) => passports.find(p => p.id === id)!
const profile = (p: Partial<ConsumerProfile> = {}): ConsumerProfile =>
  ({ shopping_for_children: false, allergens: [], conditions: [], dietary: [], takes_medicines: 'unanswered', labs: [], today: {}, ...p })
const warns = (id: string, p: Partial<ConsumerProfile>) => personalWarnings(passport(id), profile(p)).filter(w => w.level === 'warn')

test('eggs + egg allergy -> warn that names the allergen', () => {
  const w = warns('eggs-meadowlark', { allergens: ['eggs'] })
  expect(w).toHaveLength(1)
  expect(w[0].text).toContain('This product lists eggs, which is in your allergen list')
})

test("profile 'shellfish' matches a passport's 'Crustacean shellfish'", () => {
  const shrimp = { ...passport('salmon-cold-bay'), allergens: ['Crustacean shellfish'] }
  expect(personalWarnings(shrimp, profile({ allergens: ['shellfish'] })).some(w => w.level === 'warn')).toBe(true)
})

test('bread + celiac -> gluten warn', () => {
  expect(warns('bread-stone-mill', { conditions: ['celiac'] }).map(w => w.title)).toContain('Not recorded as gluten-free')
})

test('romaine + immunocompromised -> warn mentioning E. coli and handling; low-likelihood Cyclospora is skipped', () => {
  const w = warns('romaine-valley-green', { conditions: ['immunocompromised'] })
  expect(w).toHaveLength(1)
  expect(w[0].text).toContain('E. coli')
  expect(w[0].text).toContain('Rinse under running water')
  expect(w[0].text).toContain('not medical advice')
})

test('strawberry + empty profile -> no warn-level items', () => {
  expect(warns('strawberry-riverbend', {})).toHaveLength(0)
})

test('notes: halal missing on bread, vegetarian vs beef, saturated fat arithmetic for high cholesterol', () => {
  expect(personalWarnings(passport('bread-stone-mill'), profile({ dietary: ['halal'] })).map(w => w.title)).toContain('No halal certification is recorded')
  const beef = personalWarnings(passport('beef-sample-ridge'), profile({ dietary: ['vegetarian'], conditions: ['high_cholesterol'] }))
  expect(beef.map(w => w.title)).toContain('Not vegetarian')
  expect(beef.find(w => w.title.startsWith('Saturated fat'))!.text).toContain('7 / 20 g = 35%')
})

test("daily intake adds today's logged sodium and never treats a missing value as zero", () => {
  const rows = dailyIntake(passport('bread-stone-mill'), profile({ today: { sodium_mg: 1900 } }))
  expect(rows.find(r => r.label === 'Sodium')).toMatchObject({ amount: 190, pct: 8, today: 1900, pct_with_today: 91 })
  const bare = { ...passport('bread-stone-mill'), nutrition: { serving: '1 slice', serving_g: 43, per_serving: {} } }
  expect(dailyIntake(bare, profile())[0].amount).toBeUndefined()
})

test('vegan: eggs -> warn; apples labelled vegan -> nothing; unlabelled non-animal food -> note only', () => {
  expect(warns('eggs-meadowlark', { dietary: ['vegan'] }).map(w => w.title)).toContain('This is an animal product')
  expect(personalWarnings(passport('apples-orchard-lane'), profile({ dietary: ['vegan'] }))).toHaveLength(0)
  const unlabelled = personalWarnings({ ...passport('apples-orchard-lane'), dietary: [] }, profile({ dietary: ['vegan'] }))
  expect(unlabelled).toMatchObject([{ level: 'note', title: 'No vegan label is recorded for this product' }])
})

test("custom allergen 'strawberry' + strawberry passport -> warn that says where and to read the label; whole words only", () => {
  const w = warns('strawberry-riverbend', { custom_allergens: ['Strawberry'] })
  expect(w).toHaveLength(1)
  expect(w[0].title).toBe('Matches your own allergen "Strawberry"')
  expect(w[0].text).toContain('the product name')
  expect(w[0].text).toContain('read the label')
  expect(warns('strawberry-riverbend', { custom_allergens: ['straw', ' '] })).toHaveLength(0)
  expect(personalWarnings({ ...passport('apples-orchard-lane'), name: 'Frozen Strawberries' }, profile({ custom_allergens: ['strawberry'] }))).toHaveLength(1)
})

const imported = (over: Partial<Passport>): Passport => ({ ...passport('apples-orchard-lane'), sample: false, name: 'Plant Drink', allergens: [], dietary: [],
  imported_from: { source: 'Open Food Facts', url: 'https://world.openfoodfacts.org/product/0', retrieved_at: '2026-09-19' }, ...over })

test("imported record: ingredients 'water, soy protein' + soybeans allergy -> warn; shellfish maps to the crustacean keywords", () => {
  const w = personalWarnings(imported({ ingredients: 'water, soy protein' }), profile({ allergens: ['soybeans'] }))
  expect(w).toMatchObject([{ level: 'warn', title: 'Allergen: soybeans' }])
  expect(w[0].text).toContain('"soy"')
  expect(personalWarnings(imported({ ingredients: 'Rice, SHRIMP (12%)' }), profile({ allergens: ['shellfish'] }))[0].level).toBe('warn')
  expect(personalWarnings(imported({ ingredients: 'water, soy protein' }), profile({ allergens: ['milk'] }))).toHaveLength(0)
})

test('imported record with no allergen data and no ingredients -> honest note, never "allergen-free"', () => {
  const w = personalWarnings(imported({}), profile({ allergens: ['milk'] }))
  expect(w).toMatchObject([{ level: 'note' }])
  expect(w[0].text).toContain('That is not the same as allergen-free')
  expect(personalWarnings(passport('apples-orchard-lane'), profile({ allergens: ['milk'] }))).toHaveLength(0)   // sample passport: [] means none declared
})

test('old saved profile without the custom fields -> no crash', () => {
  const { custom_allergens: _a, custom_conditions: _c, ...old } = profile({ allergens: ['eggs'], custom_allergens: ['x'], custom_conditions: ['y'] })
  expect(personalWarnings(passport('eggs-meadowlark'), old as ConsumerProfile)).toHaveLength(1)
})
