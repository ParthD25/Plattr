// My groceries: cart, purchase history with an overall Plattr score, and how the foods complement each other.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GradeDot } from '../components/ScoreBadge'
import { Loading, SampleBanner } from '../components/ui'
import { DAILY_VALUES_SOURCE, GROUPS, foodGroupCoverage, missingGroups, nutrientTotals, pairingNotes, recommend } from '../consumer/history/complement'
import { GRADE_COLOR, averageScore, gradeFor, scorePassport } from '../passport/score'
import type { FoodGroup, Passport } from '../passport/types'
import { usePassports } from '../passport/usePassports'
import { EMPTY_PROFILE, actions, useAccount, useStore, type CartItem } from '../store'

const CSS = `
.gh .row { grid-template-columns: 46px minmax(0, 1fr) auto; }
.gh .row a { color: inherit; font-weight: 800; text-decoration: none; } .gh .row a:hover { color: var(--red); }
.gh-end { display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end; align-items: center; }
.gh-sample { font-size: 0.68rem; font-weight: 800; letter-spacing: 0.06em; padding: 1px 7px; border-radius: 6px; background: #ffe48a; color: #3d3000; border: 1.5px solid #b38f00; margin-left: 6px; vertical-align: middle; }
.gh-stat { padding: 16px 18px; } .gh-stat .stat small { font-size: 1rem; color: var(--muted); font-weight: 700; }
.gh-groups { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; padding: 0; margin: 12px 0; list-style: none; }
.gh-groups li { border: 1px solid var(--line); border-radius: 16px; background: #fff; padding: 12px; text-align: center; font-weight: 700; text-transform: capitalize; }
.gh-groups li.gh-miss { border-style: dashed; background: transparent; color: var(--muted); }
.gh-groups .emoji { font-size: 1.8rem; display: block; } .gh-groups small { display: block; font-weight: 600; text-transform: none; }
.gh-nut { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 4px 28px; }
.gh-nut-head { display: flex; justify-content: space-between; gap: 8px; font-size: 0.92rem; } .gh-nut-head span { color: var(--muted); }
.gh-suggest { padding-left: 20px; } .gh-suggest li { margin: 6px 0; } .gh-suggest b { text-transform: capitalize; }
@media (max-width: 480px) { .gh .row { grid-template-columns: 46px minmax(0, 1fr); } .gh .row .gh-end { grid-column: 1 / -1; justify-content: flex-start; } }
`

const GROUP_EMOJI: Record<FoodGroup, string> = { protein: '🥩', vegetables: '🥬', fruits: '🍓', grains: '🍞', dairy: '🥛' }
const TIMEFRAMES = [['trip', 'Latest trip'], ['month', 'This month'], ['year', 'This year'], ['all', 'Lifetime']] as const
type Timeframe = (typeof TIMEFRAMES)[number][0]

const gradeOf = (n: number) => gradeFor(n).grade
const tripOf = (c: CartItem) => c.trip ?? c.purchased_at!.slice(0, 10)
const niceDate = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { dateStyle: 'long' })
const Sample = ({ p }: { p: Passport }) => (p.sample ? <span className="gh-sample">SAMPLE</span> : null)

export default function HistoryPage() {
  const account = useAccount()
  const store = useStore()
  const { passports, error } = usePassports()
  const [frame, setFrame] = useState<Timeframe>('trip')

  if (error) return <p className="warn" role="alert">Could not load the food library: {error}</p>
  if (!passports || !account) return <Loading what="your groceries" />

  const email = account.email
  const byId = new Map(passports.map(p => [p.id, p]))
  const cart = store.carts[email] ?? []
  const inCart = cart.filter(c => !c.purchased_at)
  const bought = cart.filter(c => c.purchased_at)

  const latestTrip = bought.map(tripOf).sort().at(-1)
  const today = new Date().toISOString()   // purchased_at is stored as a UTC ISO string, so compare in UTC too
  const inFrame = bought.filter(c =>
    frame === 'trip' ? tripOf(c) === latestTrip : frame === 'month' ? c.purchased_at!.startsWith(today.slice(0, 7)) : frame === 'year' ? c.purchased_at!.startsWith(today.slice(0, 4)) : true)
  const framePassports = inFrame.flatMap(c => byId.get(c.passport_id) ?? [])
  const avg = averageScore(framePassports)
  const farms = new Set(framePassports.map(p => p.farm.name))
  const states = [...new Set(framePassports.map(p => p.farm.state))]
  const trips = [...new Set(inFrame.map(tripOf))].sort().reverse()

  // Section 3 looks at each different food once: this timeframe's purchases plus what is waiting in the cart.
  const basket = [...new Set([...inFrame, ...inCart].map(c => c.passport_id))].flatMap(id => byId.get(id) ?? [])
  const coverage = foodGroupCoverage(basket)
  const suggestions = recommend(missingGroups(basket), passports)
  const profile = store.profiles[email] ?? EMPTY_PROFILE
  // Tips are default-deny (see health/references): food can interact with medicines. The blood-sugar tip is also skipped for diabetes.
  const tipsAllowed = profile.takes_medicines === 'none'
  const notes = pairingNotes(basket).filter(n => n.id !== 'cinnamon_with_carbs' || !profile.conditions.includes('diabetes_or_prediabetes'))
  const frameLabel = TIMEFRAMES.find(t => t[0] === frame)![1].toLowerCase()

  return (
    <div className="gh">
      <style>{CSS}</style>
      <h1>My groceries</h1>
      <p className="lede">Your cart, what you have bought, and how your foods work together.</p>
      {[...inCart, ...bought].some(c => byId.get(c.passport_id)?.sample) &&
        <SampleBanner text="Items marked SAMPLE are fictional demo passports - the farms, records and numbers on them are not real." />}

      <section aria-labelledby="gh-cart">
        <h2 id="gh-cart">In your cart</h2>
        {inCart.length === 0
          ? <p className="note">Your cart is empty. <Link to="/shop">Start a grocery trip</Link>, scan a food, or <Link to="/explore">browse the food library</Link>.</p>
          : <div className="panel">
              <ul className="rows" style={{ marginTop: 0 }}>
                {inCart.map(c => {
                  const p = byId.get(c.passport_id)
                  return (
                    <li className="row" key={c.passport_id}>
                      <span className="ico" aria-hidden="true">{p?.emoji ?? '❔'}</span>
                      <div>
                        {p ? <><Link to={`/food/${p.id}`}>{p.name}</Link><Sample p={p} /></> : <strong>{c.passport_id}</strong>}
                        <span className="sub">{p ? `${p.farm.name} · ${p.farm.city}, ${p.farm.state}` : 'This passport is no longer in the library.'}</span>
                      </div>
                      <div className="gh-end">
                        {p && <GradeDot score={scorePassport(p)} />}
                        <button className="small secondary" aria-label={`Remove ${p?.name ?? c.passport_id} from cart`} onClick={() => actions.removeFromCart(email, c.passport_id)}>Remove</button>
                      </div>
                    </li>
                  )
                })}
              </ul>
              <p style={{ margin: '16px 0 6px' }}><button onClick={() => { actions.checkout(email); setFrame('trip') }}>I bought these</button></p>
              <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
                Marking items as bought records a shopping trip dated today and moves them into your history below. Plattr does not order or pay for anything.
              </p>
            </div>}
      </section>

      <section aria-labelledby="gh-bought">
        <h2 id="gh-bought">What you've bought</h2>
        {bought.length === 0
          ? <p className="note">No shopping trips recorded yet. Add foods to your cart, then press "I bought these". <Link to="/explore">Find foods in the library</Link>.</p>
          : <>
              <div className="tabs" role="group" aria-label="Timeframe">
                {TIMEFRAMES.map(([key, label]) => <button key={key} aria-pressed={frame === key} onClick={() => setFrame(key)}>{label}</button>)}
              </div>
              {inFrame.length === 0
                ? <p className="note">Nothing bought {frameLabel === 'lifetime' ? 'yet' : frameLabel}. Try a longer timeframe.</p>
                : <>
                    <div className="stats">
                      <div className="panel gh-stat"><div className="stat">{inFrame.length}</div>item{inFrame.length === 1 ? '' : 's'} bought</div>
                      <div className="panel gh-stat">
                        {avg === null ? <div className="stat">-</div> : <>
                          <div className="stat">{avg}<small> /100 · Grade {gradeOf(avg)}</small></div>
                          <div className="bar" role="img" aria-label={`Overall Plattr score ${avg} out of 100, grade ${gradeOf(avg)}`}><span style={{ width: `${avg}%`, background: GRADE_COLOR[gradeOf(avg)] }} /></div>
                        </>}
                        overall Plattr score
                      </div>
                      <div className="panel gh-stat"><div className="stat">{farms.size}</div>farm{farms.size === 1 ? '' : 's'}</div>
                      <div className="panel gh-stat"><div className="stat">{states.length}</div>state{states.length === 1 ? '' : 's'}<span className="muted" style={{ display: 'block', fontSize: '0.85rem' }}>{states.join(', ')}</span></div>
                    </div>
                    <p className="muted" style={{ fontSize: '0.9rem' }}>
                      The overall score is the average of these items' Plattr scores: how much of each food's story is documented and backed up - not a medical or food-safety guarantee.
                      Open an item to see every fact with its evidence level. <Link to="/map">See where this food came from</Link>.
                    </p>
                    {trips.map(trip => (
                      <div key={trip}>
                        <h3 style={{ margin: '18px 0 0' }}>Trip on {niceDate(trip)}</h3>
                        <ul className="rows">
                          {inFrame.filter(c => tripOf(c) === trip).map(c => {
                            const p = byId.get(c.passport_id)
                            return (
                              <li className="row" key={c.passport_id + c.purchased_at}>
                                <span className="ico" aria-hidden="true">{p?.emoji ?? '❔'}</span>
                                <div>
                                  {p ? <><Link to={`/food/${p.id}`}>{p.name}</Link><Sample p={p} /></> : <strong>{c.passport_id}</strong>}
                                  <span className="sub">{p ? `${p.farm.name} · ${p.farm.state}` : 'This passport is no longer in the library.'}</span>
                                </div>
                                <div className="gh-end">{p && <GradeDot score={scorePassport(p)} />}</div>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    ))}
                  </>}
            </>}
      </section>

      <section aria-labelledby="gh-together">
        <h2 id="gh-together">How your groceries work together</h2>
        {basket.length === 0
          ? <p className="note">Once you have foods in your cart or a shopping trip, this shows which food groups you have covered and what could round them out. <Link to="/explore">Browse the food library</Link>.</p>
          : <div className="panel">
              <p style={{ marginTop: 0 }}>Looking at the {basket.length} different food{basket.length === 1 ? '' : 's'} in your cart and your purchases ({frameLabel}).</p>

              <h3>Food groups</h3>
              <ul className="gh-groups">
                {GROUPS.map(g => (
                  <li key={g} className={coverage[g] ? undefined : 'gh-miss'}>
                    <span className="emoji" aria-hidden="true">{GROUP_EMOJI[g]}</span>{g}
                    <small>{coverage[g] ? `${coverage[g]} item${coverage[g] === 1 ? '' : 's'}` : 'Not yet'}</small>
                  </li>
                ))}
              </ul>
              {suggestions.length === 0
                ? <p><strong>All five food groups are covered.</strong></p>
                : <ul className="gh-suggest">
                    {suggestions.map(({ group, items }) => (
                      <li key={group}>
                        <b>Add {group}:</b>{' '}
                        {items.length === 0 ? <span className="muted">nothing in the library for this group yet.</span> : items.map((p, i) => {
                          const s = scorePassport(p)
                          return <span key={p.id}>{i > 0 && ', '}<Link to={`/food/${p.id}`}>{p.name} - score {s.total} {s.grade}</Link><Sample p={p} /></span>
                        })}
                      </li>
                    ))}
                  </ul>}

              <h3 style={{ marginTop: 22 }}>Nutrients, one serving of each food added up</h3>
              <p className="muted" style={{ margin: '4px 0 10px', fontSize: '0.9rem' }}>
                Shown against the FDA Daily Values for a 2,000-calorie day, using the nutrition panel on each passport. A quick picture of the mix, not a record of what you ate.
              </p>
              <div className="gh-nut">
                {nutrientTotals(basket).map(n => (
                  <div key={n.key}>
                    <div className="gh-nut-head"><strong>{n.label}</strong><span>{n.total} {n.unit} · {n.pct}% of daily {n.limit ? 'limit' : 'value'} ({n.dv} {n.unit})</span></div>
                    <div className="bar" role="img" aria-label={`${n.label}: ${n.pct}% of the daily ${n.limit ? 'limit' : 'value'}`}>
                      <span style={{ width: `${Math.min(n.pct, 100)}%`, background: n.limit ? 'var(--amber)' : undefined }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="card-source" style={{ marginTop: 6 }}>Source: <a href={DAILY_VALUES_SOURCE.url} target="_blank" rel="noreferrer">{DAILY_VALUES_SOURCE.source}</a>. Sodium and saturated fat are amounts to stay under.</p>

              <h3 style={{ marginTop: 22 }}>Pairing notes</h3>
              {!tipsAllowed
                ? <p className="note">Food-pairing tips are hidden. They are shown only when your profile says you take no medicines, because food can interact with medicines - your pharmacist or clinician is the right person to ask. <Link to="/profile">Update your profile</Link>.</p>
                : notes.length === 0
                  ? <p className="muted">No pairing notes for this mix of foods.</p>
                  : notes.map(n => (
                      <div className="card card-inference" key={n.id}>
                        <div className="card-head"><span className="chip chip-inference">Evidence: {n.evidence}</span></div>
                        <div className="card-body"><p>{n.text}</p></div>
                        <div className="card-source">Source: <a href={n.url} target="_blank" rel="noreferrer">{n.source}</a></div>
                      </div>
                    ))}
              <p className="muted" style={{ fontSize: '0.9rem', marginBottom: 0 }}>General food information, not medical advice. Talk to a doctor or dietitian about your own needs.</p>
            </div>}
      </section>
    </div>
  )
}
