// Library: nutrients and the five MyPlate food groups. One component serves the index, /:slug nutrient pages and /group-<name> pages.
import { Link, useParams } from 'react-router-dom'
import { Loading, SourceLine } from '../../components/ui'
import { DV_BANDS, TIPS } from '../../health/references'
import { FOOD_GROUPS, NUTRIENTS, type FoodGroupEntry, type Nutrient } from '../../library/nutrients'
import type { Passport } from '../../passport/types'
import { usePassports } from '../../passport/usePassports'
import { useAccount, useStore } from '../../store'

const BASE = '/library/nutrients'
const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 1 })
const dvText = (n: Nutrient) => n.dv_label ?? (n.daily_value == null ? 'No Daily Value' : `${fmt(n.daily_value)} ${n.unit} a day`)
const goalClass = { 'Get enough': 'ev-verified', 'Stay under': 'ev-document', 'Reference amount': 'ev-missing' } as const
const groupOf = (g: string) => FOOD_GROUPS.find(x => x.group === g)!

const CSS = `
.nl-groups { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); gap: 18px; padding: 0; margin: 16px 0; list-style: none; }
.nl-group { position: relative; overflow: hidden; display: flex; flex-direction: column; gap: 8px; height: 100%; padding: 22px; border-radius: 28px; background: var(--card); border: 1px solid var(--line); box-shadow: var(--shadow); text-decoration: none; color: inherit; }
.nl-group::before { content: ""; position: absolute; top: -50px; right: -60px; width: 190px; height: 170px; background: var(--blob); border-radius: 46% 54% 60% 40% / 50% 45% 55% 50%; }
.nl-group::after { content: "🌿"; position: absolute; right: 14px; bottom: 10px; font-size: 1.5rem; opacity: 0.55; transform: rotate(-20deg); }
.nl-group > * { position: relative; }
.nl-group:hover, .nl-nutrient:hover { border-color: var(--red); }
.nl-emoji { width: 84px; height: 84px; border-radius: 50%; display: grid; place-items: center; font-size: 2.6rem; background: #fff; border: 1px solid var(--line); }
.nl-group h3 { font-size: 1.35rem; } .nl-group p { margin: 0; color: var(--muted); font-size: 0.95rem; }
.nl-group .link-arrow { color: var(--red); margin-top: auto; padding-right: 34px; }
.nl-nutrients { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 14px; padding: 0; margin: 16px 0; list-style: none; }
.nl-nutrient { display: flex; flex-direction: column; gap: 6px; height: 100%; padding: 16px 18px; border-radius: 20px; background: var(--card); border: 1px solid var(--line); box-shadow: 0 4px 14px rgba(120, 72, 40, 0.05); text-decoration: none; color: inherit; }
.nl-nutrient p { margin: 0; color: var(--muted); font-size: 0.9rem; }
.nl-dv { font-size: 1.35rem; font-weight: 900; letter-spacing: -0.02em; }
.nl-hero { position: relative; display: grid; grid-template-columns: 96px 1fr; gap: 18px; align-items: center; margin: 8px 0 4px; }
.nl-hero h1 { margin: 0 0 6px; } .nl-hero .nl-emoji { width: 96px; height: 96px; font-size: 3rem; background: var(--blob); border: 0; border-radius: 46% 54% 60% 40% / 50% 45% 55% 50%; }
@media (max-width: 480px) { .nl-hero { grid-template-columns: 1fr; } }
.nl-links { display: flex; flex-wrap: wrap; gap: 8px; padding: 0; margin: 10px 0; list-style: none; }
.nl-links a { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 999px; background: #fff; border: 1.5px solid var(--line); text-decoration: none; color: var(--ink); font-weight: 700; font-size: 0.92rem; }
.nl-links a:hover { border-color: var(--red); }
.nl-sample { font-size: 0.68rem; font-weight: 800; letter-spacing: 0.06em; padding: 1px 7px; border-radius: 6px; border: 1.5px solid #b38f00; background: #fff3c4; color: #3d3000; margin-left: 6px; vertical-align: middle; }
.nl-amount { text-align: right; font-weight: 800; white-space: nowrap; } .nl-amount small { display: block; font-weight: 600; color: var(--muted); }
`

/** Top sample foods for a nutrition key, highest amount per serving first. */
function topFoods(samples: Passport[], key: string, n = 3): Passport[] {
  return samples.filter(p => (p.nutrition.per_serving[key] ?? 0) > 0)
    .sort((a, b) => b.nutrition.per_serving[key] - a.nutrition.per_serving[key]).slice(0, n)
}

function FoodRows({ foods, amount }: { foods: Passport[]; amount?: (p: Passport) => React.ReactNode }) {
  return (
    <ul className="rows">
      {foods.map(p => (
        <li key={p.id}>
          <Link className="row" to={`/food/${p.id}`}>
            <span className="ico" aria-hidden="true">{p.emoji}</span>
            <span><strong>{p.name}<span className="nl-sample">SAMPLE</span></strong><span className="sub">{p.nutrition.serving} · {groupOf(p.food_group).name}</span></span>
            <span className="nl-amount">{amount?.(p)}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

const SampleNote = () => <p className="caveat">Foods marked SAMPLE are fictional demo passports, so these figures illustrate the idea rather than describe real products. For a real food, the label in your hand wins.</p>
const Disclaimer = () => <p className="muted">General information from public health agencies, not medical advice. Daily Values are FDA label reference amounts for adults and children 4 and older; your own needs may differ - ask a doctor or registered dietitian about your situation.</p>

function Index({ samples }: { samples?: Passport[] }) {
  return (
    <>
      <h1>Nutrients and food groups</h1>
      <p className="lede">What each nutrient on a Plattr passport does, how much a day the label is measured against, and how each food group serves you.</p>

      <h2 id="groups">Food groups</h2>
      <p className="muted">The five MyPlate groups Plattr sorts foods into.</p>
      <ul className="nl-groups">
        {FOOD_GROUPS.map(g => {
          const examples = samples?.filter(p => p.food_group === g.group).map(p => p.name) ?? []
          return (
            <li key={g.slug}>
              <Link className="nl-group" to={`${BASE}/${g.slug}`}>
                <span className="nl-emoji" aria-hidden="true">{g.emoji}</span>
                <h3>{g.name}</h3>
                <p>{g.what_it_is}</p>
                {examples.length > 0 && <p><strong>Sample foods:</strong> {examples.join(', ')}</p>}
                <span className="link-arrow">How this group serves you</span>
              </Link>
            </li>
          )
        })}
      </ul>

      <h2 id="nutrients">Nutrients</h2>
      <p className="muted">Each card says whether the Daily Value is an amount to <strong>get enough</strong> of, an amount to <strong>stay under</strong>, or simply a reference amount.</p>
      <ul className="nl-nutrients">
        {NUTRIENTS.map(n => (
          <li key={n.slug}>
            <Link className="nl-nutrient" to={`${BASE}/${n.slug}`}>
              <span><span className={`chip ${goalClass[n.goal]}`}>{n.goal}</span></span>
              <h3>{n.name}</h3>
              <span className="nl-dv">{dvText(n)}</span>
              <p>{n.what_it_does.split('. ')[0].replace(/\.$/, '')}.</p>
            </Link>
          </li>
        ))}
      </ul>
      <p className="muted">Daily Values: <a href={NUTRIENTS[1].url} target="_blank" rel="noreferrer">FDA, 21 CFR 101.9</a>. Food groups: <a href={FOOD_GROUPS[0].url} target="_blank" rel="noreferrer">USDA MyPlate</a>.</p>
    </>
  )
}

function CinnamonTip() {
  const tip = TIPS.find(t => t.id === 'cinnamon_with_carbs')
  // Same default-deny idea as the health layer: no pairing tips for someone who reported medicines or a condition.
  const account = useAccount()
  const profile = useStore().profiles[account?.email ?? '']
  const hidden = !!profile && (profile.takes_medicines === 'some' || profile.conditions.length > 0 || (profile.custom_conditions?.length ?? 0) > 0)
  if (!tip) return null
  if (hidden) return <p className="note">A food-pairing tip is hidden here because your profile lists medicines or a health condition, and food can interact with medicines. Your pharmacist or clinician is the right person to ask.</p>
  return (
    <aside className="note" aria-labelledby="nl-tip">
      <h2 id="nl-tip" style={{ margin: '0 0 6px', fontSize: '1.05rem' }}>Food pairing <span className="chip ev-missing">Evidence: {tip.evidence}</span></h2>
      <p style={{ margin: '0 0 6px' }}>{tip.text}</p>
      <small className="muted"><SourceLine source={tip.source} url={tip.url} /></small>
    </aside>
  )
}

function NutrientDetail({ n, samples }: { n: Nutrient; samples?: Passport[] }) {
  const foods = samples && topFoods(samples, n.key)
  return (
    <div className="narrow">
      <h1>{n.name}</h1>
      <span className={`chip ${goalClass[n.goal]}`}>{n.goal}</span>

      <h2>What it does</h2>
      <p>{n.what_it_does}</p>

      <h2>Daily Value</h2>
      <div className="panel">
        <p className="stat" style={{ margin: 0 }}>{dvText(n)}</p>
        <p style={{ margin: '6px 0 0' }}>
          {n.dv_note ?? (n.limit
            ? `This is an amount to stay under: the label's % Daily Value shows how much of the daily limit one serving uses.`
            : n.goal === 'Get enough'
              ? `This is an amount to aim for: the label's % Daily Value shows how much of the day's target one serving supplies.`
              : `This is a reference amount based on a 2,000-calorie diet - not a target to hit or a limit to stay under.`)}
        </p>
        {n.pct_dv && <p className="caveat">Reading aid from the FDA: {DV_BANDS.low}% DV or less per serving is low, {DV_BANDS.high}% DV or more is high.</p>}
      </div>

      <h2>Food groups that mainly supply it</h2>
      <ul className="nl-links">
        {n.food_groups.map(g => { const e = groupOf(g); return <li key={g}><Link to={`${BASE}/${e.slug}`}><span aria-hidden="true">{e.emoji}</span>{e.name}</Link></li> })}
      </ul>

      <h2>Sample foods highest in this per serving</h2>
      {!foods ? <Loading what="sample foods" /> : foods.length === 0 ? <p className="muted">None of the sample passports record {n.name.toLowerCase()}.</p> : (
        <>
          <FoodRows foods={foods} amount={p => {
            const v = p.nutrition.per_serving[n.key]
            return <>{fmt(v)} {n.unit}{n.pct_dv && n.daily_value != null && <small>{Math.round(v / n.daily_value * 100)}% DV</small>}</>
          }} />
          <SampleNote />
        </>
      )}

      <h2>Good to know</h2>
      <p>{n.good_to_know}</p>
      {n.slug === 'carbohydrate' && <CinnamonTip />}

      <p className="card-source"><SourceLine source={n.source} url={n.url} /></p>
      <Disclaimer />
      <p><Link className="link-arrow" to={BASE}>All nutrients and food groups</Link></p>
    </div>
  )
}

function GroupDetail({ g, samples }: { g: FoodGroupEntry; samples?: Passport[] }) {
  const foods = samples?.filter(p => p.food_group === g.group)
  return (
    <div className="narrow">
      <div className="nl-hero">
        <span className="nl-emoji" aria-hidden="true">{g.emoji}</span>
        <div><h1>{g.name}</h1><span className="chip ev-verified">MyPlate food group</span></div>
      </div>

      <h2>What it is</h2>
      <p>{g.what_it_is}</p>

      <h2>How it serves you</h2>
      <p>{g.how_it_serves_you}</p>

      <h2>Nutrients it mainly contributes</h2>
      <ul className="nl-links">
        {g.nutrients.map(s => { const n = NUTRIENTS.find(x => x.slug === s)!; return <li key={s}><Link to={`${BASE}/${s}`}>{n.name} <span className={`chip ${goalClass[n.goal]}`}>{n.goal}</span></Link></li> })}
      </ul>

      <h2>Sample foods in this group</h2>
      {!foods ? <Loading what="sample foods" /> : foods.length === 0 ? <p className="muted">No sample passports in this group yet.</p> : (
        <>
          <FoodRows foods={foods} amount={p => <>{fmt(p.nutrition.per_serving.kcal ?? 0)} kcal<small>per serving</small></>} />
          <SampleNote />
        </>
      )}

      <h2>Good to know</h2>
      <p>{g.tip}</p>

      <p className="card-source"><SourceLine source={g.source} url={g.url} /></p>
      <Disclaimer />
      <p><Link className="link-arrow" to={BASE}>All nutrients and food groups</Link></p>
    </div>
  )
}

export default function NutrientsPage() {
  const { slug } = useParams()
  const { passports, error } = usePassports()
  const samples = passports?.filter(p => p.sample) ?? (error ? [] : undefined)
  const nutrient = NUTRIENTS.find(n => n.slug === slug)
  const group = FOOD_GROUPS.find(g => g.slug === slug)
  return (
    <>
      <style>{CSS}</style>
      {error && <p className="warn" role="alert">Could not load the sample foods: {error}</p>}
      {!slug ? <Index samples={samples} />
        : nutrient ? <NutrientDetail n={nutrient} samples={samples} />
        : group ? <GroupDetail g={group} samples={samples} />
        : <div className="narrow"><h1>Not in the library</h1><p>There is no nutrient or food group called “{slug}”. <Link to={BASE}>See all nutrients and food groups</Link>.</p></div>}
    </>
  )
}
