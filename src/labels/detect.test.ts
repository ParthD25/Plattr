import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import type { ClaimsFile, ProductsFile } from '../types'
import { detectLabels } from './detect'

const claims: ClaimsFile = JSON.parse(readFileSync('public/data/claims.json', 'utf8'))
const { products }: ProductsFile = JSON.parse(readFileSync('public/data/products.json', 'utf8'))

function run(code: string) {
  const d = detectLabels(products.find(p => p.code === code)!, claims)
  return { ...d, rules: d.labelRules.map(r => r.key), claimKeys: d.labelClaims.map(c => c.key) }
}

test('365 Uncured Beef Hot Dogs: uncured fires, nitrite does not', () => {
  const d = run('0099482460839')
  expect(d.rules).toContain('uncured')
  expect(d.rules).not.toContain('nitrite')
  expect(d.labelRules.find(r => r.key === 'uncured')!.matched).toEqual(['uncured', 'celery powder'])
  expect(d.claimKeys).not.toContain('organic')   // "organic cane sugar" is an ingredient, not a product claim
})

test("Nathan's Beef Franks: nitrite and phosphates fire, uncured does not", () => {
  const d = run('0088813914999')
  expect(d.rules).toEqual(expect.arrayContaining(['nitrite', 'phosphates']))
  expect(d.rules).not.toContain('uncured')
})

test('Kroger Ground Beef: ground_beef rule; "NATURAL FLAVORING" is an ingredient, not a Natural claim', () => {
  const d = run('0011110632005')
  expect(d.rules).toEqual(['ground_beef'])
  expect(d.claimKeys).toEqual([])
  expect(run('0088813914999').claimKeys).not.toContain('natural')   // "natural flavorings"
  expect(run('0087427442439').claimKeys).not.toContain('natural')   // "NATURAL FLAVOR."
})

test('"Natural* beef." fires the natural claim, matched verbatim', () => {
  const d = run('0648649186183')
  expect(d.claimKeys).toEqual(['natural'])
  expect(d.labelClaims[0].matched).toBe('Natural')
})

test('Thousand Hills: grass_fed claim; unmapped tags are listed verbatim', () => {
  const d = run('0875045182383')
  expect(d.claimKeys).toContain('grass_fed')
  expect(d.otherLabels).toEqual(['en:Certified American Grassfed', 'en:Verified Land to Market'])
  expect(d.est).toBeUndefined()   // emb_codes is an empty string
})

test('establishment number is parsed out of emb_codes', () => {
  expect(run('0850388002291').est).toBe('6024')
  expect(run('0860004439707').est).toBe('47633')
  expect(run('0099482460839').est).toBeUndefined()
})

test('rules without detect strings never fire', () => {
  for (const p of products) {
    const keys = detectLabels(p, claims).labelRules.map(r => r.key)
    expect(keys).not.toContain('custom_exempt')
    expect(keys).not.toContain('cattle_id_not_public')
  }
})
