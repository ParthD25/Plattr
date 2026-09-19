// Demo accounts (/demo-account): one click into a SAMPLE shopper or a SAMPLE producer. Everything listed on the cards is read from the seed in src/auth/demo.ts.
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { actions, useAccount, useStore, type Role } from '../store'
import { DEMO, DEMO_FARM, DEMO_LABS, DEMO_LOG_DAYS, DEMO_LOG_GAPS, DEMO_NOTE, DEMO_PROFILE, DEMO_TRIPS, destination, enterDemo, resetDemo, safeNext } from '../auth/demo'

const LAB_NAME = { ldl: 'LDL cholesterol', hba1c: 'HbA1c' }
const list = (n: readonly number[]) => new Intl.ListFormat('en').format(n.map(String))
const word = (r: Role) => (r === 'consumer' ? 'shopper' : 'producer')
const otherRole = (r: Role): Role => (r === 'consumer' ? 'producer' : 'consumer')

interface Item { ico: string; title: string; sub: string }
const NEXT: Record<Role, { to: string; label: string; sub: string }[]> = {
  consumer: [
    { to: '/explore', label: 'Find or scan a food', sub: 'Search by name or barcode, open a passport, and see the egg warning on Pasture-Raised Eggs.' },
    { to: '/shop', label: 'Grocery trip', sub: 'Add SAMPLE foods to the cart and watch the cart score and your warnings update.' },
    { to: '/history', label: 'My groceries', sub: 'The three preloaded trips, their overall score and how the foods complement each other.' },
    { to: '/map', label: 'Map', sub: 'Where the purchased SAMPLE foods came from; it zooms to your location if you allow it.' },
    { to: '/trends', label: 'Health trends', sub: 'Intake per day against the FDA daily reference, score per trip over time, and lab values as entered. Informational, not medical advice.' },
    { to: '/profile', label: 'Profile', sub: 'Change the allergens and conditions, add your own, or delete the health data.' },
  ],
  producer: [
    { to: '/producer', label: 'My farm', sub: 'The SAMPLE farm profile: land, water tests, inputs, animal health records.' },
    { to: '/producer/passports', label: 'Product passports', sub: 'Build a passport, watch the live score move as facts are backed up, and get its QR code.' },
  ],
}

const CSS = `
/* full-bleed wrapper (same trick as the demo walkthrough): blobs bleed off the page edge and are clipped, so they never cause sideways scroll */
.da { position: relative; margin-inline: calc(50% - 50vw); padding-inline: calc(50vw - 50%); overflow-x: clip; }
.da::before, .da::after { content: ""; position: absolute; z-index: -1; pointer-events: none; background: var(--blob); border-radius: 46% 54% 60% 40% / 50% 45% 55% 50%; }
.da::before { top: -40px; right: -240px; width: 640px; height: 560px; }
.da::after { bottom: 60px; left: -300px; width: 520px; height: 480px; transform: rotate(40deg); }
.da-hero { max-width: 720px; padding: 10px 0 4px; }
.da-hero h1 { font-size: clamp(2.2rem, 5.5vw, 3.4rem); }
.da-squiggle { display: block; width: 190px; height: 12px; margin: -2px 0 12px; }
.da-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
.da-who h2 { margin-top: 0; } .da-who p { margin: 0; }
.da-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 330px), 1fr)); gap: 22px; margin: 22px 0 8px; }
.da-card { position: relative; overflow: hidden; display: flex; flex-direction: column; gap: 12px; padding: 28px; border-radius: 30px; }
.da-card > * { position: relative; }
.da-card.is-current { border: 2px solid var(--green); }
.da-leaf { position: absolute; right: -26px; bottom: -44px; width: 120px; transform: rotate(-28deg); }
.da-top { display: flex; gap: 16px; align-items: center; }
.da-top > div { flex: 1; min-width: 0; }
.da-top .chip { margin: 2px 4px 2px 0; }
.da-art { flex: none; width: 96px; height: 96px; border-radius: 50%; display: grid; place-items: center; font-size: 3rem; background: #fdebdc; }
.is-producer .da-art { background: var(--green-soft); }
.da-card h2 { margin: 0 0 4px; font-size: 1.7rem; letter-spacing: -0.02em; }
.da-card h3 { margin-top: 4px; }
.da-card p { margin: 0; }
.da-card .rows { margin: 0; }
.da-card .row { grid-template-columns: 46px minmax(0, 1fr); }
.da-next a.row { grid-template-columns: 46px minmax(0, 1fr) auto; }
.da-next a.row:hover { border-color: var(--red); }
.da-next .ico { font-weight: 900; font-size: 1.1rem; }
.da-go { align-self: flex-start; margin-top: auto; font-size: 1.05rem; padding: 14px 26px; }
.da-cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 330px), 1fr)); gap: 8px 22px; align-items: start; }
.da-cols h3 { margin: 8px 0 0; font-size: 1.1rem; }
.da-reset { display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: center; justify-content: space-between; margin-top: 26px; background: var(--green-soft); }
.da-reset h2 { margin: 0 0 4px; } .da-reset p { margin: 0; }
@media (max-width: 560px) { .da::before { width: 380px; height: 360px; right: -200px; } .da::after { display: none; } .da-card { padding: 20px; } .da-art { width: 72px; height: 72px; font-size: 2.2rem; } .da-go { align-self: stretch; justify-content: center; } .da-leaf { display: none; } }
`

const Leaf = () => (
  <svg className="da-leaf" viewBox="0 0 120 160" aria-hidden="true" focusable="false">
    <path fill="#3aa64c" d="M60 4c34 26 52 62 50 98-2 30-22 50-50 54-28-4-48-24-50-54C8 66 26 30 60 4z" />
    <path fill="none" stroke="#2a8a3c" strokeWidth="3" strokeLinecap="round" d="M60 22v130M60 70l24-20M60 96l28-18M60 84 36 64M60 112 32 92" />
  </svg>
)

export default function DemoAccountPage() {
  const account = useAccount()
  const store = useStore()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const [error, setError] = useState<string | null>(null)

  function enter(role: Role) {
    const err = enterDemo(role, store)
    if (err) return setError(`Could not open the demo ${word(role)}: ${err} Resetting the demo data (below) fixes this.`)
    navigate(destination(role, next))
  }

  const t = DEMO_PROFILE.today
  const foods = DEMO_TRIPS.reduce((n, trip) => n + trip.ids.length, 0)
  const cards: { role: Role; emoji: string; title: string; blurb: string; items: Item[] }[] = [
    { role: 'consumer', emoji: '🛒', title: 'Demo shopper', blurb: 'A shopper with a health profile, three weeks of logged intake and a shopping history, so warnings, My groceries, the map and Health trends all have something to show.', items: [
      { ico: '🥚', title: 'Egg allergy', sub: 'Foods that list eggs show a warning.' },
      { ico: '🩺', title: 'High blood pressure', sub: 'Sodium is put next to the FDA Daily Value. Informational only, never medical advice.' },
      { ico: '📊', title: `${DEMO_LOG_DAYS / 7} weeks of logged intake`, sub: `Sodium, saturated fat, calories, protein and exercise for the ${DEMO_LOG_DAYS} days before today, with ${DEMO_LOG_GAPS.length} days left unlogged so gaps show as gaps, not zeros. Today so far: ${t.sodium_mg?.toLocaleString('en-US')} mg sodium, ${t.saturated_fat_g} g saturated fat, ${t.exercise_min} minutes of exercise.` },
      { ico: '🧪', title: 'Three lab draws', sub: `${DEMO_LABS.map(l => LAB_NAME[l.code]).join(' and ')}, each drawn ${list(DEMO_LABS[0].draws.map(d => d[0]))} days ago. Shown as the numbers entered with their dates; Plattr never labels or interprets them.` },
      { ico: '🧺', title: `${DEMO_TRIPS.length} grocery trips`, sub: `${foods} SAMPLE foods bought ${list(DEMO_TRIPS.map(trip => trip.daysAgo))} days ago, so the score per trip can be followed over time.` },
    ] },
    { role: 'producer', emoji: '🚜', title: 'Demo producer', blurb: 'A fictional farm with its profile filled in, ready to build product passports with QR codes.', items: [
      { ico: '🌾', title: DEMO_FARM.name, sub: `${DEMO_FARM.city}, ${DEMO_FARM.state} · ${DEMO_FARM.acres} acres, ${DEMO_FARM.pasture_acres} in pasture · herd of ${DEMO_FARM.herd_size}.` },
      { ico: '💧', title: 'Water test on file', sub: `${DEMO_FARM.water_source}, last tested ${DEMO_FARM.water_last_test}.` },
      { ico: '🐄', title: 'Animal health records', sub: `${DEMO_FARM.health_records.length} vet entries and ${DEMO_FARM.parasite_watch.length} parasite-watch note.` },
      { ico: '📇', title: 'Ready to build passports', sub: 'Add facts, mark how each one is backed up, and watch the score respond.' },
    ] },
  ]

  return (
    <div className="da">
      <style>{CSS}</style>
      <header className="da-hero">
        <h1>Demo accounts</h1>
        <svg className="da-squiggle" viewBox="0 0 190 12" aria-hidden="true" focusable="false"><path fill="none" stroke="var(--red)" strokeWidth="3" strokeLinecap="round" d="M3 8c20-8 34 4 54-1s32-6 52-1 40 4 78-3" /></svg>
        <p className="lede">Look around Plattr without typing anything. One click signs you in to an account that is already filled with SAMPLE data.</p>
        {next && <p className="note">Pick an account to continue to <code>{next}</code>.</p>}
      </header>

      {account && (
        <section className="panel da-who" aria-labelledby="da-who-h">
          <h2 id="da-who-h">You are signed in</h2>
          <p><strong>{account.name}</strong> ({account.email}) — {word(account.role)} account{account.email === DEMO[account.role].email ? ', filled with SAMPLE data' : ''}.</p>
          <div className="da-actions">
            <Link className="btn" to={destination(account.role, next)}>Continue <span aria-hidden="true">→</span></Link>
            <button type="button" className="secondary" onClick={() => enter(otherRole(account.role))}>Switch to the other demo account ({word(otherRole(account.role))})</button>
            <button type="button" className="secondary" onClick={() => actions.signOut()}>Sign out</button>
          </div>
        </section>
      )}
      {error && <p className="warn" role="alert">{error}</p>}

      <div className="da-cards">
        {cards.map(c => {
          const current = account?.email === DEMO[c.role].email
          return (
            <section key={c.role} className={`panel da-card is-${c.role}${current ? ' is-current' : ''}`} aria-labelledby={`da-${c.role}`}>
              <Leaf />
              <div className="da-top">
                <span className="da-art" aria-hidden="true">{c.emoji}</span>
                <div>
                  <h2 id={`da-${c.role}`}>{c.title}</h2>
                  <span className="chip ev-declared">Sample data</span>{current && <span className="chip ev-verified">Signed in now</span>}
                </div>
              </div>
              <p>{c.blurb}</p>
              <h3>What is preloaded</h3>
              <ul className="rows" role="list">
                {c.items.map(i => (
                  <li className="row" key={i.title}><span className="ico" aria-hidden="true">{i.ico}</span><span><strong>{i.title}</strong><span className="sub">{i.sub}</span></span></li>
                ))}
              </ul>
              <button type="button" className="da-go" onClick={() => enter(c.role)}>{current ? 'Continue as' : 'Use'} the {c.title.toLowerCase()} <span aria-hidden="true">→</span></button>
            </section>
          )
        })}
      </div>
      <p className="caveat" style={{ marginTop: 12 }}>{DEMO_NOTE} Everything preloaded is fictional, including the lab values and the intake log. Warnings are a plain match against the profile plus arithmetic on FDA Daily Values — informational, never medical advice.</p>

      <section aria-labelledby="da-next-h">
        <h2 id="da-next-h">What to try next</h2>
        <div className="da-cols">
          {(['consumer', 'producer'] as Role[]).map(role => (
            <div key={role}>
              <h3>As the demo {word(role)}</h3>
              <ol className="rows da-next" role="list">
                {NEXT[role].map((n, i) => (
                  <li key={n.to}>
                    <Link to={n.to} className="row">
                      <span className="ico" aria-hidden="true">{i + 1}</span>
                      <span><strong>{n.label}</strong><span className="sub">{n.sub}</span></span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 14 }}>
          <Link to="/demo" className="link-arrow">Follow the full demo walkthrough</Link> · <Link to="/login" className="link-arrow">Sign in or create your own account</Link>
        </p>
      </section>

      <section className="panel da-reset" aria-labelledby="da-reset-h">
        <div>
          <h2 id="da-reset-h"><span aria-hidden="true">🌱 </span>Start fresh</h2>
          <p>Clears the accounts, profiles, carts, farms and producer-made passports stored in this browser, then reloads. Sample passports are not affected.</p>
        </div>
        <button type="button" className="secondary" onClick={resetDemo}>Reset demo data</button>
      </section>
      <p className="note">Accounts live only in this browser (its localStorage): no server and no real authentication. Account and health data never leave this browser, and clearing the browser data removes them. Do not enter a real password or real medical data.</p>
    </div>
  )
}
