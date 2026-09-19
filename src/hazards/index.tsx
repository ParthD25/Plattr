// Contract: the passport page renders <HazardPanel passport={p} />. Owner: hazards builder.
import { Link } from 'react-router-dom'
import { hazardSlug } from '../library/hazards'
import type { Category, Hazard, Passport } from '../passport/types'

type Likelihood = Hazard['likelihood']
const LEVELS: Likelihood[] = ['low', 'moderate', 'elevated']
const LEVEL_LABEL: Record<Likelihood, string> = { low: 'Low', moderate: 'Moderate', elevated: 'Elevated' }
const KIND_LABEL: Record<Hazard['kind'], string> = { parasite: 'Parasite', bacteria: 'Bacteria', heavy_metal: 'Heavy metal', toxin: 'Natural toxin' }

/** Highest likelihood among a passport's hazards; null when none are listed. */
export function worstLikelihood(passport: Pick<Passport, 'hazards'>): Likelihood | null {
  const worst = Math.max(-1, ...(passport.hazards ?? []).map(h => LEVELS.indexOf(h.likelihood)))
  return worst < 0 ? null : LEVELS[worst]
}

const HANDLING: { category: Category; text: string }[] = [
  { category: 'beef', text: 'Beef: cook ground beef to 160 F.' },
  { category: 'poultry', text: 'Poultry: cook to 165 F.' },
  { category: 'eggs', text: 'Eggs: cook until yolks are firm.' },
  { category: 'fish', text: 'Fish: cook to 145 F.' },
  { category: 'produce', text: 'Produce: rinse under running water.' },
  { category: 'dairy', text: 'Dairy: keep at 40 F or below.' },
]

const CSS = `
.hz-meter { display: inline-flex; gap: 4px; vertical-align: middle; margin-right: 8px; }
.hz-meter i { width: 22px; height: 10px; border-radius: 999px; border: 1.5px solid var(--ink); background: transparent; }
.hz-meter i.on { background: var(--ink); }
.hz-like { font-weight: 800; }
.hz-card dl { margin: 8px 0 0; display: grid; gap: 8px; }
.hz-card dt { font-weight: 800; font-size: 0.9rem; }
.hz-card dd { margin: 2px 0 0; }
.hz-handling { margin: 8px 0; padding-left: 20px; }
.hz-handling li { margin: 4px 0; }
`

function Meter({ level }: { level: Likelihood }) {
  const n = LEVELS.indexOf(level) + 1
  return (
    <p style={{ margin: '4px 0 0' }}>
      <span className="hz-meter" aria-hidden="true">{LEVELS.map((l, i) => <i key={l} className={i < n ? 'on' : undefined} />)}</span>
      <span className="hz-like">Likelihood: {LEVEL_LABEL[level]}</span> <span className="muted">(step {n} of 3: Low / Moderate / Elevated)</span>
    </p>
  )
}

export default function HazardPanel({ passport: p }: { passport: Passport }) {
  const hazards = p.hazards ?? []
  const worst = worstLikelihood(p)
  return (
    <section className="hz" aria-labelledby="hazards">
      <style>{CSS}</style>
      <h2 id="hazards"><span className="ico" aria-hidden="true">🔬</span>Parasites and hazards where this food comes from</h2>
      <div className="note" role="note">
        General background for the sourcing region, not a live surveillance feed.
        {p.sample && <> <span className="chip" style={{ color: '#6b5200' }}>Sample</span> This is a SAMPLE passport: the farm and what it reports are fictional demo data.</>}
      </div>

      {hazards.length === 0
        ? <p>No hazards have been reported for this product's sourcing region.</p>
        : <>
          {worst && <p className="muted" style={{ margin: '0 0 4px' }}>{hazards.length} listed · highest likelihood: <strong>{LEVEL_LABEL[worst]}</strong></p>}
          {hazards.map(h => { const slug = hazardSlug(h.name); return (
            <div key={h.name} className="card hz-card">
              <div className="card-head">
                <h3>{slug ? <Link to={`/library/hazards/${slug}`} title="What this is, in the Plattr library">{h.name}</Link> : h.name}</h3>
                <span className="chip">{KIND_LABEL[h.kind] ?? h.kind}</span>
              </div>
              <div className="card-body">
                <Meter level={h.likelihood} />
                <dl>
                  <div><dt>Why it matters in {p.farm.city}, {p.farm.state}</dt><dd>{h.regional_relevance}</dd></div>
                  <div><dt>Outlook</dt><dd>{h.outlook}</dd></div>
                  <div>
                    <dt>What the farm does</dt>
                    <dd>
                      {h.what_the_farm_does || 'Nothing reported by the producer'}{' '}
                      {h.what_the_farm_does
                        ? <span className="chip ev-declared">Producer-declared</span>
                        : <span className="chip ev-missing">Not provided</span>}
                    </dd>
                  </div>
                </dl>
              </div>
              <footer className="card-source">
                Source: {h.url ? <a href={h.url} target="_blank" rel="noreferrer">{h.source}</a> : h.source}
              </footer>
            </div>
          ) })}
        </>}
      <p><Link className="link-arrow" to="/library/hazards">All parasites and hazards</Link></p>

      <h3>Safe handling at home</h3>
      <ul className="hz-handling">
        {HANDLING.map(l => (
          <li key={l.category}>{l.category === p.category ? <strong>{l.text} (this product's category)</strong> : l.text}</li>
        ))}
      </ul>
      <p className="muted" style={{ fontSize: '0.85rem' }}>
        From USDA FSIS / FDA safe food handling:{' '}
        <a href="https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures" target="_blank" rel="noreferrer">safe minimum internal temperatures</a>.
        General information, not medical advice and not a food-safety guarantee.
      </p>
    </section>
  )
}
