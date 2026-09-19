// Field notes (/learn and /learn/:slug): five one-minute explainers.
// Every regulation quote, source link, caveat and law-or-guidance flag is rendered from public/data/claims.json;
// the prose only restates that file and README.md. Do not add facts here that are not in those two places.
import { useEffect, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Loading, useData } from '../components/ui'
import { loadClaims } from '../data'
import { GRADE_BANDS } from '../passport/score'
import type { ClaimDef, ClaimsFile } from '../types'

type Entry = Omit<ClaimDef, 'caveat'> & { caveat?: string } // fits both claims[] and label_rules[]
const entriesFor = (d: ClaimsFile, keys: string[]): Entry[] =>
  keys.flatMap(k => [...d.claims, ...d.label_rules].filter((e: Entry) => e.key === k))

const lawChip = (es: Entry[]): { text: string; cls: string } =>
  es.length === 0 ? { text: "Plattr's own rubric", cls: 'ev-missing' }
    : es.every(e => e.is_binding_law) ? { text: 'Binding law', cls: 'ev-verified' }
    : es.some(e => e.is_binding_law) ? { text: 'Law and guidance', cls: 'ev-document' }
    : { text: 'Guidance, not law', cls: 'ev-document' }

/* ---------- decorative art (all aria-hidden) ---------- */
const Leaf = ({ className = '' }: { className?: string }) => (
  <svg className={`fn-leaf ${className}`} viewBox="0 0 64 96" aria-hidden="true" focusable="false">
    <path d="M32 2C56 22 62 52 32 94 2 52 8 22 32 2Z" fill="#2e9e44" />
    <path d="M32 14v72M32 36l-12-9M32 36l12-9M32 54l-15-10M32 54l15-10M32 70l-11-8M32 70l11-8" stroke="#1f7a33" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
)
const Blob = ({ className }: { className: string }) => (
  <svg className={`fn-blob ${className}`} viewBox="0 0 600 520" aria-hidden="true" focusable="false">
    <path fill="#fde3d2" d="M421 61c68 41 131 110 139 190 8 81-39 172-113 219-74 46-175 48-257 12C108 446 45 372 32 290 19 208 56 118 124 69c68-49 229-49 297-8Z" />
  </svg>
)
const Squiggle = () => (
  <svg className="fn-squiggle" viewBox="0 0 120 12" aria-hidden="true" focusable="false">
    <path d="M3 8c14-8 24 6 38 0s24-8 38-1 24 3 38-3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
  </svg>
)
const Sprout = () => (
  <svg className="fn-sprout" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <ellipse cx="32" cy="58" rx="20" ry="4.5" fill="#7a4a2b" />
    <path d="M32 58V30" stroke="#1f7a33" strokeWidth="3" strokeLinecap="round" />
    <path d="M32 36C30 21 18 14 5 16c0 15 13 24 27 20Z" fill="#2e9e44" />
    <path d="M32 31c2-14 14-21 27-19 0 15-13 23-27 19Z" fill="#46b85c" />
  </svg>
)

const CSS = `
/* .fn is a full-bleed strip that clips the blobs at the viewport edge (no horizontal scroll); .fn-in keeps the normal page width. */
.fn { margin: 0 calc(50% - 50vw); padding: 0 calc(50vw - 50%); overflow-x: clip; }
.fn-in { position: relative; }
.fn code { white-space: nowrap; font-size: 0.95em; }
.fn-blob { position: absolute; z-index: -2; pointer-events: none; }
.fn-blob-a { width: 640px; top: -110px; right: -280px; }
.fn-blob-b { width: 460px; left: -330px; top: 560px; transform: rotate(140deg); }
.fn-leaf { position: absolute; z-index: -1; width: 72px; pointer-events: none; }
.fn-kicker { display: inline-flex; align-items: center; gap: 6px; margin: 10px 0 0; padding: 4px 14px; border-radius: 999px; background: var(--green-soft); color: var(--verified); font-weight: 800; font-size: 0.78rem; letter-spacing: 0.1em; text-transform: uppercase; }
.fn-hero { max-width: 660px; padding: 8px 0 4px; }
.fn-hero h1 { font-size: clamp(2.2rem, 6vw, 3.6rem); margin-top: 10px; }
.fn-hand { font-size: 1.25rem; margin: 10px 0 0 6px; }
.fn-squiggle { display: block; width: 110px; margin: 2px 0 0 auto; color: var(--red); }
.fn-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(290px, 100%), 1fr)); gap: 34px 24px; padding: 0; margin: 40px 0 30px; list-style: none; }
.fn-item { position: relative; }
.fn-item:nth-child(odd) > .fn-leaf { top: -46px; right: 26px; transform: rotate(32deg); }
.fn-item:nth-child(even) > .fn-leaf { bottom: -40px; left: -18px; transform: rotate(-125deg); }
.fn-card { position: relative; height: 100%; display: flex; flex-direction: column; gap: 10px; border-radius: 30px 22px 32px 24px; transition: transform 0.15s, border-color 0.15s; }
.fn-card:hover, .fn-card:focus-within { border-color: var(--red); transform: translateY(-3px); }
.fn-card h2 { margin: 0; font-size: 1.2rem; line-height: 1.25; }
.fn-card h2 a { color: inherit; text-decoration: none; }
.fn-card h2 a::after { content: ""; position: absolute; inset: 0; border-radius: inherit; }
.fn-card p { margin: 0; color: var(--muted); font-size: 0.95rem; }
.fn-medal { width: 64px; height: 64px; border-radius: 50%; display: grid; place-items: center; font-size: 1.9rem; }
.fn-meta { display: flex; flex-wrap: wrap; gap: 6px 10px; align-items: center; font-size: 0.82rem; font-weight: 700; color: var(--muted); }
.fn-card .fn-meta { margin-top: auto; padding-top: 6px; }
.fn-more { color: var(--red); font-weight: 800; margin-left: auto; }
.fn-cta { background: var(--green-soft); border-color: #cfe6cc; align-items: flex-start; }
.fn-cta p { color: var(--ink); }
.fn-sprout { width: 64px; height: 64px; }
.fn-article { max-width: 760px; margin: 0 auto; }
.fn-article .fn-blob-a { top: -70px; right: -360px; }
.fn-article > p, .fn-article li { font-size: 1.05rem; }
.fn-article h1 { margin-top: 8px; }
.fn-back { font-weight: 800; text-decoration: none; }
.fn-panel { position: relative; margin: 28px 0; border-radius: 30px 22px 32px 24px; }
.fn-panel > h2 { margin-top: 0; }
.fn-panel > .fn-leaf { top: -48px; right: 30px; transform: rotate(30deg); }
.fn-panel .quote { font-size: 1.08rem; border-left-color: var(--green); margin: 12px 0 4px; }
.fn-src { font-size: 0.85rem !important; color: var(--muted); margin: 0 0 14px; }
.fn-law { list-style: none; padding: 0; margin: 0; display: grid; gap: 14px; }
.fn-law strong { display: block; margin: 4px 0 2px; }
.fn-law p { margin: 0; }
.fn-panel-hand { position: absolute; right: 18px; bottom: -20px; font-size: 1.05rem; background: var(--bg); padding: 2px 8px; border-radius: 10px; }
.fn-panel-hand .fn-squiggle { width: 90px; }
.fn-next { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 34px 0 12px; }
.fn-next a { display: block; padding: 14px 18px; border: 1px solid var(--line); border-radius: 20px; background: var(--card); text-decoration: none; color: inherit; font-weight: 800; box-shadow: 0 4px 14px rgba(120, 72, 40, 0.05); }
.fn-next a:hover { border-color: var(--red); }
.fn-next small { display: block; color: var(--muted); font-weight: 700; }
.fn-next .fn-right { text-align: right; grid-column: 2; }
@media (max-width: 560px) { .fn-next { grid-template-columns: 1fr; } .fn-next .fn-right { grid-column: 1; text-align: left; } .fn-blob-a { width: 420px; right: -240px; } }
@media (prefers-reduced-motion: reduce) { .fn-card { transition: none; } .fn-card:hover, .fn-card:focus-within { transform: none; } }
`

/* ---------- the five notes ---------- */
interface Note { slug: string; title: string; blurb: string; ico: string; tint: string; keys: string[]; body: ReactNode; cta?: { to: string; text: string } }

const EVIDENCE = [ // README.md, "How the Plattr score works", table 1
  { cls: 'ev-verified', label: 'Verified record', means: "Checked against a public record or a certifier's listing. Full weight (1.0)." },
  { cls: 'ev-document', label: 'Document on file', means: 'The producer names and dates a report or certificate they hold; nothing is uploaded or checked in this prototype. Weight 0.9.' },
  { cls: 'ev-declared', label: 'Producer-declared', means: "The producer's own statement. Weight 0.5 — half the points of a verified record." },
  { cls: 'ev-missing', label: 'Not provided', means: 'Nothing was given. Weight 0. It is shown, never hidden.' },
]
const PARTS: [string, string, string][] = [ // README.md, table 2: section, animal products, plant products
  ['Farm origin', '20', '20'], ['Feed and grazing', '15', '—'], ['Space and welfare', '15', '—'], ['Animal health records', '15', '—'],
  ['Soil, fertilizers and pesticides', '—', '25'], ['Water quality', '10', '20'], ['Certifications', '10', '15'], ['Safety testing and recalls', '15', '20'],
]

const NOTES: Note[] = [
  {
    slug: 'grass-fed-vs-grass-finished', ico: '🌾', tint: '#eef3e6', keys: ['grass_fed', 'grass_finished'],
    title: 'What grass-fed really means (and why grass-finished is different)',
    blurb: 'Two labels that sound like twins. USDA guidance treats them as different claims.',
    body: <>
      <p>“Grass-fed” and “grass-finished” sound like two ways of saying the same thing. In the USDA guidance behind beef labels, they are not.</p>
      <p>For <strong>grass-fed</strong>, the FSIS guideline describes cattle that were only (100%) fed forage, such as grass, after being weaned from their mother's milk. It adds that such animals are never confined to a feedlot.</p>
      <p><strong>Grass-finished</strong> is a separate claim. The same guideline says it is not synonymous with grass-fed, and that grass-finished animals can be fed grain. So grass-finished does not mean the animal never ate grain.</p>
      <p>Both statements come from an FSIS guideline dated August 2024 — guidance, not law. That is why Plattr's form for ranchers asks two plain questions next to this claim: after weaning, were the cattle ever fed grain, and were they ever confined to a feedlot? The answers are shown as the rancher's own words, and the caveat stays beside the claim: a rancher cannot edit or remove it.</p>
    </>,
  },
  {
    slug: 'uncured-is-not-nitrite-free', ico: '🏷️', tint: '#fdebdc', keys: ['uncured', 'nitrite'],
    title: 'Uncured does not mean nitrite-free',
    blurb: 'What the federal rule behind “Uncured” and “No Nitrate or Nitrite Added” covers — and what it leaves out.',
    body: <>
      <p>You may see “Uncured” and “No Nitrate or Nitrite Added” on a meat label. Here is what the federal rule behind those words covers, and what it leaves out.</p>
      <p>The rule says a product may be prepared without nitrate or nitrite and still carry its standard name, as long as that name is immediately preceded by the term “Uncured”.</p>
      <p>The catch: the rule is about <em>added</em> sodium or potassium nitrate and nitrite. Ingredients such as celery powder can be listed on a product labeled Uncured. The label tells you they are present — not how much nitrite they contribute.</p>
      <p>Where nitrite is used for curing, a separate rule caps it at 200 parts per million of nitrite in the finished product, calculated as sodium nitrite. Again, the label tells you nitrite is present, not how much was used.</p>
      <p>Plattr points out these words when it finds them in an ingredient list: “uncured”, “celery powder”, “celery juice”, “cultured celery”, “sodium nitrite” and “potassium nitrite”. This is information about labels, not medical advice.</p>
    </>,
  },
  {
    slug: 'the-number-on-your-meat-package', ico: '🏭', tint: '#e8f1fb', keys: ['cattle_id_not_public'],
    title: 'The little number on your meat package',
    blurb: 'The USDA establishment number: how to find it, what it unlocks, and why a plant is not a farm.',
    cta: { to: '/plant-lookup', text: 'Look up a plant number' },
    body: <>
      <p>Every federally inspected beef package carries a <strong>USDA establishment number</strong>. It is printed on the pack and looks like <code>EST. 86R</code>, <code>M9714</code> or <code>P-13556</code>.</p>
      <p><strong>How to find it:</strong> look on the pack for “EST.” followed by a short number, sometimes with a letter. Barcode databases almost never carry the US plant number, so you type it from the pack instead of scanning it.</p>
      <p>Type it into Plattr's <Link to="/plant-lookup">plant lookup</Link> and you see what the public federal record says about that establishment: its entry in the USDA FSIS directory (7,241 establishments in Plattr's snapshot of 2026-09-19), recalls and public-health alerts, FY2025 raw-beef sampling results and humane-handling enforcement postings — each with a source and a date. “Nothing found” is never presented as “clean” or “safe”.</p>
      <p><strong>A plant is not a farm.</strong> The establishment number identifies the plant. No public record links a beef package to the ranch or feedlot that raised the animal. Official cattle ID tags do exist — see the regulation below — but official ID is required only for certain cattle moving between states, the records are held by animal-health officials, there is no public lookup, and nothing links a tag to an establishment number or to a package.</p>
    </>,
  },
  {
    slug: 'raised-without-antibiotics', ico: '💊', tint: '#fdecea', keys: ['raised_without_antibiotics'],
    title: 'Raised without antibiotics: what the claim covers',
    blurb: 'What FSIS guidance expects behind the words, and the market-wide study Plattr always shows beside them.',
    body: <>
      <p>“Raised without antibiotics” is a claim about the whole production process. FSIS guidance spells out what it covers.</p>
      <p>To use the claim, source animals cannot be given antibiotics in their feed, in their water or by injection at any point in the production process. That includes ionophores, which FSIS recognizes as antibiotics — so Plattr's form for ranchers asks about ionophores by name.</p>
      <p>This is FSIS guidance, not law.</p>
      <p>Plattr always shows one more thing beside this claim. In a press release of 28 August 2024, USDA reported a study that found antibiotic residues in approximately 20% of samples tested from the “Raised Without Antibiotics” market. <strong>That finding is about the market as a whole.</strong> It is not about any particular ranch, brand or product, and it says nothing about any food you look up on Plattr.</p>
      <p>A rancher cannot edit or remove that caveat. It is there for context and is not medical advice.</p>
    </>,
  },
  {
    slug: 'how-to-read-a-plattr-passport', ico: '📖', tint: '#fff3c4', keys: [],
    title: 'How to read a Plattr passport',
    blurb: 'Evidence labels, the parts of the score, and what the SAMPLE marker means.',
    cta: { to: '/explore', text: 'Open a passport in the food library' },
    body: <>
      <p>A product passport is the page you land on when you scan a food's QR code or barcode. It covers farm origin, soil, water, feed and grazing, space and welfare, animal health history, certifications, safety testing, a hazard outlook for the sourcing region, and nutrition.</p>
      <h2>1. Read the evidence label on every fact</h2>
      <p>Every fact carries a label in words — never colour alone — saying how well it is backed up, so a producer's own statement never passes as a verified record.</p>
      <ul className="fn-law">
        {EVIDENCE.map(e => <li key={e.label}><span className={`chip ${e.cls}`}>{e.label}</span> <span>{e.means}</span></li>)}
      </ul>
      <h2>2. See where the score comes from</h2>
      <p>The Plattr score runs from 0 to 100. Each section earns the average weight of its facts multiplied by the section's maximum points, rounded; an empty section earns 0. Hazard notes, nutrition and price do not affect the score.</p>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead><tr><th scope="col">Section</th><th scope="col">Animal products, max points</th><th scope="col">Plant products, max points</th></tr></thead>
          <tbody>{PARTS.map(([s, a, p]) => <tr key={s}><th scope="row">{s}</th><td>{a}</td><td>{p}</td></tr>)}</tbody>
        </table>
      </div>
      <p>The total is graded with a letter and a word: {GRADE_BANDS.map(b => `${b.grade} (${b.word}) ${b.band}`).join(', ')}. An F means little is documented, not that a food is unsafe. The <Link to="/how-it-works">How it works</Link> page shows two worked examples.</p>
      <h2>3. Look for the SAMPLE marker</h2>
      <p>The sample product passports in this demo, and the farms behind them, are fictional. Each one is marked <span className="chip ev-missing">Sample</span> on screen. Passports a producer creates are whatever the producer typed — shown as Producer-declared, not checked by Plattr.</p>
      <section className="panel fn-panel">
        <Leaf />
        <h2>In Plattr's own words</h2>
        <blockquote className="quote">“The score measures how much of this food's story is documented and backed up — it is not a medical or food-safety guarantee.”</blockquote>
        <p className="fn-src">Source: Plattr README, “How the Plattr score works”. A high score means the producer has shown their work. It does not mean a food is safe, healthy or right for you, and a low score does not mean a food is unsafe.</p>
        <h2>Is this law or guidance?</h2>
        <p style={{ margin: 0 }}><span className="chip ev-missing">Neither</span> The Plattr score is Plattr's own rubric. It is not a regulation and not a government rating.</p>
      </section>
    </>,
  },
]

/* ---------- pages ---------- */
function Index({ data }: { data?: ClaimsFile }) {
  return (
    <div className="fn"><div className="fn-in">
      <Blob className="fn-blob-a" /><Blob className="fn-blob-b" />
      <header className="fn-hero">
        <p className="fn-kicker"><span aria-hidden="true">🌱</span> Plattr learn</p>
        <h1>Field notes</h1>
        <p className="lede">Five one-minute reads on what the words on a food label really mean. Each note quotes the regulation or guidance behind the label, links to the source, and says plainly whether it is law or only guidance.</p>
        <span className="hand fn-hand">Read the label, then read behind it<Squiggle /></span>
      </header>
      <ul className="fn-grid">
        {NOTES.map((n, i) => {
          const chip = data && lawChip(entriesFor(data, n.keys))
          return (
            <li className="fn-item" key={n.slug}>
              <Leaf />
              <article className="panel fn-card">
                <span className="fn-medal" style={{ background: n.tint }} aria-hidden="true">{n.ico}</span>
                <h2><Link to={`/learn/${n.slug}`}>{n.title}</Link></h2>
                <p>{n.blurb}</p>
                <div className="fn-meta">
                  <span>Note {i + 1} · 1-minute read</span>
                  {chip && <span className={`chip ${chip.cls}`}>{chip.text}</span>}
                  <span className="fn-more" aria-hidden="true">Read →</span>
                </div>
              </article>
            </li>
          )
        })}
        <li className="fn-item">
          <Leaf />
          <div className="panel fn-card fn-cta">
            <Sprout />
            <h2>Now try it on a real food</h2>
            <p>Open a product passport, or type the establishment number from a beef pack.</p>
            <div className="fn-meta">
              <Link className="btn small" to="/explore">Explore a food <span aria-hidden="true">→</span></Link>
              <Link className="btn small secondary" to="/plant-lookup">Plant lookup</Link>
            </div>
          </div>
        </li>
      </ul>
      <div className="note" role="note">
        <strong>Where these notes come from:</strong> the quotes are USDA FSIS guidance and the Code of Federal Regulations{data && <>, retrieved {data.retrieved}</>}, each
        checked word for word against a saved copy of its source. Field notes are informational — not medical advice and not a food-safety guarantee.
      </div>
    </div></div>
  )
}

function Article({ note, index, data, error }: { note: Note; index: number; data?: ClaimsFile; error?: string }) {
  const entries = data ? entriesFor(data, note.keys) : []
  const prev = NOTES[index - 1], next = NOTES[index + 1]
  return (
    <div className="fn"><article className="fn-in fn-article">
      <Blob className="fn-blob-a" />
      <p><Link to="/learn" className="fn-back"><span aria-hidden="true">← </span>All field notes</Link></p>
      <p className="fn-meta"><span className="fn-medal" style={{ background: note.tint, width: 44, height: 44, fontSize: '1.3rem' }} aria-hidden="true">{note.ico}</span> Field note {index + 1} of {NOTES.length} · 1-minute read</p>
      <h1>{note.title}</h1>
      <p className="lede">{note.blurb}</p>
      {note.body}

      {note.keys.length > 0 && (error ? <p className="warn" role="alert">Could not load the source quotes: {error}</p> : !data ? <Loading what="the source quotes" /> : <>
        <section className="panel fn-panel">
          <Leaf />
          <h2>In the source's own words</h2>
          {entries.map(e => (
            <div key={e.key}>
              {e.quote && <>
                <blockquote className="quote">“{e.quote}”</blockquote>
                <p className="fn-src">{e.label} — <a href={e.url} target="_blank" rel="noreferrer">{e.source}</a> (opens in a new tab)</p>
              </>}
              {e.caveat_quote && <>
                <blockquote className="quote">“{e.caveat_quote}”</blockquote>
                <p className="fn-src">About the market as a whole, not any one ranch or product — <a href={e.caveat_url} target="_blank" rel="noreferrer">{e.caveat_source}</a> (opens in a new tab)</p>
              </>}
            </div>
          ))}
          <span className="hand fn-panel-hand" aria-hidden="true">straight from the source<Squiggle /></span>
        </section>
        <section className="panel fn-panel">
          <h2>Is this law or guidance?</h2>
          <ul className="fn-law">
            {entries.map(e => (
              <li key={e.key}>
                <span className={`chip ${e.is_binding_law ? 'ev-verified' : 'ev-document'}`}>{e.is_binding_law ? 'Binding law' : 'Guidance, not law'}</span>
                <strong>{e.label}</strong>
                <p className="muted">{e.is_binding_law ? 'A binding federal regulation' : 'Agency guidance, not a binding regulation'}: {e.source}.</p>
                {e.caveat && !e.caveat_quote && <p><em>What Plattr always adds:</em> {e.caveat}</p>}
              </li>
            ))}
          </ul>
        </section>
        <p className="caveat">Quotes retrieved {data.retrieved} and checked word for word against a saved copy of each source. Informational only — not medical advice.</p>
      </>)}

      {note.cta && <p><Link className="btn" to={note.cta.to}>{note.cta.text} <span aria-hidden="true">→</span></Link></p>}
      <nav className="fn-next" aria-label="More field notes">
        {prev && <Link to={`/learn/${prev.slug}`}><small><span aria-hidden="true">← </span>Previous note</small>{prev.title}</Link>}
        {next && <Link className="fn-right" to={`/learn/${next.slug}`}><small>Next note<span aria-hidden="true"> →</span></small>{next.title}</Link>}
      </nav>
    </article></div>
  )
}

export default function LearnPage() {
  const { slug } = useParams()
  const { data, error } = useData(loadClaims)
  useEffect(() => { window.scrollTo(0, 0) }, [slug])
  const index = NOTES.findIndex(n => n.slug === slug)
  return (
    <>
      <style>{CSS}</style>
      {!slug ? <Index data={data} />
        : index < 0 ? <><h1>Field note not found</h1><p>There is no field note at this address. <Link to="/learn">See all five field notes</Link>.</p></>
        : <Article note={NOTES[index]} index={index} data={data} error={error} />}
    </>
  )
}
