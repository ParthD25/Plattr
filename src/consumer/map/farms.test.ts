import { describe, expect, it } from 'vitest'
import { fromOrigin, groupFarms, haversineMiles, inTimeframe } from './farms'
import type { Passport } from '../../passport/types'

const passport = (id: string, farm: string, lat: number, lon: number): Passport => ({
  id, name: id, sample: true, tagline: '', emoji: '', category: 'produce', food_group: 'fruits', badges: [],
  farm: { name: farm, city: 'c', state: 's', country: 'USA', lat, lon },
  origin: [{ label: 'Farm', value: farm, evidence: 'declared' }], soil: [], water: [], feed: [], animal_welfare: [], health_history: [], certifications: [], safety: [], hazards: [],
  nutrition: { serving: '', serving_g: 0, per_serving: {} }, allergens: [], gluten_free: true, dietary: [],
})

describe('food map logic', () => {
  it('haversine: Pittsburgh to Philadelphia is about 257 miles', () => {
    expect(Math.round(haversineMiles(40.4406, -79.9959, 39.9526, -75.1652))).toBeGreaterThan(250)
    expect(Math.round(haversineMiles(40.4406, -79.9959, 39.9526, -75.1652))).toBeLessThan(265)
  })

  it('filters purchases by timeframe', () => {
    const now = new Date('2026-09-19T12:00:00Z')
    const cart = [
      { passport_id: 'a', added_at: '', purchased_at: '2025-03-01T10:00:00Z', trip: '2025-03-01' },
      { passport_id: 'b', added_at: '', purchased_at: '2026-02-10T10:00:00Z', trip: '2026-02-10' },
      { passport_id: 'c', added_at: '', purchased_at: '2026-09-05T10:00:00Z', trip: '2026-09-05' },
      { passport_id: 'd', added_at: '', purchased_at: '2026-09-15T10:00:00Z', trip: '2026-09-15' },
      { passport_id: 'e', added_at: '' }, // still in cart
    ]
    const ids = (tf: Parameters<typeof inTimeframe>[1]) => inTimeframe(cart, tf, now).map(c => c.passport_id).join('')
    expect(ids('latest')).toBe('d')
    expect(ids('month')).toBe('cd')
    expect(ids('year')).toBe('bcd')
    expect(ids('lifetime')).toBe('abcd')
  })

  it('groups by farm, counts repeats, skips farms without coordinates', () => {
    const a = passport('a', 'Farm One', 40, -80), b = passport('b', 'Farm One', 40, -80), c = passport('c', 'Far Farm', 59, -158)
    const farms = groupFarms([a, a, b, c, passport('x', 'Nowhere', NaN, NaN)])
    expect(farms.map(f => [f.name, f.count])).toEqual([['Farm One', 3], ['Far Farm', 1]]) // nearest first
    expect(farms[0].products).toEqual([{ id: 'a', name: 'a', times: 2 }, { id: 'b', name: 'b', times: 1 }])
    expect(farms[0].originEvidence).toBe('declared')
  })

  it('measures distances from a given origin, nearest farm first', () => {
    const farms = [{ name: 'Philadelphia', lat: 39.9526, lon: -75.1652 }, { name: 'Seattle', lat: 47.6062, lon: -122.3321 }]
    const fromPgh = fromOrigin(farms, { lat: 40.4406, lon: -79.9959 })
    expect(fromPgh.map(f => f.name)).toEqual(['Philadelphia', 'Seattle'])
    expect(Math.round(fromPgh[0].miles)).toBeGreaterThan(250)
    expect(Math.round(fromPgh[0].miles)).toBeLessThan(265)
    const fromPortland = fromOrigin(farms, { lat: 45.5152, lon: -122.6784 })
    expect(fromPortland.map(f => f.name)).toEqual(['Seattle', 'Philadelphia']) // order follows the origin
    expect(Math.round(fromPortland[0].miles)).toBeGreaterThan(135)
    expect(Math.round(fromPortland[0].miles)).toBeLessThan(155)
    expect(fromOrigin(farms, farms[1])[0].miles).toBe(0)
    expect(farms[0]).not.toHaveProperty('miles') // input untouched
  })
})
