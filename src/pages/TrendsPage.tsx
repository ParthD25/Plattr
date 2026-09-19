// Health trends: what the shopper logged, day by day, plus grocery-trip scores and the lab values they typed in.
// Informational only. Every sentence here is descriptive arithmetic on the user's own numbers - no labels like normal/high/low, no inference about health.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DEMO } from '../auth/demo'
import { Loading, SampleBanner } from '../components/ui'
import { Chart } from '../consumer/trends/Chart'
import { fmt, fmtDay, intakeSeries, labSeries, summary, tripScores, type IntakeKey, type Summary } from '../consumer/trends/series'
import { DAILY_REFERENCE, DISCLAIMER, type NutrientKey } from '../health/references'
import { usePassports } from '../passport/usePassports'
import { EMPTY_PROFILE, localDay, useAccount, useStore } from '../store'

const RANGES = [7, 14, 30] as const
const MAX_TRIPS = 6   // every trip point carries a text label, so keep them few enough to read at phone width

const NUTRIENTS: { key: IntakeKey; title: string; noun: string; unit: string }[] = [
  { key: 'sodium_mg', title: 'Sodium', noun: 'sodium', unit: 'mg' },
  { key: 'saturated_fat_g', title: 'Saturated fat', noun: 'saturated fat', unit: 'g' },
  { key: 'energy_kcal', title: 'Calories', noun: 'calories', unit: 'kcal' },
  { key: 'protein_g', title: 'Protein', noun: 'protein', unit: 'g' },
  { key: 'added_sugars_g', title: 'Added sugars', noun: 'added sugars', unit: 'g' },
]

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** "You logged sodium on 9 of the last 14 days; 5 of those days were above the 2,300 mg daily reference. The average on logged days was ..." */
function intakeSentence(noun: string, unit: string, days: number, s: Summary, reference?: number): string {
  if (!s.daysLogged) return `Nothing logged for ${noun} in the last ${days} days.`
  const above = reference === undefined || s.daysAbove === null ? '' : `; ${s.daysAbove} of those ${s.daysAbove === 1 ? 'days was' : 'days were'} above the ${fmt(reference)} ${unit} daily reference`
  const c = s.changeVsPreviousPeriod
  const change = c === null ? '' : c === 0 ? `, the same as the ${days} days before` : `, ${Math.abs(c)}% ${c < 0 ? 'lower' : 'higher'} than the ${days} days before`
  return `You logged ${noun} on ${s.daysLogged} of the last ${days} days${above}. The average on logged days was ${fmt(s.average! >= 100 ? Math.round(s.average!) : s.average!)} ${unit}${change}.`
}

const CSS = `
.tr-root { --tr-series: #2a78d6; --tr-slate: #4b5563; position: relative; }
.tr-root::before { content: ""; position: absolute; top: -30px; right: -90px; width: 300px; height: 230px; background: var(--blob); border-radius: 46% 54% 60% 40% / 50% 45% 55% 50%; z-index: -1; }
.tr-range { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; margin: 14px 0 0; }
.tr-range .tabs { margin: 0; } .tr-range-label { font-weight: 800; }
.tr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); gap: 16px; margin: 12px 0; }
.tr-chart { margin: 0; background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); padding: 16px 16px 12px; min-width: 0; max-width: 560px; }
.tr-chart-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 2px 10px; }
.tr-readout { margin: 0; font-size: 0.88rem; color: var(--muted); } .tr-readout strong { color: var(--ink); font-variant-numeric: tabular-nums; }
.tr-chart svg { display: block; width: 100%; height: auto; margin: 6px 0 2px; touch-action: pan-y; overflow: visible; }
.tr-chart figcaption { font-size: 0.92rem; }
.tr-chart details { margin-top: 8px; font-size: 0.9rem; } .tr-chart summary { cursor: pointer; font-weight: 800; color: var(--red); }
.tr-chart table { margin-top: 6px; } .tr-chart tbody th { font-weight: 600; }
.tr-grid-line { stroke: var(--line); stroke-width: 1; }
.tr-tick { font-size: 10.5px; fill: var(--muted); font-variant-numeric: tabular-nums; } .tr-today { font-weight: 800; fill: var(--ink); }
.tr-ref { stroke: var(--ink); stroke-opacity: 0.6; stroke-width: 1.5; stroke-dasharray: 5 4; }
.tr-ref-label { font-size: 10.5px; font-weight: 700; fill: var(--ink); paint-order: stroke; stroke: var(--card); stroke-width: 3px; }
.tr-cross { stroke: var(--muted); stroke-width: 1; }
.tr-line { fill: none; stroke: var(--tr-series); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
.tr-dot { fill: var(--tr-series); stroke: var(--card); stroke-width: 2; }
.tr-col { fill: var(--tr-series); } .tr-col.tr-hot { fill-opacity: 0.75; }
.tr-col.tr-now { stroke: var(--ink); stroke-width: 1.5; }
.tr-neutral .tr-line { stroke: var(--tr-slate); } .tr-neutral .tr-dot { fill: var(--tr-slate); }
.tr-value { font-size: 11.5px; font-weight: 800; fill: var(--ink); paint-order: stroke; stroke: var(--card); stroke-width: 3px; font-variant-numeric: tabular-nums; }
.tr-singles { list-style: none; padding: 0; margin: 12px 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: 12px; }
.tr-singles li { background: var(--card); border: 1px solid var(--line); border-radius: 18px; padding: 12px 16px; }
.tr-singles strong { display: block; font-size: 1.5rem; font-weight: 900; letter-spacing: -0.02em; }
.tr-empty { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
.tr-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.tr-how summary { cursor: pointer; font-weight: 800; } .tr-how li { margin: 6px 0; }
@media (max-width: 560px) { .tr-root::before { width: 190px; height: 150px; top: -46px; right: -80px; } }
@media (forced-colors: active) { .tr-dot, .tr-col { fill: CanvasText; } .tr-line, .tr-ref, .tr-grid-line { stroke: CanvasText; } }
`

export default function TrendsPage() {
  const account = useAccount()
  const store = useStore()
  const { passports, error } = usePassports()
  const [days, setDays] = useState<(typeof RANGES)[number]>(14)
  if (!account) return null

  const profile = store.profiles[account.email] ?? EMPTY_PROFILE
  const cart = store.carts[account.email] ?? []
  const log = profile.intake_log ?? {}
  const today = localDay()
  const isDemo = account.email === DEMO.consumer.email
  const everLogged = (key: IntakeKey) => Object.values(log).some(d => typeof d[key] === 'number')

  /** The chart for one logged quantity over the chosen range, compared with the same number of days before it. */
  const daily = (key: IntakeKey, title: string, noun: string, unit: string, kind: 'line' | 'columns' = 'line') => {
    const both = intakeSeries(log, key, days * 2, today), current = both.slice(days)
    const ref = DAILY_REFERENCE[key as NutrientKey]
    const s = summary(current, ref?.value, both.slice(0, days))
    return (
      <Chart key={key} title={title} unit={unit} kind={kind} points={current} todayIso={today}
        reference={ref && { value: ref.value, label: `${fmt(ref.value)} ${unit} daily reference` }}
        describe={intakeSentence(noun, unit, days, s, ref?.value)} />
    )
  }

  const nutrients = NUTRIENTS.filter(n => everLogged(n.key))
  const trips = tripScores(cart, passports ?? [])
  const shownTrips = trips.slice(-MAX_TRIPS)
  const labs = labSeries(profile.labs)
  const bought = cart.some(c => c.purchased_at)
  const brandNew = !Object.keys(log).length && !labs.length && !bought

  const last = trips[trips.length - 1], prev = trips[trips.length - 2]
  const diff = last && prev ? last.averageScore - prev.averageScore : 0
  const tripSentence = !last ? '' : `Your ${prev ? 'last' : 'only recorded'} trip (${fmtDay(last.date)}) averaged ${last.averageScore} (${last.grade}) across ${plural(last.items, 'item')}`
    + (!prev ? '. A second trip will start a trend.' : diff === 0 ? ', the same as the one before.' : `, ${diff > 0 ? 'up' : 'down'} ${plural(Math.abs(diff), 'point')} from the one before.`)

  return (
    <div className="tr-root">
      <style>{CSS}</style>
      <h1>Health trends</h1>
      <p className="lede">The numbers you logged, day by day, next to the public daily reference values. Arithmetic on your own entries - not medical advice.</p>
      {isDemo && <SampleBanner text="SAMPLE data - this demo account's daily logs, exercise, lab values and grocery trips are synthetic, made up for the demo. They do not describe a real person." />}

      {brandNew ? (
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>Nothing to chart yet</h2>
          <p>Trends build up one day at a time. Log what you ate today and it appears here as the first point; record a grocery trip and its Plattr score starts a second chart. Days you skip stay blank - they are never counted as zero.</p>
          <p className="tr-empty"><Link className="btn" to="/profile">Log today's numbers</Link><Link className="btn secondary" to="/shop">Start a grocery trip</Link></p>
        </div>
      ) : (
        <>
          <div className="tr-range">
            <span className="tr-range-label" id="tr-range-label">Days shown</span>
            <div className="tabs" role="group" aria-labelledby="tr-range-label">
              {RANGES.map(r => <button key={r} type="button" aria-pressed={days === r} onClick={() => setDays(r)}>{r} days</button>)}
            </div>
            <span className="caveat">Applies to daily logs and exercise. Trips and lab values show what you have entered.</span>
          </div>

          <section aria-labelledby="tr-logged">
            <h2 id="tr-logged">What you logged each day</h2>
            {nutrients.length ? (
              <>
                <p className="caveat">A dot is a day you logged. Days without a dot were not logged - they are gaps, not zeros. The dashed line is the FDA daily reference where one exists.</p>
                <div className="tr-grid">{nutrients.map(n => daily(n.key, n.title, n.noun, n.unit))}</div>
              </>
            ) : <p className="note">No daily food numbers logged yet. <Link to="/profile">Log today's numbers</Link> and they start a line here; each day you log adds a point.</p>}
          </section>

          <section aria-labelledby="tr-exercise">
            <h2 id="tr-exercise">Exercise</h2>
            {everLogged('exercise_min')
              ? <div className="tr-grid">{daily('exercise_min', 'Exercise', 'exercise', 'min', 'columns')}</div>
              : <p className="note">No exercise minutes logged yet. <Link to="/profile">Log today's numbers</Link> to add them.</p>}
          </section>

          <section aria-labelledby="tr-trips">
            <h2 id="tr-trips">Your grocery trips</h2>
            {!passports && !error ? <Loading what="your trips" />
              : !last ? <p className="note">{error ? 'The food passports could not be loaded, so trip scores cannot be shown right now. ' : 'No grocery trips recorded yet. '}<Link to="/shop">Start a grocery trip</Link> and its average Plattr score becomes the first point here.</p>
              : (
                <>
                  {prev
                    ? <div className="tr-grid"><Chart title="Average Plattr score per trip" unit="points" yMax={100} describe={tripSentence} valueHeader="Average score and grade"
                        points={shownTrips.map(t => ({ date: t.date, value: t.averageScore, label: `${t.averageScore} · ${t.grade}` }))} /></div>
                    : <p className="panel"><strong>{last.averageScore} · {last.grade}</strong> - {tripSentence}</p>}
                  <p className="caveat">
                    {trips.length > MAX_TRIPS && `Showing your last ${MAX_TRIPS} of ${trips.length} trips. `}
                    The Plattr score measures how much of a food's story is documented and backed up - it is not a measure of how healthy a food is. <Link to="/history">See every trip in My groceries</Link>.
                  </p>
                </>
              )}
          </section>

          <section aria-labelledby="tr-labs">
            <h2 id="tr-labs">Lab values you entered</h2>
            {labs.length ? (
              <>
                <p className="caveat">These are the numbers and dates you typed in, shown as entered. Plattr does not interpret them - talk to your doctor about what they mean for you.</p>
                <div className="tr-grid">
                  {labs.filter(l => l.points.length > 1).map(l => {
                    const first = l.points[0], latest = l.points[l.points.length - 1]
                    return <Chart key={l.code} neutral withYear title={`${l.label} (${l.unit})`} unit={l.unit} valueHeader={`Value (${l.unit})`}
                      points={l.points.map(p => ({ ...p, label: l.points.length <= 3 ? `${fmt(p.value)} ${l.unit}` : fmt(p.value) }))}
                      describe={`${l.points.length} values entered, drawn between ${fmtDay(first.date, true)} and ${fmtDay(latest.date, true)}. The most recent is ${fmt(latest.value)} ${l.unit}.`} />
                  })}
                </div>
                <ul className="tr-singles">
                  {labs.filter(l => l.points.length === 1).map(l => (
                    <li key={l.code}>{l.label}<strong>{fmt(l.points[0].value)} {l.unit}</strong><span className="muted">drawn {fmtDay(l.points[0].date, true)} - one value entered</span></li>
                  ))}
                </ul>
              </>
            ) : <p className="note">No lab values entered. They are optional - if you add them with their dates on your <Link to="/profile">profile</Link>, they are listed here exactly as you typed them.</p>}
          </section>
        </>
      )}

      <details className="panel tr-how" style={{ marginTop: 28 }}>
        <summary>How this is calculated</summary>
        <ul>
          <li>Each point is the day's total you saved on your profile, or added from a grocery trip. A day with nothing saved is left blank and is not part of any average.</li>
          <li>"Average on logged days" divides by the days you logged, not by the days in the range. The comparison is that average against the same number of days just before.</li>
          <li>"Above the daily reference" counts logged days whose total is greater than the reference. The references are general public values for adults, not personal targets:
            <ul>
              {Object.values(DAILY_REFERENCE).map(r => <li key={r.id}>{r.label}: {fmt(r.value)} {r.unit} a day - <a href={r.url} target="_blank" rel="noreferrer">{r.source}</a> (checked {r.checked})</li>)}
            </ul>
          </li>
          <li>Calories, protein and exercise are shown without a reference line: Plattr has no sourced one-size figure for them.</li>
          <li>Trip score is the average Plattr score of the foods bought on that trip, graded on the same A to F bands used everywhere else. It describes documentation, not nutrition.</li>
          <li>Lab values are displayed exactly as entered, with their dates. No ranges, colours or judgements are applied to them.</li>
          <li>Everything stays in this browser. You can delete your health data at any time from your <Link to="/profile">profile</Link>.</li>
        </ul>
        <p className="caveat">{DISCLAIMER}</p>
      </details>
    </div>
  )
}
