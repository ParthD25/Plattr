// Loads the prepared JSON from /public/data once and caches it. Shared file: builders import, do not edit.
import type { BeefSampling, ClaimsFile, HumaneFile, PlantsFile, ProductsFile, RanchersFile, RecallsFile } from './types'

const cache = new Map<string, Promise<unknown>>()

function load<T>(name: string): Promise<T> {
  if (!cache.has(name)) {
    cache.set(name, fetch(`/data/${name}.json`).then(r => {
      if (!r.ok) throw new Error(`Could not load ${name}.json (${r.status})`)
      return r.json()
    }))
  }
  return cache.get(name) as Promise<T>
}

export const loadPlants = () => load<PlantsFile>('plants')          // 3.4 MB - load only on pages that need it
export const loadRecalls = () => load<RecallsFile>('recalls')
export const loadSampling = () => load<BeefSampling>('beef_sampling')
export const loadHumane = () => load<HumaneFile>('humane')
export const loadClaims = () => load<ClaimsFile>('claims')
export const loadRanchers = () => load<RanchersFile>('ranchers')
export const loadProducts = () => load<ProductsFile>('products')

// Product passports: the sample set plus anything created in the producer portal (kept in the local store).
import type { Passport } from './passport/types'
export const loadSamplePassports = () => load<{ note: string; passports: Passport[] }>('passports')
