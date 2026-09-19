// The full product passport a shopper sees after scanning. Every fact carries its evidence level as a text chip.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import QRCode from 'qrcode'
import { SampleBanner } from '../components/ui'
import { ScoreBadge } from '../components/ScoreBadge'
import { actions, useAccount, useStore } from '../store'
import HazardPanel from '../hazards'
import PersonalPanel, { PersonalAlerts, usePersonalSummary } from '../consumer/PersonalPanel'
import { scorePassport } from './score'
import { labelRows } from './nutritionLabel'
import { nutrientSlug } from '../library/nutrients'
import EstPrompt from './EstPrompt'
import { productionMethodLabel } from './source'
import type { Evidence, Fact, Passport } from './types'

export const EVIDENCE_LABEL: Record<Evidence, string> = { verified: 'Verified record', document: 'Document on file', declared: 'Producer-declared', community: 'Community record', missing: 'Not provided' }
const EVIDENCE_MEANS: Record<Evidence, string> = {
  verified: 'checked against a public record or a certifier’s listing',
  document: 'the producer names and dates a report or certificate they hold; Plattr has not seen it',
  declared: 'the producer’s own statement, not independently checked',
  community: 'a crowd-sourced record from Open Food Facts, not checked by Plattr',
  missing: 'nothing was provided',
}

export function EvidenceChip({ evidence }: { evidence: Evidence }) {
  // styles.css has no .ev-community; inline so the chip reads the same wherever it is reused. The text carries the meaning, not the colour.
  return <span className={`chip ev-${evidence}`} style={evidence === 'community' ? { color: '#2a5d8f' } : undefined}>{EVIDENCE_LABEL[evidence]}</span>
}

type SectionKey = 'origin' | 'soil' | 'water' | 'feed' | 'animal_welfare' | 'health_history' | 'certifications' | 'safety'
interface SectionDef { id: string; key: SectionKey; title: string; icon: string; about: string; animal?: true }
const SECTIONS: SectionDef[] = [
  { id: 'origin', key: 'origin', title: 'Farm origin', icon: '🌱', about: 'Where it was grown or raised, and when it was harvested or packed.' },
  { id: 'feed', key: 'feed', title: 'Feed and grazing', icon: '🌾', about: 'What the animals ate: grass-fed or not, hours of grazing, where feed came from.', animal: true },
  { id: 'welfare', key: 'animal_welfare', title: 'Space and welfare', icon: '🐄', about: 'Stocking density, pasture per animal and housing.', animal: true },
  { id: 'health', key: 'health_history', title: 'Animal health history', icon: '🩺', about: 'Vet reports, treatments and withdrawal periods.', animal: true },
  { id: 'soil', key: 'soil', title: 'Soil, fertilizers and pesticides', icon: '🟤', about: 'Organic matter, pH, and what was applied to the land.' },
  { id: 'water', key: 'water', title: 'Water quality', icon: '💧', about: 'Water source, last test and result.' },
  { id: 'certifications', key: 'certifications', title: 'Certifications', icon: '✅', about: 'Organic, Non-GMO, halal / kosher and other certificates.' },
  { id: 'safety', key: 'safety', title: 'Safety testing and recalls', icon: '🛡️', about: 'Recall checks and pathogen or heavy-metal tests.' },
]
/** score part key -> section anchor id */
const PART_ANCHOR: Record<string, string> = { certs: 'certifications' }

const niceDate = (iso: string) => {
  const d = new Date(iso.length === 10 ? `${iso}T00:00` : iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')

function FactList({ facts }: { facts: Fact[] }) {
  return (
    <ul className="rows">
      {facts.map((f, i) => (
        <li key={i} className="row pv-fact">
          <div>
            <span className="sub">{f.label}</span>
            <strong>{f.value || 'Not provided'}</strong>
            {(f.source || f.date) && (
              <span className="sub">
                {f.source && <>Source: {f.url ? <a href={f.url} target="_blank" rel="noreferrer">{f.source}</a> : f.source}</>}
                {f.source && f.date && ' · '}
                {f.date && <>dated {niceDate(f.date)}</>}
              </span>
            )}
          </div>
          <EvidenceChip evidence={f.evidence} />
        </li>
      ))}
    </ul>
  )
}

function Actions({ p }: { p: Passport }) {
  const account = useAccount()
  const carts = useStore().carts
  const next = encodeURIComponent(`/food/${p.id}`)
  if (!account) return <><Link className="btn" to={`/demo-account?next=${next}`}>Try the demo shopper to save this</Link><Link to={`/login?next=${next}`}>or sign in</Link></>
  if (account.role !== 'consumer') return <p className="muted">You are signed in as a producer. Shoppers can add this food to their cart from here.</p>
  const mine = (carts[account.email] ?? []).filter(c => c.passport_id === p.id)
  const inCart = mine.some(c => !c.purchased_at)
  const lastBought = mine.map(c => c.purchased_at).filter(Boolean).sort().pop()
  return (
    <>
      {inCart
        ? <><strong aria-live="polite">✓ In your cart</strong><Link className="btn small secondary" to="/history">Go to my groceries</Link></>
        : <button className="pv-add" onClick={() => actions.addToCart(account.email, p.id)}><span aria-hidden="true">🛒</span> Add to cart</button>}
      {lastBought && <span className="muted">You bought this on {niceDate(lastBought)}.</span>}
    </>
  )
}

function QrBlock({ id }: { id: string }) {
  const url = `${location.origin}/food/${id}`
  const [src, setSrc] = useState('')
  useEffect(() => {
    let live = true
    QRCode.toDataURL(url, { margin: 1, width: 220 }).then(d => live && setSrc(d), () => {})
    return () => { live = false }
  }, [url])
  return (
    <figure className="panel pv-qr">
      {src ? <img src={src} width={180} height={180} alt={`QR code that opens ${url}`} /> : <div className="pv-qr-wait muted">Drawing QR code…</div>}
      <figcaption><strong>Scan to open this passport</strong><span className="sub muted">{url}</span></figcaption>
    </figure>
  )
}

export default function PassportView({ passport: p }: { passport: Passport }) {
  const score = scorePassport(p)
  const shown = SECTIONS.filter(s => (p[s.key] ?? []).length > 0)   // ?? []: passports made in the producer portal come from localStorage
  const hasSection = (id: string) => id === 'origin' || shown.some(s => s.id === id)   // origin always renders: it is the "Where this comes from" panel
  const diet = [...(p.gluten_free ? ['Gluten-free'] : []), ...(p.dietary ?? []).map(cap)]
  const allergens = p.allergens ?? []
  const badges = p.badges ?? []
  const { kcal, rows: nutrients } = labelRows(p.nutrition?.per_serving)
  const hasNutrition = kcal !== undefined || nutrients.length > 0
  const serving = `${p.nutrition?.serving || 'serving size not provided'}${p.nutrition?.serving_g ? ` (${p.nutrition.serving_g} g)` : ''}`
  const personalSummary = usePersonalSummary(p)
  const farm = p.farm
  const place = [farm.city, farm.state, farm.country].filter(Boolean).join(', ')
  const method = productionMethodLabel(p)
  const off = p.imported_from
  const isSample = p.sample && !off

  // Deep links (#nutrition, #ingredients, #your-health, #soil ...): the passport loads after the browser has tried to scroll, and a closed drop-down hides its target.
  useEffect(() => {
    const go = () => {
      const el = location.hash.length > 1 ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null
      if (!el) return
      const drop = el.closest('details')
      if (drop) drop.open = true
      el.scrollIntoView()
    }
    go()
    window.addEventListener('hashchange', go)
    return () => window.removeEventListener('hashchange', go)
  }, [])
  /** For jump links: open the drop-down before the browser scrolls to it (hashchange does not fire when the hash is already set). */
  const openDrop = (id: string) => () => { const d = document.getElementById(id)?.closest('details'); if (d) d.open = true }

  return (
    <article className="pv">
      <style>{`
        .pv h2 { scroll-margin-top: 16px; display: flex; align-items: center; gap: 10px; }
        .pv h2 .ico { width: 40px; height: 40px; border-radius: 50%; display: inline-grid; place-items: center; background: var(--green-soft); font-size: 1.2rem; flex: none; }
        .pv .pv-fact { grid-template-columns: minmax(0, 1fr) auto; }
        .pv .pv-fact strong { overflow-wrap: anywhere; }
        @media (max-width: 480px) { .pv .pv-fact { grid-template-columns: 1fr; gap: 6px; } .pv .pv-fact .chip { justify-self: start; } }
        .pv .pv-title { font-size: clamp(1.6rem, 4vw, 2.1rem); margin: 14px 0 2px; }
        .pv .pv-price { font-size: 1.3rem; font-weight: 900; margin: 10px 0 0; }
        .pv .pv-diet .badge { background: var(--green-soft); } .pv .pv-diet .badge::before { content: "✓"; }
        .pv .pv-parts { display: grid; gap: 10px; margin: 14px 0 0; padding: 0; list-style: none; }
        .pv .pv-parts li { font-size: 0.92rem; } .pv .pv-parts .bar { height: 7px; margin: 4px 0 2px; }
        .pv .pv-parts .pv-part-head { display: flex; justify-content: space-between; gap: 8px; font-weight: 800; }
        .pv .pv-parts a { color: inherit; text-decoration: none; } .pv .pv-parts a:hover { color: var(--red); }
        .pv .pv-actions { display: flex; flex-wrap: wrap; gap: 10px 14px; align-items: center; margin: 16px 0; }
        .pv .pv-jump { display: flex; flex-wrap: wrap; gap: 8px; margin: 18px 0 0; padding: 0; list-style: none; }
        .pv .pv-animal { border-left: 6px solid var(--green); margin-top: 22px; } .pv .pv-animal h2 { margin-top: 0; }
        .pv .pv-legend { display: grid; gap: 6px; margin: 8px 0 0; padding: 0; list-style: none; font-size: 0.9rem; }
        .pv .pv-qr { display: flex; flex-wrap: wrap; gap: 16px; align-items: center; margin: 30px 0 0; }
        .pv .pv-qr img, .pv .pv-qr-wait { width: 180px; height: 180px; border-radius: 12px; background: #fff; display: grid; place-items: center; }
        .pv .pv-qr .sub { display: block; font-size: 0.85rem; overflow-wrap: anywhere; }
        .pv .pv-actions .pv-add { font-size: 1.1rem; padding: 14px 30px; box-shadow: 0 8px 20px rgba(224, 50, 47, 0.25); }
        .pv .pv-source { margin-top: 18px; border-left: 6px solid var(--red); } .pv .pv-source h2 { margin-top: 0; }
        .pv .pv-producer { font-size: 1.35rem; font-weight: 900; margin: 10px 0 0; overflow-wrap: anywhere; }
        .pv .pv-method { display: inline-flex; align-items: center; gap: 8px; margin: 12px 0 0; padding: 8px 18px; border-radius: 999px; border: 2px solid var(--ink); background: #fff; font-weight: 900; font-size: 1.05rem; }
        .pv .pv-links { display: flex; flex-wrap: wrap; gap: 8px 22px; margin: 14px 0 0; }
        .pv .pv-est { margin-top: 18px; padding-top: 14px; border-top: 1px dashed var(--line); }
        .pv .quote { font-style: normal; overflow-wrap: anywhere; }
        .pv .score-head { flex-wrap: wrap; }
        .pv .pv-drop { margin-top: 18px; padding: 0; scroll-margin-top: 16px; }
        .pv .pv-drop > summary { list-style: none; cursor: pointer; display: flex; align-items: center; gap: 14px; padding: 18px 22px; border-radius: var(--radius); }
        .pv .pv-drop > summary::-webkit-details-marker { display: none; }
        .pv .pv-drop > summary:hover { background: #fff; }
        .pv .pv-drop > summary:focus-visible { outline: 3px solid var(--blue); outline-offset: 2px; }
        .pv .pv-drop > summary h2 { margin: 0; flex: 1; min-width: 0; font-size: 1.2rem; }
        .pv .pv-drop > summary .pv-sub { font-size: 0.92rem; font-weight: 600; color: var(--muted); }
        .pv .pv-drop > summary::after { content: ""; flex: none; width: 11px; height: 11px; margin: -6px 6px 0 0; border-right: 3px solid var(--red); border-bottom: 3px solid var(--red); transform: rotate(45deg); transition: transform 0.2s; }
        .pv .pv-drop[open] > summary::after { transform: rotate(-135deg); margin-top: 6px; }
        @media (prefers-reduced-motion: reduce) { .pv .pv-drop > summary::after { transition: none; } }
        .pv .pv-drop-body { padding: 0 22px 22px; } .pv .pv-drop-body > :last-child { margin-bottom: 0; }
        .pv .pv-drop-body h3 { margin: 22px 0 6px; }
        .pv .pv-nf { max-width: 460px; border: 2px solid var(--ink); border-radius: 16px; background: #fff; padding: 12px 16px 10px; }
        .pv .pv-nf table { font-size: 0.95rem; } .pv .pv-nf th, .pv .pv-nf td { padding: 5px 0; border-bottom: 1px solid var(--ink); }
        .pv .pv-nf caption { text-align: left; font-size: 1.7rem; font-weight: 900; letter-spacing: -0.03em; line-height: 1.1; }
        .pv .pv-nf caption small { display: block; font-size: 0.9rem; font-weight: 600; letter-spacing: 0; padding: 4px 0 6px; border-bottom: 8px solid var(--ink); }
        .pv .pv-nf a { color: inherit; text-decoration-color: var(--red); text-underline-offset: 3px; } .pv .pv-nf a:hover { color: var(--red); }
        .pv .pv-nf thead th { font-size: 0.78rem; text-align: right; white-space: nowrap; } .pv .pv-nf thead th:first-child { text-align: left; } .pv .pv-nf thead th + th { padding-left: 10px; }
        .pv .pv-nf td { text-align: right; white-space: nowrap; padding-left: 10px; } .pv .pv-nf td.pct { font-weight: 800; width: 5.5em; }
        .pv .pv-nf th[scope="row"] { font-weight: 800; } .pv .pv-nf tr.indent th { padding-left: 18px; font-weight: 500; }
        .pv .pv-nf tr.cal th, .pv .pv-nf tr.cal td { font-size: 1.5rem; font-weight: 900; border-bottom-width: 5px; } .pv .pv-nf tr.cal td { font-size: 2rem; line-height: 1; }
        .pv .pv-nf tr.micro-first th, .pv .pv-nf tr.micro-first td { border-top: 6px solid var(--ink); }
        .pv .pv-nf tbody tr:last-child th, .pv .pv-nf tbody tr:last-child td { border-bottom: 0; }
        .pv .pv-nf-foot { max-width: 460px; font-size: 0.82rem; margin: 8px 0 0; }
        .pv .pv-flags { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 6px 14px; margin: 0; } .pv .pv-flags dt { font-weight: 800; } .pv .pv-flags dd { margin: 0; }
        @media (max-width: 480px) { .pv .pv-drop > summary { padding: 16px; } .pv .pv-drop-body { padding: 0 16px 18px; } .pv .pv-flags { grid-template-columns: 1fr; gap: 2px; } .pv .pv-flags dd { margin-bottom: 8px; } }
      `}</style>

      {isSample && <SampleBanner text="SAMPLE passport - fictional demo data" />}
      {off && (
        <p className="note">
          <strong>Community record.</strong> Looked up live in Open Food Facts on {niceDate(off.retrieved_at)}. Crowd-sourced record, not checked by Plattr - the label in your hand wins.{' '}
          <a href={off.url} target="_blank" rel="noreferrer">See this product on Open Food Facts</a>.{' '}
          <span className="muted">Data © Open Food Facts contributors, under the <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noreferrer">Open Database License (ODbL)</a>.</span>
        </p>
      )}

      <header className="panel passport-card">
        <div>
          <div className="food-art" aria-hidden="true">{p.emoji}</div>
          <h1 className="pv-title">{p.name}{isSample && <> <span className="chip" style={{ color: '#6b5200', verticalAlign: 'middle' }}>Sample</span></>}</h1>
          <p className="lede" style={{ margin: 0 }}>{p.tagline}</p>
          {badges.length > 0 && <ul className="badges" aria-label="Label badges">{badges.map(b => <li key={b} className="badge">{b}</li>)}</ul>}
          {diet.length > 0 && <ul className="badges pv-diet" aria-label="Dietary labels listed on this passport">{diet.map(d => <li key={d} className="badge">{d}</li>)}</ul>}
          {p.price_usd != null && <p className="pv-price">${p.price_usd.toFixed(2)}</p>}
          <p className="muted" style={{ margin: '6px 0 0', fontSize: '0.9rem' }}>
            {farm.name ? `From ${farm.name}` : 'Producer: Not provided'}{place && <> · {place}</>}{method && <> · <strong>{method}</strong></>}
          </p>
          <div className="pv-actions"><Actions p={p} /></div>
        </div>
        <div>
          <ScoreBadge score={score} label="Plattr score" />
          <p className="muted" style={{ fontSize: '0.85rem', margin: '4px 0 0' }}>
            The score shows how much of this food’s story is documented and backed up — not a medical or food-safety guarantee.
          </p>
          {off && (
            <p className="note" style={{ fontSize: '0.88rem' }}>
              <strong>This producer has not published a Plattr passport.</strong> The score counts only what a crowd-sourced record documents, so almost every product
              looked up this way starts low. It says nothing about the quality or safety of the food. Producers can raise it by <a href="/for-producers">publishing their records</a>.
            </p>
          )}
          <ul className="pv-parts" aria-label="Score breakdown">
            {score.parts.map(part => {
              const anchor = PART_ANCHOR[part.key] ?? part.key
              return (
                <li key={part.key}>
                  <div className="pv-part-head">
                    {hasSection(anchor) ? <a href={`#${anchor}`}>{part.label} ›</a> : <span>{part.label}</span>}
                    <span>{part.points}/{part.max}</span>
                  </div>
                  <div className="bar" role="img" aria-label={`${part.points} of ${part.max} points`}><span style={{ width: `${(part.points / part.max) * 100}%` }} /></div>
                  <span className="muted">{part.note}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </header>

      <PersonalAlerts passport={p} />

      <section className="panel pv-source" aria-labelledby="origin">
        <h2 id="origin"><span className="ico" aria-hidden="true">📍</span>Where this comes from</h2>
        <p className="pv-producer">{farm.name || 'Producer: Not provided'}</p>
        <p style={{ margin: 0 }}>
          {place || 'Place: Not provided'}
          {farm.approximate && <span className="muted"> · approximate location: the pin sits at the centre of the state or country, not at a real address</span>}
          {farm.acres != null && <> · {farm.acres.toLocaleString()} acres</>}
        </p>
        {method && <p className="pv-method"><span aria-hidden="true">{p.production_method === 'wild_caught' ? '🌊' : p.production_method === 'farm_raised' ? '🐟' : '❔'}</span>{method}</p>}
        {(p.origin ?? []).length > 0 ? <FactList facts={p.origin} /> : <p className="muted">Origin facts: Not provided.</p>}
        {farm.about && <p style={{ marginBottom: 0 }}>{farm.about}</p>}
        {farm.markets && farm.markets.length > 0 && <p style={{ marginBottom: 0 }}><strong>Where they sell:</strong> {farm.markets.join(' · ')}</p>}
        <p className="pv-links">
          <Link className="link-arrow" to="/map">See it on the map</Link>
          {p.est_number && <Link className="link-arrow" to={`/est/${encodeURIComponent(p.est_number)}`}>EST. {p.est_number}: see the real USDA plant record (recalls, sampling, enforcement)</Link>}
        </p>
        <EstPrompt passport={p} />
      </section>

      <nav aria-label="Passport sections">
        <ul className="pv-jump">
          {shown.filter(s => s.id !== 'origin').map(s => <li key={s.id}><a className="btn small secondary" href={`#${s.id}`}>{s.title}</a></li>)}
          <li><a className="btn small secondary" href="#hazards">Hazards</a></li>
          <li><a className="btn small secondary" href="#nutrition" onClick={openDrop('nutrition')}>Nutrition</a></li>
          {p.ingredients && <li><a className="btn small secondary" href="#ingredients" onClick={openDrop('ingredients')}>Ingredients</a></li>}
          <li><a className="btn small secondary" href="#your-health" onClick={openDrop('your-health')}>Your health data</a></li>
        </ul>
      </nav>

      <details className="note" open={!!off}>
        <summary><strong>What the evidence labels mean</strong></summary>
        <ul className="pv-legend">
          {(Object.keys(EVIDENCE_LABEL) as Evidence[]).map(e => <li key={e}><EvidenceChip evidence={e} /> {EVIDENCE_MEANS[e]}</li>)}
        </ul>
      </details>

      {shown.filter(s => s.id !== 'origin').map(s => (
        <section key={s.id} className={s.animal ? 'panel pv-animal' : undefined} aria-labelledby={s.id}>
          <h2 id={s.id}><span className="ico" aria-hidden="true">{s.icon}</span>{s.title}</h2>
          <p className="muted" style={{ margin: 0 }}>{s.about}</p>
          <FactList facts={p[s.key]} />
        </section>
      ))}

      <HazardPanel passport={p} />

      <details id="nutrition" className="panel pv-drop">
        <summary>
          <h2><span className="ico" aria-hidden="true">🥗</span><span>Nutrition facts <span className="pv-sub">- per serving ({serving})</span></span></h2>
        </summary>
        <div className="pv-drop-body">
          {hasNutrition ? (
            <>
              <div className="pv-nf">
                <table>
                  <caption>Nutrition Facts<small>Serving size: {serving}</small></caption>
                  <thead><tr><th scope="col">Nutrient</th><th scope="col">Amount</th><th scope="col">% Daily Value*</th></tr></thead>
                  <tbody>
                    {kcal !== undefined && <tr className="cal"><th scope="row"><Link to={`/library/nutrients/${nutrientSlug('kcal')}`}>Calories</Link></th><td colSpan={2}>{kcal}</td></tr>}
                    {nutrients.map((r, i) => (
                      <tr key={r.key} className={[r.indent && 'indent', r.micro && !nutrients[i - 1]?.micro && 'micro-first'].filter(Boolean).join(' ') || undefined}>
                        <th scope="row">{r.slug ? <Link to={`/library/nutrients/${r.slug}`}>{r.label}</Link> : r.label}</th>
                        <td>{r.amount} {r.unit}</td>
                        <td className="pct">{r.pct === null ? <span className="muted" style={{ fontWeight: 500 }}>no DV</span> : `${r.pct}%`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="muted pv-nf-foot">
                * % Daily Value = the amount in one serving divided by the FDA Daily Value for adults and children 4 and older (<a href="https://www.ecfr.gov/current/title-21/section-101.9" target="_blank" rel="noreferrer">21 CFR 101.9</a>), built on a 2,000 calorie reference diet.
                “no DV” = FDA sets no Daily Value for that line (calories, total sugars). A nutrient that is not listed was not provided - that is not the same as zero.
              </p>
              <p><Link className="link-arrow" to="/library/nutrients">What each nutrient does: open the nutrient library</Link></p>
            </>
          ) : <p className="note">Nutrition values: not provided on this record. That is not the same as zero - check the pack itself.</p>}

          <h3>Allergens and dietary flags</h3>
          <dl className="pv-flags">
            <dt>Allergens listed</dt>
            <dd>{allergens.length ? allergens.map(cap).join(', ') : <>None of the major allergens are listed on this passport{off && ' - that is not the same as allergen-free'}.</>}</dd>
            <dt>Gluten</dt>
            <dd>{p.gluten_free ? '✓ Recorded as gluten-free' : 'Not recorded as gluten-free'}</dd>
            <dt>Dietary labels</dt>
            <dd>{(p.dietary ?? []).length ? p.dietary.map(cap).join(', ') : 'None recorded'}</dd>
          </dl>

          {p.ingredients && (
            <>
              <h3 id="ingredients">Ingredients</h3>
              <blockquote className="quote">{p.ingredients}</blockquote>
            </>
          )}

          <p className="muted" style={{ fontSize: '0.85rem', marginTop: 18 }}>
            {isSample
              ? <><span className="chip" style={{ color: '#6b5200' }}>Sample</span> Sample values - fictional demo data, not a real product.</>
              : off
                ? <><EvidenceChip evidence="community" /> Open Food Facts community record, retrieved {niceDate(off.retrieved_at)} - crowd-sourced, not checked by Plattr.</>
                : <><EvidenceChip evidence="declared" /> Producer-entered values, not independently checked by Plattr.</>}
            {' '}The label in your hand wins. This is information, not medical advice.
          </p>
        </div>
      </details>

      <details id="your-health" className="panel pv-drop">
        <summary>
          <h2><span className="ico" aria-hidden="true">🫶</span><span>Your health data and this product <span className="pv-sub">- {personalSummary}</span></span></h2>
        </summary>
        <div className="pv-drop-body">
          <PersonalPanel passport={p} />
        </div>
      </details>

      <QrBlock id={p.id} />
    </article>
  )
}
