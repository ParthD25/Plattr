// Pure logic behind the passport builder form: starter rows, draft -> Passport, validation. No React here so it is testable.
import type { Category, Evidence, Fact, FoodGroup, Hazard, Passport } from '../../passport/types'
import type { FarmProfile } from '../../store'

export type SectionKey = 'origin' | 'soil' | 'water' | 'feed' | 'animal_welfare' | 'health_history' | 'certifications' | 'safety'
/** Producers can only declare or attach a document. "verified" is Plattr's job; "missing" is simply no row. */
export type ProducerEvidence = Extract<Evidence, 'declared' | 'document'>
export interface FactDraft { label: string; value: string; evidence: ProducerEvidence; source: string; date: string }
export interface HazardDraft { name: string; kind: Hazard['kind']; regional_relevance: string; likelihood: Hazard['likelihood']; outlook: string; what_the_farm_does: string; source: string }
export type Method = NonNullable<Passport['production_method']>
export interface FarmDraft { name: string; city: string; state: string; country: string; lat: string; lon: string; acres: string; markets: string; about: string }

export interface Draft {
  name: string; tagline: string; emoji: string; category: Category | ''; produce_group: 'fruits' | 'vegetables' | ''
  production_method: Method | ''   // fish only, and required there
  price: string; barcode: string; badges: string; est_number: string
  farm: FarmDraft
  sections: Record<SectionKey, FactDraft[]>
  hazards: HazardDraft[]
  serving: string; serving_g: string; per_serving: Record<string, string>
  allergens: string[]; gluten_free: boolean; dietary: string[]
}

export const EVIDENCE_LABEL: Record<Evidence, string> = { verified: 'Verified record', document: 'Document on file', declared: 'Producer-declared', community: 'Community record', missing: 'Not provided' }

export const CATEGORIES: { value: Category; label: string; emoji: string }[] = [
  { value: 'beef', label: 'Beef', emoji: '🥩' }, { value: 'poultry', label: 'Poultry', emoji: '🍗' }, { value: 'eggs', label: 'Eggs', emoji: '🥚' },
  { value: 'dairy', label: 'Dairy', emoji: '🥛' }, { value: 'fish', label: 'Fish', emoji: '🐟' }, { value: 'produce', label: 'Produce', emoji: '🥬' },
  { value: 'grain', label: 'Grain', emoji: '🌾' },
]
export const EMOJI: [string, string][] = [
  ['🥩', 'Beef'], ['🍗', 'Poultry'], ['🥚', 'Eggs'], ['🥛', 'Milk'], ['🧀', 'Cheese'], ['🐟', 'Fish'], ['🦐', 'Shellfish'], ['🍓', 'Strawberry'], ['🍎', 'Apple'],
  ['🍊', 'Citrus'], ['🫐', 'Berries'], ['🥬', 'Leafy greens'], ['🥕', 'Carrot'], ['🍅', 'Tomato'], ['🥔', 'Potato'], ['🌽', 'Corn'], ['🫘', 'Beans'],
  ['🌾', 'Grain'], ['🍞', 'Bread'], ['🍚', 'Rice'], ['🍯', 'Honey'], ['🍽️', 'Other food'],
]
export const NUTRIENTS: [string, string][] = [
  ['kcal', 'Calories (kcal)'], ['protein_g', 'Protein (g)'], ['fat_g', 'Total fat (g)'], ['saturated_fat_g', 'Saturated fat (g)'], ['carbs_g', 'Carbohydrate (g)'],
  ['fiber_g', 'Fiber (g)'], ['sugars_g', 'Sugars (g)'], ['sodium_mg', 'Sodium (mg)'], ['cholesterol_mg', 'Cholesterol (mg)'], ['vitamin_c_mg', 'Vitamin C (mg)'],
  ['iron_mg', 'Iron (mg)'], ['calcium_mg', 'Calcium (mg)'], ['potassium_mg', 'Potassium (mg)'],
]
export const METHOD_LABEL: Record<Method, string> = { farm_raised: 'Farm-raised (aquaculture)', wild_caught: 'Wild-caught' }
/** The fish origin row that must always agree with the wild-caught / farm-raised choice. */
const WILD_OR_FARMED = 'Wild or farmed'
export const ALLERGENS = ['milk', 'eggs', 'fish', 'shellfish', 'tree nuts', 'peanuts', 'wheat', 'soybeans', 'sesame']
export const DIETARY = ['halal', 'kosher', 'vegetarian', 'vegan']

export const SECTION_META: Record<SectionKey, { title: string; hint: string }> = {
  origin: { title: 'Farm origin', hint: 'Where it was grown or raised, lot or batch, harvest or pack date.' },
  soil: { title: 'Soil, fertilizers and pesticides', hint: 'Organic matter, pH, what was applied and when.' },
  water: { title: 'Water quality', hint: 'Source, last test and result.' },
  feed: { title: 'Feed and grazing', hint: 'Grass-fed or not, hours on pasture, where feed comes from.' },
  animal_welfare: { title: 'Space and welfare', hint: 'Stocking density, space per animal, housing.' },
  health_history: { title: 'Animal health history', hint: 'Vet visits, treatments, antibiotics and withdrawal periods.' },
  certifications: { title: 'Certifications', hint: 'Organic, halal / kosher, export compliance, audits.' },
  safety: { title: 'Safety testing and recalls', hint: 'Pathogen and heavy-metal test results, recall history.' },
}

// Same split as src/passport/score.ts: animal products are judged on feed, welfare and health; plants on soil.
const ANIMAL: Category[] = ['beef', 'poultry', 'eggs', 'dairy', 'fish']
export const isAnimal = (c: Category | '') => ANIMAL.includes(c as Category)
/** Packs that carry a USDA establishment number. */
export const hasEstNumber = (c: Category | '') => c === 'beef' || c === 'poultry' || c === 'eggs'
export const sectionsFor = (c: Category | ''): SectionKey[] =>
  isAnimal(c) ? ['origin', 'feed', 'animal_welfare', 'health_history', 'water', 'certifications', 'safety'] : ['origin', 'soil', 'water', 'certifications', 'safety']

export const emptyFact = (label = '', value = ''): FactDraft => ({ label, value: value.trim(), evidence: 'declared', source: '', date: '' })
export const emptyHazard = (): HazardDraft => ({ name: '', kind: 'parasite', regional_relevance: '', likelihood: 'low', outlook: '', what_the_farm_does: '', source: '' })

const FEED: Partial<Record<Category, string[]>> = {
  beef: ['Grass-fed', 'Grazing time', 'Feed source'], dairy: ['Grass-fed', 'Grazing time', 'Feed source'],
  poultry: ['Feed', 'Outdoor access'], eggs: ['Feed', 'Outdoor access'],
}
const WELFARE: Partial<Record<Category, string[]>> = {
  beef: ['Stocking density', 'Pasture per animal'], dairy: ['Stocking density', 'Housing'],
  poultry: ['Space per bird', 'Housing'], eggs: ['Space per bird', 'Housing'],
}
const PACKED: Record<Category, string> = { beef: 'Processed', poultry: 'Processed', eggs: 'Laid and packed', dairy: 'Bottled or packed', fish: 'Caught or harvested', produce: 'Harvested', grain: 'Harvested' }

/** Starter rows for a category. Values are prefilled only from what the producer already put in their farm profile. */
export function starterRows(c: Category, farm: FarmDraft, profile?: FarmProfile, method: Method | '' = ''): Record<SectionKey, FactDraft[]> {
  const f = (label: string, value = '') => emptyFact(label, value)
  const lastVet = profile?.health_records?.slice().sort((a, b) => b.date.localeCompare(a.date))[0]
  const perHead = (area: number | undefined, unit: string) => (area && profile?.herd_size ? `${+(area / profile.herd_size).toFixed(2)} ${unit} each (${area} ${unit} for ${profile.herd_size} animals, from farm profile)` : '')
  const welfareValue: Record<string, string> = { 'Pasture per animal': perHead(profile?.pasture_acres, 'acres'), 'Space per bird': perHead(profile?.coop_sqft, 'sq ft') }
  const place = [farm.name, farm.city, farm.state, farm.country].filter(Boolean).join(', ')
  const vet = lastVet ? `${lastVet.date}: ${lastVet.event} (${lastVet.animal_or_lot}; vet: ${lastVet.vet})` : ''
  const base: Record<SectionKey, FactDraft[]> = {
    origin: [f('Farm', place), f('Lot or batch'), f(PACKED[c])],
    soil: [f('Organic matter'), f('pH'), f('Fertilizers', profile?.fertilizers), f('Pesticides', profile?.pesticides)],
    water: [f('Source', profile?.water_source), f('Last test', profile?.water_last_test), f('Result', profile?.water_result)],
    feed: (FEED[c] ?? []).map(l => f(l)),
    animal_welfare: (WELFARE[c] ?? []).map(l => f(l, welfareValue[l])),
    health_history: [f('Veterinary record', vet), f('Antibiotics'), f('Withdrawal periods')],
    certifications: [f('Organic', profile?.organic ? 'Farm profile says organic practices' : ''), f('Halal / kosher'), f('Export compliance')],
    safety: [f('Pathogen test'), f('Heavy-metal test'), f('Recalls')],
  }
  if (c !== 'fish') return base
  const tag = f(WILD_OR_FARMED, method ? METHOD_LABEL[method] : '')
  // Wild fish have no feed, stocking or vet history to declare: those sections start empty rather than inviting made-up rows.
  if (method === 'wild_caught') return {
    ...base, feed: [], animal_welfare: [], health_history: [],
    origin: [f('Fishery and waters', [place, profile?.farm_type === 'fishery' && profile.aquaculture_system].filter(Boolean).join(' - ')), f('Vessel and landing port'), f('Catch method'), tag, f('Lot or batch'), f('Caught')],
    safety: [f('Heavy metals'), f('Frozen for parasite control'), f('Recalls')],
  }
  const fishFarm = profile?.farm_type === 'fish_farm' ? profile : undefined
  return {
    ...base,
    origin: [f('Fish farm', place), tag, f('Species', fishFarm?.species), f('Lot or batch'), f('Harvested')],
    water: [f('Source', profile?.water_source), f('Last test (dissolved oxygen, ammonia)', [profile?.water_last_test, profile?.water_result].filter(Boolean).join(': '))],
    feed: [f('Feed'), f('Feed conversion')],
    animal_welfare: [f('Stocking density', fishFarm?.stocking_density), f('Rearing system', fishFarm?.aquaculture_system), f('Handling at harvest')],
    health_history: [f('Fish health inspection', vet), f('Antibiotics or treatments'), f('Parasite checks')],
    safety: [f('Heavy metals'), f('Pathogen test'), f('Recalls')],
  }
}

/** Switching category (or, for fish, wild-caught / farm-raised) keeps every row the producer typed and swaps the untouched starter rows for the new ones. */
export function withCategory(d: Draft, c: Category | '', profile?: FarmProfile, method: Method | '' = d.production_method): Draft {
  if (!c) return { ...d, category: c }
  const old = d.category ? starterRows(d.category, d.farm, profile, d.production_method) : undefined
  const start = starterRows(c, d.farm, profile, method)
  const sections = { ...d.sections }
  for (const k of sectionsFor(c)) {
    const untouched = (r: FactDraft) => r.evidence === 'declared' && old?.[k].some(s => s.label === r.label && s.value === r.value)
    const kept = d.sections[k].filter(r => r.value.trim() && r.label !== WILD_OR_FARMED && !untouched(r))
    sections[k] = [...kept, ...start[k].filter(s => !kept.some(r => r.label === s.label))]
  }
  return { ...d, category: c, production_method: method, sections, emoji: c === d.category ? d.emoji : CATEGORIES.find(x => x.value === c)!.emoji }
}

export function newDraft(profile?: FarmProfile): Draft {
  const s = (v?: number) => (v == null ? '' : String(v))
  return {
    name: '', tagline: '', emoji: '🍽️', category: '', produce_group: '',
    production_method: profile?.farm_type === 'fish_farm' ? 'farm_raised' : profile?.farm_type === 'fishery' ? 'wild_caught' : '', price: '', barcode: '', badges: '', est_number: '',
    farm: { name: profile?.name ?? '', city: profile?.city ?? '', state: profile?.state ?? '', country: profile?.country ?? '', lat: s(profile?.lat), lon: s(profile?.lon),
      acres: s(profile?.acres), markets: (profile?.markets ?? []).join(', '), about: profile?.about ?? '' },
    sections: { origin: [], soil: [], water: [], feed: [], animal_welfare: [], health_history: [], certifications: [], safety: [] },
    hazards: [], serving: '', serving_g: '', per_serving: {}, allergens: [], gluten_free: false, dietary: [],
  }
}

const num = (s: string) => (s.trim() === '' ? NaN : Number(s))
const list = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean)
const filled = (r: FactDraft) => r.label.trim() !== '' && r.value.trim() !== ''

const foodGroup = (d: Draft): FoodGroup =>
  d.category === 'dairy' ? 'dairy' : d.category === 'grain' ? 'grains' : d.category === 'produce' ? d.produce_group || 'vegetables' : 'protein'

const toFacts = (rows: FactDraft[]): Fact[] => rows.filter(filled).map(r => ({
  label: r.label.trim(), value: r.value.trim(), evidence: r.evidence,
  ...(r.evidence === 'document' && r.source.trim() ? { source: r.source.trim() } : {}),
  ...(r.evidence === 'document' && r.date ? { date: r.date } : {}),
}))

export function validate(d: Draft): string[] {
  const e: string[] = []
  if (!d.name.trim()) e.push('Give the product a name.')
  if (!d.category) e.push('Choose a category.')
  if (d.category === 'produce' && !d.produce_group) e.push('Say whether this produce is a fruit or a vegetable.')
  if (d.category === 'fish' && !d.production_method) e.push('Say whether this fish is wild-caught or farm-raised - US labeling rules for fish (7 CFR Part 60) require it.')
  if (!d.farm.name.trim()) e.push('Enter the farm name.')
  const lat = num(d.farm.lat), lon = num(d.farm.lon)
  if (!(lat >= -90 && lat <= 90) || !(lon >= -180 && lon <= 180)) e.push('Enter the farm latitude (-90 to 90) and longitude (-180 to 180) - shoppers see it on their food map.')
  if (!(num(d.serving_g) > 0)) e.push('Serving size in grams must be more than 0.')
  if (d.price.trim() && !(num(d.price) >= 0)) e.push('Price must be a number.')
  for (const [k, v] of Object.entries(d.per_serving)) if (v.trim() && !(num(v) >= 0)) e.push(`Nutrition: "${k}" must be a number of 0 or more.`)
  for (const k of sectionsFor(d.category)) for (const r of d.sections[k].filter(filled))
    if (r.evidence === 'document' && !r.source.trim()) e.push(`${SECTION_META[k].title}: "${r.label}" is marked Document on file - name the document in the source box.`)
  for (const h of d.hazards) if (h.name.trim() && !h.source.trim()) e.push(`Hazard "${h.name}": say where this information comes from (source).`)
  return e
}

export const slug = (name: string) => name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'food'
export const newId = (name: string) => `${slug(name)}-${crypto.randomUUID().slice(0, 6)}`

/** Draft -> Passport. Empty rows and empty numbers are dropped, never filled in. Sections that do not apply to the category stay []. */
export function buildPassport(d: Draft, email: string, id: string): Passport {
  const category = (d.category || 'produce') as Category
  const use = sectionsFor(category)
  const facts = (k: SectionKey) => (use.includes(k) ? toFacts(d.sections[k]) : [])
  const opt = (s: string) => (Number.isFinite(num(s)) ? num(s) : undefined)
  const per_serving: Record<string, number> = {}
  for (const [k] of NUTRIENTS) { const v = num(d.per_serving[k] ?? ''); if (v >= 0) per_serving[k] = v }
  return {
    id, sample: false, created_by: email, name: d.name.trim(), tagline: d.tagline.trim(), emoji: d.emoji, category, food_group: foodGroup(d),
    ...(d.barcode.trim() ? { barcode: d.barcode.replace(/\D/g, '') } : {}),
    ...(opt(d.price) != null ? { price_usd: opt(d.price) } : {}),
    badges: list(d.badges),
    farm: { name: d.farm.name.trim(), city: d.farm.city.trim(), state: d.farm.state.trim(), country: d.farm.country.trim(), lat: num(d.farm.lat), lon: num(d.farm.lon),
      ...(opt(d.farm.acres) != null ? { acres: opt(d.farm.acres) } : {}), ...(list(d.farm.markets).length ? { markets: list(d.farm.markets) } : {}), ...(d.farm.about.trim() ? { about: d.farm.about.trim() } : {}) },
    ...(category === 'fish' && d.production_method ? { production_method: d.production_method } : {}),
    ...(hasEstNumber(category) && d.est_number.trim() ? { est_number: d.est_number.trim() } : {}),
    origin: facts('origin'), soil: facts('soil'), water: facts('water'), feed: facts('feed'), animal_welfare: facts('animal_welfare'),
    health_history: facts('health_history'), certifications: facts('certifications'), safety: facts('safety'),
    hazards: d.hazards.filter(h => h.name.trim()).map(h => ({
      // Shopper page renders these two with no fallback, so blanks become the honest "Not provided" here (never invented text).
      name: h.name.trim(), kind: h.kind, regional_relevance: h.regional_relevance.trim() || 'Not provided', likelihood: h.likelihood, outlook: h.outlook.trim() || 'Not provided', source: h.source.trim(),
      ...(h.what_the_farm_does.trim() ? { what_the_farm_does: h.what_the_farm_does.trim() } : {}),
    })),
    nutrition: { serving: d.serving.trim(), serving_g: num(d.serving_g), per_serving },
    allergens: d.allergens, gluten_free: d.gluten_free, dietary: d.dietary,
  }
}
