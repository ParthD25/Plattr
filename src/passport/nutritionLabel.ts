// Turns a nutrition key from a passport ("saturated_fat_g") into a friendly label and unit ("Saturated fat", "g").
import { NUTRIENTS } from '../library/nutrients'

const NAMES: Record<string, string> = { kcal: 'Calories', fat_g: 'Total fat', carbs_g: 'Carbohydrates', vitamin_c_mg: 'Vitamin C', vitamin_d_mcg: 'Vitamin D' }

export function nutritionLabel(key: string): { label: string; unit: string } {
  const unit = key === 'kcal' ? 'kcal' : key.match(/_(g|mg|mcg)$/)?.[1] ?? ''
  const words = (unit && key !== 'kcal' ? key.slice(0, -unit.length - 1) : key).replace(/_/g, ' ')
  return { label: NAMES[key] ?? words.charAt(0).toUpperCase() + words.slice(1), unit }
}

// The order a US Nutrition Facts label uses; anything else on the passport follows as a vitamin / mineral row.
const MACROS = ['fat_g', 'saturated_fat_g', 'trans_fat_g', 'cholesterol_mg', 'sodium_mg', 'carbs_g', 'fiber_g', 'sugars_g', 'added_sugars_g', 'protein_g']
const INDENTED = new Set(['saturated_fat_g', 'trans_fat_g', 'fiber_g', 'sugars_g', 'added_sugars_g'])
const ENERGY = ['kcal', 'energy_kcal']

export interface LabelRow { key: string; label: string; unit: string; amount: number; pct: number | null; slug: string | null; indent: boolean; micro: boolean }

/** Passport nutrition laid out like a Nutrition Facts label. pct is null where FDA sets no Daily Value (total sugars, trans fat) - never shown as 0%. */
export function labelRows(per: Record<string, number> = {}): { kcal?: number; rows: LabelRow[] } {
  const keys = Object.keys(per).filter(k => typeof per[k] === 'number' && !ENERGY.includes(k))
  const ordered = [...MACROS.filter(k => keys.includes(k)), ...keys.filter(k => !MACROS.includes(k))]
  return {
    kcal: ENERGY.map(k => per[k]).find(v => typeof v === 'number'),
    rows: ordered.map(key => {
      const n = NUTRIENTS.find(x => x.key === key)
      const { label, unit } = nutritionLabel(key)
      return { key, label: n?.name ?? label, unit, amount: per[key], slug: n?.slug ?? null, indent: INDENTED.has(key), micro: !MACROS.includes(key),
        pct: n?.pct_dv && n.daily_value ? Math.round(per[key] / n.daily_value * 100) : null }
    }),
  }
}
