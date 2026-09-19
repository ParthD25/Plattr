// "What's In My System" - the scan engine. A pure function: same inputs, same cards. Runs on the device; the
// health profile never needs to leave it. No verdicts, no diagnosis, no LLM: fixed sentence templates filled with
// numbers the user entered, numbers recorded for the product, and cited public reference values.
import type { Product } from '../types'
import {
  ALLERGENS, ALLERGEN_SOURCE, DAILY_REFERENCE, DV_BANDS, LAB_STALE_AFTER_DAYS, MAX_AMOUNT_SERVINGS, MIN_PER_100G,
  POST_EXERCISE_PROTEIN, TIPS, type Allergen, type NutrientKey,
} from './references'

export interface LabValue {
  code: 'hba1c' | 'fasting_glucose' | 'ldl' | 'hdl' | 'total_cholesterol' | 'triglycerides'
  value: number
  unit: '%' | 'mg/dL'
  drawn_on: string                         // yyyy-mm-dd
}
export type Watch = 'sodium' | 'saturated_fat' | 'carbohydrate' | 'post_workout_protein'

export interface HealthProfile {
  data_label: 'Sample data' | 'Entered by you'
  labs: LabValue[]
  allergies: Allergen[]
  watching: Watch[]                        // chosen by the user - never inferred from a lab value
  stricter: { sodium?: boolean; saturated_fat?: boolean }
  medicines: 'none' | 'some' | 'unanswered'
  has_condition: boolean
}

export interface TodaySnapshot {
  source: 'demo' | 'manual' | 'healthkit' | 'health_connect'
  intake: Partial<Record<NutrientKey, number>>   // a missing key means UNKNOWN, never zero
  exercise_min?: number
}

export interface ScanProduct {
  name: string
  serving_g: number | null
  per_100g: Partial<Record<NutrientKey, number>>   // sodium in mg here - the adapter converts
  allergen_tags: string[] | null                   // null = nothing recorded
  ingredients_text: string
  is_beef: boolean
  recorded: string                                 // "Open Food Facts, recorded 2026-09-19"
}

export interface Card {
  id: string
  kind: 'allergen' | 'reference' | 'protein' | 'note' | 'tip'
  title: string
  lines: string[]
  why: { rule: string; inputs: string; source: string; url?: string }
}

const LAB_LABEL: Record<LabValue['code'], string> = { hba1c: 'HbA1c', fasting_glucose: 'fasting glucose', ldl: 'LDL-C', hdl: 'HDL-C', total_cholesterol: 'total cholesterol', triglycerides: 'triglycerides' }
const WATCH_NUTRIENT: Partial<Record<Watch, { key: NutrientKey; lab?: LabValue['code'] }>> = {
  sodium: { key: 'sodium_mg' },
  saturated_fat: { key: 'saturated_fat_g', lab: 'ldl' },
}
const fmt = (n: number) => (n >= 100 ? Math.round(n).toLocaleString('en-US') : String(Math.round(n * 10) / 10))

/** Open Food Facts stores grams (sodium in g). Convert once, here, so rules never see mixed units. */
export function fromOpenFoodFacts(p: Product): ScanProduct {
  const n = p.per_100g
  const pick = (k: string, factor = 1) => (typeof n[k] === 'number' ? n[k] * factor : undefined)
  const per_100g = { sodium_mg: pick('sodium', 1000), saturated_fat_g: pick('saturated-fat'), added_sugars_g: pick('added-sugars'), protein_g: pick('proteins'), carbs_g: pick('carbohydrates'), energy_kcal: pick('energy-kcal') }
  const grams = p.serving_size?.match(/(\d+(?:\.\d+)?)\s*g\b/i)
  return {
    name: p.product_name, serving_g: grams ? Math.round(Number(grams[1])) : null,
    per_100g: Object.fromEntries(Object.entries(per_100g).filter(([, v]) => v !== undefined)) as ScanProduct['per_100g'],
    allergen_tags: p.allergens_tags ?? null, ingredients_text: p.ingredients_text ?? '',
    is_beef: /beef/i.test(`${p.product_name} ${p.ingredients_text ?? ''}`), recorded: `Open Food Facts, recorded ${p.retrieved_at}`,
  }
}

function labContext(profile: HealthProfile, code: LabValue['code'] | undefined, today: string): string | null {
  const lab = code && profile.labs.filter(l => l.code === code).sort((a, b) => b.drawn_on.localeCompare(a.drawn_on))[0]
  if (!lab) return null
  const days = (Date.parse(today) - Date.parse(lab.drawn_on)) / 86_400_000
  const stale = days > LAB_STALE_AFTER_DAYS ? ' That draw is more than 12 months old and may be out of date (the 12-month mark is Plattr\'s design choice, not a clinical rule).' : ''
  return `You entered ${LAB_LABEL[lab.code]} ${fmt(lab.value)} ${lab.unit} (blood draw ${lab.drawn_on}).${stale}`
}

function allergenCard(product: ScanProduct, profile: HealthProfile): Card | null {
  if (!profile.allergies.length) return null
  const text = product.ingredients_text.toLowerCase()
  const hits = profile.allergies.filter(a =>
    ALLERGENS[a].tags.some(t => product.allergen_tags?.includes(t)) || ALLERGENS[a].words.some(w => new RegExp(`\\b${w}\\b`).test(text)))
  const why = { rule: 'allergen_match', inputs: `your allergy list; allergen tags and ingredient text (${product.recorded})`, ...ALLERGEN_SOURCE }
  if (hits.length) {
    return { id: 'allergen', kind: 'allergen', title: `Allergen match: ${hits.join(', ')}`, why,
      lines: [`The record for this product lists ${hits.join(', ')}, which you listed as an allergy.`,
        'Plattr cannot rule out cross-contact or a changed recipe. Check the package; do not rely on this app to decide whether a food is right for you.'] }
  }
  const nothingRecorded = !product.allergen_tags?.length && !text
  return { id: 'allergen', kind: 'note', title: nothingRecorded ? 'No allergen information is recorded for this product' : 'No match in what is recorded', why,
    lines: [nothingRecorded ? 'That is not the same as allergen-free. Check the package.'
      : 'Nothing in the recorded allergen tags or ingredient text matches your list. Records can be incomplete or out of date - the package wins.'] }
}

function referenceCard(product: ScanProduct, profile: HealthProfile, today: TodaySnapshot, watch: Watch, todayIso: string): Card | null {
  const spec = WATCH_NUTRIENT[watch]
  const ref = spec && DAILY_REFERENCE[spec.key]
  if (!spec || !ref) return null
  const stricter = profile.stricter[watch as 'sodium' | 'saturated_fat'] && ref.stricter
  const target = stricter ? ref.stricter!.value : ref.value
  const targetSource = stricter ? ref.stricter!.source : ref.source
  const lines: string[] = []
  const context = labContext(profile, spec.lab, todayIso)
  lines.push(`${context ? context + ' ' : ''}You chose to watch ${ref.label}.`)

  const per100 = product.per_100g[spec.key]
  const why = { rule: ref.id, inputs: `${ref.label} recorded for the product; ${ref.label} you logged today`, source: targetSource, url: stricter ? ref.stricter!.url : ref.url }
  if (per100 === undefined) return { id: watch, kind: 'reference', title: `${ref.label}: not recorded for this product`, lines: [...lines, 'Not recorded for this product.'], why }
  if (per100 < (MIN_PER_100G[spec.key] ?? 0)) {
    return { id: watch, kind: 'reference', title: `${ref.label}: too little recorded to calculate`, why,
      lines: [...lines, `The record shows ${fmt(per100)} ${ref.unit} per 100 g, which is either negligible or a data-entry error, so no arithmetic is shown.`] }
  }

  const serving = product.serving_g
  const perServing = serving ? per100 * serving / 100 : null
  if (perServing !== null) {
    const pct = Math.round(perServing / ref.value * 100)
    const band = pct >= DV_BANDS.high ? ' FDA describes 20% or more per serving as high.' : pct <= DV_BANDS.low ? ' FDA describes 5% or less per serving as low.' : ''
    lines.push(`One serving (${serving} g) has ${fmt(perServing)} ${ref.unit} of ${ref.label}, ${pct}% of the FDA Daily Value (${fmt(ref.value)} ${ref.unit}).${band}`)
  } else {
    lines.push(`This product has ${fmt(per100)} ${ref.unit} of ${ref.label} per 100 g. No serving size is recorded.`)
  }

  const logged = today.intake[spec.key]
  if (logged === undefined) {
    lines.push(`No ${ref.label} logged today, so Plattr cannot work out a remaining amount.`)
  } else if (logged >= target) {
    lines.push(`The ${fmt(logged)} ${ref.unit} you logged today already reaches the ${fmt(target)} ${ref.unit} daily reference.`)
  } else {
    const grams = Math.round((target - logged) / (per100 / 100) / 5) * 5
    const limit = serving ? serving * MAX_AMOUNT_SERVINGS : 300
    lines.push(grams > limit
      ? `With the ${fmt(logged)} ${ref.unit} you logged today, ${serving ? 'two servings' : '300 g'} would stay below the ${fmt(target)} ${ref.unit} daily reference.`
      : `With the ${fmt(logged)} ${ref.unit} you logged today, about ${grams} g of this product${serving && grams < serving ? ' (less than one serving)' : ''} would reach the ${fmt(target)} ${ref.unit} daily reference.`)
  }
  lines.push(`Based only on what is logged today; unlogged food is not counted. Product data: ${product.recorded} - the label in your hand wins.`)
  return { id: watch, kind: 'reference', title: `${ref.label[0].toUpperCase()}${ref.label.slice(1)}`, lines, why }
}

export function evaluateScan(product: ScanProduct, profile: HealthProfile, today: TodaySnapshot, todayIso: string): Card[] {
  const cards: Card[] = []
  const allergen = allergenCard(product, profile)
  if (allergen) cards.push(allergen)
  const matched = allergen?.kind === 'allergen'          // an allergen match comes first and suppresses every positive message

  for (const watch of profile.watching) {
    const card = referenceCard(product, profile, today, watch, todayIso)
    if (card) cards.push(card)
  }

  if (profile.watching.includes('carbohydrate')) {
    const context = labContext(profile, profile.labs.some(l => l.code === 'hba1c') ? 'hba1c' : 'fasting_glucose', todayIso)
    const carbs = product.per_100g.carbs_g
    cards.push({ id: 'carbohydrate', kind: 'note', title: 'Carbohydrate',
      lines: [`${context ? context + ' ' : ''}You chose to watch carbohydrate.`,
        carbs === undefined ? 'Carbohydrate is not recorded for this product.'
          : `This product records ${fmt(product.serving_g ? carbs * product.serving_g / 100 : carbs)} g of carbohydrate per ${product.serving_g ? 'serving' : '100 g'}. Glycemic index is measured only for carbohydrate foods and is not recorded for this product.`],
      why: { rule: 'carbohydrate_note', inputs: 'carbohydrate recorded for the product', source: product.recorded } })
  }

  if (!matched && profile.watching.includes('post_workout_protein') && today.exercise_min && product.serving_g && product.per_100g.protein_g !== undefined) {
    const g = product.per_100g.protein_g * product.serving_g / 100
    const { min_g, max_g } = POST_EXERCISE_PROTEIN
    const where = g < min_g ? 'is below' : g > max_g ? 'is above' : 'is within'
    cards.push({ id: 'protein', kind: 'protein', title: 'Protein after exercise',
      lines: [`You logged ${today.exercise_min} minutes of exercise today and chose to watch post-workout protein.`,
        `One serving (${product.serving_g} g) has ${fmt(g)} g of protein, which ${where} the ${min_g}-${max_g} g that sports-nutrition position stands describe after exercise.`],
      why: { rule: 'post_exercise_protein', inputs: 'protein recorded for the product; exercise you logged', source: POST_EXERCISE_PROTEIN.source, url: POST_EXERCISE_PROTEIN.url } })
  }

  // Tips are default-deny: only for someone who answered "no medicines" and ticked no condition.
  if (!matched && profile.medicines === 'none' && !profile.has_condition) {
    for (const tip of TIPS) {
      const carbs = (product.per_100g.carbs_g ?? 0) * (product.serving_g ?? 100) / 100
      if ((tip.when === 'sodium' && profile.watching.includes('sodium')) || (tip.when === 'beef' && product.is_beef)
        || (tip.when === 'carbs' && (profile.watching.includes('carbohydrate') || carbs >= 15))) {
        cards.push({ id: tip.id, kind: 'tip', title: `Food pairing (${tip.evidence})`, lines: [tip.text], why: { rule: tip.id, inputs: 'none of your health data', source: tip.source, url: tip.url } })
      }
    }
  } else if (!matched) {
    cards.push({ id: 'tips_hidden', kind: 'note', title: 'Food-pairing tips are hidden',
      lines: ['Tips are shown only when you report no medicines and no medical condition, because food can interact with medicines. Your pharmacist or clinician is the right person to ask.'],
      why: { rule: 'tips_default_deny', inputs: 'your answers about medicines and health conditions', source: 'Plattr design rule' } })
  }
  return cards
}
