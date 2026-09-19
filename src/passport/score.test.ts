import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { gradeFor, scorePassport } from './score'
import type { Passport } from './types'

const { passports } = JSON.parse(readFileSync('public/data/passports.json', 'utf8')) as { passports: Passport[] }
const score = (id: string) => scorePassport(passports.find(p => p.id === id)!)

test('parts add up to the total and never exceed 100', () => {
  for (const p of passports) {
    const s = scorePassport(p)
    expect(s.parts.reduce((a, x) => a + x.points, 0)).toBe(s.total)
    expect(s.parts.reduce((a, x) => a + x.max, 0)).toBe(100)
  }
})

test('well-documented food grades A; a food with little provided grades F', () => {
  expect(score('strawberry-riverbend').grade).toBe('A+')
  expect(score('apples-orchard-lane').grade).toBe('F')
})

test('grade bands follow the usual school scale', () => {
  expect([100, 97, 96, 90, 89, 80, 79, 70, 69, 60, 59, 0].map(n => gradeFor(n).grade)).toEqual(['A+', 'A+', 'A', 'A', 'B', 'B', 'C', 'C', 'D', 'D', 'F', 'F'])
})

test('a declared-only claim earns less than a verified one', () => {
  const p = passports.find(x => x.id === 'eggs-meadowlark')!
  const weaker = { ...p, certifications: p.certifications.map(f => ({ ...f, evidence: 'declared' as const })) }
  expect(scorePassport(weaker).total).toBeLessThan(scorePassport(p).total)
})
