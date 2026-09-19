import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import type { Passport } from '../../passport/types'
import { averageScore } from '../../passport/score'
import { intakeSeries, labSeries, shiftDay, summary, tripScores } from './series'

const { passports } = JSON.parse(readFileSync('public/data/passports.json', 'utf8')) as { passports: Passport[] }

test('shiftDay crosses month and year ends', () => {
  expect(shiftDay('2026-03-01', -1)).toBe('2026-02-28')
  expect(shiftDay('2026-12-31', 1)).toBe('2027-01-01')
})

test('intake series covers the last N days and keeps unlogged days as gaps, never zero', () => {
  const log = { '2026-09-19': { sodium_mg: 1400 }, '2026-09-17': { sodium_mg: 0, protein_g: 40 }, '2026-09-01': { sodium_mg: 9999 } }
  const s = intakeSeries(log, 'sodium_mg', 4, '2026-09-19')
  expect(s).toEqual([{ date: '2026-09-16', value: null }, { date: '2026-09-17', value: 0 }, { date: '2026-09-18', value: null }, { date: '2026-09-19', value: 1400 }])
  expect(intakeSeries(log, 'exercise_min', 3, '2026-09-19').every(p => p.value === null)).toBe(true)
  expect(intakeSeries(undefined, 'sodium_mg', 7, '2026-09-19')).toHaveLength(7)
})

test('summary counts logged days, days above the reference, and change against the period before', () => {
  const pts = (...v: (number | null)[]) => v.map((value, i) => ({ date: `d${i}`, value }))
  const s = summary(pts(2000, null, 2500, 2300, 3000), 2300, pts(null, 2000, 3000))
  expect(s).toEqual({ daysLogged: 4, daysAbove: 2, average: 2450, changeVsPreviousPeriod: -2 })   // 2300 itself is not above 2300
  expect(summary(pts(10, 20))).toEqual({ daysLogged: 2, daysAbove: null, average: 15, changeVsPreviousPeriod: null })
  expect(summary(pts(null, null), 20, pts(5))).toEqual({ daysLogged: 0, daysAbove: 0, average: null, changeVsPreviousPeriod: null })
})

test('trip scores group bought items by trip, oldest first, and skip what is still in the cart', () => {
  const [a, b, c] = passports
  const trips = tripScores([
    { passport_id: b.id, added_at: 'x', purchased_at: '2026-09-10T15:00:00.000Z', trip: '2026-09-10' },
    { passport_id: a.id, added_at: 'x', purchased_at: '2026-08-30T15:00:00.000Z' },
    { passport_id: c.id, added_at: 'x', purchased_at: '2026-09-10T15:00:00.000Z', trip: '2026-09-10' },
    { passport_id: c.id, added_at: 'x' },
    { passport_id: 'gone', added_at: 'x', purchased_at: '2026-07-01T15:00:00.000Z' },
  ], passports)
  expect(trips.map(t => t.date)).toEqual(['2026-08-30', '2026-09-10'])
  expect(trips[1]).toMatchObject({ items: 2, averageScore: averageScore([b, c]) })
  expect(trips[0].grade).toMatch(/^(A\+|[A-DF])$/)
})

test('lab series group by marker and sort by draw date', () => {
  const out = labSeries([
    { code: 'ldl', value: 120, unit: 'mg/dL', drawn_on: '2026-06-01' },
    { code: 'hba1c', value: 5.6, unit: '%', drawn_on: '2026-02-01' },
    { code: 'ldl', value: 131, unit: 'mg/dL', drawn_on: '2025-11-15' },
  ])
  expect(out.map(s => s.code)).toEqual(['hba1c', 'ldl'])
  expect(out[1].points).toEqual([{ date: '2025-11-15', value: 131 }, { date: '2026-06-01', value: 120 }])
  expect(labSeries([])).toEqual([])
  expect(labSeries()).toEqual([]) // legacy profile without `labs`
})
