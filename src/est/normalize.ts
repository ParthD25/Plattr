// USDA establishment numbers as printed on packs -> tokens in plants.json. Shared file: builders import, do not edit.
import type { Plant, PlantsFile } from '../types'

export interface ParsedEst { prefix?: string; digits: string; suffix: string }

/** "EST. 86R" | "P-13556" | "M-9714" | "est 00874" | "9714" -> parts; null when it is not an establishment number. */
export function parseEst(input: string): ParsedEst | null {
  const s = input.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^EST(ABLISHMENT)?(NO|NUMBER)?/, '')
  const m = s.match(/^([MPGVI])?0*(\d{1,5})([A-Z]{0,2})$/)
  return m ? { prefix: m[1], digits: m[2], suffix: m[3] } : null
}

// M (meat) and P (poultry) are separate namespaces: M1 is Vienna Beef, P1 is Tyson. A pack that shows a bare
// number may be either, so try both (plus G egg products, V voluntary) and let the caller show every distinct plant.
const BARE_PREFIXES = ['M', 'P', 'G', 'V']

export function candidateTokens(p: ParsedEst): string[] {
  return (p.prefix ? [p.prefix] : BARE_PREFIXES).map(pre => pre + p.digits + p.suffix)
}

export interface EstMatch { plant: Plant; token: string }

/** Every distinct plant the printed number could mean. One result = resolved; several = ask the user; none = not found. */
export function findPlants(file: PlantsFile, input: string): EstMatch[] {
  const parsed = parseEst(input)
  if (!parsed) return []
  const seen = new Set<number>()
  const out: EstMatch[] = []
  for (const token of candidateTokens(parsed)) {
    for (const i of file.tokens[token] ?? []) {
      if (!seen.has(i)) { seen.add(i); out.push({ plant: file.plants[i], token }) }
    }
  }
  return out
}

/** All tokens of a plant ("M9714+P9714" -> ["M9714", "P9714"]) - for joining recalls, humane-handling rows and rancher declarations. */
export function plantTokens(plant: Plant): string[] {
  return plant.number.split('+').map(t => t.trim().toUpperCase().replace(/^([A-Z]+)0+/, '$1'))
}

/** A recall/rancher token may lack its prefix ("13556"). True when it points at this plant. */
export function tokenMatchesPlant(token: string, plant: Plant): boolean {
  const t = token.toUpperCase()
  return plantTokens(plant).some(pt => pt === t || (/^\d/.test(t) && pt.replace(/^[A-Z]+/, '') === t))
}
