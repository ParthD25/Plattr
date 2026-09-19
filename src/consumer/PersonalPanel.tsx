// Contract with the passport page. Owner: personal builder.
//   <PersonalAlerts passport={p} />  warn-level items only (allergen, gluten, animal product, elevated hazard). Always visible near the top - never inside a drop-down.
//   <PersonalPanel passport={p} />   everything else: notes, daily-value table, "What's In My System" cards, tips, disclaimer. Lives inside the health drop-down.
//   usePersonalSummary(p)            the short count for that drop-down's summary line.
import { Link } from 'react-router-dom'
import type { Passport } from '../passport/types'
import { useAccount, useStore, type ConsumerProfile } from '../store'
import { DEMO, DEMO_NOTE } from '../auth/demo'
import { evaluateScan, type HealthProfile, type ScanProduct, type TodaySnapshot, type Watch } from '../health/evaluate'
import { DISCLAIMER, type NutrientKey } from '../health/references'
import { dailyIntake, personalWarnings, type PersonalWarning } from './warnings'

const fmt = (n: number) => (n >= 100 ? Math.round(n).toLocaleString('en-US') : String(Math.round(n * 10) / 10))
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

function Source({ source, url }: { source?: string; url?: string }) {
  if (!source) return null
  return <span className="pp-source">Source: {url ? <a href={url} target="_blank" rel="noreferrer">{source}</a> : source}</span>
}

function toScanProduct(p: Passport): ScanProduct {
  const s = p.nutrition?.per_serving ?? {}
  const g = p.nutrition?.serving_g > 0 ? p.nutrition.serving_g : null
  const keys: [NutrientKey, number | undefined][] = [
    ['sodium_mg', s.sodium_mg], ['saturated_fat_g', s.saturated_fat_g], ['protein_g', s.protein_g], ['carbs_g', s.carbs_g], ['energy_kcal', s.energy_kcal ?? s.kcal],
  ]
  return {
    name: p.name, serving_g: g, allergen_tags: null, ingredients_text: '', is_beef: p.category === 'beef', recorded: 'Plattr passport',
    per_100g: g ? Object.fromEntries(keys.filter(([, v]) => typeof v === 'number').map(([k, v]) => [k, v! * 100 / g])) : {},   // no serving weight -> nothing to convert
  }
}

function toHealthProfile(c: ConsumerProfile): HealthProfile {
  const watching = [
    c.conditions.includes('high_blood_pressure') && 'sodium', c.conditions.includes('high_cholesterol') && 'saturated_fat',
    c.conditions.includes('diabetes_or_prediabetes') && 'carbohydrate', c.today?.exercise_min && 'post_workout_protein',
  ].filter(Boolean) as Watch[]
  // allergies: [] - personalWarnings already covers allergens from the passport's own list.
  return { data_label: 'Entered by you', labs: c.labs ?? [], allergies: [], watching, stricter: {}, medicines: c.takes_medicines, has_condition: c.conditions.length > 0 }
}

function toToday(c: ConsumerProfile): TodaySnapshot {
  const { exercise_min, ...rest } = c.today ?? {}
  const intake = Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v === 'number')) as TodaySnapshot['intake']
  return { source: 'manual', intake, ...(exercise_min ? { exercise_min } : {}) }
}

/** Everything personal about one passport, split by level. saved is undefined when signed out, a producer, or no profile yet. */
function usePersonal(passport: Passport) {
  const account = useAccount()
  const profiles = useStore().profiles
  const saved = account?.role === 'consumer' ? profiles[account.email] : undefined
  const warnings = saved ? personalWarnings(passport, saved) : []
  const alerts = warnings.filter(w => w.level === 'warn')
  // A warning above suppresses the upbeat food-pairing tips, the same way an allergen match does inside evaluateScan.
  const cards = saved ? evaluateScan(toScanProduct(passport), toHealthProfile(saved), toToday(saved), new Date().toISOString().slice(0, 10)).filter(c => !(alerts.length && c.kind === 'tip')) : []
  return { account, saved, alerts, notes: warnings.filter(w => w.level === 'note'), cards, isDemo: account?.email === DEMO.consumer.email }
}

const STYLE = `
  .pp h3 { margin: 22px 0 6px; } .pp > :first-child { margin-top: 0; }
  .pp-item strong { display: block; margin-bottom: 4px; } .pp-item p { margin: 0; font-weight: 400; }
  .pp-source { display: block; margin-top: 6px; font-size: 0.8rem; font-weight: 400; }
  .pp-tablewrap { overflow-x: auto; } .pp td.num, .pp th.num { text-align: right; white-space: nowrap; }
  .pp .card h4 { margin: 0 0 6px; } .pp .card p { margin: 6px 0; } .pp .card-tip { border-left-color: var(--green); border-left-style: dashed; }
  .pp details { margin-top: 8px; font-size: 0.86rem; color: var(--muted); } .pp details summary { cursor: pointer; font-weight: 700; }
  .pp dl { display: grid; grid-template-columns: auto 1fr; gap: 2px 10px; margin: 6px 0 0; } .pp dt { font-weight: 700; } .pp dd { margin: 0; overflow-wrap: anywhere; }
  .pp-alerts { margin: 18px 0 0; } .pp-alerts h2 { margin: 0 0 4px; font-size: 1.15rem; } .pp-alerts .warn { margin: 10px 0 0; }
  .pp-alerts .pp-foot { margin: 8px 0 0; font-size: 0.85rem; }
`

function Item({ w }: { w: PersonalWarning }) {
  return (
    <div className={`${w.level} pp-item`}>
      <strong>{w.level === 'warn' ? 'Warning: ' : 'Note: '}{w.title}</strong>
      <p>{w.text}</p>
      <Source source={w.source} url={w.url} />
    </div>
  )
}

/** Warn-level items only. Renders nothing when signed out, when there is no profile, or when nothing matches. */
export function PersonalAlerts({ passport }: { passport: Passport }) {
  const { alerts, isDemo } = usePersonal(passport)
  if (!alerts.length) return null
  return (
    <section className="pp-alerts" id="your-warnings" aria-labelledby="pp-alerts-title">
      <style>{STYLE}</style>
      <h2 id="pp-alerts-title"><span aria-hidden="true">⚠️ </span>{plural(alerts.length, 'warning')} for you on this product</h2>
      {alerts.map((w, i) => <Item key={i} w={w} />)}
      <p className="muted pp-foot">
        {isDemo && <><span className="chip ev-missing">Sample</span> {DEMO_NOTE} </>}
        Matched against the profile you entered. Informational only - not medical advice; the package in your hand wins. <Link to="/profile">Edit profile</Link> · <a href="#your-health">More for you below</a>
      </p>
    </section>
  )
}

/** Short count for the health drop-down's summary line. */
export function usePersonalSummary(passport: Passport): string {
  const { account, saved, alerts, notes, cards } = usePersonal(passport)
  if (!account) return 'try the demo shopper to see yours'
  if (account.role !== 'consumer') return 'for shopper accounts'
  if (!saved) return 'add your profile to see yours'
  return `${alerts.length ? `${plural(alerts.length, 'warning')} shown at the top · ` : ''}${plural(notes.length + cards.length, 'note')} - based on your profile`
}

export default function PersonalPanel({ passport }: { passport: Passport }) {
  const { account, saved, alerts, notes, cards, isDemo } = usePersonal(passport)
  const next = encodeURIComponent(`/food/${passport.id}`)

  if (!account) {
    return (
      <p className="note" style={{ marginBottom: 0 }}>
        <strong>Shopping with allergies or a health condition?</strong>{' '}
        <Link to={`/demo-account?next=${next}`}>Try the demo shopper</Link> or <Link to={`/login?next=${next}`}>sign in</Link> to see allergen and condition notes on every passport. Informational only - not medical advice.
      </p>
    )
  }
  if (account.role !== 'consumer') {
    return <p className="note" style={{ marginBottom: 0 }}>Allergen and condition notes are for shopper accounts - you are signed in as a producer. <Link to="/demo-account">Switch account</Link></p>
  }
  if (!saved) {
    return (
      <>
        <p className="note">
          <strong>No health profile yet.</strong> <Link to="/profile">Add your allergens and conditions</Link> to get warnings and notes for this product. It stays in this browser. Informational only - not medical advice.
        </p>
        <p style={{ marginBottom: 0 }}><Link className="link-arrow" to="/trends">See your trends</Link></p>
      </>
    )
  }

  const customConditions = (saved.custom_conditions ?? []).map(c => c.trim()).filter(Boolean)
  const intake = dailyIntake(passport, saved)
  const hasToday = intake.some(r => r.today !== undefined)

  return (
    <div className="pp">
      <style>{STYLE}</style>
      <p className="muted">
        For {account.name}: based on the profile you entered and what this passport records. Informational only - not medical advice. <Link to="/profile">Edit profile</Link>
      </p>
      {(isDemo || passport.sample) && (
        <p>
          {isDemo && <><span className="chip ev-missing">Sample profile</span> {DEMO_NOTE} </>}
          {passport.sample && <span className="chip ev-missing">Sample passport - fictional demo data</span>}
        </p>
      )}
      {alerts.length > 0 && <p className="warn"><a href="#your-warnings">{plural(alerts.length, 'warning')} for this product {alerts.length === 1 ? 'is' : 'are'} shown at the top of the page.</a></p>}

      {notes.length === 0 && alerts.length === 0 && <p className="note">Nothing on this passport matches the allergens, conditions or preferences in your profile. Passports can be incomplete - the package in your hand wins.</p>}
      {notes.map((w, i) => <Item key={i} w={w} />)}
      {customConditions.length > 0 && <p className="note">You told us about: {customConditions.join(', ')}. Plattr has no rules for these - check this product with your clinician or dietitian.</p>}

      <h3>This serving and your day</h3>
      <p className="muted">One serving ({passport.nutrition?.serving || 'size not provided'}) as a share of the FDA Daily Values. Nutrition figures are as entered on the passport.</p>
      <div className="pp-tablewrap">
        <table>
          <thead>
            <tr><th scope="col">Nutrient</th><th scope="col" className="num">This serving</th><th scope="col" className="num">% Daily Value</th>{hasToday && <th scope="col" className="num">With what you logged today</th>}</tr>
          </thead>
          <tbody>
            {intake.map(r => (
              <tr key={r.label}>
                <th scope="row">{r.label} <span className="muted">(DV {fmt(r.dv)} {r.unit})</span></th>
                {r.amount === undefined
                  ? <td colSpan={hasToday ? 3 : 2}><span className="chip ev-missing">Not provided</span></td>
                  : <>
                    <td className="num">{fmt(r.amount)} {r.unit}</td>
                    <td className="num">{r.pct}%</td>
                    {hasToday && <td className="num">{r.today === undefined ? <span className="muted">nothing logged</span> : `${fmt(r.today)} + ${fmt(r.amount)} ${r.unit} = ${r.pct_with_today}%`}</td>}
                  </>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted"><small>Daily Values are FDA reference amounts for adults and children 4 and older (<a href="https://www.ecfr.gov/current/title-21/section-101.9" target="_blank" rel="noreferrer">21 CFR 101.9</a>). Values for children under 4 and during pregnancy differ. Only food you logged today is counted; a nutrient with nothing logged is a gap, not a zero.</small></p>
      <p><Link className="link-arrow" to="/trends">See your trends</Link></p>

      <h3>What's In My System</h3>
      <p className="muted">Arithmetic on numbers you entered against public reference values. No verdicts, no diagnosis.</p>
      {cards.length === 0 && <p className="note">Nothing to show yet. Tick a condition, answer the medicines question or log today's intake in <Link to="/profile">your profile</Link> to see cards here.</p>}
      {cards.map(c => (
        <section key={c.id} className={`card${c.kind === 'tip' ? ' card-tip' : ''}`}>
          <h4>{c.kind === 'tip' ? 'Tip: ' : ''}{c.title}</h4>
          {c.lines.map((l, i) => <p key={i}>{l}</p>)}
          <details>
            <summary>Why am I seeing this?</summary>
            <dl>
              <dt>Rule</dt><dd><code>{c.why.rule}</code></dd>
              <dt>Uses</dt><dd>{c.why.inputs}</dd>
              <dt>Source</dt><dd>{c.why.url ? <a href={c.why.url} target="_blank" rel="noreferrer">{c.why.source}</a> : c.why.source}</dd>
            </dl>
          </details>
        </section>
      ))}

      <p className="muted" style={{ marginBottom: 0 }}><small>{DISCLAIMER}</small></p>
    </div>
  )
}
