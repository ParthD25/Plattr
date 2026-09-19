// Every number the health layer uses, with where it comes from. Reviewed against the sources on `checked`.
// Rules read these; nothing is hard-coded in evaluate.ts. Informational only - not medical advice.

export type NutrientKey = 'sodium_mg' | 'saturated_fat_g' | 'added_sugars_g' | 'protein_g' | 'carbs_g' | 'energy_kcal'

export interface Reference {
  id: string
  label: string
  unit: string
  value: number
  source: string
  url: string
  checked: string
  /** A stricter figure the user may opt into. Never applied automatically from a lab value. */
  stricter?: { value: number; source: string; url: string }
}

const DV_URL = 'https://www.ecfr.gov/current/title-21/section-101.9'

export const DAILY_REFERENCE: Partial<Record<NutrientKey, Reference>> = {
  sodium_mg: {
    id: 'sodium_daily_reference', label: 'sodium', unit: 'mg', value: 2300,
    source: 'FDA Daily Value, 21 CFR 101.9(c)(9); Dietary Guidelines for Americans 2025-2030', url: DV_URL, checked: '2026-09-19',
    stricter: { value: 1500, source: 'American Heart Association ideal limit', url: 'https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/sodium/how-much-sodium-should-i-eat-per-day' },
  },
  saturated_fat_g: {
    id: 'saturated_fat_daily_reference', label: 'saturated fat', unit: 'g', value: 20,
    source: 'FDA Daily Value, 21 CFR 101.9(c)(9) (10% of a 2,000-calorie diet)', url: DV_URL, checked: '2026-09-19',
    stricter: { value: 13, source: 'American Heart Association: under 6% of calories, about 13 g at 2,000 calories', url: 'https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/fats/saturated-fats' },
  },
  added_sugars_g: {
    id: 'added_sugars_daily_reference', label: 'added sugars', unit: 'g', value: 50,
    source: 'FDA Daily Value, 21 CFR 101.9(c)(9)', url: DV_URL, checked: '2026-09-19',
  },
}

/** FDA's own reading aid for % Daily Value per serving. */
export const DV_BANDS = {
  low: 5, high: 20,
  source: 'FDA, Daily Value on the Nutrition and Supplement Facts Labels: 5% DV or less is low, 20% DV or more is high',
  url: 'https://www.fda.gov/food/nutrition-facts-label/daily-value-nutrition-and-supplement-facts-labels',
}

export const POST_EXERCISE_PROTEIN = {
  min_g: 15, max_g: 25,
  source: 'Academy of Nutrition and Dietetics, Dietitians of Canada and ACSM joint position stand, Nutrition and Athletic Performance (2016)',
  url: 'https://pubmed.ncbi.nlm.nih.gov/26891166/', checked: '2026-09-19',
}

/** Design choices, not sourced thresholds - the UI says so. */
export const LAB_STALE_AFTER_DAYS = 365
export const MAX_AMOUNT_SERVINGS = 2          // never print an amount larger than about two servings
export const MIN_PER_100G: Partial<Record<NutrientKey, number>> = { sodium_mg: 5, saturated_fat_g: 0.1 }   // below this the entry is trivial or a data error: no arithmetic

/** FDA major food allergens (FASTER Act added sesame, 2023) and how they appear in Open Food Facts tags / ingredient text. */
export const ALLERGENS = {
  milk: { tags: ['en:milk'], words: ['milk', 'whey', 'casein', 'cheese', 'butter', 'cream'] },
  eggs: { tags: ['en:eggs'], words: ['egg', 'eggs'] },
  fish: { tags: ['en:fish'], words: ['fish', 'anchovy', 'anchovies'] },
  'Crustacean shellfish': { tags: ['en:crustaceans'], words: ['shrimp', 'crab', 'lobster'] },
  'tree nuts': { tags: ['en:nuts'], words: ['almond', 'almonds', 'walnut', 'walnuts', 'pecan', 'pecans', 'cashew', 'cashews', 'hazelnut', 'hazelnuts', 'pistachio', 'pistachios'] },
  peanuts: { tags: ['en:peanuts'], words: ['peanut', 'peanuts'] },
  wheat: { tags: ['en:gluten', 'en:wheat'], words: ['wheat'] },
  soybeans: { tags: ['en:soybeans'], words: ['soy', 'soya', 'soybean', 'soybeans'] },
  sesame: { tags: ['en:sesame-seeds'], words: ['sesame', 'tahini'] },
} as const
export type Allergen = keyof typeof ALLERGENS
export const ALLERGEN_SOURCE = { source: 'FDA, Food Allergies: the nine major food allergens', url: 'https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/food-allergies' }

/** Food-pairing tips. Shown only when the user reports no medicines and no condition (default deny). Meal-level effects only. */
export const TIPS = [
  { id: 'herbs_not_salt', when: 'sodium', evidence: 'guideline advice',
    text: 'Seasoning with herbs and spices instead of salt is one way the ADA Standards of Care describe to keep sodium down.',
    source: 'American Diabetes Association, Standards of Care in Diabetes 2026, Section 5', url: 'https://diabetesjournals.org/care/issue/49/Supplement_1' },
  { id: 'vitamin_c_with_plant_iron', when: 'beef', evidence: 'strong for a single meal',
    text: 'Vitamin C foods (peppers, tomatoes, citrus) in the same meal mean your body absorbs more of the iron from the plant foods on the plate.',
    source: 'NIH Office of Dietary Supplements, Iron fact sheet', url: 'https://ods.od.nih.gov/factsheets/Iron-Consumer/' },
  { id: 'cinnamon_with_carbs', when: 'carbs', evidence: 'limited, mixed evidence',
    text: 'Cinnamon pairs well with carbohydrate-rich foods: some small trials report a smaller rise in blood sugar when cinnamon is eaten with them, though results across studies are mixed. Treat a sprinkle as a flavour choice, not a treatment.',
    source: 'NIH National Center for Complementary and Integrative Health, Cinnamon', url: 'https://www.nccih.nih.gov/health/cinnamon' },
] as const

/** Things the team asked about that the evidence does not support as a tip. Kept here so nobody re-adds them. */
export const NOT_SHOWN = [
  { claim: 'Turmeric with black pepper', reason: 'One small 1998 pharmacokinetic study; NCCIH warns about liver injury from high-bioavailability curcumin products.' },
]

export const DISCLAIMER = 'Plattr is not a medical device and does not diagnose, treat, cure, or prevent any medical condition. It does arithmetic on numbers you entered against public reference values. Check with a doctor before making medical decisions. Not for use during pregnancy, by people under 18, or to manage a medical condition.'
