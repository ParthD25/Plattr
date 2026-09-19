import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import type { ProductsFile } from '../types'
import { evaluateScan, fromOpenFoodFacts, type HealthProfile, type TodaySnapshot } from './evaluate'

const products: ProductsFile = JSON.parse(readFileSync('public/data/products.json', 'utf8'))
const product = (code: string) => fromOpenFoodFacts(products.products.find(p => p.code === code)!)
const TODAY = '2026-09-19'

const alex: HealthProfile = {   // SAMPLE persona - synthetic values
  data_label: 'Sample data',
  labs: [{ code: 'ldl', value: 142, unit: 'mg/dL', drawn_on: '2026-08-01' }, { code: 'hba1c', value: 5.9, unit: '%', drawn_on: '2026-08-01' }],
  allergies: ['soybeans'], watching: ['sodium', 'saturated_fat', 'post_workout_protein'], stricter: {}, medicines: 'none', has_condition: false,
}
const day: TodaySnapshot = { source: 'demo', intake: { sodium_mg: 1900, saturated_fat_g: 12 }, exercise_min: 45 }
const text = (cards: ReturnType<typeof evaluateScan>) => cards.flatMap(c => [c.title, ...c.lines]).join(' ')

test('adapter converts Open Food Facts grams of sodium to mg and reads the serving size', () => {
  const frank = product('0088813914999')            // Nathan's Beef Franks: 1.1 g sodium / 100 g, "1 FRANK (50 g)"
  expect(frank.per_100g.sodium_mg).toBe(1100)
  expect(frank.serving_g).toBe(50)
})

test('sodium: %DV per serving and the amount that reaches the reference, from what was logged', () => {
  const out = text(evaluateScan(product('0088813914999'), alex, day, TODAY))
  expect(out).toContain('550 mg of sodium, 24% of the FDA Daily Value')
  expect(out).toContain('about 35 g of this product (less than one serving) would reach the 2,300 mg daily reference')   // (2300-1900)/11 = 36.4 -> 35
})

test('saturated fat: lab value appears only as something the user entered, with its draw date - never a band', () => {
  const out = text(evaluateScan(product('0875045182383'), alex, day, TODAY))   // Thousand Hills 80/20: 9 g / 100 g, 112 g serving
  expect(out).toContain('You entered LDL-C 142 mg/dL (blood draw 2026-08-01). You chose to watch saturated fat.')
  expect(out).toContain('10.1 g of saturated fat, 50% of the FDA Daily Value')
  expect(out).toContain('about 90 g of this product')
  expect(out).toContain('21.3 g of protein, which is within the 15-25 g')
})

test('unknown intake is not zero', () => {
  const out = text(evaluateScan(product('0088813914999'), alex, { source: 'manual', intake: {} }, TODAY))
  expect(out).toContain('No sodium logged today, so Plattr cannot work out a remaining amount.')
  expect(out).not.toMatch(/about \d+ g of this product/)
})

test('a near-zero entry (Kroger ground beef sodium 0.00006 g) produces no arithmetic', () => {
  const out = text(evaluateScan(product('0011110632005'), { ...alex, watching: ['sodium'] }, day, TODAY))
  expect(out).toContain('data-entry error')
})

test('allergen match comes first and suppresses protein and tips; empty data is never "allergen-free"', () => {
  const stick = evaluateScan(product('0017082879783'), alex, day, TODAY)        // Jack Link's: en:soybeans
  expect(stick[0].kind).toBe('allergen')
  expect(stick.some(c => c.kind === 'protein' || c.kind === 'tip')).toBe(false)
  const beef = evaluateScan(product('0875045182383'), alex, day, TODAY)
  expect(beef[0].title).toBe('No match in what is recorded')
})

test('tips are default-deny: hidden unless the user reports no medicines and no condition', () => {
  const hidden = evaluateScan(product('0875045182383'), { ...alex, medicines: 'unanswered' }, day, TODAY)
  expect(hidden.some(c => c.kind === 'tip')).toBe(false)
  expect(hidden.some(c => c.id === 'tips_hidden')).toBe(true)
  expect(evaluateScan(product('0875045182383'), alex, day, TODAY).some(c => c.id === 'vitamin_c_with_plant_iron')).toBe(true)
})

test('language lint: no verdicts, no disease names, no imperatives', () => {
  const everything = products.products.map(p => text(evaluateScan(fromOpenFoodFacts(p), { ...alex, watching: ['sodium', 'saturated_fat', 'carbohydrate', 'post_workout_protein'] }, day, TODAY))).join(' ')
  expect(everything).not.toMatch(/\b(avoid|limit|spike|unsafe|safe|dangerous|abnormal|normal|prediabet\w*|diabet\w*|you have|you are|at risk|should|must|compatible|recommended|trend\w*)\b/i)
})
