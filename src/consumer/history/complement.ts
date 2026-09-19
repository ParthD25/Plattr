// How a basket of groceries works together: food groups covered, nutrients against FDA Daily Values, pairing notes.
// Pure functions over passports. Informational only - not medical advice.
import { DAILY_REFERENCE, TIPS } from '../../health/references'
import { scorePassport } from '../../passport/score'
import type { FoodGroup, Passport } from '../../passport/types'

export const GROUPS: FoodGroup[] = ['protein', 'vegetables', 'fruits', 'grains', 'dairy']

export function foodGroupCoverage(passports: Passport[]): Record<FoodGroup, number> {
  const counts: Record<FoodGroup, number> = { protein: 0, vegetables: 0, fruits: 0, grains: 0, dairy: 0 }
  for (const p of passports) if (p.food_group in counts) counts[p.food_group]++
  return counts
}

export function missingGroups(passports: Passport[]): FoodGroup[] {
  const c = foodGroupCoverage(passports)
  return GROUPS.filter(g => c[g] === 0)
}

/** Up to 3 highest-scoring library items for each missing group. */
export function recommend(missing: FoodGroup[], all: Passport[]): { group: FoodGroup; items: Passport[] }[] {
  return missing.map(group => ({
    group,
    items: all.filter(p => p.food_group === group).sort((a, b) => scorePassport(b).total - scorePassport(a).total).slice(0, 3),
  }))
}

const DV_SOURCE = 'FDA Daily Value, 21 CFR 101.9(c)(8)(iv) and (c)(9), adults and children 4+'
/** FDA Daily Values. Sodium and saturated fat come from the shared health references so there is one copy. */
export const DAILY_VALUES = [
  { key: 'fiber_g', label: 'Fiber', unit: 'g', dv: 28, limit: false },
  { key: 'protein_g', label: 'Protein', unit: 'g', dv: 50, limit: false },
  { key: 'vitamin_c_mg', label: 'Vitamin C', unit: 'mg', dv: 90, limit: false },
  { key: 'iron_mg', label: 'Iron', unit: 'mg', dv: 18, limit: false },
  { key: 'calcium_mg', label: 'Calcium', unit: 'mg', dv: 1300, limit: false },
  { key: 'potassium_mg', label: 'Potassium', unit: 'mg', dv: 4700, limit: false },
  { key: 'sodium_mg', label: 'Sodium', unit: 'mg', dv: DAILY_REFERENCE.sodium_mg!.value, limit: true },
  { key: 'saturated_fat_g', label: 'Saturated fat', unit: 'g', dv: DAILY_REFERENCE.saturated_fat_g!.value, limit: true },
] as const
export const DAILY_VALUES_SOURCE = { source: DV_SOURCE, url: DAILY_REFERENCE.sodium_mg!.url }

export interface NutrientTotal { key: string; label: string; unit: string; dv: number; limit: boolean; total: number; pct: number }

/** One serving of each item, summed. A nutrient a passport does not list counts as 0. */
export function nutrientTotals(passports: Passport[]): NutrientTotal[] {
  return DAILY_VALUES.map(d => {
    const total = Math.round(passports.reduce((s, p) => s + (p.nutrition.per_serving[d.key] ?? 0), 0) * 10) / 10
    return { ...d, total, pct: Math.round((total / d.dv) * 100) }
  })
}

export interface PairingNote { id: string; text: string; evidence: string; source: string; url: string }

const tip = (id: (typeof TIPS)[number]['id']) => TIPS.find(t => t.id === id)!

export function pairingNotes(passports: Passport[]): PairingNote[] {
  const n = (p: Passport, k: string) => p.nutrition.per_serving[k] ?? 0
  const notes: PairingNote[] = []
  const iron = passports.find(p => n(p, 'iron_mg') >= 2)
  const vitC = passports.find(p => n(p, 'vitamin_c_mg') >= 30 && p !== iron)
  if (iron && vitC) {
    const t = tip('vitamin_c_with_plant_iron')
    notes.push({ id: t.id, evidence: t.evidence, source: t.source, url: t.url,
      text: `${vitC.name} + ${iron.name}: Vitamin C foods help your body absorb the iron in plant foods eaten at the same meal.` })
  }
  // calcium + vitamin D: passports carry no vitamin D data, so no note.
  const carby = passports.filter(p => n(p, 'carbs_g') >= 15)
  if (carby.length) {
    const t = tip('cinnamon_with_carbs')
    notes.push({ id: t.id, evidence: t.evidence, source: t.source, url: t.url, text: `${carby.map(p => p.name).join(', ')}: ${t.text}` })
  }
  return notes
}
