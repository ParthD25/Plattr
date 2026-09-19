// One-click demo accounts. Everything seeded here is SAMPLE data and is labelled as such.
import { actions, EMPTY_PROFILE, localDay, type CartItem, type ConsumerProfile, type FarmProfile, type Role } from '../store'

export const DEMO: Record<Role, { email: string; name: string }> = {
  consumer: { email: 'demo-shopper@plattr.app', name: 'Demo Shopper' },
  producer: { email: 'demo-producer@plattr.app', name: 'Demo Producer' },
}
const DEMO_PASSWORD = 'demo'
export const DEMO_NOTE = 'Demo shopper data is synthetic sample data.'
/** SAMPLE past shopping trips, oldest first (ids in public/data/passports.json). Chosen so the average trip score rises over time. */
export const DEMO_TRIPS = [
  { daysAgo: 35, ids: ['apples-orchard-lane', 'salmon-cold-bay', 'bread-stone-mill'] },
  { daysAgo: 21, ids: ['beef-sample-ridge', 'romaine-valley-green', 'milk-clover-hill'] },
  { daysAgo: 7, ids: ['strawberry-riverbend', 'eggs-meadowlark', 'trout-clear-springs'] },
]
/** SYNTHETIC lab draws: numbers and dates only - Plattr never labels or interprets them. */
export const DEMO_LABS = [
  { code: 'ldl', unit: 'mg/dL', draws: [[180, 148], [90, 139], [14, 131]] },
  { code: 'hba1c', unit: '%', draws: [[180, 5.8], [90, 5.7], [14, 5.6]] },
] as const
export const DEMO_LOG_DAYS = 21
export const DEMO_LOG_GAPS = [4, 11, 16]   // day indexes left unlogged on purpose: unknown is a gap, never a zero

export const DEMO_FARM: FarmProfile = {
  name: 'Demo Acres (sample)', city: 'Butler', state: 'Pennsylvania', country: 'USA', lat: 40.8612, lon: -79.8953,
  acres: 120, pasture_acres: 80, coop_sqft: 1200, herd_size: 45,
  markets: ['Butler Farmers Market (sample)', 'Farm stand on site (sample)'],
  specialties: ['Grass-fed beef', 'Pasture-raised eggs'],
  about: 'SAMPLE farm profile - fictional demo data. A small family farm raising beef cattle on rotated pasture and a laying flock.',
  water_source: 'Private well (sample)', water_last_test: '2026-05-12', water_result: 'Sample entry: no coliform detected, nitrate 2.1 mg/L',
  fertilizers: 'Composted manure; no synthetic nitrogen (sample entry)', pesticides: 'None on pasture; spot herbicide on fence lines (sample entry)', organic: false,
  health_records: [
    { date: '2026-04-03', animal_or_lot: 'Herd (45 head)', event: 'Annual herd health check and vaccinations (sample entry)', vet: 'Sample Large Animal Vet' },
    { date: '2026-06-18', animal_or_lot: 'Cow #112', event: 'Treated for hoof infection; withdrawal period observed (sample entry)', vet: 'Sample Large Animal Vet' },
  ],
  parasite_watch: [
    { name: 'Barber pole worm (Haemonchus)', status: 'Monitoring - fecal egg counts low (sample entry)', noted_on: '2026-07-09' },
  ],
}

export const DEMO_PROFILE: ConsumerProfile = {
  ...EMPTY_PROFILE, age: 34, allergens: ['eggs'], conditions: ['high_blood_pressure'], dietary: [], custom_allergens: [], custom_conditions: [], takes_medicines: 'none',
  today: { sodium_mg: 1400, saturated_fat_g: 9, energy_kcal: 1250, protein_g: 48, exercise_min: 30 },
}

/** Local noon n days before `now` (noon keeps the local and the UTC calendar day the same in nearly every time zone). */
const daysAgo = (n: number, now: Date) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - n, 12)
const pick = (wiggle: number[], i: number) => wiggle[i % wiggle.length]

/** SYNTHETIC history, dated relative to `now`: lab draws plus a 21-day intake log ending yesterday. Deterministic (derived from the day index), gently improving, with 3 unlogged days. */
export function demoHistory(now = new Date()): Pick<ConsumerProfile, 'labs' | 'intake_log'> {
  const intake_log: NonNullable<ConsumerProfile['intake_log']> = {}
  for (let i = 0; i < DEMO_LOG_DAYS; i++) {
    if (DEMO_LOG_GAPS.includes(i)) continue
    const left = 1 - i / (DEMO_LOG_DAYS - 1)   // 1 on the oldest day, 0 yesterday
    intake_log[localDay(daysAgo(DEMO_LOG_DAYS - i, now))] = {
      sodium_mg: Math.round((2100 + 800 * left * left + pick([60, -120, 260, -40, -90, 110, 0], i)) / 10) * 10,   // about 2,900 -> 2,100 mg, every 7th day a salty one
      saturated_fat_g: Math.round(16 + 8 * left + pick([1, -1, 2, 0, -2, 1, -1], i)),
      energy_kcal: 2050 + pick([120, -80, 150, -150, 40, -110, 90], i),
      protein_g: Math.round(62 + 16 * (1 - left) + pick([4, -2, 6, 0, -3, 5, -1], i)),
      exercise_min: pick([0, 20, 30, 0, 45, 15, 30], i),
    }
  }
  const labs = DEMO_LABS.flatMap(l => l.draws.map(([ago, value]) => ({ code: l.code, unit: l.unit, value, drawn_on: localDay(daysAgo(ago, now)) })))
  return { labs, intake_log }
}

/** The three SAMPLE trips as purchased cart items, dated relative to `now`. */
export function demoTrips(now = new Date()): CartItem[] {
  return DEMO_TRIPS.flatMap(t => {
    const d = daysAgo(t.daysAgo, now)
    return t.ids.map(passport_id => ({ passport_id, added_at: d.toISOString(), purchased_at: d.toISOString(), trip: localDay(d) }))
  })
}

/** What enterDemo needs to know about what already exists (pass the useStore() snapshot). */
export interface Existing { profiles: Record<string, ConsumerProfile>; carts: Record<string, CartItem[]>; farms: Record<string, FarmProfile> }

/** Signs in the demo account for a role, creating and seeding it on first use. Never overwrites existing data (an older demo shopper only gets its empty history filled in). Returns a store error or null. */
export function enterDemo(role: Role, existing: Existing): string | null {
  const { email, name } = DEMO[role]
  const err = actions.signIn(email, DEMO_PASSWORD) && actions.signUp({ email, name, role, password: DEMO_PASSWORD })
  if (err) return err
  if (role === 'consumer') {
    const profile = existing.profiles[email], cart = existing.carts[email] ?? []
    // A demo shopper seeded before trends existed has no labs and no past days: top up those empty fields once, leave everything else as it is.
    const stale = !!profile && !profile.labs?.length && Object.keys(profile.intake_log ?? {}).length <= 1
    const history = demoHistory()
    if (!profile) actions.saveProfile(email, { ...DEMO_PROFILE, ...history })
    else if (stale) actions.saveProfile(email, { ...profile, labs: history.labs, intake_log: { ...history.intake_log, ...profile.intake_log } })
    if (!cart.length || stale) actions.setCart(email, [...demoTrips(), ...cart])
  } else if (!existing.farms[email]) actions.saveFarm(email, DEMO_FARM)
  return null
}

/** Only same-site paths are allowed as a post-login destination (no open redirect via ?next=). */
export function safeNext(next: string | null): string | null {
  return next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : null
}

/** Where a role lands after signing in: a safe ?next= wins unless that page belongs to the other role (which would dead-end on the role guard). */
export function destination(role: Role, next: string | null): string {
  const owner: Role | null = !next ? null : /^\/producer(\/|\?|$)/.test(next) ? 'producer' : /^\/(shop|history|map|trends|profile)(\/|\?|$)/.test(next) ? 'consumer' : null
  return next && (owner ?? role) === role ? next : role === 'consumer' ? '/shop' : '/producer'
}

/** Clears everything Plattr stored in this browser (key 'plattr.v1', same as src/store.ts) and reloads. Sample passports are files, so they are untouched. */
export function resetDemo() {
  if (!confirm('Reset demo data? This clears every account, profile, cart, farm and producer-made passport stored in this browser.')) return
  try { localStorage.removeItem('plattr.v1') } catch { /* storage blocked: nothing to clear */ }
  location.reload()
}
