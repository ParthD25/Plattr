// Farm form helpers: the form keeps numbers and comma lists as strings while typing, and converts on save.
import type { FarmProfile } from '../../store'

const NUM_KEYS = ['lat', 'lon', 'acres', 'pasture_acres', 'coop_sqft', 'herd_size'] as const
type NumKey = (typeof NUM_KEYS)[number]
type FishKey = 'species' | 'aquaculture_system' | 'stocking_density'
export type FarmType = NonNullable<FarmProfile['farm_type']>
export type FarmDraft = Omit<FarmProfile, NumKey | FishKey | 'farm_type' | 'markets' | 'specialties'> & Record<NumKey | FishKey, string> & { farm_type: FarmType; markets: string; specialties: string }

/** What shoppers are told about the operation. Land farms need no extra label. */
export const kindLabel = (t?: FarmType) => (t === 'fish_farm' ? 'Fish farm (farm-raised)' : t === 'fishery' ? 'Wild-catch fishery' : '')

export const EMPTY_FARM: FarmProfile = {
  name: '', city: '', state: '', country: 'USA', markets: [], specialties: [], about: '',
  water_source: '', water_last_test: '', water_result: '', fertilizers: '', pesticides: '', organic: false,
  health_records: [], parasite_watch: [],
}

/** '' or junk -> undefined, so a blank box never becomes 0. */
export const num = (s: string): number | undefined => {
  const n = Number(s)
  return s.trim() !== '' && Number.isFinite(n) ? n : undefined
}

export const splitList = (s: string): string[] => s.split(',').map(x => x.trim()).filter(Boolean)

/** Space per animal (pasture acres, coop sq ft). Null unless both numbers are positive. 3 significant figures. */
export const perHead = (total?: number, head?: number): number | null =>
  total !== undefined && head !== undefined && total > 0 && head > 0 ? Number((total / head).toPrecision(3)) : null

export function toDraft(f: FarmProfile = EMPTY_FARM): FarmDraft {
  const nums = Object.fromEntries(NUM_KEYS.map(k => [k, f[k] === undefined ? '' : String(f[k])])) as Record<NumKey, string>
  return {
    ...EMPTY_FARM, ...f, ...nums, farm_type: f.farm_type ?? 'land', species: f.species ?? '', aquaculture_system: f.aquaculture_system ?? '', stocking_density: f.stocking_density ?? '',
    markets: (f.markets ?? []).join(', '), specialties: (f.specialties ?? []).join(', '),
  }
}

const filled = (row: Record<string, string>) => Object.values(row).some(v => v.trim() !== '')

export function fromDraft(d: FarmDraft): FarmProfile {
  const nums = Object.fromEntries(NUM_KEYS.map(k => [k, num(d[k])])) as Record<NumKey, number | undefined>
  // Fish fields are only stored for the kind of operation that shows them; aquaculture_system holds "fishing area and gear" for a fishery.
  const fish = (k: FishKey, shown: boolean) => (shown && d[k].trim()) || undefined
  return {
    ...d, ...nums, species: fish('species', d.farm_type !== 'land'), aquaculture_system: fish('aquaculture_system', d.farm_type !== 'land'),
    stocking_density: fish('stocking_density', d.farm_type === 'fish_farm'), name: d.name.trim(), markets: splitList(d.markets), specialties: splitList(d.specialties),
    health_records: d.health_records.filter(filled), parasite_watch: d.parasite_watch.filter(filled),
  }
}
