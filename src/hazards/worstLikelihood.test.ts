import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { worstLikelihood } from './index'
import type { Passport } from '../passport/types'

const { passports } = JSON.parse(readFileSync('public/data/passports.json', 'utf8')) as { passports: Passport[] }
const worst = (id: string) => worstLikelihood(passports.find(p => p.id === id)!)

test('worstLikelihood picks the highest level, null when empty', () => {
  expect(worst('romaine-valley-green')).toBe('elevated')
  expect(worst('strawberry-riverbend')).toBe('low')
  expect(worstLikelihood({ hazards: [] })).toBeNull()
})
