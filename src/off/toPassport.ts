// Pure conversion: an Open Food Facts product record -> a Plattr passport. Nothing is guessed about the product itself:
// every fact is evidence 'community' (crowd-sourced, not checked by Plattr) or 'missing' with the value "Not provided".
import type { Category, Fact, FoodGroup, Passport } from '../passport/types'
import { findPlace, USA } from './places'

export interface OffProduct {
  code: string
  product_name?: string
  brands?: string | string[]
  brand_owner?: string
  categories_tags?: string[]
  ingredients_text?: string
  allergens_tags?: string[]
  labels_tags?: string[]
  origins?: string
  manufacturing_places?: string
  countries_tags?: string[]
  emb_codes?: string
  serving_size?: string
  serving_quantity?: number | string
  nutriments?: Record<string, unknown>
  last_modified_t?: number
}

const SOURCE = 'Open Food Facts contributors'
const NOT_PROVIDED = 'Not provided'

/** 'en:united-states' -> 'United States' */
const pretty = (tag: string) => tag.replace(/^[a-z]{2}:/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
const text = (v: unknown) => (Array.isArray(v) ? v.join(', ') : typeof v === 'string' ? v : '').trim()

// ponytail: Category / FoodGroup (shared passport/types.ts) have no neutral value, so a product that matches nothing is cast to 'other'
// instead of being declared grain. Every reader tolerates it (Partial lookups, includes(), `in` guards) and Explore lists it under "All"
// only. Add 'other' to both unions when types.ts is next opened, then drop the casts.
const OTHER = 'other' as Category
const NO_GROUP = 'other' as FoodGroup

// ponytail: naive keyword guess, first match wins (categories, then name). Swap for the OFF taxonomy tree if mis-sorting matters.
const KINDS: [Category, FoodGroup, string, RegExp][] = [
  ['eggs', 'protein', '🥚', /\beggs?\b/],
  ['fish', 'protein', '🐟', /\b(fish(es)?|seafoods?|salmons?|tunas?|cod|sardines?|shrimps?|prawns?|tilapia|trout|anchov\w+|mackerels?|shellfish|crustaceans?)\b/],
  ['dairy', 'dairy', '🥛', /\b(dairy|dairies|milks?|cheeses?|yogurts?|yoghurts?|ice creams?|kefir)\b/],
  ['beef', 'protein', '🥩', /\b(beef|steaks?|veal)\b/],
  ['poultry', 'protein', '🍗', /\b(poultry|poultries|chickens?|turkeys?|duck)\b/],
  ['produce', 'fruits', '🍎', /\b(fruits?|apples?|bananas?|berries|oranges?|grapes?)\b/],
  ['produce', 'vegetables', '🥬', /\b(vegetables?|salads?|tomato(es)?|carrots?|spinach|lettuces?|potato(es)?)\b/],
  ['grain', 'grains', '🍞', /\b(cereals?|breads?|pastas?|rices?|oats?|flours?|grains?|noodles?|crackers?|biscuits?|cookies?|tortillas?)\b/],
  // nuts, peanuts and pulses: USDA MyPlate counts them in the Protein Foods group; no Plattr category fits, so none is claimed
  [OTHER, 'protein', '🥜', /\b(nut butters?|peanut butters?|peanuts?|nuts?|almonds?|cashews?|walnuts?|pecans?|pistachios?|legumes?|lentils?|chickpeas?|tofu)\b/],
]
const PLANT_MILK = /plant based milk|plant milk|milk (alternative|substitute)|(almond|oat|soy|coconut|rice) milk/

function guessKind(p: OffProduct): { category: Category; food_group: FoodGroup; emoji: string } {
  for (const hay of [(p.categories_tags ?? []).map(t => pretty(t).toLowerCase()).join(' | '), (p.product_name ?? '').toLowerCase()]) {
    const hit = KINDS.find(([cat, , , re]) => re.test(hay) && !(cat === 'dairy' && PLANT_MILK.test(hay)))
    if (hit) return { category: hit[0], food_group: hit[1], emoji: hit[2] }
  }
  return { category: OTHER, food_group: NO_GROUP, emoji: '🍽️' }
}

const ALLERGENS: Record<string, string> = {
  'en:milk': 'milk', 'en:eggs': 'eggs', 'en:fish': 'fish', 'en:crustaceans': 'shellfish', 'en:nuts': 'tree nuts', 'en:peanuts': 'peanuts',
  'en:gluten': 'wheat', 'en:wheat': 'wheat', 'en:soybeans': 'soybeans', 'en:sesame-seeds': 'sesame',
}

// nutrition key -> [OFF nutriment, multiplier (OFF stores sodium and cholesterol in GRAMS), decimals]
const NUTRIENTS: [string, string, number, number][] = [
  ['kcal', 'energy-kcal', 1, 0], ['protein_g', 'proteins', 1, 1], ['fat_g', 'fat', 1, 1], ['saturated_fat_g', 'saturated-fat', 1, 1],
  ['carbs_g', 'carbohydrates', 1, 1], ['fiber_g', 'fiber', 1, 1], ['sugars_g', 'sugars', 1, 1], ['sodium_mg', 'sodium', 1000, 0], ['cholesterol_mg', 'cholesterol', 1000, 0],
]

const CERTS: [string, RegExp][] = [
  ['Organic', /\borganic\b/], ['Non-GMO', /\b(no|non) gmos?\b/], ['Fair trade', /\bfair ?trade\b/], ['Kosher', /\bkosher\b/], ['Halal', /\bhalal\b/],
]

export function toPassport(p: OffProduct, today = new Date().toISOString().slice(0, 10)): Passport {
  const url = 'https://world.openfoodfacts.org/product/' + p.code
  const date = p.last_modified_t ? new Date(p.last_modified_t * 1000).toISOString().slice(0, 10) : undefined
  const brands = text(p.brands)
  const labels = (p.labels_tags ?? []).filter(t => t.startsWith('en:'))
  const labelWords = labels.map(t => pretty(t).toLowerCase())
  const kind = guessKind(p)

  const fact = (label: string, raw: unknown): Fact => {
    const value = text(raw)
    return value ? { label, value, evidence: 'community', source: SOURCE, url, date } : { label, value: NOT_PROVIDED, evidence: 'missing' }
  }
  const countries = (p.countries_tags ?? []).map(pretty).join(', ')

  // where it was made beats where it is sold; a multi-country "sold in" list prefers the USA (Plattr's records are US ones)
  const made = findPlace(p.manufacturing_places) ?? findPlace(p.origins)
  const place = made ?? (/united states/i.test(countries) ? USA : findPlace(countries))
  const at = place ?? USA
  const est = p.emb_codes?.match(/EST\.?[\s-]*((?:[A-Z]-?)?\d+[A-Z]?)/i)?.[1]

  const serving_g = Number(p.serving_quantity) > 0 ? Number(p.serving_quantity) : 100
  const per_serving: Record<string, number> = {}
  for (const [key, off, mult, decimals] of NUTRIENTS) {
    const per100 = Number(p.nutriments?.[off + '_100g'])
    if (p.nutriments?.[off + '_100g'] != null && Number.isFinite(per100)) per_serving[key] = +(per100 * mult * serving_g / 100).toFixed(decimals)
  }

  const wildOrFarm = (labelWords.join(' ') + ' ' + (p.product_name ?? '')).toLowerCase()
  const production_method = kind.category !== 'fish' ? undefined : /\bwild\b/.test(wildOrFarm) ? 'wild_caught' as const : /\bfarm/.test(wildOrFarm) ? 'farm_raised' as const : undefined

  return {
    id: 'off-' + p.code,
    barcode: p.code,
    sample: false,
    imported_from: { source: 'Open Food Facts', url, retrieved_at: today },
    name: text(p.product_name) || 'Unnamed product',
    tagline: brands,
    ...kind,
    badges: labels.slice(0, 5).map(t => pretty(t)),
    ingredients: text(p.ingredients_text) || undefined,
    ...(est ? { est_number: est } : {}),
    ...(production_method ? { production_method } : {}),
    farm: {
      name: text(p.brand_owner) || brands || 'Producer not recorded', city: '', state: at.state, country: place ? at.country : NOT_PROVIDED,
      lat: at.lat, lon: at.lon, approximate: true,
      about: place
        ? `Location is approximate: placed at the centre of ${at.name}${made ? '' : ', where the record says it is sold'}. No farm or plant address is recorded.`
        : `Location is approximate: no place is recorded, so the pin sits at the centre of ${at.name}. No farm or plant address is recorded.`,
    },
    origin: [fact('Brand owner', p.brand_owner), fact('Manufacturing place', p.manufacturing_places), fact('Origin of ingredients', p.origins), fact('Sold in', countries)],
    soil: [], water: [], feed: [], animal_welfare: [], health_history: [],
    certifications: CERTS.flatMap(([label, re]) => {
      const found = labels.filter(t => re.test(pretty(t).toLowerCase()))
      return found.length ? [{ label, value: 'Label on the record: ' + found.map(pretty).join(', '), evidence: 'community' as const, source: SOURCE, url, date }] : []
    }),
    safety: [], hazards: [],
    nutrition: { serving: text(p.serving_size) || '100 g', serving_g, per_serving },
    allergens: [...new Set((p.allergens_tags ?? []).flatMap(t => ALLERGENS[t] ?? []))],
    gluten_free: labels.includes('en:no-gluten') || labels.includes('en:gluten-free'),
    dietary: ['vegan', 'vegetarian', 'halal', 'kosher'].filter(d => labelWords.some(l => new RegExp(`\\b${d}\\b`).test(l) && !/\b(non|not|no)\b/.test(l))),
  }
}
