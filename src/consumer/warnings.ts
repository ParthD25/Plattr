// Personal warnings for one passport + one shopper profile. Pure: same inputs, same output. Informational only - not medical advice.
import type { Passport } from '../passport/types'
import type { ConsumerProfile } from '../store'
import { ALLERGENS, ALLERGEN_SOURCE, type Allergen } from '../health/references'

export interface PersonalWarning { level: 'warn' | 'note'; title: string; text: string; source?: string; url?: string }

const DV_SOURCE = 'FDA Daily Value, 21 CFR 101.9(c)(9)'
const DV_URL = 'https://www.ecfr.gov/current/title-21/section-101.9'
const NOT_ADVICE = 'Informational only - not medical advice.'

/** FDA Daily Values for adults and children 4 and older. */
export const DAILY_VALUES = [
  { key: 'fiber_g', label: 'Fiber', unit: 'g', dv: 28 },
  { key: 'protein_g', label: 'Protein', unit: 'g', dv: 50 },
  { key: 'vitamin_c_mg', label: 'Vitamin C', unit: 'mg', dv: 90 },
  { key: 'iron_mg', label: 'Iron', unit: 'mg', dv: 18 },
  { key: 'calcium_mg', label: 'Calcium', unit: 'mg', dv: 1300 },
  { key: 'potassium_mg', label: 'Potassium', unit: 'mg', dv: 4700 },
  { key: 'sodium_mg', label: 'Sodium', unit: 'mg', dv: 2300 },
  { key: 'saturated_fat_g', label: 'Saturated fat', unit: 'g', dv: 20 },
  { key: 'cholesterol_mg', label: 'Cholesterol', unit: 'mg', dv: 300 },
] as const

const HANDLING: Partial<Record<Passport['category'], string>> = {
  beef: 'Cook ground beef to 160 F (USDA FSIS)',
  eggs: 'Cook until yolks are firm',
  fish: 'Cook to 145 F or use previously frozen fish',
  produce: 'Rinse under running water',
}

const fmt = (n: number) => (n >= 100 ? Math.round(n).toLocaleString('en-US') : String(Math.round(n * 10) / 10))
const allergenKey = (s: string) => s.toLowerCase().replace('crustacean', '').trim()   // 'Crustacean shellfish' == 'shellfish'

// ponytail: plain text match (whole word, plus simple plurals: strawberry -> strawberries). No synonyms, no translations - every warning built on it says "read the label".
const wordRe = (w: string) => {
  const e = w.trim().toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?<![a-z0-9])(?:${e}(?:e?s)?${e.endsWith('y') ? `|${e.slice(0, -1)}ies` : ''})(?![a-z0-9])`, 'i')
}

export interface IntakeRow { label: string; unit: string; dv: number; amount?: number; pct?: number; today?: number; pct_with_today?: number }

/** This serving's share of each FDA Daily Value; amount undefined = not recorded on the passport (never treated as zero). */
export function dailyIntake(passport: Passport, profile: ConsumerProfile): IntakeRow[] {
  const today: Record<string, number | undefined> = profile.today ?? {}
  return DAILY_VALUES.map(({ key, label, unit, dv }) => {
    const amount = passport.nutrition?.per_serving?.[key]
    if (typeof amount !== 'number') return { label, unit, dv }
    const logged = today[key]
    return { label, unit, dv, amount, pct: Math.round(amount / dv * 100),
      ...(typeof logged === 'number' ? { today: logged, pct_with_today: Math.round((amount + logged) / dv * 100) } : {}) }
  })
}

export function personalWarnings(passport: Passport, profile: ConsumerProfile): PersonalWarning[] {
  const out: PersonalWarning[] = []
  const has = (c: string) => profile.conditions.includes(c)
  const prefers = (d: string) => profile.dietary.includes(d)
  const n = passport.nutrition?.per_serving ?? {}
  const serving = passport.nutrition?.serving ?? 'one serving'

  // 1. allergens: the passport's own list first, then the ingredient text (imported records often have only that)
  const ingredients = passport.ingredients?.trim() ?? ''
  const custom = (profile.custom_allergens ?? []).map(w => w.trim()).filter(Boolean)
  const listed = new Map((passport.allergens ?? []).map(a => [allergenKey(a), a]))
  for (const mine of new Set(profile.allergens.map(allergenKey))) {
    const a = listed.get(mine)
    const word = a ? undefined : (ALLERGENS[(mine === 'shellfish' ? 'Crustacean shellfish' : mine) as Allergen]?.words ?? []).find(w => wordRe(w).test(ingredients))
    if (a) out.push({ level: 'warn', title: `Allergen: ${a}`, text: `This product lists ${a}, which is in your allergen list. Check the package - Plattr cannot rule out cross-contact.`, ...ALLERGEN_SOURCE })
    else if (word) out.push({ level: 'warn', title: `Allergen: ${mine}`, ...ALLERGEN_SOURCE,
      text: `The ingredient list on this record mentions "${word}", and ${mine} is in your allergen list. This is a simple text match, not a checked allergen statement - read the label on the package.` })
  }
  for (const word of custom) {
    const re = wordRe(word)
    const where = ([['the product name', passport.name], ['the tagline', passport.tagline], ['a badge', (passport.badges ?? []).join(' | ')],
      ['the ingredient list', ingredients], ['the allergen list', (passport.allergens ?? []).join(' | ')]] as const).filter(([, t]) => re.test(t ?? '')).map(([l]) => l)
    if (where.length) out.push({ level: 'warn', title: `Matches your own allergen "${word}"`,
      text: `"${word}" appears in ${where.join(', ')}. This is a simple text match on the words in this record - it can miss other names for the same food, so read the label.` })
  }
  if (passport.imported_from && !(passport.allergens ?? []).length && !ingredients && (profile.allergens.length || custom.length)) {
    out.push({ level: 'note', title: 'No allergen information is recorded', text: 'No allergen information is recorded for this product. That is not the same as allergen-free. Read the label on the package.' })
  }

  // 2. gluten
  if ((has('celiac') || prefers('gluten_free')) && passport.gluten_free === false) {
    out.push({ level: 'warn', title: 'Not recorded as gluten-free',
      text: `This product's passport does not record it as gluten-free, and your profile says ${has('celiac') ? 'celiac disease' : 'you prefer gluten-free food'}. Check the package. ${NOT_ADVICE}` })
  }

  // 3. dietary preferences
  for (const d of ['halal', 'kosher']) {
    if (prefers(d) && !passport.dietary?.includes(d)) {
      out.push({ level: 'note', title: `No ${d} certification is recorded`, text: `No ${d} certification is recorded on this passport. That is not the same as "not ${d}" - ask the producer or check the package.` })
    }
  }
  if (prefers('vegetarian') && ['beef', 'poultry', 'fish'].includes(passport.category)) {
    out.push({ level: 'note', title: 'Not vegetarian', text: `This is a ${passport.category} product, and your profile says you prefer vegetarian food.` })
  }

  if (prefers('vegan')) {
    if (['beef', 'poultry', 'eggs', 'dairy', 'fish'].includes(passport.category)) {
      out.push({ level: 'warn', title: 'This is an animal product', text: `This product is filed under ${passport.category}, and your profile says you prefer vegan food.` })
    } else if (!passport.dietary?.includes('vegan')) {
      out.push({ level: 'note', title: 'No vegan label is recorded for this product', text: 'No vegan label is recorded for this product. That is not the same as "not vegan" - check the ingredients on the package.' })
    }
  }

  // 4. people more likely to get seriously ill from foodborne hazards
  const groups = [
    has('immunocompromised') && 'people with a weakened immune system',
    has('pregnant') && 'pregnant people',
    (profile.age ?? 0) >= 65 && 'adults 65 and older',
    profile.shopping_for_children && 'young children',
  ].filter(Boolean) as string[]
  if (groups.length) {
    const handling = HANDLING[passport.category]
    for (const h of passport.hazards ?? []) {
      if (h.likelihood === 'low') continue
      out.push({ level: 'warn', title: `${h.name}: ${h.likelihood} likelihood for this sourcing region`,
        text: [`Your profile includes ${groups.join(', ')}. People in this group are more likely to get seriously ill from ${h.name}.`,
          `Why it matters here: ${h.regional_relevance}`,
          `What the farm reports doing: ${h.what_the_farm_does ?? 'nothing provided by the producer.'}`,
          handling ? `Handling: ${handling}.` : '', NOT_ADVICE].filter(Boolean).join(' '),
        source: h.source, url: h.url })
    }
  }

  // 5. nutrients at or above FDA's "high" band (20% of the Daily Value per serving)
  const FDA_HIGH = 'FDA describes 20% or more of the Daily Value per serving as high.'
  const high = (cond: string, condLabel: string, key: string, label: string, unit: string, threshold: number, dv: number, band = FDA_HIGH) => {
    const v = n[key]
    if (!has(cond) || typeof v !== 'number' || v < threshold) return
    out.push({ level: 'note', title: `${label[0].toUpperCase()}${label.slice(1)}: ${Math.round(v / dv * 100)}% of the Daily Value per serving`, source: DV_SOURCE, url: DV_URL,
      text: `One serving (${serving}) has ${fmt(v)} ${unit} of ${label}: ${fmt(v)} / ${fmt(dv)} ${unit} = ${Math.round(v / dv * 100)}% of the FDA Daily Value. ${band} Your profile lists ${condLabel}. ${NOT_ADVICE}` })
  }
  high('high_blood_pressure', 'high blood pressure', 'sodium_mg', 'sodium', 'mg', 460, 2300)
  high('high_cholesterol', 'high cholesterol', 'saturated_fat_g', 'saturated fat', 'g', 4, 20)
  // ponytail: 470 mg = 10% of the 4,700 mg DV is Plattr's own flag line, not an FDA band or a clinical limit - the text says so.
  high('kidney_disease', 'kidney disease', 'potassium_mg', 'potassium', 'mg', 470, 4700,
    'Plattr flags potassium at 470 mg (10% of the Daily Value) or more per serving; that line is a Plattr design choice, and your care team sets the amount that fits you.')

  return out
}
