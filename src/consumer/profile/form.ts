// Form <-> stored profile conversion. Inputs are strings while editing; empty stays undefined (never 0).
import type { ConsumerProfile } from '../../store'

export type LabCode = ConsumerProfile['labs'][number]['code']
export type TodayKey = keyof ConsumerProfile['today']
export interface LabRow { code: LabCode; value: string; unit: '%' | 'mg/dL'; drawn_on: string }
export interface ProfileForm {
  age: string
  shopping_for_children: boolean
  allergens: string[]
  conditions: string[]
  dietary: string[]
  custom_allergens: string[]
  custom_conditions: string // textarea text: one per line or comma separated
  takes_medicines: ConsumerProfile['takes_medicines']
  consent: boolean
  labs: LabRow[]
  today: Record<TodayKey, string>
}

export const TODAY_KEYS: TodayKey[] = ['sodium_mg', 'saturated_fat_g', 'added_sugars_g', 'energy_kcal', 'protein_g', 'exercise_min']
export const MAX_LABS = 6
export const MAX_CUSTOM_ALLERGENS = 12
export const MAX_CUSTOM_ALLERGEN_CHARS = 40
export const MAX_CUSTOM_CONDITIONS_CHARS = 200

/** Trimmed, lower-cased, de-duplicated, max 40 chars each, max 12. */
export function cleanAllergens(list: string[]): string[] {
  const words = list.map(s => s.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, MAX_CUSTOM_ALLERGEN_CHARS).trim()).filter(Boolean)
  return [...new Set(words)].slice(0, MAX_CUSTOM_ALLERGENS)
}

/** One per line or comma separated, max 200 chars in total; de-duplicated ignoring case, kept as typed. */
export function parseConditions(text: string): string[] {
  const items = text.slice(0, MAX_CUSTOM_CONDITIONS_CHARS).split(/[\n,]/).map(s => s.trim().replace(/\s+/g, ' ')).filter(Boolean)
  return items.filter((s, i) => items.findIndex(t => t.toLowerCase() === s.toLowerCase()) === i)
}

/** '' / junk / negative -> undefined. "0" typed on purpose stays 0. */
export function num(s: string): number | undefined {
  if (s.trim() === '') return undefined
  const n = Number(s)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

export function toForm(p: ConsumerProfile): ProfileForm {
  const today = Object.fromEntries(TODAY_KEYS.map(k => [k, p.today[k] === undefined ? '' : String(p.today[k])])) as Record<TodayKey, string>
  return {
    age: p.age === undefined ? '' : String(p.age),
    shopping_for_children: p.shopping_for_children,
    allergens: p.allergens, conditions: p.conditions, dietary: p.dietary,
    custom_allergens: cleanAllergens(p.custom_allergens ?? []), // older stored profiles have neither field
    custom_conditions: (p.custom_conditions ?? []).join('\n'),
    takes_medicines: p.takes_medicines,
    consent: p.labs.length > 0 || Object.keys(p.today).length > 0, // they consented when they saved these
    labs: p.labs.map(l => ({ ...l, value: String(l.value) })),
    today,
  }
}

/** Health numbers are only stored with consent; incomplete lab rows (no value or no draw date) are dropped. */
export function toProfile(f: ProfileForm): ConsumerProfile {
  const age = num(f.age)
  const today: ConsumerProfile['today'] = {}
  if (f.consent) for (const k of TODAY_KEYS) { const n = num(f.today[k]); if (n !== undefined) today[k] = n }
  const labs = !f.consent ? [] : f.labs.slice(0, MAX_LABS).flatMap(l => {
    const value = num(l.value)
    return value === undefined || !l.drawn_on ? [] : [{ code: l.code, value, unit: l.unit, drawn_on: l.drawn_on }]
  })
  const custom_allergens = cleanAllergens(f.custom_allergens)
  const custom_conditions = parseConditions(f.custom_conditions)
  return {
    ...(age === undefined ? {} : { age: Math.floor(age) }),
    shopping_for_children: f.shopping_for_children,
    allergens: f.allergens, conditions: f.conditions, dietary: f.dietary,
    ...(custom_allergens.length ? { custom_allergens } : {}),
    ...(custom_conditions.length ? { custom_conditions } : {}),
    takes_medicines: f.takes_medicines,
    labs, today,
  }
}
