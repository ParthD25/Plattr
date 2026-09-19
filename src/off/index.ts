// Live product lookup against Open Food Facts (crowd-sourced, ODbL). Records are community data: not checked by Plattr.
import type { Passport } from '../passport/types'
import { toPassport, type OffProduct } from './toPassport'

export interface OffHit { code: string; name: string; brand: string }

const FIELDS = 'code,product_name,brands'
const PRODUCT_FIELDS = 'code,product_name,brands,brand_owner,categories_tags,ingredients_text,allergens_tags,labels_tags,origins,manufacturing_places,countries_tags,emb_codes,serving_size,serving_quantity,nutriments,last_modified_t'

/** fetch + parse, throwing on non-200 or a non-JSON body (OFF answers HTML when it is overloaded). */
async function getJson(url: string, okOnly = true): Promise<any> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (okOnly && !res.ok) throw new Error(`Open Food Facts answered ${res.status}`)
  try { return JSON.parse(await res.text()) } catch { throw new Error('Open Food Facts did not answer with JSON') }
}

const toHits = (rows: unknown): OffHit[] => (Array.isArray(rows) ? rows : [])
  .filter(r => r?.code && typeof r.product_name === 'string' && r.product_name.trim())
  .map(r => ({ code: String(r.code), name: r.product_name.trim(), brand: Array.isArray(r.brands) ? r.brands.join(', ') : String(r.brands ?? '') }))

/** Free-text product search. Uses the /api/off-search proxy (see vite.config.ts); falls back to brand search. [] on total failure. */
export async function searchProducts(query: string): Promise<OffHit[]> {
  const q = query.trim()
  if (!q) return []
  try {
    return toHits((await getJson('/api/off-search?q=' + encodeURIComponent(q) + '&page_size=12&fields=' + FIELDS)).hits)
  } catch {
    try {
      const brand = encodeURIComponent(q.toLowerCase().replace(/\s+/g, '-'))
      return toHits((await getJson(`https://world.openfoodfacts.org/api/v2/search?brands_tags=${brand}&page_size=12&fields=${FIELDS}`)).products)
    } catch { return [] }
  }
}

/** Look a barcode up live and turn the record into a passport (evidence: 'community'). Null when not found. Throws on network trouble. */
export async function importProduct(barcode: string): Promise<Passport | null> {
  const code = barcode.replace(/\D/g, '')
  if (!code) return null
  // found and not-found both answer 200 (older mirrors: 404 with the same JSON body), so branch on result.id
  const body = await getJson(`https://world.openfoodfacts.org/api/v3/product/${code}?fields=${PRODUCT_FIELDS}`, false)
  if (body?.result?.id !== 'product_found' || !body.product) return null
  return toPassport({ ...(body.product as OffProduct), code: String(body.product.code ?? code) })
}
