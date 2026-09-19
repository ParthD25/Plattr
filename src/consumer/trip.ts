// Grocery trip maths - pure, so it can be tested without a browser.
import type { Passport } from '../passport/types'
import type { ConsumerProfile } from '../store'

/** What gets added to "today so far" when a shopper logs one serving of each item as eaten. */
const LOGGED: [keyof ConsumerProfile['today'], string][] = [
  ['sodium_mg', 'sodium_mg'], ['saturated_fat_g', 'saturated_fat_g'], ['energy_kcal', 'kcal'], ['protein_g', 'protein_g'],
]

/** One serving of each item added to today's log. A nutrient no item records stays as it was (unknown is not zero). */
export function logServings(today: ConsumerProfile['today'], items: Passport[]): ConsumerProfile['today'] {
  const next = { ...today }
  for (const [todayKey, nutrient] of LOGGED) {
    const recorded = items.map(p => p.nutrition.per_serving[nutrient]).filter((n): n is number => typeof n === 'number')
    if (recorded.length) next[todayKey] = Math.round(((today[todayKey] ?? 0) + recorded.reduce((a, b) => a + b, 0)) * 10) / 10
  }
  return next
}

export const cartTotal = (items: Passport[]) => Math.round(items.reduce((s, p) => s + (p.price_usd ?? 0), 0) * 100) / 100
