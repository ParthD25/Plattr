// Series builders for the Health trends page - pure, so they can be tested without a browser.
// Descriptive arithmetic only: nothing here labels a value as good, bad, normal or abnormal. Unknown is not zero: a day with nothing logged is null.
import { averageScore, gradeFor } from '../../passport/score'
import type { Passport, Score } from '../../passport/types'
import type { CartItem, ConsumerProfile } from '../../store'

export type IntakeKey = keyof ConsumerProfile['today']
export interface Point { date: string; value: number | null }

/** yyyy-mm-dd moved by whole days (UTC arithmetic, so daylight saving cannot skip or repeat a day). */
export function shiftDay(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** The last `days` days ending on `todayIso`, oldest first. Days with nothing logged for `key` are null - gaps, not zeros. */
export function intakeSeries(intake_log: ConsumerProfile['intake_log'], key: IntakeKey, days: number, todayIso: string): Point[] {
  return Array.from({ length: days }, (_, i) => {
    const date = shiftDay(todayIso, i - days + 1)
    const v = intake_log?.[date]?.[key]
    return { date, value: typeof v === 'number' && Number.isFinite(v) ? v : null }
  })
}

export interface Summary {
  daysLogged: number
  /** Logged days strictly above the reference; null when there is no reference for this nutrient. */
  daysAbove: number | null
  /** Mean of the logged days only; null when nothing was logged. */
  average: number | null
  /** Percent change of the logged-day average against the period before (-12 = fell 12%); null when either period has no logged days. */
  changeVsPreviousPeriod: number | null
}

const logged = (s: Point[]) => s.flatMap(p => (p.value === null ? [] : [p.value]))
const mean = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null)

export function summary(series: Point[], reference?: number, previous: Point[] = []): Summary {
  const values = logged(series)
  const average = mean(values)
  const before = mean(logged(previous))
  return {
    daysLogged: values.length,
    daysAbove: reference === undefined ? null : values.filter(v => v > reference).length,
    average: average === null ? null : Math.round(average * 10) / 10,
    changeVsPreviousPeriod: average === null || !before ? null : Math.round(((average - before) / before) * 100),
  }
}

export interface TripScore { date: string; items: number; averageScore: number; grade: Score['grade'] }

/** One row per shopping trip (same trip key as My groceries), oldest first. Trips whose items no longer match a passport are left out. */
export function tripScores(cart: CartItem[], passports: Passport[]): TripScore[] {
  const byTrip = new Map<string, Passport[]>()
  for (const c of cart) {
    if (!c.purchased_at) continue
    const date = c.trip ?? c.purchased_at.slice(0, 10)
    const p = passports.find(x => x.id === c.passport_id)
    byTrip.set(date, [...(byTrip.get(date) ?? []), ...(p ? [p] : [])])
  }
  return [...byTrip].sort(([a], [b]) => a.localeCompare(b)).flatMap(([date, items]) => {
    const avg = averageScore(items)
    return avg === null ? [] : [{ date, items: items.length, averageScore: avg, grade: gradeFor(avg).grade }]
  })
}

type Lab = ConsumerProfile['labs'][number]
export const LAB_LABEL: Record<Lab['code'], string> = {
  hba1c: 'HbA1c', fasting_glucose: 'Fasting glucose', ldl: 'LDL cholesterol', hdl: 'HDL cholesterol', total_cholesterol: 'Total cholesterol', triglycerides: 'Triglycerides',
}
export interface LabSeries { code: Lab['code']; label: string; unit: Lab['unit']; points: { date: string; value: number }[] }

/** Lab values grouped by marker (fixed marker order), each sorted by the date it was drawn. Just the numbers and dates the user entered. */
export function labSeries(labs: Lab[] = []): LabSeries[] { // default: profiles saved before `labs` existed
  return (Object.keys(LAB_LABEL) as Lab['code'][]).flatMap(code => {
    const mine = labs.filter(l => l.code === code).sort((a, b) => a.drawn_on.localeCompare(b.drawn_on))
    return mine.length ? [{ code, label: LAB_LABEL[code], unit: mine[0].unit, points: mine.map(l => ({ date: l.drawn_on, value: l.value })) }] : []
  })
}

/** 1,400 / 9.5 - at most one decimal, thousands-comma'd. */
export const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 1 })
/** 'Sep 14', or 'Sep 14, 2026' when the year matters (lab dates). */
export const fmtDay = (iso: string, withYear = false) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(withYear ? { year: 'numeric' } : {}), timeZone: 'UTC' })
