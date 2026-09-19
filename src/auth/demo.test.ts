import { readFileSync } from 'node:fs'
import { expect, test, vi } from 'vitest'
import type { Passport } from '../passport/types'
import type { CartItem } from '../store'

const mem = new Map<string, string>()
vi.stubGlobal('localStorage', { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) })
const saved = () => JSON.parse(mem.get('plattr.v1') ?? '{}')
const { enterDemo, safeNext, destination, demoHistory, demoTrips, DEMO, DEMO_PROFILE, DEMO_TRIPS } = await import('./demo')
const { actions, localDay } = await import('../store')
const { averageScore } = await import('../passport/score')

test('demo shopper is created, seeded once with history, and never overwritten', () => {
  const email = DEMO.consumer.email
  expect(enterDemo('consumer', { profiles: {}, carts: {}, farms: {} })).toBeNull()
  let s = saved()
  expect(s.session.email).toBe(email)
  expect(s.profiles[email].allergens).toEqual(['eggs'])
  expect(s.profiles[email]).toMatchObject({ dietary: [], custom_allergens: [], custom_conditions: [], takes_medicines: 'none', age: 34 })
  // 21 days ending yesterday minus 3 gaps, plus today mirrored by saveProfile
  const days = Object.keys(s.profiles[email].intake_log)
  expect(days.length).toBeGreaterThanOrEqual(18)
  expect(days).toContain(localDay())
  expect(s.profiles[email].labs.map((l: { code: string; value: number }) => `${l.code} ${l.value}`)).toEqual(['ldl 148', 'ldl 139', 'ldl 131', 'hba1c 5.8', 'hba1c 5.7', 'hba1c 5.6'])
  const cart: CartItem[] = s.carts[email]
  expect(cart).toHaveLength(9)
  expect(cart.every(c => c.purchased_at && c.trip === c.purchased_at.slice(0, 10))).toBe(true)
  expect(new Set(cart.map(c => c.trip)).size).toBe(3)
  // second use signs in again without duplicating or resetting anything
  actions.saveProfile(email, { ...s.profiles[email], allergens: ['milk'] })
  expect(enterDemo('consumer', saved())).toBeNull()
  s = saved()
  expect(s.accounts).toHaveLength(1)
  expect(s.carts[email]).toHaveLength(9)
  expect(s.profiles[email].allergens).toEqual(['milk'])
  expect(Object.keys(s.profiles[email].intake_log)).toEqual(days)
  expect(s.profiles[email].labs).toHaveLength(6)
})

test('seeded intake is deterministic, improves gently and leaves gaps instead of zeros', () => {
  const now = new Date(2026, 8, 19, 9)
  const { intake_log, labs } = demoHistory(now)
  expect(demoHistory(now)).toEqual({ intake_log, labs })
  const days = Object.keys(intake_log!).sort()
  expect(days).toHaveLength(18)
  expect(days[0]).toBe('2026-08-29'); expect(days.at(-1)).toBe('2026-09-18')
  const sodium = days.map(d => intake_log![d].sodium_mg!)
  expect(sodium[0]).toBeGreaterThan(2800); expect(sodium.at(-1)).toBeLessThan(2200)
  const last14 = days.filter(d => d >= '2026-09-05').map(d => intake_log![d].sodium_mg!)
  const over = last14.filter(v => v > 2300).length
  expect(over).toBeGreaterThanOrEqual(2); expect(over).toBeLessThan(last14.length / 2)
  for (const d of days) {
    const t = intake_log![d]
    expect(t.energy_kcal).toBeGreaterThanOrEqual(1900); expect(t.energy_kcal).toBeLessThanOrEqual(2200)
    expect(t.protein_g).toBeGreaterThanOrEqual(60); expect(t.protein_g).toBeLessThanOrEqual(85)
    expect(t.saturated_fat_g).toBeGreaterThanOrEqual(14); expect(t.saturated_fat_g).toBeLessThanOrEqual(26)
  }
  expect(labs.map(l => l.drawn_on)).toEqual(['2026-03-23', '2026-06-21', '2026-09-05', '2026-03-23', '2026-06-21', '2026-09-05'])
})

test('the three sample trips score higher over time', () => {
  const { passports } = JSON.parse(readFileSync('public/data/passports.json', 'utf8')) as { passports: Passport[] }
  const avg = DEMO_TRIPS.map(t => averageScore(t.ids.map(id => passports.find(p => p.id === id)!))!)
  expect(avg[0]).toBeLessThan(avg[1]); expect(avg[1]).toBeLessThan(avg[2])
  expect(demoTrips(new Date(2026, 8, 19)).map(c => c.trip)).toEqual([...Array(3).fill('2026-08-15'), ...Array(3).fill('2026-08-29'), ...Array(3).fill('2026-09-12')])
})

test('a demo shopper seeded before trends existed gets its empty history filled in, nothing else touched', () => {
  const email = DEMO.consumer.email
  const bought = { passport_id: 'milk-clover-hill', added_at: '2026-09-18T10:00:00.000Z', purchased_at: '2026-09-18T10:00:00.000Z', trip: '2026-09-18' }
  actions.saveProfile(email, { ...DEMO_PROFILE, allergens: ['sesame'] })
  actions.setCart(email, [bought])
  expect(enterDemo('consumer', saved())).toBeNull()
  const s = saved()
  expect(s.profiles[email].allergens).toEqual(['sesame'])
  expect(s.profiles[email].labs).toHaveLength(6)
  expect(Object.keys(s.profiles[email].intake_log).length).toBeGreaterThanOrEqual(18)
  expect(s.carts[email]).toHaveLength(10)
  expect(s.carts[email].at(-1)).toEqual(bought)
})

test('demo producer gets the sample farm', () => {
  expect(enterDemo('producer', saved())).toBeNull()
  expect(saved().farms[DEMO.producer.email].name).toBe('Demo Acres (sample)')
})

test('safeNext only allows same-site paths', () => {
  expect(safeNext('/history')).toBe('/history')
  for (const bad of [null, '', 'https://evil.example', '//evil.example', '/\\evil.example']) expect(safeNext(bad)).toBeNull()
})

test('destination honours next only when it fits the role', () => {
  expect(destination('consumer', null)).toBe('/shop')
  expect(destination('producer', null)).toBe('/producer')
  expect(destination('consumer', '/history')).toBe('/history')
  expect(destination('consumer', '/food/eggs-meadowlark')).toBe('/food/eggs-meadowlark')
  expect(destination('consumer', '/producer/passports')).toBe('/shop')
  expect(destination('producer', '/map')).toBe('/producer')
  expect(destination('producer', '/trends')).toBe('/producer')
  expect(destination('consumer', '/trends')).toBe('/trends')
  expect(destination('producer', '/producer/passports')).toBe('/producer/passports')
})
