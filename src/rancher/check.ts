// The two checks Plattr runs on what a rancher types. Both are table lookups: they describe the plant record
// and the claim vocabulary - never the ranch.
import { findPlants, type EstMatch } from '../est/normalize'
import type { ClaimDef, PlantsFile, ProcessorCheck } from '../types'

/** claims.json carries form_questions; the shared ClaimDef type does not. */
export type ClaimDefQ = ClaimDef & { form_questions?: string[] }

/** The plant a rancher's number means. For beef, a bare number that is different plants under M and P means the M one. */
export function beefPlant(file: PlantsFile, est: string): EstMatch | undefined {
  const matches = findPlants(file, est)
  return matches.find(m => m.token.startsWith('M')) ?? matches[0]
}

export function checkProcessor(file: PlantsFile, est: string): ProcessorCheck {
  const plant = beefPlant(file, est)?.plant
  if (!plant) return 'not_found'
  return plant.cattle_slaughter?.length ? 'cattle_slaughter' : 'inspected_no_cattle_slaughter'
}

/** A yes to any follow-up question means the claim cannot stand under its own key: grass-fed is re-keyed as
 *  grass-finished, anything else is not listed (null). Same rule as prep/check_data.py. */
export function listedKey(def: ClaimDefQ, answers: Record<string, string>): string | null {
  if (!(def.form_questions ?? []).some(q => answers[q] === 'yes')) return def.key
  return def.key === 'grass_fed' ? 'grass_finished' : null
}
