// /for-producers - marketing page for small farms and ranches. Every number on it is either an evidence weight
// mirrored from passport/score.ts or computed live from a SAMPLE passport with scorePassport().
import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Loading } from '../components/ui'
import { ScoreBadge } from '../components/ScoreBadge'
import { scorePassport } from '../passport/score'
import { usePassports } from '../passport/usePassports'
import type { Evidence, Fact, Passport } from '../passport/types'

const PREVIEW_ID = 'beef-sample-ridge'
const ORIGIN_MAX = 20 // "Farm origin" section maximum in passport/score.ts (same for animal and plant foods)
// Mirrors WEIGHT in passport/score.ts (not exported there).
const EVIDENCE: { ev: Evidence; label: string; weight: number; means: string }[] = [
  { ev: 'verified', label: 'Verified record', weight: 1, means: "Plattr checked it against a public record or a certifier's listing." },
  { ev: 'document', label: 'Document on file', weight: 0.9, means: 'You hold the report - a lab result, an audit, a vet record, a grazing plan - and name and date it on the passport.' },
  { ev: 'declared', label: 'Producer-declared', weight: 0.5, means: 'Your own statement, with nothing attached yet.' },
  { ev: 'missing', label: 'Not provided', weight: 0, means: 'Left blank. Shoppers see "Not provided" - it is never hidden.' },
]
const EV_CLASS: Record<Evidence, string> = { verified: 'ev-verified', document: 'ev-document', declared: 'ev-declared', community: 'ev-declared', missing: 'ev-missing' }
const FACT_KEYS = ['origin', 'soil', 'water', 'feed', 'animal_welfare', 'health_history', 'certifications', 'safety'] as const

/** The same passport with every attachment and check stripped: what it would score on claims alone. */
function claimsOnly(p: Passport): Passport {
  const copy = { ...p }
  for (const k of FACT_KEYS) copy[k] = p[k].map(f => (f.evidence === 'missing' ? f : { ...f, evidence: 'declared' as const }))
  return copy
}

const PUBLISH = [
  { ico: '🌾', bg: '#eef3e6', title: 'Acreage', text: 'How much land you work, and where it is.' },
  { ico: '🐓', bg: '#fdebdc', title: 'Pasture and coop size', text: 'Room per animal, herd size, how often the coops move.' },
  { ico: '🧺', bg: '#fde9e6', title: 'Markets', text: 'The farmers markets and stores where people can find you.' },
  { ico: '💧', bg: '#e6f0f8', title: 'Water tests', text: 'Your water source, the last test date and the result.' },
  { ico: '🧪', bg: '#f3ecf8', title: 'Fertilizers and pesticides', text: 'What goes on the field - and what does not.' },
  { ico: '🩺', bg: '#e6f4e4', title: 'Livestock health records', text: 'Vet visits, treatments and withdrawal periods.' },
  { ico: '🔎', bg: '#fff3c4', title: 'Parasite watch', text: 'What you monitor for in your region, and how.' },
  { ico: '🛡️', bg: '#eef3e6', title: 'Certifications', text: 'Organic, Non-GMO, halal or kosher, and who certified it.' },
]
const STEPS = [
  { ico: '🚜', title: 'Create a free producer account', text: 'Pick "I\'m a producer" on the sign-in page. There is a one-click demo producer if you just want to look around.', to: '/login', link: 'Create your account' },
  { ico: '📝', title: 'Fill in your farm', text: 'Acreage, pasture, markets, water, inputs, health records and your parasite watch. Skip what you do not have - blanks show as "Not provided".', to: '/producer', link: 'Open the farm profile' },
  { ico: '🔳', title: 'Build a passport and print its QR code', text: 'One passport per product. Put the QR code on the pack or your market stall; a scan lands on your passport.', to: '/producer/passports', link: 'Open the passport builder' },
]
const FAQ: { q: string; a: ReactNode }[] = [
  { q: 'Is it free?', a: <>Yes, in this prototype. Plattr is a student project: there are no plans, fees or payment forms anywhere in it.</> },
  { q: 'Who checks my claims?', a: <>Nobody inspects your farm, and Plattr says so. What you type is labelled <span className="chip ev-declared">Producer-declared</span>. Naming and dating a document you hold (a lab report, a certificate) raises a fact to <span className="chip ev-document">Document on file</span>. Only Plattr's own checks against public records - for example, that the processing plant you name exists in the USDA FSIS directory - are labelled <span className="chip ev-verified">Verified record</span>.</> },
  { q: 'Where is my data?', a: <>This prototype stores your account, farm profile and passports in your browser only (its <code>localStorage</code>). There is no server, nothing is uploaded, and passwords are stored unencrypted - so do not reuse a real password. Clearing your browser data removes it.</> },
  { q: 'What does the Plattr score actually say about my food?', a: <>It measures how much of a food's story is documented and backed up - not a medical or food-safety guarantee. A low score means less has been documented, not that a food is unsafe. <Link to="/how-it-works">See the full rubric</Link>.</> },
]

const CSS = `
.fp-hero { padding-bottom: 26px; }
.fp-hero h1 { max-width: 12ch; }
.fp-hero .lede { max-width: 36ch; }
.fp-art { position: relative; isolation: isolate; margin-top: 30px; }
.fp-art .panel { padding: 16px; }
.fp-scene { display: block; width: 100%; height: auto; border-radius: 18px; }
.fp-leaf { position: absolute; z-index: -1; pointer-events: none; }
.fp-note { position: absolute; right: 4px; top: -46px; font-size: 1.15rem; text-align: center; }
.fp-note svg, .fp-hand-inline svg { display: block; margin: 2px auto 0; }
.fp-section { position: relative; margin-top: 44px; }
.fp-section > h2 { font-size: clamp(1.5rem, 3.2vw, 2rem); letter-spacing: -0.02em; margin: 0 0 6px; font-weight: 900; }
.fp-section > .lede { max-width: 62ch; }
.fp-blob { position: absolute; z-index: -1; background: var(--blob); pointer-events: none; }
.fp-blob-l { left: -260px; top: -40px; width: 460px; height: 420px; border-radius: 58% 42% 45% 55% / 48% 58% 42% 52%; }
.fp-blob-r { right: -280px; top: 10px; width: 480px; height: 440px; border-radius: 44% 56% 52% 48% / 56% 44% 56% 44%; }
.fp-publish { grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); margin: 18px 0 0; }
.fp-publish .feature { grid-template-columns: 60px 1fr; gap: 14px; padding: 16px; }
.fp-publish .feature .ico { width: 60px; height: 60px; font-size: 1.7rem; }
.fp-publish .feature h3 { font-size: 1.05rem; } .fp-publish .feature p { margin: 2px 0 0; font-size: 0.9rem; }
.fp-weights { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 20px; align-items: start; margin-top: 18px; }
.fp-weights h3 { margin-bottom: 8px; }
.fp-ev { list-style: none; margin: 0; padding: 0; display: grid; gap: 14px; }
.fp-ev-top { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.fp-ev-top b { font-size: 1.25rem; font-weight: 900; letter-spacing: -0.02em; }
.fp-ev p { margin: 0; font-size: 0.9rem; color: var(--muted); }
.fp-ladder { list-style: none; margin: 10px 0; padding: 0; display: grid; gap: 8px; }
.fp-ladder li { display: flex; justify-content: space-between; gap: 12px; align-items: center; padding: 10px 14px; border: 1px solid var(--line); border-radius: 14px; background: #fff; }
.fp-ladder b { font-size: 1.15rem; font-weight: 900; white-space: nowrap; }
.fp-hand-inline { font-size: 1.1rem; margin: 18px 0 0 12px; text-align: center; }
.fp-steps { counter-reset: fp; margin: 18px 0 0; }
.fp-steps .feature { grid-template-columns: 1fr; gap: 10px; align-content: start; position: relative; padding-top: 26px; }
.fp-steps .feature .ico { background: var(--green-soft); }
.fp-steps .feature::before { counter-increment: fp; content: counter(fp); position: absolute; top: 16px; right: 18px; width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; background: var(--red); color: #fff; font-weight: 900; }
.fp-preview { position: relative; isolation: isolate; margin-top: 18px; }
.fp-preview .passport-card { align-items: start; }
.fp-farm-art { aspect-ratio: 2.2; font-size: 3.4rem; }
.fp-farm dl { margin: 10px 0 0; display: grid; grid-template-columns: auto 1fr; gap: 4px 14px; font-size: 0.92rem; }
.fp-farm dt { color: var(--muted); font-weight: 700; } .fp-farm dd { margin: 0; }
.fp-fact { grid-template-columns: 1fr; gap: 4px; }
.fp-foot { grid-column: 1 / -1; } .fp-foot > * { margin: 0 0 8px; } .fp-foot > :last-child { margin-bottom: 0; }
.fp-faq { display: grid; gap: 10px; margin-top: 16px; }
.fp-faq details { background: var(--card); border: 1px solid var(--line); border-radius: 18px; box-shadow: 0 4px 14px rgba(120, 72, 40, 0.05); padding: 0 18px; }
.fp-faq summary { cursor: pointer; font-weight: 800; font-size: 1.05rem; padding: 14px 0; list-style: none; display: flex; justify-content: space-between; gap: 12px; align-items: center; }
.fp-faq summary::-webkit-details-marker { display: none; }
.fp-faq summary::after { content: "+"; flex: none; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; background: var(--green-soft); color: var(--verified); font-weight: 900; }
.fp-faq details[open] summary::after { content: "-"; }
.fp-faq summary:focus-visible { outline: 3px solid var(--blue); outline-offset: 4px; border-radius: 10px; }
.fp-faq details p { margin: 0 0 16px; line-height: 1.7; }
.fp-cta { position: relative; isolation: isolate; overflow: hidden; margin-top: 44px; padding: 34px 26px; text-align: center; background: var(--green-soft); border-color: #cfe6cc; }
.fp-cta h2 { margin: 0 0 6px; font-size: clamp(1.5rem, 3.2vw, 2rem); font-weight: 900; letter-spacing: -0.02em; }
.fp-cta p { margin: 0 auto; max-width: 52ch; }
.fp-cta .hero-cta { justify-content: center; margin-bottom: 0; }
.fp-cta .btn.secondary { background: var(--card); }
@media (max-width: 860px) {
  .fp-weights { grid-template-columns: 1fr; }
  .fp-art { margin-top: 56px; }
  .fp-blob { display: none; }
}
`

function Leaf({ size = 90, color = 'var(--green)', style }: { size?: number; color?: string; style: CSSProperties }) {
  return (
    <svg className="fp-leaf" aria-hidden="true" focusable="false" width={size} height={size * 1.6} viewBox="0 0 60 96" style={style}>
      <path d="M30 95C5 70 2 32 30 1c28 31 25 69 0 94Z" fill={color} />
      <path d="M30 92V14M30 66l-13-12M30 66l13-12M30 46l-10-9M30 46l10-9" stroke="rgba(255,255,255,.45)" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  )
}

const Squiggle = () => (
  <svg aria-hidden="true" focusable="false" width="70" height="10" viewBox="0 0 70 10"><path d="M2 6c10-5 18 4 30 0s20-4 36 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" /></svg>
)

/** Barn, silo, field rows and a kraft package with a (decorative, not scannable) QR label. */
function FarmScene() {
  const sprouts = [[60, 262], [120, 250], [185, 256], [250, 268], [310, 262]]
  return (
    <svg className="fp-scene" aria-hidden="true" focusable="false" viewBox="0 0 480 300">
      <rect width="480" height="300" fill="#fdebdc" />
      <circle cx="396" cy="66" r="34" fill="#f7c65a" />
      <g fill="#fff" opacity=".85"><ellipse cx="96" cy="58" rx="40" ry="13" /><ellipse cx="124" cy="48" rx="26" ry="12" /><ellipse cx="300" cy="40" rx="30" ry="10" /></g>
      <path d="M0 190C80 150 180 150 260 180s160 20 220-20v140H0Z" fill="#bfe0b0" />
      <rect x="62" y="160" width="9" height="46" rx="3" fill="#8a5a3c" />
      <g fill="#2e9e44"><circle cx="66" cy="142" r="28" /><circle cx="46" cy="158" r="18" /><circle cx="88" cy="158" r="18" /></g>
      <rect x="262" y="112" width="36" height="100" fill="#f6efe4" /><path d="M262 112a18 18 0 0 1 36 0Z" fill="#c9bfae" />
      <path d="M262 140h36M262 168h36M262 196h36" stroke="#d8ccb9" strokeWidth="3" />
      <path d="M128 140l20-38 47-22 47 22 20 38Z" fill="#c02422" />
      <path d="M140 214v-76l14-28 41-19 41 19 14 28v76Z" fill="#e0322f" />
      <rect x="184" y="106" width="22" height="20" rx="3" fill="#fffdf9" />
      <rect x="176" y="158" width="38" height="56" rx="3" fill="#fffdf9" /><path d="M176 158l38 56M214 158l-38 56" stroke="#e0322f" strokeWidth="3" />
      <path d="M0 232c120-40 220-20 320-4s120 8 160-12v84H0Z" fill="#57b35f" />
      <g stroke="#2e9e44" strokeWidth="4" fill="none" strokeLinecap="round" opacity=".7"><path d="M10 262c110-34 210-20 330 2" /><path d="M0 286c130-34 240-18 350 6" /></g>
      <g stroke="#fffdf9" strokeWidth="5" strokeLinecap="round"><path d="M20 214v26M52 208v26M84 204v26M116 202v26" /><path d="M14 222c40-12 72-16 108-16M14 234c40-12 72-16 108-16" strokeWidth="3.5" /></g>
      {sprouts.map(([x, y]) => (
        <g key={x} transform={`translate(${x} ${y})`}><path d="M0 0v-12" stroke="#1f6f3a" strokeWidth="3" strokeLinecap="round" /><path d="M0-10c-10 0-13-6-13-11 8 0 13 4 13 11Zm0-3c9 0 12-6 12-11-8 0-12 4-12 11Z" fill="#1f6f3a" /></g>
      ))}
      <g transform="rotate(-4 400 236)">
        <rect x="346" y="192" width="112" height="92" rx="12" fill="#d9a86c" /><path d="M346 214h112" stroke="#c18f52" strokeWidth="3" />
        <rect x="358" y="222" width="88" height="52" rx="8" fill="#fffdf9" />
        <path d="M368 262c-6-7-6-16 0-24 6 8 6 17 0 24Z" fill="#2e9e44" /><path d="M378 240h14M378 249h10M378 258h14" stroke="#c9bfae" strokeWidth="4" strokeLinecap="round" />
        <g fill="none" stroke="#14161a" strokeWidth="3"><rect x="401.5" y="229.5" width="10" height="10" /><rect x="427.5" y="229.5" width="10" height="10" /><rect x="401.5" y="255.5" width="10" height="10" /></g>
        <g fill="#14161a"><rect x="416" y="230" width="5" height="5" /><rect x="421" y="240" width="5" height="5" /><rect x="416" y="246" width="5" height="5" /><rect x="428" y="246" width="5" height="5" /><rect x="434" y="252" width="5" height="5" /><rect x="422" y="258" width="5" height="5" /><rect x="430" y="262" width="5" height="5" /><rect x="404" y="246" width="5" height="5" /></g>
      </g>
    </svg>
  )
}

function Preview({ p }: { p: Passport }) {
  const score = scorePassport(p)
  const facts: Fact[] = [...p.origin, ...p.feed, ...p.soil, ...p.animal_welfare, ...p.health_history, ...p.water]
  // One fact per evidence level, so the preview shows every label a shopper can meet.
  const shown = (['verified', 'document', 'declared'] as const).map(ev => facts.find(f => f.evidence === ev)).filter((f): f is Fact => !!f)
  return (
    <div className="fp-preview">
      <Leaf size={110} style={{ left: -44, bottom: -30, transform: 'rotate(-38deg)' }} />
      <Leaf size={90} color="#57b35f" style={{ right: -36, top: 40, transform: 'rotate(32deg)' }} />
      <article className="panel passport-card" aria-label={`Sample passport preview: ${p.name}`}>
        <div className="fp-farm">
          <div className="food-art fp-farm-art" aria-hidden="true">{p.emoji}</div>
          <h3 style={{ marginTop: 14, fontSize: '1.25rem' }}>{p.farm.name}</h3>
          <p className="muted" style={{ margin: 0 }}>{p.name} · {p.farm.city}, {p.farm.state}, {p.farm.country}</p>
          {p.farm.about && <p style={{ margin: '8px 0 0' }}>{p.farm.about}</p>}
          <dl>
            {p.farm.acres != null && <><dt>Acreage</dt><dd>{p.farm.acres} acres</dd></>}
            <dt>Markets</dt><dd>{p.farm.markets?.length ? p.farm.markets.join(', ') : 'Not provided'}</dd>
          </dl>
          <ul className="badges" aria-label="Label claims">{p.badges.map(b => <li className="badge" key={b}>{b}</li>)}</ul>
        </div>
        <div>
          <ScoreBadge score={score} label="Plattr score" />
          <ul className="rows">
            {shown.map(f => (
              <li className="row fp-fact" key={f.label}>
                <strong>{f.label}</strong>
                <span className="sub">{f.value}</span>
                <span><span className={`chip ${EV_CLASS[f.evidence]}`}>{EVIDENCE.find(e => e.ev === f.evidence)!.label}</span>{f.source && <small className="muted"> · {f.source}</small>}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="fp-foot">
          {p.sample && <p className="sample-banner" role="note">SAMPLE - this farm and passport are fictional demo data</p>}
          <p className="caveat">The score shows how much of this food's story is documented and backed up - not a medical or food-safety guarantee.</p>
          <p><Link to={`/food/${p.id}`} className="link-arrow">Open the full sample passport</Link></p>
        </div>
      </article>
    </div>
  )
}

export default function ForProducersPage() {
  const { passports, error } = usePassports()
  const sample = passports?.find(p => p.id === PREVIEW_ID) ?? passports?.find(p => p.sample)
  const real = sample && scorePassport(sample)
  const bare = sample && scorePassport(claimsOnly(sample))
  return (
    <>
      <style>{CSS}</style>
      <section className="hero fp-hero">
        <div>
          <h1>Put your farm on the package.</h1>
          <p className="lede">You already do the work - the pasture moves, the water tests, the vet visits. Plattr turns it into a product passport shoppers can scan at the stall or the shelf.</p>
          <div className="hero-cta">
            <Link to="/login" className="btn">Create a free producer account <span aria-hidden="true">→</span></Link>
            <Link to="/ranchers" className="btn secondary">Try the rancher profile preview</Link>
          </div>
          <ul className="trust"><li>Free in this prototype</li><li>Your words, clearly labelled</li><li>Documents count for more</li></ul>
        </div>
        <div className="fp-art">
          <Leaf size={120} style={{ left: -52, bottom: 10, transform: 'rotate(-42deg)' }} />
          <Leaf size={84} color="#57b35f" style={{ left: -8, bottom: -46, transform: 'rotate(-78deg)' }} />
          <Leaf size={104} style={{ right: -40, top: 90, transform: 'rotate(34deg)' }} />
          <span className="hand fp-note" aria-hidden="true">Good food<br />goes deeper<Squiggle /></span>
          <div className="panel">
            <FarmScene />
            <ul className="badges" aria-label="What you get"><li className="badge">Farm profile</li><li className="badge">Product passports</li><li className="badge">A QR code for the pack</li></ul>
          </div>
        </div>
      </section>

      <section className="fp-section" aria-labelledby="fp-publish">
        <span className="fp-blob fp-blob-l" aria-hidden="true" />
        <h2 id="fp-publish">What you can publish</h2>
        <p className="lede">Share as much or as little as you like. Anything you leave out shows as "Not provided" - honest gaps beat hidden ones.</p>
        <ul className="features fp-publish">
          {PUBLISH.map(f => (
            <li className="panel feature" key={f.title}>
              <span className="ico" aria-hidden="true" style={{ background: f.bg }}>{f.ico}</span>
              <div><h3>{f.title}</h3><p>{f.text}</p></div>
            </li>
          ))}
        </ul>
      </section>

      <section className="fp-section" aria-labelledby="fp-score">
        <span className="fp-blob fp-blob-r" aria-hidden="true" />
        <h2 id="fp-score">Documents count for more than claims</h2>
        <p className="lede">Every fact on a passport carries a label saying what stands behind it, and the Plattr score weights it accordingly. Marketing words earn nothing extra; paperwork does.</p>
        <div className="fp-weights">
          <div className="panel">
            <h3>Evidence weights</h3>
            <ul className="fp-ev">
              {EVIDENCE.map(e => (
                <li key={e.ev}>
                  <div className="fp-ev-top"><span className={`chip ${EV_CLASS[e.ev]}`}>{e.label}</span><b>{e.weight * 100}%</b></div>
                  <div className="bar" aria-hidden="true"><span style={{ width: `${e.weight * 100}%` }} /></div>
                  <p>{e.means}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="panel">
              <h3>What that does to your points</h3>
              <p className="muted" style={{ margin: 0, fontSize: '0.92rem' }}>The "Farm origin" section is worth {ORIGIN_MAX} points. The same facts earn:</p>
              <ul className="fp-ladder">
                {EVIDENCE.filter(e => e.weight > 0).reverse().map(e => (
                  <li key={e.ev}><span className={`chip ${EV_CLASS[e.ev]}`}>{e.label}</span><b>{Math.round(e.weight * ORIGIN_MAX)} / {ORIGIN_MAX}</b></li>
                ))}
              </ul>
              {real && bare && sample && (
                <p className="caveat">
                  Worked on a SAMPLE (fictional) passport, <Link to={`/food/${sample.id}`}>{sample.name}</Link>: as published it scores <strong>{real.total}</strong> (grade {real.grade}).
                  Strip every document and check so it is all producer-declared, and the same facts score <strong>{bare.total}</strong> (grade {bare.grade}).
                </p>
              )}
              <p style={{ margin: '10px 0 0' }}><Link to="/how-it-works" className="link-arrow">See the full score rubric</Link></p>
            </div>
            <span className="hand fp-hand-inline" aria-hidden="true">Show your work<Squiggle /></span>
          </div>
        </div>
        <p className="note" role="note">The Plattr score measures how much of a food's story is documented and backed up - not a medical or food-safety guarantee. Plattr does not inspect farms.</p>
      </section>

      <section className="fp-section" aria-labelledby="fp-steps">
        <h2 id="fp-steps">Three steps to a label that talks</h2>
        <ol className="features fp-steps">
          {STEPS.map(s => (
            <li className="panel feature" key={s.title}>
              <span className="ico" aria-hidden="true">{s.ico}</span>
              <div><h3>{s.title}</h3><p>{s.text}</p><Link to={s.to} className="link-arrow">{s.link}</Link></div>
            </li>
          ))}
        </ol>
      </section>

      <section className="fp-section" aria-labelledby="fp-preview">
        <span className="fp-blob fp-blob-l" aria-hidden="true" style={{ top: 120 }} />
        <h2 id="fp-preview">What shoppers see</h2>
        <p className="lede">This is the farm block from one of the sample passports, exactly as the app renders it - labels, gaps and all.</p>
        {sample ? <Preview p={sample} />
          : error ? <p className="warn" role="alert">Could not load the sample passports: {error}</p>
          : <Loading what="the sample passport" />}
      </section>

      <section className="fp-section narrow" aria-labelledby="fp-faq">
        <h2 id="fp-faq">Straight answers</h2>
        <div className="fp-faq">
          {FAQ.map((f, i) => <details key={f.q} open={i === 0}><summary>{f.q}</summary><p>{f.a}</p></details>)}
        </div>
      </section>

      <section className="panel fp-cta" aria-labelledby="fp-cta">
        <Leaf size={120} style={{ left: -22, bottom: -70, transform: 'rotate(28deg)' }} />
        <Leaf size={100} color="#57b35f" style={{ right: -14, top: -60, transform: 'rotate(-150deg)' }} />
        <h2 id="fp-cta">Ready to show what is behind your food?</h2>
        <p className="muted">Start with an account, sketch a rancher profile without saving anything, or look at what is already in the food library.</p>
        <div className="hero-cta">
          <Link to="/login" className="btn">Create a producer account <span aria-hidden="true">→</span></Link>
          <Link to="/ranchers" className="btn secondary">Rancher profile preview</Link>
          <Link to="/explore" className="btn secondary">Browse the food library</Link>
        </div>
      </section>
    </>
  )
}
