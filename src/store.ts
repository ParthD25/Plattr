// Demo-grade persistence: everything lives in this browser's localStorage. No server, no real authentication.
// ponytail: localStorage accounts are NOT secure - swap for a hosted auth service (Supabase Auth) before real users.
// Shared file: builders import, do not edit.
import { useSyncExternalStore } from 'react'
import type { Passport } from './passport/types'

export type Role = 'consumer' | 'producer'
export interface Account { email: string; name: string; role: Role; password: string }

export interface ConsumerProfile {
  age?: number
  shopping_for_children: boolean
  allergens: string[]            // FDA major allergens, lower-case: milk, eggs, fish, shellfish, tree nuts, peanuts, wheat, soybeans, sesame
  conditions: string[]           // 'immunocompromised' | 'pregnant' | 'celiac' | 'high_blood_pressure' | 'high_cholesterol' | 'diabetes_or_prediabetes' | 'kidney_disease'
  dietary: string[]              // 'halal' | 'kosher' | 'vegetarian' | 'vegan' | 'gluten_free'
  custom_allergens?: string[]    // anything not in the FDA list, typed by the shopper: 'strawberry', 'mustard'
  custom_conditions?: string[]   // health conditions not in the list, typed by the shopper - shown back as reminders, no rules attached
  takes_medicines: 'none' | 'some' | 'unanswered'
  labs: { code: 'hba1c' | 'fasting_glucose' | 'ldl' | 'hdl' | 'total_cholesterol' | 'triglycerides'; value: number; unit: '%' | 'mg/dL'; drawn_on: string }[]
  today: { sodium_mg?: number; saturated_fat_g?: number; added_sugars_g?: number; energy_kcal?: number; protein_g?: number; exercise_min?: number }
  intake_log?: Record<string, ConsumerProfile['today']>   // yyyy-mm-dd -> that day's totals; saveProfile keeps today's entry in step with `today`
}

export interface CartItem { passport_id: string; added_at: string; purchased_at?: string; trip?: string }

export interface FarmProfile {
  name: string; city: string; state: string; country: string; lat?: number; lon?: number
  farm_type?: 'land' | 'fish_farm' | 'fishery'   // fish_farm = aquaculture (farm-raised); fishery = wild catch
  species?: string; aquaculture_system?: string; stocking_density?: string   // fish farms: e.g. 'rainbow trout', 'flow-through raceways', '25 kg per cubic metre'
  acres?: number; pasture_acres?: number; coop_sqft?: number; herd_size?: number
  markets: string[]; specialties: string[]; about: string
  water_source: string; water_last_test: string; water_result: string
  fertilizers: string; pesticides: string; organic: boolean
  health_records: { date: string; animal_or_lot: string; event: string; vet: string }[]
  parasite_watch: { name: string; status: string; noted_on: string }[]
}

interface State {
  accounts: Account[]
  session: { email: string } | null
  profiles: Record<string, ConsumerProfile>      // by email
  carts: Record<string, CartItem[]>              // by email
  farms: Record<string, FarmProfile>             // by producer email
  passports: Passport[]                          // created in the producer portal (sample ones come from /data/passports.json)
}

const KEY = 'plattr.v1'
const EMPTY: State = { accounts: [], session: null, profiles: {}, carts: {}, farms: {}, passports: [] }
export const EMPTY_PROFILE: ConsumerProfile = { shopping_for_children: false, allergens: [], conditions: [], dietary: [], takes_medicines: 'unanswered', labs: [], today: {} }

let state: State = read()
const listeners = new Set<() => void>()

function read(): State {
  try { return { ...EMPTY, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } } catch { return EMPTY }
}
function write(next: State) {
  state = next
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* private mode: keep in memory */ }
  listeners.forEach(l => l())
}

export function useStore(): State {
  return useSyncExternalStore(cb => { listeners.add(cb); return () => listeners.delete(cb) }, () => state)
}

/** The signed-in account, or null. */
export function useAccount(): Account | null {
  const s = useStore()
  return s.accounts.find(a => a.email === s.session?.email) ?? null
}

/** Local calendar day as yyyy-mm-dd. */
export const localDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const actions = {
  signUp(a: Account): string | null {
    if (state.accounts.some(x => x.email === a.email)) return 'An account with this email already exists in this browser.'
    write({ ...state, accounts: [...state.accounts, a], session: { email: a.email } })
    return null
  },
  signIn(email: string, password: string): string | null {
    const a = state.accounts.find(x => x.email === email && x.password === password)
    if (!a) return 'Email or password not recognised.'
    write({ ...state, session: { email } })
    return null
  },
  signOut() { write({ ...state, session: null }) },
  saveProfile(email: string, p: ConsumerProfile) {
    // Whatever is logged for today is also kept under today's date, so trends build up day by day.
    const logged = Object.values(p.today).some(v => v !== undefined)
    const next = logged ? { ...p, intake_log: { ...p.intake_log, [localDay()]: p.today } } : p
    write({ ...state, profiles: { ...state.profiles, [email]: next } })
  },
  /** Replace a shopper's whole cart and purchase history (used to seed the demo account with past trips). */
  setCart(email: string, items: CartItem[]) { write({ ...state, carts: { ...state.carts, [email]: items } }) },
  deleteHealthData(email: string) { const { [email]: _gone, ...rest } = state.profiles; write({ ...state, profiles: rest }) },
  addToCart(email: string, passport_id: string) {
    const cart = state.carts[email] ?? []
    if (cart.some(c => c.passport_id === passport_id && !c.purchased_at)) return
    write({ ...state, carts: { ...state.carts, [email]: [...cart, { passport_id, added_at: new Date().toISOString() }] } })
  },
  removeFromCart(email: string, passport_id: string) {
    write({ ...state, carts: { ...state.carts, [email]: (state.carts[email] ?? []).filter(c => c.passport_id !== passport_id || c.purchased_at) } })
  },
  /** Marks everything in the cart as bought - one shopping trip. */
  checkout(email: string) {
    const now = new Date().toISOString()
    write({ ...state, carts: { ...state.carts, [email]: (state.carts[email] ?? []).map(c => (c.purchased_at ? c : { ...c, purchased_at: now, trip: now.slice(0, 10) })) } })
  },
  saveFarm(email: string, f: FarmProfile) { write({ ...state, farms: { ...state.farms, [email]: f } }) },
  savePassport(p: Passport) { write({ ...state, passports: [...state.passports.filter(x => x.id !== p.id), p] }) },
  deletePassport(id: string) { write({ ...state, passports: state.passports.filter(p => p.id !== id) }) },
}
