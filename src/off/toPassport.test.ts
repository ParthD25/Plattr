import { describe, expect, it } from 'vitest'
import { toPassport, type OffProduct } from './toPassport'
import { findPlace } from './places'

// Hand-written fixture in the shape of an Open Food Facts v3 product. Fictional - not a real record, no network.
const fixture: OffProduct = {
  code: '0000000012345',
  product_name: 'Test Strawberry Spread',
  brands: 'Testbrand',
  brand_owner: 'Test Foods Co.',
  categories_tags: ['en:plant-based-foods', 'en:spreads', 'en:fruit-spreads'],
  ingredients_text: 'Strawberries, sugar, pectin',
  allergens_tags: ['en:milk', 'en:gluten', 'en:wheat', 'en:crustaceans', 'fr:inconnu'],
  labels_tags: ['en:usda-organic', 'en:organic', 'en:no-gmos', 'en:no-gluten', 'en:kosher', 'en:vegan', 'fr:ab'],
  origins: '',
  manufacturing_places: 'Orrville, Ohio',
  countries_tags: ['en:united-states'],
  emb_codes: 'USDA-EST-6024',
  serving_size: '1 Tbsp (20 g)',
  serving_quantity: '20',
  nutriments: { 'energy-kcal_100g': 250, sugars_100g: 60, sodium_100g: 0.5, cholesterol_100g: 0.01, proteins_100g: 'n/a' },
  last_modified_t: 1700000000,
}

describe('toPassport', () => {
  const p = toPassport(fixture, '2026-01-02')

  it('marks the record as a live community import, never a sample', () => {
    expect(p).toMatchObject({ id: 'off-0000000012345', barcode: '0000000012345', sample: false, tagline: 'Testbrand' })
    expect(p.imported_from).toEqual({ source: 'Open Food Facts', url: 'https://world.openfoodfacts.org/product/0000000012345', retrieved_at: '2026-01-02' })
  })

  it('converts sodium and cholesterol from grams to mg and scales to the serving', () => {
    expect(p.nutrition).toMatchObject({ serving: '1 Tbsp (20 g)', serving_g: 20 })
    expect(p.nutrition.per_serving).toEqual({ kcal: 50, sugars_g: 12, sodium_mg: 100, cholesterol_mg: 2 })   // absent / non-numeric keys are left out
  })

  it('shows empty fields as Not provided / missing, and the rest as community facts', () => {
    expect(p.origin.find(f => f.label === 'Origin of ingredients')).toEqual({ label: 'Origin of ingredients', value: 'Not provided', evidence: 'missing' })
    expect(p.origin.find(f => f.label === 'Manufacturing place')).toMatchObject({ value: 'Orrville, Ohio', evidence: 'community', source: 'Open Food Facts contributors' })
    expect(p.origin.find(f => f.label === 'Sold in')?.value).toBe('United States')
  })

  it('extracts the USDA establishment number', () => expect(p.est_number).toBe('6024'))

  it('places the pin at the state centre and says so', () => {
    expect(p.farm).toMatchObject({ name: 'Test Foods Co.', city: '', state: 'OH', country: 'USA', lat: 40.3, lon: -82.8, approximate: true })
    expect(p.farm.about).toBe('Location is approximate: placed at the centre of Ohio. No farm or plant address is recorded.')
  })

  it('maps allergens, labels and the category guess', () => {
    expect(p.allergens).toEqual(['milk', 'wheat', 'shellfish'])
    expect(p.gluten_free).toBe(true)
    expect(p.dietary).toEqual(['vegan', 'kosher'])
    expect(p.certifications.map(f => f.label)).toEqual(['Organic', 'Non-GMO', 'Kosher'])
    expect(p.certifications.every(f => f.evidence === 'community')).toBe(true)
    expect(p.badges).toHaveLength(5)
    expect(p).toMatchObject({ category: 'produce', food_group: 'fruits' })
    expect(p.soil.length + p.water.length + p.safety.length + p.hazards.length).toBe(0)
  })

  it('an almost empty record guesses nothing', () => {
    const bare = toPassport({ code: '1' })
    expect(bare.origin.every(f => f.evidence === 'missing' && f.value === 'Not provided')).toBe(true)
    expect(bare).toMatchObject({ category: 'other', food_group: 'other', emoji: '🍽️', nutrition: { serving: '100 g', serving_g: 100, per_serving: {} } })
    // a real record with no matching keyword (soda) is not declared grain either; peanut butter lands in MyPlate's protein group
    expect(toPassport({ code: '4', product_name: 'Cola', categories_tags: ['en:beverages', 'en:sodas'] }).category).toBe('other')
    expect(toPassport({ code: '0051500255162', product_name: 'Creamy Peanut Butter', categories_tags: ['en:spreads', 'en:nut-butters', 'en:legume-butters', 'en:peanut-butters', 'en:oilseed-purees', 'en:sweet-spreads'] }))
      .toMatchObject({ category: 'other', food_group: 'protein', emoji: '🥜' })
    expect(toPassport({ code: '5', product_name: 'Honey Nut O\'s', categories_tags: ['en:breakfast-cereals'] }).category).toBe('grain')
    expect(bare.farm).toMatchObject({ name: 'Producer not recorded', country: 'Not provided', lat: 39.8, lon: -98.6, approximate: true })
  })

  it('says wild or farmed for fish only when the record does', () => {
    expect(toPassport({ code: '2', product_name: 'Wild Alaskan Salmon', categories_tags: ['en:seafood'] }).production_method).toBe('wild_caught')
    expect(toPassport({ code: '3', product_name: 'Salmon fillet', categories_tags: ['en:seafood'] }).production_method).toBeUndefined()
  })
})

describe('findPlace', () => {
  it('matches full state names, codes after a comma, and countries', () => {
    expect(findPlace('Orrville, Ohio')?.state).toBe('OH')
    expect(findPlace('Austin, TX 78701')?.state).toBe('TX')
    expect(findPlace('Charleston, West Virginia')?.state).toBe('WV')
    expect(findPlace('en:france')?.country).toBe('France')
    expect(findPlace('somewhere in the mountains')).toBeNull()   // "in" is not Indiana
  })
})
