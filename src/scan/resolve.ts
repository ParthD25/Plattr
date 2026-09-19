// Scanner / search-box output -> where to go. Knows the UPC-A / EAN-13 leading-zero equivalence:
// a camera may report the same printed code as 12 digits (UPC-A) or as 13 digits with a leading 0 (EAN-13).
import type { Passport } from '../passport/types'

/** The digits of a typed or scanned retail barcode (8-14 digits, spaces and dashes allowed), or '' when the text is something else. */
export const barcodeOf = (text: string) => {
  const digits = text.trim().replace(/[\s-]/g, '')
  return /^\d{8,14}$/.test(digits) ? digits : ''
}

const foodLinkId = (text: string) => text.match(/\/food\/([^/?#\s]+)/)?.[1]

/** A local passport by id, Plattr QR link (/food/{id}) or barcode. Like the shared findPassport, but never matches a passport with an empty barcode. */
export function resolveScan(passports: Passport[], scanned: string): Passport | undefined {
  const s = scanned.trim()
  if (!s) return undefined
  const id = foodLinkId(s) ?? s
  const code = barcodeOf(s)
  const codes = !code ? [] : code.length === 12 ? [code, '0' + code] : /^0\d{12}$/.test(code) ? [code, code.slice(1)] : [code]
  return passports.find(p => p.id === id || (!!p.barcode && codes.includes(p.barcode.replace(/\D/g, ''))))
}

/** Route for a scanned or typed value: a Plattr passport if we have one (or it is a Plattr QR link), else a live barcode lookup. undefined = not a product code. */
export function scanDestination(passports: Passport[], scanned: string): string | undefined {
  const hit = resolveScan(passports, scanned)
  if (hit) return `/food/${hit.id}`
  const id = foodLinkId(scanned)
  if (id) return `/food/${id}`
  const code = barcodeOf(scanned)
  return code ? `/lookup/${code.length === 12 ? '0' + code : code}` : undefined   // UPC-A -> the 13-digit form Open Food Facts files it under
}
