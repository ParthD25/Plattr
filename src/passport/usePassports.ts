// All passports the app knows: the sample set + those created in this browser's producer portal. Shared file.
import { loadSamplePassports } from '../data'
import { useData } from '../components/ui'
import { useStore } from '../store'
import type { Passport } from './types'

export function usePassports(): { passports?: Passport[]; error?: string } {
  const samples = useData(loadSamplePassports)
  const mine = useStore().passports
  return { passports: samples.data ? [...samples.data.passports, ...mine] : undefined, error: samples.error }
}

/** Resolve what was scanned or typed: a passport id, a barcode, or a full /food/{id} URL from a QR code. */
export function findPassport(passports: Passport[], scanned: string): Passport | undefined {
  const s = scanned.trim()
  const id = s.match(/\/food\/([^/?#]+)/)?.[1] ?? s
  return passports.find(p => p.id === id || p.barcode === s.replace(/\D/g, ''))
}
