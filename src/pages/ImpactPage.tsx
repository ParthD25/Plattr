// Our impact: why knowing where food comes from matters. Every number on this page is counted in the browser
// from the JSON snapshots in /public/data (or from the real score function) - nothing is typed in by hand.
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../components/ui'
import { loadClaims, loadHumane, loadPlants, loadRecalls, loadSampling, loadSamplePassports } from '../data'
import { averageScore, scorePassport } from '../passport/score'
import type { Fact, Passport } from '../passport/types'

const CSS = `
/* Full-bleed wrapper that clips the decorative blobs at the viewport edge, so phones never zoom out or scroll sideways. */
.imp { margin-inline: calc(50% - 50vw); padding-inline: calc(50vw - 50%); overflow-x: hidden; overflow-x: clip; }
.imp-hero { position: relative; display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr); gap: 32px; align-items: center; padding: 22px 0 6px; }
.imp-hero h1 { font-size: clamp(2.2rem, 5.4vw, 3.7rem); }
.imp-hero .lede { font-size: 1.2rem; max-width: 42ch; }
.imp-cta { display: flex; flex-wrap: wrap; gap: 14px; margin: 20px 0 6px; }
.imp-art { position: relative; display: grid; place-items: center; min-height: 320px; }
.imp-art::before { content: ""; position: absolute; inset: -8% -70% -10% -4%; background: var(--blob); border-radius: 46% 54% 60% 40% / 50% 45% 55% 50%; z-index: -1; }
.imp-sprout { width: min(320px, 78%); height: auto; }
.imp-note { position: absolute; font-size: 1.15rem; text-align: center; }
.imp-note svg { display: block; width: 74px; margin: 2px auto 0; }
.imp-note-a { right: 0; top: 4%; }
.imp-note-b { left: 0; bottom: 2%; transform: rotate(6deg); }
.imp-leaf { position: absolute; z-index: -1; width: 128px; height: auto; pointer-events: none; }

.imp-sec { position: relative; margin-top: 44px; }
.imp-sec > h2 { font-size: clamp(1.5rem, 3.2vw, 2rem); margin: 0 0 6px; letter-spacing: -0.02em; }
.imp-kicker { display: inline-flex; align-items: center; gap: 6px; font-weight: 800; color: var(--verified); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.08em; }
.imp-kicker .imp-leaf { position: static; width: 26px; transform: rotate(-24deg); }
.imp-sec-blob::before { content: ""; position: absolute; z-index: -1; background: var(--blob); width: 460px; height: 420px; left: -330px; top: -30px; border-radius: 58% 42% 45% 55% / 48% 58% 42% 52%; }
.imp-sec-blob-r::before { left: auto; right: -340px; top: 40px; border-radius: 42% 58% 55% 45% / 55% 44% 56% 45%; }

.imp-groups { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; padding: 0; margin: 18px 0 0; list-style: none; }
.imp-group { position: relative; isolation: isolate; }
.imp-group > .panel { height: 100%; }
.imp-group h3 { font-size: 1.15rem; }
.imp-group .imp-leaf-1 { left: -52px; top: 46px; transform: rotate(205deg); }
.imp-group .imp-leaf-2 { right: -54px; top: 60px; transform: rotate(-32deg); }
.imp-group .imp-leaf-3 { left: -56px; bottom: 70px; transform: rotate(150deg); }
.imp-group .imp-leaf-4 { right: -50px; bottom: 44px; transform: rotate(28deg); }
.imp-stats { display: grid; gap: 14px; padding: 0; margin: 14px 0; list-style: none; }
.imp-stat { display: grid; grid-template-columns: 116px minmax(0, 1fr); gap: 16px; align-items: center; }
.imp-stat p { margin: 0; }
.imp-stat small { display: block; color: var(--muted); font-size: 0.85rem; margin-top: 2px; }
.imp-medal { display: grid; place-items: center; width: 116px; height: 106px; font-size: 1.75rem; font-weight: 900; letter-spacing: -0.04em; line-height: 1; background: var(--green-soft); border-radius: 58% 42% 55% 45% / 48% 56% 44% 52%; }
.imp-medal small { display: inline; font-size: 0.85rem; color: var(--muted); font-weight: 700; margin: 0; }
.imp-stat:nth-child(3n + 2) .imp-medal { background: #fdebdc; border-radius: 44% 56% 47% 53% / 57% 45% 55% 43%; }
.imp-stat:nth-child(3n) .imp-medal { background: #e6f0f8; border-radius: 52% 48% 40% 60% / 44% 52% 48% 56%; }
.imp-food { display: inline-block; padding: 6px 12px; border-radius: 999px; background: #f6efe4; color: var(--ink); font-size: 0.82rem; font-weight: 700; text-decoration: none; } .imp-food:hover { color: var(--red); } .imp-food span { margin-right: 4px; }
.imp-src { font-size: 0.82rem; color: var(--muted); margin: 10px 0 0; padding-top: 10px; border-top: 1px dashed var(--line); }

.imp-duo { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr); gap: 24px; align-items: start; margin-top: 12px; }
.imp-duo p { margin: 0 0 12px; }
.imp-duo .panel > :last-child { margin-bottom: 0; }
.imp-compare { display: grid; gap: 14px; margin: 12px 0; padding: 0; list-style: none; }
.imp-compare .bar { height: 14px; margin: 6px 0 2px; }
.imp-compare .imp-declared > span { background: var(--amber); }
.imp-compare strong { font-size: 1.35rem; letter-spacing: -0.02em; }

.imp-who { grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr)); margin: 16px 0 0; }
.imp-who .feature { grid-template-columns: 72px 1fr; align-items: start; }
.imp-who .feature .ico { width: 72px; height: 72px; font-size: 2rem; }
.imp-who .feature h3 { font-size: 1.12rem; }
.imp-who .feature p { margin-bottom: 0; }

.imp-wont { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr)); gap: 14px; padding: 0; margin: 16px 0 0; list-style: none; }
.imp-wont li { display: grid; grid-template-columns: 40px 1fr; gap: 12px; align-items: start; padding: 16px; border-radius: 20px; background: var(--card); border: 1px solid var(--line); box-shadow: 0 4px 14px rgba(120, 72, 40, 0.05); }
.imp-wont .imp-x { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: #fde9e6; color: var(--red-dark); font-weight: 900; }
.imp-wont strong { display: block; } .imp-wont span.sub { color: var(--muted); font-size: 0.92rem; }

.imp-band { position: relative; isolation: isolate; margin-top: 48px; }
.imp-band > .panel { display: flex; flex-wrap: wrap; gap: 16px 28px; align-items: center; justify-content: space-between; background: var(--green-soft); }
.imp-band h2 { margin: 0 0 4px; } .imp-band p { margin: 0; }
.imp-band .imp-leaf { width: 150px; right: 18%; top: -44px; transform: rotate(-20deg); }

@media (max-width: 860px) {
  .imp-hero, .imp-duo, .imp-groups { grid-template-columns: 1fr; }
  .imp-art { min-height: 260px; }
  .imp-art::before { inset: -4% -30% -6% 8%; }
  .imp-sec-blob::before { width: 320px; height: 300px; left: -240px; }
  .imp-sec-blob-r::before { left: auto; right: -250px; }
}
@media (max-width: 420px) {
  .imp-stat { grid-template-columns: 96px minmax(0, 1fr); gap: 12px; }
  .imp-medal { width: 96px; height: 88px; font-size: 1.45rem; }
  .imp-leaf { width: 96px; }
}
`

/* ---------- decorative art (all hidden from screen readers) ---------- */
function Leaf({ className = '' }: { className?: string }) {
  return (
    <svg className={`imp-leaf ${className}`} viewBox="0 0 120 70" aria-hidden="true" focusable="false">
      <path d="M4 35C28 2 84-4 116 35 84 74 28 68 4 35Z" fill="#2e9e44" />
      <path d="M4 35C28 2 84-4 116 35Z" fill="#46b35a" />
      <path d="M10 35H108M36 35l14-15M58 35l14-16M80 35l12-12M36 35l14 15M58 35l14 16M80 35l12 12" fill="none" stroke="#1f6f3a" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
    </svg>
  )
}
function Squiggle() {
  return <svg viewBox="0 0 120 12" aria-hidden="true" focusable="false"><path d="M3 8C20 2 35 12 55 6S95 3 117 7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
}
function Sprout() {
  return (
    <svg className="imp-sprout" viewBox="0 0 360 330" aria-hidden="true" focusable="false">
      <path d="M180 222c-2 26-12 42-22 62M180 222c6 26 20 36 26 66M171 250c-12 5-24 10-36 11M193 256c12 6 24 6 36 12M162 274c-8 8-12 16-14 26" fill="none" stroke="#8a5a3a" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M36 216C82 150 278 150 324 216Z" fill="#7a4a2b" />
      <path d="M36 216c50 30 238 30 288 0Z" fill="#5f3820" />
      <path d="M180 182c-3-36 5-70 0-112" fill="none" stroke="#2e9e44" strokeWidth="9" strokeLinecap="round" />
      <path d="M180 120C150 66 92 64 74 96c26 38 78 40 106 24Z" fill="#2e9e44" />
      <path d="M181 92c22-58 84-64 106-32-22 42-76 50-106 32Z" fill="#46b35a" />
      <path d="M180 120c-30-14-66-20-106-24M181 92c34-8 70-18 106-32" fill="none" stroke="#1f6f3a" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
      <circle cx="96" cy="196" r="5" fill="#9a6a45" /><circle cx="250" cy="192" r="4" fill="#9a6a45" /><circle cx="214" cy="204" r="3" fill="#9a6a45" />
    </svg>
  )
}

/* ---------- small pieces ---------- */
const fmt = (n: number | null | undefined) => (n == null ? '…' : n.toLocaleString('en-US'))

function Stat({ n, unit, children }: { n: number | null | undefined; unit?: string; children: ReactNode }) {
  return (
    <li className="imp-stat">
      <span className="imp-medal"><span>{fmt(n)}{unit && n != null && <small>{unit}</small>}</span></span>
      <p>{children}</p>
    </li>
  )
}

function Group({ title, leaf, children, source }: { title: string; leaf: string; children: ReactNode; source: ReactNode }) {
  return (
    <li className="imp-group">
      <Leaf className={leaf} />
      <div className="panel">
        <h3>{title}</h3>
        <ul className="imp-stats">{children}</ul>
        <p className="imp-src">{source}</p>
      </div>
    </li>
  )
}

/** The same passport with every provided fact downgraded to the producer's word alone - to show what evidence is worth. */
const SECTIONS = ['origin', 'soil', 'water', 'feed', 'animal_welfare', 'health_history', 'certifications', 'safety'] as const
function asDeclaredOnly(p: Passport): Passport {
  const copy = { ...p }
  for (const k of SECTIONS) copy[k] = p[k].map((f: Fact) => (f.evidence === 'missing' ? f : { ...f, evidence: 'declared' as const }))
  return copy
}

const WHO = [
  { ico: '🧺', bg: '#fdebdc', title: 'Parents', text: 'Packing a lunchbox around an allergy means reading every label twice. A passport lists declared allergens and flags a match with the list you saved.' },
  { ico: '👓', bg: '#e6f0f8', title: 'Older shoppers', text: 'Plain words instead of fine print: every fact says how well it is backed up, in text, never by colour alone.' },
  { ico: '🩺', bg: '#eef3e6', title: 'People managing a health condition', text: "See a serving's share of the FDA Daily Value for things like sodium next to what you logged today. Informational only, not medical advice." },
  { ico: '🚜', bg: '#f6efe4', title: 'Small farms', text: 'The care you already take is invisible on a shelf. A passport and a QR code let you show your soil tests, water results and records to the people buying from you.' },
]
const WONT = [
  { title: 'No invented data', text: 'The federal numbers on this page are counted from dated public snapshots. The product passports in the demo are fictional and say SAMPLE wherever they appear.' },
  { title: 'No hidden scoring', text: 'The score is one small open function. Every part is shown with its points, and a blank section shows as "Not provided", never hidden.' },
  { title: 'No safety promises', text: "The Plattr score measures how much of a food's story is documented and backed up. It is not a medical or food-safety guarantee, and \"nothing found\" is never shown as \"clean\"." },
  { title: 'No medical advice', text: 'Allergen and health notes are matches and arithmetic against cited public reference values. They never diagnose, and they are not a substitute for your doctor.' },
]

export default function ImpactPage() {
  const plants = useData(loadPlants)
  const recalls = useData(loadRecalls)
  const sampling = useData(loadSampling)
  const humane = useData(loadHumane)
  const claims = useData(loadClaims)
  const passports = useData(loadSamplePassports)

  const cattle = plants.data?.plants.filter(p => p.cattle_slaughter?.length).length
  const notices = recalls.data?.recalls
  const withEst = notices?.filter(r => r.est.length > 0).length
  const alerts = notices?.filter(r => r.type === 'Public Health Alert').length
  const active = notices?.filter(r => r.type === 'Active Recall').length
  const since = notices?.length ? notices.reduce((min, r) => (r.date < min ? r.date : min), notices[0].date).slice(0, 4) : '2014'
  const byEst = sampling.data ? Object.values(sampling.data.by_establishment) : undefined
  const sum = (key: 'n' | 'stec_pos' | 'salm_pos') => byEst?.reduce((s, e) => s + e[key], 0)
  const samples = passports.data?.passports.filter(p => p.sample)
  const avg = samples ? averageScore(samples) : undefined
  const example = samples?.find(p => p.id === 'strawberry-riverbend') ?? samples?.[0]
  const documented = example && scorePassport(example)
  const declared = example && scorePassport(asDeclaredOnly(example))
  const errors = [plants, recalls, sampling, humane, passports].map(x => x.error).filter(Boolean)

  return (
    <div className="imp">
      <style>{CSS}</style>

      <section className="imp-hero">
        <div>
          <span className="imp-kicker"><Leaf className="" />Our impact</span>
          <h1>A label tells you what. It rarely tells you where.</h1>
          <p className="lede">
            Plattr exists so a shopper can see the farm, the soil, the water and the records behind a food, and see exactly how much of that
            story is backed up. Here is the gap we are working on, in numbers counted from real public data.
          </p>
          <div className="imp-cta">
            <Link to="/explore" className="btn">Explore the food library <span aria-hidden="true">→</span></Link>
            <Link to="/for-producers" className="btn secondary">For producers</Link>
          </div>
        </div>
        <div className="imp-art" aria-hidden="true">
          <Sprout />
          <span className="hand imp-note imp-note-a">Good food<br />goes deeper<Squiggle /></span>
          <span className="hand imp-note imp-note-b">People Plants<br />Food Forward<Squiggle /></span>
        </div>
      </section>

      <section className="imp-sec" aria-labelledby="imp-numbers">
        <h2 id="imp-numbers">What the public record can show today</h2>
        <p className="lede">
          For meat, poultry and egg products, USDA's Food Safety and Inspection Service publishes a lot. Plattr reads it as it is and counts it
          here, live, from the snapshots in this app.
        </p>
        {errors.length > 0 && <p className="warn" role="alert">Some data could not be loaded, so a few numbers below are blank: {errors.join('; ')}</p>}
        <ul className="imp-groups" aria-busy={!plants.data || !recalls.data || !sampling.data}>
          <Group title="The plants behind the package" leaf="imp-leaf-1"
            source={<>Source: {plants.data?.source ?? 'USDA FSIS inspection directory'}, snapshot {plants.data?.retrieved ?? '…'}. Humane-handling letters: FSIS, snapshot {humane.data?.retrieved ?? '…'}. FSIS notes that letters stay posted for about a year and are then removed, so this is not a history.</>}>
            <Stat n={plants.data?.plants.length}><strong>USDA-inspected establishments</strong> in the FSIS directory snapshot. The "EST." number on a meat package points to one of them.</Stat>
            <Stat n={cattle}><strong>are listed as slaughtering cattle.</strong> That number identifies the plant, not the ranch the animal came from.</Stat>
            <Stat n={humane.data?.establishments.length}><strong>establishments with a humane-handling enforcement letter</strong> currently posted by FSIS ({fmt(humane.data?.establishments.reduce((s, e) => s + e.actions.length, 0))} actions in all).</Stat>
          </Group>

          <Group title="When something goes wrong" leaf="imp-leaf-2"
            source={<>Source: {recalls.data?.source ?? 'USDA FSIS Recall API'}, snapshot {recalls.data?.retrieved ?? '…'}. The establishment match is Plattr's text match on the notice summary, not an FSIS field. Finding no notice for a plant is never shown as "clean" or "safe".</>}>
            <Stat n={notices?.length}><strong>FSIS recall and public-health-alert notices since {since}</strong> ({fmt(alerts)} of them public health alerts).</Stat>
            <Stat n={withEst}><strong>of those notices name an establishment number</strong> in their summary, so they can be linked to a plant. The rest cannot be matched from the summary alone.</Stat>
            <Stat n={active}><strong>recalls still marked active</strong> in this snapshot. A shopper would have to know the plant number to connect any of them to a package.</Stat>
          </Group>

          <Group title="Raw-beef testing, fiscal year 2025" leaf="imp-leaf-3"
            source={<>Source: {sampling.data?.source ?? 'USDA FSIS raw beef sampling'}, snapshot {sampling.data?.retrieved ?? '…'}. <strong>FSIS caveat:</strong> {sampling.data?.scope ?? 'Sample counts are not comparable between plants.'} {sampling.data && <>FSIS also states: "{sampling.data.fsis_disclaimer}"</>}</>}>
            <Stat n={sum('n')}><strong>raw-beef samples</strong> taken by FSIS at {fmt(byEst?.length)} establishments between {sampling.data?.window[0] ?? '…'} and {sampling.data?.window[1] ?? '…'}.</Stat>
            <Stat n={sum('stec_pos')}><strong>samples positive for STEC</strong> (Shiga toxin-producing <i>E. coli</i>).</Stat>
            <Stat n={sum('salm_pos')}><strong>samples positive for <i>Salmonella</i>.</strong> Counts are totals across all plants and must not be used to rank one plant against another.</Stat>
          </Group>

          <Group title="Plattr's own library (SAMPLE)" leaf="imp-leaf-4"
            source={<>Counted from the sample passports in this app. They are fictional demo data, so this is a picture of the prototype, not of real farms. The Plattr score measures how much of a food's story is documented and backed up — not a medical or food-safety guarantee.</>}>
            <Stat n={samples?.length}><strong>SAMPLE product passports</strong> across {fmt(samples && new Set(samples.map(p => p.category)).size)} food categories. Every one is fictional and marked SAMPLE on screen.</Stat>
            <Stat n={avg} unit="/100"><strong>average Plattr score of the SAMPLE passports.</strong> <Link to="/how-it-works">See how the score works</Link>.</Stat>
            {samples && <li><ul className="badges" aria-label="The SAMPLE passports">{samples.map(p => <li key={p.id}><Link className="imp-food" to={`/food/${p.id}`}><span aria-hidden="true">{p.emoji} </span>{p.name}</Link></li>)}</ul></li>}
          </Group>
        </ul>
      </section>

      <section className="imp-sec imp-sec-blob" aria-labelledby="imp-problem">
        <h2 id="imp-problem">The problem</h2>
        <div className="imp-duo">
          <div>
            <p><strong>Shoppers cannot see behind the label.</strong> Look at the numbers above: the public record is about <em>plants</em> — inspection, recalls, testing. It stops at the plant door. Where the animal was raised, what it ate, how the soil and water were managed: none of that is something you can look up.</p>
            <p>Records often exist, but they sit with the business or with officials, not with the public. Official cattle ear tags are a good example: the records are held by animal-health officials, there is no public lookup, and nothing links a tag to a package. The paperwork a producer gives FSIS to support a label claim is not public either.</p>
            <p>So a family managing an allergy, or a shopper who simply wants to support a careful farm, is left with marketing words and trust.</p>
          </div>
          <aside className="panel" aria-label="What the public record cannot do">
            <span className="chip chip-floor">Not public</span>
            <blockquote className="quote" style={{ fontSize: '1.05rem' }}>{claims.data?.floor.split(' Everything below')[0] ?? 'No public record links a beef package to the ranch or feedlot that raised the animal. The establishment number identifies the plant.'}</blockquote>
            <p className="caveat">This is the line Plattr draws on every plant lookup. <Link to="/plant-lookup">Try a USDA plant number</Link> to see exactly where the public record ends.</p>
          </aside>
        </div>
      </section>

      <section className="imp-sec imp-sec-blob imp-sec-blob-r" aria-labelledby="imp-changes">
        <h2 id="imp-changes">What Plattr changes</h2>
        <div className="imp-duo">
          <div>
            <p><strong>A product passport.</strong> Producers publish the story themselves — farm origin, soil, water, feed and grazing, welfare, animal health, certifications and safety testing — and print a QR code for the pack.</p>
            <p><strong>Evidence labels on every fact.</strong> Each line says, in words, whether it is a <span className="chip ev-verified">Verified record</span>, a <span className="chip ev-document">Document on file</span>, <span className="chip ev-declared">Producer-declared</span> or <span className="chip ev-missing">Not provided</span>. A producer's own statement never passes as a checked record.</p>
            <p><strong>Producers are rewarded for showing their work.</strong> A verified fact earns full points, a document on file 90%, a bare declaration half, and a blank earns nothing. The honest move and the high-scoring move are the same move.</p>
          </div>
          <aside className="panel" aria-labelledby="imp-worth">
            <h3 id="imp-worth">What evidence is worth</h3>
            {example && documented && declared ? (
              <>
                <p className="muted" style={{ margin: '4px 0 0' }}><span aria-hidden="true">{example.emoji} </span><Link to={`/food/${example.id}`}>{example.name}</Link> <span className="chip ev-missing">Sample — fictional</span></p>
                <ul className="imp-compare">
                  <li>
                    <strong>{documented.total}</strong><small className="muted"> /100 · Grade {documented.grade} ({documented.word})</small>
                    <div className="bar" role="img" aria-label={`As published, with its records and documents: ${documented.total} out of 100`}><span style={{ width: `${documented.total}%` }} /></div>
                    <span className="muted">As published, with its records and documents attached</span>
                  </li>
                  <li>
                    <strong>{declared.total}</strong><small className="muted"> /100 · Grade {declared.grade} ({declared.word})</small>
                    <div className="bar imp-declared" role="img" aria-label={`The same facts if only declared: ${declared.total} out of 100`}><span style={{ width: `${declared.total}%` }} /></div>
                    <span className="muted">The very same facts, if the producer only said so</span>
                  </li>
                </ul>
                <p className="caveat">Both numbers come from the real score function, run in your browser on this sample passport.</p>
              </>
            ) : <p className="muted" aria-live="polite">{passports.error ? `Could not load the sample passports: ${passports.error}` : 'Loading the worked example…'}</p>}
          </aside>
        </div>
      </section>

      <section className="imp-sec" aria-labelledby="imp-who">
        <h2 id="imp-who">Who it is for</h2>
        <ul className="features imp-who">
          {WHO.map(w => (
            <li className="panel feature" key={w.title}>
              <span className="ico" aria-hidden="true" style={{ background: w.bg }}>{w.ico}</span>
              <div><h3>{w.title}</h3><p>{w.text}</p></div>
            </li>
          ))}
        </ul>
      </section>

      <section className="imp-sec" aria-labelledby="imp-wont">
        <h2 id="imp-wont">What we will not do</h2>
        <p className="lede">Trust is the whole product, so these are fixed.</p>
        <ul className="imp-wont">
          {WONT.map(w => (
            <li key={w.title}><span className="imp-x" aria-hidden="true">✕</span><div><strong>{w.title}</strong><span className="sub">{w.text}</span></div></li>
          ))}
        </ul>
      </section>

      <section className="imp-band" aria-labelledby="imp-next">
        <Leaf />
        <div className="panel">
          <div>
            <h2 id="imp-next">See it for yourself</h2>
            <p>Open a SAMPLE passport and read the evidence line by line — or, if you grow or raise food, show your work.</p>
          </div>
          <div className="imp-cta" style={{ margin: 0 }}>
            <Link to="/explore" className="btn">Explore a food <span aria-hidden="true">→</span></Link>
            <Link to="/for-producers" className="btn secondary">I am a producer</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
