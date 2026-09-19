import { expect, test } from 'vitest'
import { labelRows, nutritionLabel } from './nutritionLabel'

test('friendly labels and units for passport nutrition keys', () => {
  expect(nutritionLabel('kcal')).toEqual({ label: 'Calories', unit: 'kcal' })
  expect(nutritionLabel('saturated_fat_g')).toEqual({ label: 'Saturated fat', unit: 'g' })
  expect(nutritionLabel('vitamin_c_mg')).toEqual({ label: 'Vitamin C', unit: 'mg' })
  expect(nutritionLabel('sodium_mg')).toEqual({ label: 'Sodium', unit: 'mg' })
  expect(nutritionLabel('omega3')).toEqual({ label: 'Omega3', unit: '' })
})

test('label rows: label order, % Daily Value from FDA values, no % where there is no Daily Value', () => {
  const { kcal, rows } = labelRows({ iron_mg: 9, sugars_g: 12, sodium_mg: 460, kcal: 50, omega3_g: 1, fat_g: 0 })
  expect(kcal).toBe(50)
  expect(rows.map(r => r.key)).toEqual(['fat_g', 'sodium_mg', 'sugars_g', 'iron_mg', 'omega3_g'])   // calories pulled out; macros in label order, then the rest
  const by = Object.fromEntries(rows.map(r => [r.key, r]))
  expect(by.sodium_mg).toMatchObject({ label: 'Sodium', pct: 20, slug: 'sodium', indent: false, micro: false })   // 460 / 2,300
  expect(by.fat_g.pct).toBe(0)                                     // a recorded zero is a real 0%
  expect(by.sugars_g).toMatchObject({ pct: null, indent: true })   // total sugars: FDA sets no Daily Value
  expect(by.iron_mg).toMatchObject({ pct: 50, micro: true })
  expect(by.omega3_g).toMatchObject({ label: 'Omega3', pct: null, slug: null })
  expect(labelRows(undefined)).toEqual({ kcal: undefined, rows: [] })
})
