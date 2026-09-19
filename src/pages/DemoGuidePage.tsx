// Demo walkthrough (/demo): a click-through script for judges and teammates. Sample barcodes and grades are computed live from the sample passports and GRADE_BANDS.
import { Link } from 'react-router-dom'
import { Loading, useData } from '../components/ui'
import { loadSamplePassports } from '../data'
import { GRADE_BANDS, scorePassport } from '../passport/score'
import { resetDemo } from '../auth/demo'

// Counted from public/data/plants.json and recalls.json (FSIS snapshots retrieved 2026-09-19). plants.json is 3.4 MB, so it is not loaded here just to count it.
const FSIS_PLANTS = '7,241'
const FSIS_RECALLS = '1,236'

const REAL_BARCODE = '0850388002291' // a real product in Open Food Facts; checked 2026-09-19: its record lists packager code USDA-EST-6024. We say nothing else about it until the live record loads.

/** food = a SAMPLE passport id whose grade is computed live and shown on the step, so the script never drifts from src/passport/score.ts. */
interface Step { ico: string; title: string; todo: string; say: string; food?: string; links: { to: string; label: string }[] }
const STEPS: Step[] = [
  { ico: '🍓', title: 'Start on the landing page', food: 'strawberry-riverbend', todo: 'Open the home page. The hero card is the strawberry SAMPLE passport with its live score and evidence labels: nearly every fact is backed up, so it earns the top grade, A+ (97 or more out of 100).',
    say: 'Plattr shows what is behind a food — and, in words, how well each fact is backed up.', links: [{ to: '/', label: 'Landing page' }] },
  { ico: '🧑‍🍳', title: 'Sign in as the demo shopper', todo: 'Open the demo accounts page and press "Use the demo shopper". The SAMPLE profile has an egg allergy and high blood pressure, three past grocery trips, three weeks of logged intake and three dated lab draws. All of it is synthetic sample data.',
    say: 'One tap gives us a shopper with a health profile; it all stays in this browser.', links: [{ to: '/demo-account', label: 'Demo accounts' }] },
  { ico: '🥚', title: 'Open Pasture-Raised Eggs', food: 'eggs-meadowlark', todo: 'See its score and grade, the evidence label on every fact and the egg allergen warning. Then scroll to the bottom of the passport and open the two drop-downs: "Nutrition facts", and "Your health data and this product" with the daily-value maths for sodium and saturated fat. Every passport ends with the same two drop-downs.',
    say: 'The warning is a plain match against the profile plus arithmetic on FDA Daily Values — informational, not medical advice.', links: [{ to: '/food/eggs-meadowlark', label: 'Pasture-Raised Eggs' }] },
  { ico: '🍎', title: 'Compare with Gala Apples', food: 'apples-orchard-lane', todo: 'The bottom of the scale, because almost nothing is documented. Scroll to the score breakdown to see which parts earned nothing.',
    say: 'The score rewards showing your work: an F means undocumented, not unsafe.', links: [{ to: '/food/apples-orchard-lane', label: 'Gala Apples' }] },
  { ico: '🥬', title: 'Romaine Hearts: hazard outlook', food: 'romaine-valley-green', todo: 'Find the hazard outlook for the Salinas Valley sourcing region.',
    say: 'Hazard notes are general background about a food and a region — not a finding about this farm.', links: [{ to: '/food/romaine-valley-green', label: 'Romaine Hearts' }] },
  { ico: '🥩', title: 'Ground beef: type the EST number from the pack', food: 'beef-sample-ridge', todo: 'Open the beef SAMPLE passport. Where it asks for the USDA establishment number on the pack, type M9714: that opens real federal data — recalls, sampling and enforcement. The plant has no connection to the sample ranch.',
    say: 'The passports are fictional, but this plant record is real USDA FSIS public data.', links: [{ to: '/food/beef-sample-ridge', label: 'Grass-Fed Ground Beef' }, { to: '/est/M9714', label: 'USDA plant EST. M9714' }] },
  { ico: '🐟', title: 'Wild-caught vs farm-raised fish', food: 'trout-clear-springs', todo: 'Open the two fish SAMPLE passports side by side. Each says up front whether it is wild-caught or farm-raised. The trout farm documents its feed, stocking density, fish health and water; the wild salmon declares a fishery and little else, so it scores far lower.',
    say: 'Wild or farmed is not good or bad here — the score only asks how much of the story is written down and backed up.', links: [{ to: '/food/salmon-cold-bay', label: 'Wild Sockeye Salmon' }, { to: '/food/trout-clear-springs', label: 'Farm-Raised Rainbow Trout' }] },
  { ico: '🧺', title: 'Take a grocery trip', todo: 'Add a few SAMPLE foods to the cart: the cart score, food groups and your personal warnings update as you go. Press "Finish trip", then "Log one serving of each as eaten today".',
    say: 'Shopping updates everything: history, the overall grade, the food map and the intake logged for today.', links: [{ to: '/shop', label: 'Grocery trip' }] },
  { ico: '🛒', title: 'My groceries and the map', todo: 'See the shopping trips, the overall score, how the groceries complement each other, and the farms on the map. The map zooms to your location when the browser is allowed to share it.',
    say: 'Purchases roll up into one overall score and a map of where the food came from.', links: [{ to: '/history', label: 'My groceries' }, { to: '/map', label: 'Map' }] },
  { ico: '📈', title: 'Health trends', todo: 'Open Health trends: intake per day against the FDA daily reference (unlogged days stay gaps, never zeros), the score per grocery trip over time, and lab values exactly as entered, with their dates. The demo numbers are synthetic sample data.',
    say: 'Trends are descriptive arithmetic on numbers the shopper entered — informational, not medical advice, and never a diagnosis.', links: [{ to: '/trends', label: 'Health trends' }] },
  { ico: '📷', title: 'Scan a sample barcode', todo: 'Type barcode 0850001000011 into Find a food, or use the camera on a supported phone (the page says so where the browser cannot).',
    say: 'At the shelf it is a scan; here we type the numbers under the barcode.', links: [{ to: '/explore', label: 'Find a food and scanner' }] },
  { ico: '🌍', title: 'Search a REAL product', todo: `On Find a food, type a product or brand name, or the real barcode ${REAL_BARCODE}. The result is a live Open Food Facts record: a Community record, crowd-sourced and not checked by Plattr, shown as recorded on the lookup date — the label in your hand wins. This record lists USDA EST 6024 as its packager code, so the real USDA plant appears immediately. Anything the record lacks reads "Not provided".`,
    say: 'Real products come from a crowd-sourced database, so we label them as community records and never fill the gaps with guesses.', links: [{ to: '/explore', label: 'Find a food' }, { to: `/lookup/${REAL_BARCODE}`, label: `Look up ${REAL_BARCODE}` }] },
  { ico: '🔬', title: 'Browse the Library', todo: 'Open the Library: parasites and hazards explained food by food, and nutrients and food groups with their FDA Daily Values. It is general background, not a finding about any product or farm.',
    say: 'When a passport mentions a hazard or a nutrient, the Library explains it in plain language, with sources.', links: [{ to: '/library/hazards', label: 'Parasites and hazards' }, { to: '/library/nutrients', label: 'Nutrients and food groups' }] },
  { ico: '🚜', title: 'Switch to the demo producer', todo: 'Go back to the demo accounts page and press "Use the demo producer" (it switches accounts for you). Then open product passports: add a fact as "Document on file" and watch the live score rise, save, and get the QR code.',
    say: 'Producers see their score move as they back facts up — and what they only declare earns half.', links: [{ to: '/demo-account', label: 'Demo accounts' }, { to: '/producer', label: 'My farm' }, { to: '/producer/passports', label: 'Product passports' }] },
  { ico: '📚', title: 'Field notes and our impact', todo: 'Finish on the reading pages: plain-language field notes and what Plattr is trying to change.',
    say: 'Everything is sourced, labelled, and honest about what is sample.', links: [{ to: '/learn', label: 'Field notes' }, { to: '/impact', label: 'Our impact' }] },
]

const CSS = `
/* full-bleed wrapper: as wide as the viewport so the blobs bleed off the page edge, clipped so they never cause sideways scroll */
.dg { position: relative; margin-inline: calc(50% - 50vw); padding-inline: calc(50vw - 50%); overflow-x: clip; }
.dg-blob { position: absolute; z-index: -1; pointer-events: none; }
.dg-blob-a { top: -60px; right: -180px; width: 620px; }
.dg-blob-b { top: 900px; left: -250px; width: 520px; }
.dg-blob-c { bottom: 120px; right: -230px; width: 560px; }
.dg-hero { max-width: 700px; padding: 18px 0 8px; }
.dg-hero h1 { font-size: clamp(2.2rem, 5.5vw, 3.6rem); }
.dg-squiggle { display: block; width: 190px; height: 12px; margin: -2px 0 12px; }
.dg-hand { display: none; font-size: 1.2rem; }
.dg-hand svg { display: block; width: 64px; height: 10px; margin: 4px auto 0; }
@media (min-width: 1000px) { .dg-hand { display: inline-block; position: absolute; } .dg-hand-a { top: 90px; right: 150px; } .dg-hand-b { right: 48px; bottom: 16px; } }
.dg-steps { list-style: none; padding: 0; margin: 22px 0; display: grid; gap: 18px; max-width: 860px; }
.dg-step { position: relative; display: grid; grid-template-columns: 64px minmax(0, 1fr); gap: 16px; align-items: start; }
.dg-step > * { position: relative; }
.dg-leaf { position: absolute; z-index: -1; width: 120px; pointer-events: none; }
.dg-step:nth-child(odd) .dg-leaf { right: -62px; top: 14px; transform: rotate(24deg); }
.dg-step:nth-child(even) .dg-leaf { left: -64px; bottom: 6px; transform: scaleX(-1) rotate(18deg); }
.dg-num { width: 64px; height: 64px; border-radius: 50%; display: grid; place-items: center; background: var(--green-soft); font-size: 1.7rem; position: relative; }
.dg-num b { position: absolute; top: -6px; left: -6px; width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; background: var(--red); color: #fff; font-size: 0.85rem; }
.dg-step h2 { margin: 2px 0 6px; font-size: 1.25rem; }
.dg-step p { margin: 0 0 8px; }
.dg-say { background: #fdf1e6; border-radius: 14px; padding: 8px 12px; }
.dg-tag { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin-right: 6px; }
.dg-links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
.dg-side { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 18px; align-items: start; margin-top: 8px; }
.dg-side h2 { margin-top: 0; }
.dg-side code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.85rem; overflow-wrap: anywhere; }
.dg-side .row:hover { border-color: var(--red); }
.dg-real ul { padding-left: 20px; margin: 6px 0 12px; } .dg-real li { margin: 4px 0; }
.dg-reset { display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: center; justify-content: space-between; margin-top: 18px; background: var(--green-soft); }
.dg-reset h2 { margin: 0 0 4px; } .dg-reset p { margin: 0; }
@media (max-width: 560px) {
  .dg-step { grid-template-columns: 1fr; gap: 10px; } .dg-leaf { display: none; }
  .dg-blob-a { width: 380px; right: -200px; } .dg-blob-b, .dg-blob-c { width: 340px; }
}
`

const Blob = ({ className }: { className: string }) => (
  <svg className={`dg-blob ${className}`} viewBox="0 0 600 520" aria-hidden="true" focusable="false">
    <path fill="var(--blob)" d="M421 38c78 34 150 108 160 196 11 92-42 190-124 238-86 50-206 54-296 8C76 436 14 350 12 262 10 170 66 76 150 36c84-40 190-34 271 2z" />
  </svg>
)
const Leaf = () => (
  <svg className="dg-leaf" viewBox="0 0 120 160" aria-hidden="true" focusable="false">
    <path fill="#3aa64c" d="M60 4c34 26 52 62 50 98-2 30-22 50-50 54-28-4-48-24-50-54C8 66 26 30 60 4z" />
    <path fill="none" stroke="#2a8a3c" strokeWidth="3" strokeLinecap="round" d="M60 22v130M60 70l24-20M60 96l28-18M60 84 36 64M60 112 32 92" />
  </svg>
)
const Squiggle = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 190 12" aria-hidden="true" focusable="false">
    <path fill="none" stroke="var(--red)" strokeWidth="3" strokeLinecap="round" d="M3 8c20-8 34 4 54-1s32-6 52-1 40 4 78-3" />
  </svg>
)

const NEUTRAL = { background: '#f6efe4', color: 'var(--ink)' } // grades below C are not painted green; the letter and word carry the meaning

export default function DemoGuidePage() {
  const samples = useData(loadSamplePassports)
  const scoreOf = (id?: string) => { const p = samples.data?.passports.find(x => x.id === id); return p && scorePassport(p) }
  return (
    <div className="dg">
      <style>{CSS}</style>
      <Blob className="dg-blob-a" /><Blob className="dg-blob-b" /><Blob className="dg-blob-c" />

      <header className="dg-hero">
        <h1>Demo walkthrough</h1>
        <Squiggle className="dg-squiggle" />
        <p className="lede">{STEPS.length} steps through Plattr, for judges and teammates. Each step says what to do, one sentence to say, and where to go.</p>
        <p className="caveat">Grades: {GRADE_BANDS.map(b => `${b.grade} ${b.word} (${b.band})`).join(' · ')}.</p>
        <p className="caveat">The product passports are fictional SAMPLE data. The Plattr score measures how much of a food's story is documented and backed up — not a medical or food-safety guarantee. Health notes are informational, never medical advice.</p>
        <span className="hand dg-hand dg-hand-a" aria-hidden="true">Good food<br />goes deeper<Squiggle /></span>
      </header>

      <ol className="dg-steps" aria-label="Demo steps">
        {STEPS.map((s, i) => { const score = scoreOf(s.food); return (
          <li className="dg-step panel" key={s.title}>
            <Leaf />
            <span className="dg-num" aria-hidden="true">{s.ico}<b>{i + 1}</b></span>
            <div>
              <h2><span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Step {i + 1}: </span>{s.title}</h2>
              <p><span className="dg-tag">Do</span>{s.todo}</p>
              {score && <p><span className="grade-pill" style={score.total < 70 ? NEUTRAL : undefined}>Live grade: {score.grade} · {score.word} · {score.total}/100</span></p>}
              <p className="dg-say"><span className="dg-tag">Say</span>“{s.say}”</p>
              <div className="dg-links">
                {s.links.map((l, j) => <Link key={l.to + l.label} to={l.to} className={`btn small${j ? ' secondary' : ''}`}>{l.label} <span aria-hidden="true">→</span></Link>)}
              </div>
            </div>
          </li>
        ) })}
      </ol>

      <div className="dg-side">
        <section className="panel" aria-labelledby="dg-barcodes">
          <h2 id="dg-barcodes">Sample barcodes</h2>
          <p className="muted" style={{ marginTop: 0 }}>Type one into the <Link to="/explore">food library</Link>, or tap a row. The passports are SAMPLE — fictional demo data; grades are computed live. The last row is a real barcode, looked up live.</p>
          {samples.error ? <p className="warn" role="alert">Could not load the sample passports: {samples.error}</p>
            : !samples.data ? <Loading what="the sample barcodes" />
            : (
              <ul className="rows">
                {samples.data.passports.map(p => {
                  const score = scorePassport(p)
                  return (
                    <li key={p.id}>
                      <Link to={`/food/${p.id}`} className="row">
                        <span className="ico" aria-hidden="true">{p.emoji}</span>
                        <span style={{ minWidth: 0 }}><strong>{p.name}</strong><span className="sub"><code>{p.barcode}</code> · SAMPLE</span></span>
                        <span className="grade-pill" style={score.total < 70 ? NEUTRAL : undefined}>{score.grade} · {score.word}</span>
                      </Link>
                    </li>
                  )
                })}
                <li>
                  <Link to={`/lookup/${REAL_BARCODE}`} className="row">
                    <span className="ico" aria-hidden="true">🌍</span>
                    <span style={{ minWidth: 0 }}><strong>A real barcode</strong><span className="sub"><code>{REAL_BARCODE}</code> · live Open Food Facts lookup</span></span>
                    <span className="chip ev-declared">Community record</span>
                  </Link>
                </li>
              </ul>
            )}
        </section>

        <section className="panel dg-real" aria-labelledby="dg-real">
          <h2 id="dg-real">What is real vs sample</h2>
          <h3>Real public data</h3>
          <ul>
            <li>USDA FSIS plant records behind <Link to="/plant-lookup">plant lookup</Link>: {FSIS_PLANTS} establishments and {FSIS_RECALLS} recall and public-health-alert notices in our snapshot (retrieved 2026-09-19), plus FY2025 raw-beef sampling and humane-handling enforcement postings.</li>
            <li>A recall is linked to a plant by a Plattr text match on the establishment number — not an FSIS field. "Nothing found" is never shown as "clean" or "safe".</li>
            <li>FDA Daily Values (21 CFR 101.9) used for the daily-value maths, and the regulation quotes behind label claims.</li>
          </ul>
          <h3>Live community data</h3>
          <ul>
            <li>Products found by name or real barcode come live from <a href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer">Open Food Facts</a> (© contributors, ODbL). Each is a Community record: crowd-sourced, not checked by Plattr, shown as recorded on the lookup date — the label in your hand wins. Missing information reads "Not provided", never a guess.</li>
          </ul>
          <h3>Sample (fictional)</h3>
          <ul>
            <li>Every product passport in the library and the farm behind it{samples.data ? ` (${samples.data.passports.length} passports)` : ''}, the rancher profiles, and both demo accounts.</li>
            <li>Hazard and parasite notes are general background about a food and a region — not measurements or findings about any farm.</li>
            <li>Passports made in the producer portal are whatever was typed: shown as Producer-declared, not checked by Plattr.</li>
          </ul>
          <h3>Demo-grade storage</h3>
          <ul>
            <li>Accounts, health profiles and carts live only in this browser's localStorage. No server, no real authentication — do not enter a real password or real medical data.</li>
          </ul>
          <Link to="/how-it-works" className="link-arrow">How the score works</Link>
        </section>
      </div>

      <section className="panel dg-reset" aria-labelledby="dg-reset" style={{ position: 'relative' }}>
        <div>
          <h2 id="dg-reset"><span aria-hidden="true">🌱 </span>Start fresh between demos</h2>
          <p>Clears the accounts, profiles, carts and producer-made passports stored in this browser, then reloads. Sample passports are not affected.</p>
        </div>
        <button type="button" className="secondary" onClick={resetDemo}>Reset demo data</button>
        <span className="hand dg-hand dg-hand-b" aria-hidden="true">People Plants<br />Food Forward<Squiggle /></span>
      </section>
    </div>
  )
}
