import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { HAZARDS, hazardSlug } from './hazards'
import type { Passport } from '../passport/types'

const { passports } = JSON.parse(readFileSync('public/data/passports.json', 'utf8')) as { passports: Passport[] }
const slugs = new Set(HAZARDS.map(h => h.slug))

test('every hazard name on the sample passports resolves to a library entry', () => {
  const names = [...new Set(passports.flatMap(p => p.hazards.map(h => h.name)))]
  expect(names.length).toBeGreaterThan(0)
  for (const n of names) expect(slugs.has(hazardSlug(n) ?? ''), n).toBe(true)
})

test('library entries: unique slugs, own name resolves to own slug, unknown names give null', () => {
  expect(slugs.size).toBe(HAZARDS.length)
  for (const h of HAZARDS) expect(hazardSlug(h.name), h.name).toBe(h.slug)
  expect(hazardSlug('E. coli O157:H7')).toBe('e-coli-stec')
  expect(hazardSlug('Gill flukes')).toBe('fish-gill-parasites')
  expect(hazardSlug('Vomitoxin (DON), a grain mould toxin')).toBe('vomitoxin-don')
  expect(hazardSlug('sunshine')).toBeNull()
})
