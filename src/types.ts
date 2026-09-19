// Shapes of the prepared JSON in /public/data (built by /prep). Shared file: builders import, do not edit.

export interface Plant {
  number: string            // FSIS composite grant string, e.g. "M9714+P9714"
  name: string
  dbas: string
  city: string
  state: string
  county: string
  fips: string
  lat: number | null
  lon: number | null
  activities: string        // "Meat Processing; Meat Slaughter"
  size: string              // "Very Small" | "Small" | "Large" | "N / A"
  grant_date: string
  slaughter: boolean
  rte: boolean
  raw: boolean
  slaughter_volume_category?: number   // 1-5, see PlantsFile.volume_legend
  processing_volume_category?: number
  cattle_slaughter?: string[]          // "steer" | "heifer" | "beef_cow" | "dairy_cow" | "bull_stag" | "heavy_calf" | "bob_veal"
  beef?: { ground_or_non_intact: boolean; intact: boolean }
}

export interface PlantsFile {
  source: string
  retrieved: string
  volume_legend: { slaughter: string; processing: string; source: string }
  plants: Plant[]
  tokens: Record<string, number[]>     // "M9714" -> indexes into plants[]; prefix kept (M and P are separate namespaces)
}

export interface Recall {
  number: string
  title: string
  date: string
  type: string
  risk: string
  reason: string
  url: string
  establishment_name: string
  est: { token: string; sentence: string }[]   // token may lack a prefix ("13556"); sentence is the matched text from the notice
}
export interface RecallsFile { source: string; retrieved: string; note: string; recalls: Recall[] }

export interface BeefSampling {
  source: string
  url: string
  window: [string, string]
  fsis_disclaimer: string
  scope: string
  retrieved: string
  by_establishment: Record<string, { n: number; stec_pos: number; salm_pos: number; first: string; last: string }>  // key = Plant.number
}

export interface HumaneFile {
  source: string
  url: string
  retention: string
  retrieved: string
  establishments: { est: string; tokens: string[]; name_as_posted: string; actions: { action: string; date_of_action: string; date_posted: string; pdf: string }[] }[]
}

export type ClaimLevel = 'usda_program' | 'certifier_listed' | 'document_on_file' | 'rancher_declared'

export interface ClaimDef {
  key: string
  label: string
  is_binding_law: boolean
  raising_claim?: boolean
  quote?: string
  source?: string
  url?: string
  caveat: string
  caveat_quote?: string
  caveat_source?: string
  caveat_url?: string
}
export interface LabelRule { key: string; label: string; is_binding_law: boolean; quote: string; source: string; url: string; caveat?: string }
export interface ClaimsFile { retrieved: string; levels: Record<ClaimLevel, string>; claims: ClaimDef[]; label_rules: LabelRule[]; floor: string }

export type ProcessorCheck = 'cattle_slaughter' | 'inspected_no_cattle_slaughter' | 'not_found'

export interface Rancher {
  slug: string
  status: 'sample' | 'pending' | 'published' | 'withdrawn'
  sample_banner?: string
  ranch: { name: string; county: string; state: string; url?: string; buy_url?: string }
  last_confirmed: string
  inspection_path: 'usda' | 'state' | 'custom_exempt'
  processors: { est: string; role: string; declared_at: string; check?: { result: ProcessorCheck; snapshot: string; source: string } }[]
  story?: { text: string; by: string; date: string }
  claims: { key: string; words: string; answers?: Record<string, string>; declared_at: string; level: ClaimLevel; evidence: { type: string; issuer: string; url: string; checked_on: string }[] }[]
}
export interface RanchersFile { ranchers: Rancher[] }

export interface Product {
  code: string
  product_name: string
  brands?: string
  ingredients_text?: string
  labels_tags?: string[]
  allergens_tags?: string[]   // Open Food Facts taxonomy (en:soybeans ...), NOT the FDA list; empty does not mean allergen-free
  emb_codes?: string
  serving_size?: string
  per_100g: Record<string, number>     // Open Food Facts units: grams (sodium in g), energy-kcal
  last_modified_t?: number
  retrieved_at: string
}
export interface ProductsFile { source: string; note: string; products: Product[] }
