// The product passport: what a shopper sees after scanning. Shared file: builders import, do not edit.

/** How much stands behind a statement. Drives both the chips and the score. */
export type Evidence = 'verified' | 'document' | 'declared' | 'community' | 'missing'
//  verified = checked against a public record or a certifier's listing · document = producer names and dates a report they hold (nothing is uploaded)
//  declared = producer's own statement · community = crowd-sourced record (Open Food Facts), not checked by Plattr
//  missing = nothing provided

export interface Fact { label: string; value: string; evidence: Evidence; source?: string; url?: string; date?: string }

export type Category = 'beef' | 'poultry' | 'eggs' | 'dairy' | 'fish' | 'produce' | 'grain'
export type FoodGroup = 'protein' | 'vegetables' | 'fruits' | 'grains' | 'dairy'

export interface Hazard {
  name: string                  // "E. coli O157:H7", "Cyclospora", "liver fluke"
  kind: 'parasite' | 'bacteria' | 'heavy_metal' | 'toxin'
  regional_relevance: string    // why it matters where this food is sourced
  likelihood: 'low' | 'moderate' | 'elevated'
  outlook: string               // what to expect in the near future (season, weather)
  what_the_farm_does?: string   // monitoring / controls the producer reports
  source: string
  url?: string
}

export interface Passport {
  id: string                    // what the QR / barcode resolves to:  /food/{id}
  barcode?: string
  sample: boolean               // true = fictional demo data; must show the SAMPLE marker
  created_by?: string           // producer account email when made in the producer portal
  name: string
  tagline: string
  emoji: string                 // product picture stand-in
  category: Category
  food_group: FoodGroup
  price_usd?: number
  badges: string[]              // "Organic", "Non-GMO", "Grass-fed" ...
  farm: { name: string; city: string; state: string; country: string; lat: number; lon: number; acres?: number; markets?: string[]; about?: string; approximate?: boolean }   // approximate = placed at a state/country centre, not a real address
  production_method?: 'wild_caught' | 'farm_raised'   // fish and shellfish: always say which
  ingredients?: string          // ingredient statement, when the record has one
  imported_from?: { source: 'Open Food Facts'; url: string; retrieved_at: string }   // real product record looked up live
  est_number?: string           // USDA establishment number on the pack (meat, poultry, egg products) -> /est/{n}

  origin: Fact[]                // farm origin, harvest / pack dates, lot
  soil: Fact[]                  // organic matter, pH, fertilizers, pesticides
  water: Fact[]                 // source, last test, result
  feed: Fact[]                  // animals only: grass-fed, grazing hours, feed source
  animal_welfare: Fact[]        // stocking density, pasture per animal, housing
  health_history: Fact[]        // vet reports, treatments, withdrawal periods
  certifications: Fact[]        // USDA Organic, Non-GMO, halal / kosher, export compliance
  safety: Fact[]                // recalls, pathogen / heavy-metal tests
  hazards: Hazard[]

  nutrition: { serving: string; serving_g: number; per_serving: Record<string, number> }   // kcal, protein_g, fat_g, saturated_fat_g, carbs_g, fiber_g, sugars_g, sodium_mg, cholesterol_mg, vitamin_c_mg, iron_mg, calcium_mg, potassium_mg
  allergens: string[]           // FDA major allergens present, lower-case; [] = none declared
  gluten_free: boolean
  dietary: string[]             // "halal", "kosher", "vegan" ...
}

export interface ScorePart { key: string; label: string; points: number; max: number; note: string }
export interface Score { total: number; grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'; word: 'Outstanding' | 'Excellent' | 'Good' | 'Fair' | 'Limited' | 'Minimal'; parts: ScorePart[] }
