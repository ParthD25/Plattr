// Parasites and hazards library: /library/hazards (index, filter by kind) and /library/hazards/:slug (one entry).
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { HAZARDS, NOT_MEDICAL_ADVICE, SAFE_TEMPS, SAFE_TEMPS_URL, hazardSlug, type HazardEntry, type HazardKind } from '../../library/hazards'
import { usePassports } from '../../passport/usePassports'

const KINDS: Record<HazardKind, { label: string; plural: string; emoji: string; blurb: string }> = {
  bacteria: { label: 'Bacteria', plural: 'Bacteria', emoji: '🦠', blurb: 'Living microbes that cooking kills and cold slows down.' },
  parasite: { label: 'Parasite', plural: 'Parasites', emoji: '🪱', blurb: 'Organisms that live in or on an animal, a fish or a person. Some only affect the animal.' },
  virus: { label: 'Virus', plural: 'Viruses', emoji: '🧬', blurb: 'Spread mostly by people handling food.' },
  heavy_metal: { label: 'Heavy metal', plural: 'Heavy metals', emoji: '🧪', blurb: 'Come from soil and water. Cooking and washing do not remove them, so sourcing matters.' },
  toxin: { label: 'Natural toxin', plural: 'Natural toxins', emoji: '🌾', blurb: 'Made by moulds in the field. Controlled by testing before food reaches you.' },
}
const USED_KINDS = (Object.keys(KINDS) as HazardKind[]).filter(k => HAZARDS.some(h => h.kind === k))
const LIKELIHOOD = { low: 'Low', moderate: 'Moderate', elevated: 'Elevated' }

const CSS = `
.hzl-head { position: relative; padding: 4px 0; }
.hzl-head::before { content: ""; position: absolute; top: -34px; right: -70px; width: 340px; height: 270px; background: var(--blob); border-radius: 46% 54% 60% 40% / 50% 45% 55% 50%; z-index: -1; }
@media (max-width: 600px) { .hzl-head::before { width: 220px; height: 180px; right: -50px; } }
.hzl-head .hand { font-size: 1.25rem; margin: 0 0 0 6px; }
.hzl-kind { display: flex; align-items: center; gap: 12px; margin: 30px 0 4px; }
.hzl-kind .ico, .hzl-hero .ico { width: 52px; height: 52px; flex: none; border-radius: 50%; display: grid; place-items: center; background: var(--green-soft); font-size: 1.6rem; }
.hzl-kind h2 { margin: 0; }
.hzl .tiles { margin: 12px 0 0; }
.hzl .tiles a { border-radius: 22px; }
.hzl .tiles strong { display: block; font-size: 1.05rem; line-height: 1.25; margin: 8px 0 4px; }
.hzl .tiles small + small { margin-top: 6px; }
.hzl-hero { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
.hzl-hero .ico { width: 84px; height: 84px; font-size: 2.6rem; background: #fdebdc; }
.hzl-hero h1 { margin: 0 0 6px; }
.hzl-two { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 14px; }
.hzl-two .panel { padding: 18px; }
.hzl-two h3 { font-size: 1.05rem; margin-bottom: 6px; }
.hzl-two p { margin: 0; }
.hzl .badge a { color: inherit; }
.hzl-temps { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; padding: 0; margin: 12px 0; list-style: none; }
.hzl-temps li { background: var(--card); border: 1px solid var(--line); border-radius: 18px; padding: 12px 16px; }
.hzl-temps .stat { display: block; color: var(--red); }
.hzl-foot { display: flex; flex-wrap: wrap; gap: 8px 20px; margin-top: 26px; }
`

function SafeTemps() {
  return (
    <section aria-labelledby="hzl-temps">
      <h2 id="hzl-temps">Safe minimum internal temperatures</h2>
      <p className="muted" style={{ margin: 0 }}>The single most useful kitchen control. Use a food thermometer; colour is not a reliable guide.</p>
      <ul className="hzl-temps">
        {SAFE_TEMPS.map(t => <li key={t.what}><span className="stat">{t.temp}</span>{t.what}</li>)}
      </ul>
      <p className="caveat">Source: <a href={SAFE_TEMPS_URL} target="_blank" rel="noreferrer">FoodSafety.gov, Safe Minimum Internal Temperatures (USDA)</a>.</p>
    </section>
  )
}

function Index() {
  const [params, setParams] = useSearchParams()
  const wanted = params.get('kind') as HazardKind | null
  const kind = wanted && USED_KINDS.includes(wanted) ? wanted : 'all'
  const shownKinds = kind === 'all' ? USED_KINDS : [kind]
  return (
    <div className="hzl">
      <style>{CSS}</style>
      <header className="hzl-head">
        <h1>Parasites and hazards</h1>
        <p className="lede narrow" style={{ marginLeft: 0 }}>
          Plain-language background on {HAZARDS.length} food hazards, including the ones named on Plattr passports: what each one is, the foods where it matters, and how farms and kitchens keep it in check.
        </p>
        <p className="hand">know it, then cook it right</p>
      </header>
      <div className="note" role="note">
        Written from public CDC, FDA and USDA pages; every entry links to its source. {NOT_MEDICAL_ADVICE}
      </div>

      <div className="tabs" role="group" aria-label="Filter by kind of hazard">
        {(['all', ...USED_KINDS] as const).map(k => (
          <button key={k} type="button" aria-pressed={kind === k} onClick={() => setParams(k === 'all' ? {} : { kind: k }, { replace: true })}>
            {k === 'all' ? `All (${HAZARDS.length})` : `${KINDS[k].plural} (${HAZARDS.filter(h => h.kind === k).length})`}
          </button>
        ))}
      </div>

      {shownKinds.map(k => (
        <section key={k} aria-labelledby={`hzl-${k}`}>
          <div className="hzl-kind">
            <span className="ico" aria-hidden="true">{KINDS[k].emoji}</span>
            <div><h2 id={`hzl-${k}`}>{KINDS[k].plural}</h2><p className="caveat" style={{ margin: 0 }}>{KINDS[k].blurb}</p></div>
          </div>
          <ul className="tiles">
            {HAZARDS.filter(h => h.kind === k).map(h => (
              <li key={h.slug}>
                <Link to={`/library/hazards/${h.slug}`}>
                  <span className="chip">{KINDS[h.kind].label}</span>
                  <strong>{h.name}</strong>
                  <small>Also called: {h.also_called.join(', ')}</small>
                  <small>Matters for: {[...new Set(h.foods.flatMap(f => f.category ?? [])), ...(h.foods.some(f => !f.category) ? ['other foods'] : [])].join(', ')}</small>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <SafeTemps />
      <p className="hzl-foot"><Link className="link-arrow" to="/library">Back to the library</Link><Link className="link-arrow" to="/explore">Find a food and see its hazard outlook</Link></p>
    </div>
  )
}

function Detail({ h }: { h: HazardEntry }) {
  const { passports, error } = usePassports()
  const seen = (passports ?? []).flatMap(p => p.hazards.filter(x => hazardSlug(x.name) === h.slug).map(x => ({ p, x })))
  return (
    <article className="hzl">
      <style>{CSS}</style>
      <header className="hzl-head hzl-hero">
        <span className="ico" aria-hidden="true">{KINDS[h.kind].emoji}</span>
        <div>
          <h1>{h.name}</h1>
          <p style={{ margin: 0 }}><span className="chip">{KINDS[h.kind].label}</span> <span className="muted">Also called: {h.also_called.join(', ')}</span></p>
        </div>
      </header>

      <h2>What it is</h2>
      <p className="narrow" style={{ marginLeft: 0 }}>{h.what_it_is}</p>

      <h2>Foods where it matters</h2>
      <ul className="badges">
        {h.foods.map(f => (
          <li key={f.name} className="badge">
            {f.category ? <Link to={`/explore?category=${f.category}`} aria-label={`${f.name}: browse ${f.category} foods`}>{f.name}</Link> : f.name}
          </li>
        ))}
      </ul>
      <p className="caveat">Linked foods open that category in Find a food.</p>

      <div className="hzl-two" style={{ marginTop: 18 }}>
        <section className="panel"><h2 style={{ marginTop: 0 }}>Where it matters</h2><p>{h.where_it_matters}</p></section>
        <section className="panel"><h2 style={{ marginTop: 0 }}>Who is most at risk</h2><p>{h.who_is_most_at_risk}</p></section>
      </div>

      <h2>How it is controlled</h2>
      <div className="hzl-two">
        <section className="panel"><h3><span aria-hidden="true">🚜 </span>On the farm and at the processor</h3><p>{h.how_it_is_controlled.farm}</p></section>
        <section className="panel"><h3><span aria-hidden="true">🍳 </span>In your kitchen</h3><p>{h.how_it_is_controlled.kitchen}</p></section>
      </div>

      <h2>Seen on these sample passports</h2>
      {error ? <p className="warn" role="alert">Could not load passports: {error}</p>
        : !passports ? <p className="muted" aria-live="polite">Loading passports…</p>
        : seen.length === 0 ? <p className="muted">No passport lists this hazard right now.</p>
        : (
          <ul className="rows">
            {seen.map(({ p, x }) => (
              <li key={p.id + x.name}>
                <Link className="row" to={`/food/${p.id}`}>
                  <span className="ico" aria-hidden="true">{p.emoji}</span>
                  <span><strong>{p.name}</strong><span className="sub">Listed as "{x.name}" · likelihood on this passport: {LIKELIHOOD[x.likelihood]}</span></span>
                  <span className="chip" style={p.sample ? { color: '#6b5200' } : undefined}>{p.sample ? 'Sample' : 'Made in this browser'}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      <p className="caveat">Sample passports are fictional demo data. A hazard listed on a passport is regional background, not a test result for that product.</p>

      <div className="card card-verified">
        <div className="card-body"><strong>Source:</strong> <a href={h.url} target="_blank" rel="noreferrer">{h.source}</a>. Safe cooking temperatures: <a href={SAFE_TEMPS_URL} target="_blank" rel="noreferrer">FoodSafety.gov (USDA)</a>.</div>
        <footer className="card-source">{NOT_MEDICAL_ADVICE}</footer>
      </div>

      <p className="hzl-foot"><Link className="link-arrow" to="/library/hazards">All parasites and hazards</Link><Link className="link-arrow" to={`/library/hazards?kind=${h.kind}`}>More {KINDS[h.kind].plural.toLowerCase()}</Link></p>
    </article>
  )
}

export default function HazardsPage() {
  const { slug } = useParams()
  if (!slug) return <Index />
  const h = HAZARDS.find(x => x.slug === slug)
  if (h) return <Detail h={h} />
  return (
    <>
      <h1>Hazard not found</h1>
      <p>The library has no entry called "{slug}". <Link to="/library/hazards">See all parasites and hazards</Link>.</p>
    </>
  )
}
