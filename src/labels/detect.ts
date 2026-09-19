// Which label rules and label claims does a product's Open Food Facts record trigger? Pure string matching - no judgement.
import type { ClaimDef, ClaimsFile, LabelRule, Product } from '../types'

// claims.json carries "detect" on label rules; the shared LabelRule type does not declare it.
type DetectRule = LabelRule & { detect?: string[] }

export type FiredRule = LabelRule & { matched: string[] }   // matched = the detect strings found
export type FiredClaim = ClaimDef & { matched: string }     // matched = the tag or the words as recorded

// tags are compared lower-cased to labels_tags; words are searched in product_name + ingredients_text.
// Organic is tag-only on purpose: "organic cane sugar" in an ingredient list is not a USDA Organic claim for the product.
const CLAIM_TRIGGERS: { key: string; tags?: string[]; words?: RegExp }[] = [
  { key: 'grass_fed', tags: ['en:grass-fed'], words: /grass[- ]fed/i },
  { key: 'pasture_raised', words: /pasture[- ]raised/i },
  { key: 'organic', tags: ['en:organic', 'en:usda-organic'] },
  // "natural flavoring" is an ingredient descriptor, not a Natural claim for the product, so it does not fire.
  // ponytail: only the flavor(ing) descriptor is excluded; add others (e.g. "natural casing") here when the data has them.
  { key: 'natural', words: /\bnatural\b(?!\s+flavou?r)/i },
  { key: 'breed', words: /\bangus\b/i },
]
const CLAIM_TAGS = CLAIM_TRIGGERS.flatMap(t => t.tags ?? [])

export interface Detected { labelRules: FiredRule[]; labelClaims: FiredClaim[]; otherLabels: string[]; est?: string }

export function detectLabels(product: Product, claims: ClaimsFile): Detected {
  const text = `${product.product_name} ${product.ingredients_text ?? ''}`
  const lower = text.toLowerCase()
  const tags = product.labels_tags ?? []

  const labelRules = (claims.label_rules as DetectRule[]).flatMap(rule => {
    const matched = (rule.detect ?? []).filter(d => lower.includes(d.toLowerCase()))
    return matched.length ? [{ ...rule, matched }] : []
  })

  const labelClaims = CLAIM_TRIGGERS.flatMap(t => {
    const def = claims.claims.find(c => c.key === t.key)
    const matched = tags.find(tag => t.tags?.includes(tag.toLowerCase())) ?? (t.words && text.match(t.words)?.[0])
    return def && matched ? [{ ...def, matched }] : []
  })

  return {
    labelRules,
    labelClaims,
    otherLabels: tags.filter(tag => !CLAIM_TAGS.includes(tag.toLowerCase())),
    // "USDA-EST-6024" -> "6024"; "212102031517-EST-47633" -> "47633"
    est: product.emb_codes?.match(/EST[^A-Z0-9]*(\d{1,5}[A-Z]{0,2})/i)?.[1].toUpperCase(),
  }
}
