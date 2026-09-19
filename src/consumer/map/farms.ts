// Pure logic for My Food Map: timeframe filter, grouping purchases by farm, distance from the demo home location.
import { gradeFor, scorePassport } from '../../passport/score'
import type { Evidence, Passport, Score } from '../../passport/types'
import type { CartItem } from '../../store'

export type Timeframe = 'latest' | 'month' | 'year' | 'lifetime'
export const TIMEFRAMES: [Timeframe, string][] = [['latest', 'Latest trip'], ['month', 'This month'], ['year', 'This year'], ['lifetime', 'Lifetime']]

export const HOME = { lat: 40.4406, lon: -79.9959, label: 'Pittsburgh (demo location)' }

/** Purchased items inside the timeframe. "Latest trip" = every item sharing the most recent trip date. */
export function inTimeframe(cart: CartItem[], tf: Timeframe, now = new Date()): CartItem[] {
  const bought = cart.filter(c => c.purchased_at)
  if (tf === 'lifetime') return bought
  if (tf === 'latest') {
    const trip = (c: CartItem) => c.trip ?? c.purchased_at!.slice(0, 10)
    const last = bought.map(trip).sort().at(-1)
    return bought.filter(c => trip(c) === last)
  }
  return bought.filter(c => {
    const d = new Date(c.purchased_at!)
    return d.getFullYear() === now.getFullYear() && (tf === 'year' || d.getMonth() === now.getMonth())
  })
}

/** Great-circle distance in miles. */
export function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = (d: number) => (d * Math.PI) / 180
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2
  return 3958.8 * 2 * Math.asin(Math.sqrt(a))
}

export interface LatLon { lat: number; lon: number }

/** The same farms with `miles` measured from `origin` (the shopper's location or the demo one), nearest first. Does not mutate. */
export const fromOrigin = <T extends LatLon>(farms: T[], origin: LatLon): (T & { miles: number })[] =>
  farms.map(f => ({ ...f, miles: haversineMiles(origin.lat, origin.lon, f.lat, f.lon) })).sort((a, b) => a.miles - b.miles)

const gradeOf = (total: number): Score['grade'] => gradeFor(total).grade
const RANK: Evidence[] = ['missing', 'community', 'declared', 'document', 'verified']

export interface FarmPoint {
  key: string; name: string; city: string; state: string; country: string; lat: number; lon: number
  count: number                                  // items bought from this farm (drives marker size)
  products: { id: string; name: string; times: number }[]
  score: number; grade: Score['grade']           // average of this farm's items
  originEvidence: Evidence                       // weakest backing of the "where it came from" fact across its products
  sample: boolean
  miles: number
}

/** One point per farm. `passports` may repeat (bought twice = counted twice). Farms without coordinates are skipped. */
export function groupFarms(passports: Passport[]): FarmPoint[] {
  const farms = new Map<string, FarmPoint & { sum: number }>()
  for (const p of passports) {
    const f = p.farm
    if (!Number.isFinite(f?.lat) || !Number.isFinite(f?.lon)) continue
    const key = `${f.name}|${f.lat}|${f.lon}`
    const total = scorePassport(p).total
    const ev = p.origin[0]?.evidence ?? 'missing'
    const cur = farms.get(key) ?? { key, name: f.name, city: f.city, state: f.state, country: f.country, lat: f.lat, lon: f.lon, count: 0, products: [], score: 0, grade: 'D' as const, originEvidence: ev, sample: false, miles: haversineMiles(HOME.lat, HOME.lon, f.lat, f.lon), sum: 0 }
    cur.count++
    cur.sum += total
    cur.sample ||= p.sample
    if (RANK.indexOf(ev) < RANK.indexOf(cur.originEvidence)) cur.originEvidence = ev
    const prod = cur.products.find(x => x.id === p.id)
    if (prod) prod.times++
    else cur.products.push({ id: p.id, name: p.name, times: 1 })
    farms.set(key, cur)
  }
  return [...farms.values()].map(({ sum, ...f }) => ({ ...f, score: Math.round(sum / f.count), grade: gradeOf(Math.round(sum / f.count)) })).sort((a, b) => a.miles - b.miles)
}
