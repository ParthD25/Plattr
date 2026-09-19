// Landing page: follows docs/design-reference.png. Everything on the card comes from the strawberry sample passport.
import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Loading } from '../components/ui'
import { ScoreBadge } from '../components/ScoreBadge'
import { averageScore, scorePassport } from '../passport/score'
import { usePassports } from '../passport/usePassports'
import type { Evidence, Passport, Score } from '../passport/types'
import { Blob, CowArt, DropIcon, Leaf, LeafIcon, ShieldIcon, SoilArt, SoilIcon, Sprig, SproutIcon, Squiggle, Strawberry, WaterArt } from './landing/Art'

const HERO_ID = 'strawberry-riverbend'
const EVIDENCE_LABEL: Record<Evidence, string> = { verified: 'Verified record', document: 'Document on file', declared: 'Producer-declared', community: 'Community record', missing: 'Not provided' }
const EV_CLASS: Record<Evidence, string> = { verified: 'ev-verified', document: 'ev-document', declared: 'ev-declared', community: 'ev-declared', missing: 'ev-missing' }
const srOnly: CSSProperties = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }

const CSS = `
/* full-bleed wrapper: spans the viewport so blobs can run off the edges, and clips them so nothing scrolls sideways */
.lp { position: relative; isolation: isolate; margin-inline: calc(50% - 50vw); padding-inline: calc(50vw - 50%); overflow-x: clip; }
.lp .hero::before { content: none; }
.lp .hero { gap: 32px; padding-top: 34px; }
@media (min-width: 861px) { .lp .hero { grid-template-columns: minmax(0, 0.86fr) minmax(0, 1.14fr); } }
.lp .hero h1 { font-size: clamp(2.7rem, 5.6vw, 4.1rem); line-height: 1; letter-spacing: -0.05em; color: var(--ink); margin: 0 0 18px; text-wrap: balance; }
.lp .panel { border-color: #f4e9dd; box-shadow: 0 18px 48px rgba(150, 90, 50, 0.13); }

/* blobs: bleed off the viewport edges (body clips overflow-x) */
.lp-blob { position: absolute; z-index: -2; pointer-events: none; }
.lp-blob-hero { top: -70px; left: 41%; right: -90px; height: 960px; width: auto; }
.lp-blob-left { top: 430px; left: -150px; width: 340px; height: 420px; }
.lp-blob-bottom { bottom: -60px; left: -120px; width: 420px; height: 360px; }
@media (max-width: 860px) {
  .lp-blob-hero { top: 210px; left: 24%; right: -150px; height: 820px; }
  .lp-blob-left { top: 120px; left: -190px; width: 300px; height: 360px; }
}

/* leaves peeking out from behind the card */
.lp-cardwrap { position: relative; min-width: 0; }
.lp-leaf { position: absolute; z-index: -1; pointer-events: none; transform-origin: 50% 100%; transform: rotate(var(--r)); animation: lp-sway 5.5s ease-in-out infinite alternate; }
.lp-leaf-a { --r: -42deg; width: 96px; left: -22px; bottom: 96px; }
.lp-leaf-b { --r: -112deg; width: 72px; left: -2px; bottom: 50px; animation-duration: 6.5s; animation-delay: -2s; }
.lp-leaf-c { --r: 36deg; width: 104px; right: -24px; top: 34%; animation-duration: 7s; animation-delay: -1s; }
.lp-sprig { position: absolute; z-index: -1; width: 62px; right: -32px; top: 6px; pointer-events: none; transform-origin: 50% 100%; --r: 28deg; transform: rotate(var(--r)); animation: lp-sway 6s ease-in-out infinite alternate; }
.lp-band-leaf { position: absolute; z-index: -1; width: 82px; left: 38px; top: -62px; --r: -30deg; transform-origin: 50% 100%; transform: rotate(var(--r)); animation: lp-sway 6.5s ease-in-out infinite alternate; }
@keyframes lp-sway { from { transform: rotate(calc(var(--r) - 2.5deg)); } to { transform: rotate(calc(var(--r) + 2.5deg)); } }
@media (prefers-reduced-motion: reduce) { .lp-leaf, .lp-sprig, .lp-band-leaf { animation: none; } }

/* handwritten margin notes - wide screens only */
.lp-note { display: none; }
@media (min-width: 1280px) {
  .lp-note { display: inline-block; position: absolute; z-index: 1; font-size: 1.05rem; text-align: left; }
  .lp-note svg { display: block; width: 46px; margin: 4px 0 0 18px; }
  .lp-note-l { left: -88px; bottom: -92px; transform: rotate(-11deg); }
  .lp-note-r { right: -86px; bottom: 70px; transform: rotate(-7deg); }
  .lp-note-tr { right: -84px; top: 26px; transform: rotate(-13deg); }
}
@media (min-width: 1400px) { .lp-note { font-size: 1.25rem; } .lp-note-l { left: -128px; } .lp-note-r { right: -128px; } .lp-note-tr { right: -120px; } }

/* passport card */
.lp-card { align-items: start; border-radius: 34px; padding: 26px; background: #fffdf9; }
@media (min-width: 561px) { .lp-card { grid-template-columns: minmax(0, 0.74fr) minmax(0, 1fr); } }
.lp-card .food-art { border-radius: 26px; background: linear-gradient(160deg, #feeadb, #fbdcc6); aspect-ratio: 0.96; }
.lp-card .food-art svg { width: 62%; filter: drop-shadow(0 10px 12px rgba(160, 40, 30, 0.22)); }
@media (max-width: 560px) { .lp-card { padding: 20px; border-radius: 28px; } .lp-card .food-art { aspect-ratio: 1.5; } .lp-card .food-art svg { width: 38%; } }
.lp-card h2 { font-size: 1.35rem; letter-spacing: -0.02em; }
.lp-card .badge { background: #f7efe3; padding: 7px 13px 7px 9px; }
.lp-card .badge::before { content: none; }
.lp-card .badge svg { width: 18px; height: 18px; padding: 3px; border-radius: 50%; background: #dff1dc; flex: none; }
.lp-card .grade-pill { border-radius: 12px; padding: 8px 11px; font-size: 0.8rem; white-space: nowrap; }
.lp-card .score-head strong { white-space: nowrap; }
.lp-card-score .rows { gap: 8px; }
.lp-card-score .row { grid-template-columns: 44px 1fr auto; gap: 11px; padding: 9px 10px; border-radius: 20px; border-color: #f3e8dc; background: #fffefb; transition: border-color .15s, transform .15s; }
.lp-card-score .row:hover, .lp-card-score .row:focus-visible { border-color: var(--red); transform: translateX(2px); }
.lp-card-score .row .ico { width: 44px; height: 44px; }
.lp-card-score .row .ico svg { width: 25px; height: 25px; }
.lp-ico-soil { background: #f6e6d6 !important; } .lp-ico-water { background: #e2effb !important; }
.lp-card-foot { grid-column: 1 / -1; }
.lp-card-foot > * { margin: 0 0 8px; } .lp-card-foot > :last-child { margin-bottom: 0; }
.lp-row-text { display: block; min-width: 0; }
.lp-row-text .bar { display: block; margin: 6px 0 4px; height: 8px; }
.lp-chev { width: 18px; height: 18px; color: var(--ink); }

/* feature cards */
.lp-features { position: relative; }
.lp-features .features { margin-top: 34px; }
.lp-features .feature { grid-template-columns: 100px 1fr; gap: 18px; border-radius: 30px; padding: 24px; }
.lp-features .feature .ico { width: 100px; height: 100px; }
.lp-features .feature .ico svg { width: 66px; height: 66px; }
.lp-features .feature h3 { font-size: 1.45rem; letter-spacing: -0.02em; }
.lp-features .link-arrow { color: var(--red); }
@media (max-width: 420px) { .lp-features .feature { grid-template-columns: 76px 1fr; gap: 14px; padding: 18px; } .lp-features .feature .ico { width: 76px; height: 76px; } .lp-features .feature .ico svg { width: 50px; height: 50px; } }

.lp-band { position: relative; display: flex; flex-wrap: wrap; gap: 14px 24px; align-items: center; justify-content: space-between; margin: 44px 0 26px; background: var(--green-soft); border-radius: 38px 30px 42px 28px / 30px 40px 28px 38px; border-color: #d3ead0 !important; box-shadow: none !important; }
.lp-band h2 { margin: 0 0 4px; }
.lp-band p { margin: 0; }
.lp .stats .panel { border-radius: 26px; }

/* handwritten tagline strip */
.lp-strip { display: flex; align-items: center; gap: 18px; margin: 46px 0 0; color: var(--muted); }
.lp-strip::before, .lp-strip::after { content: ""; flex: 1; border-top: 1.5px dashed #e6d5c3; }
.lp-strip .hand { transform: rotate(-1.5deg); font-size: 1.2rem; text-align: center; color: var(--ink); }
.lp-strip svg { display: block; width: 58px; margin: 3px auto 0; color: var(--green); }
`

function Chip({ evidence }: { evidence: Evidence }) {
  return <span className={`chip ${EV_CLASS[evidence]}`}>{EVIDENCE_LABEL[evidence]}</span>
}

/** One clickable row of the hero card. `part` draws the bar from the real score part (points / max). */
function Row({ to, ico, icoClass = '', title, sub, evidence, part }: { to: string; ico: ReactNode; icoClass?: string; title: string; sub: string[]; evidence?: Evidence; part?: Score['parts'][number] }) {
  return (
    <li>
      <Link to={to} className="row">
        <span className={`ico ${icoClass}`} aria-hidden="true">{ico}</span>
        <span className="lp-row-text">
          <strong>{title}</strong>
          {sub.map(s => <span className="sub" key={s}>{s}</span>)}
          {part && <span className="bar" role="img" aria-label={`${part.label}: ${part.points} of ${part.max} score points`}><span style={{ width: `${(part.points / part.max) * 100}%` }} /></span>}
          {evidence && <Chip evidence={evidence} />}
        </span>
        <svg className="lp-chev" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </Link>
    </li>
  )
}

function PassportCard({ p }: { p: Passport }) {
  const score = scorePassport(p)
  const to = `/food/${p.id}`
  const soil = p.soil[0]
  const water = p.water.find(f => f.label.toLowerCase() === 'result') ?? p.water[p.water.length - 1]
  const verified = p.certifications.filter(f => f.evidence === 'verified').length
  const part = (key: string) => score.parts.find(x => x.key === key)
  return (
    <article className="panel passport-card lp-card" aria-label={`Product passport: ${p.name}`}>
      <div>
        <div className="food-art" aria-hidden="true">{p.emoji === '🍓' ? <Strawberry /> : p.emoji}</div>
        <h2 style={{ margin: '16px 0 2px' }}>{p.name}</h2>
        <p className="muted" style={{ margin: 0 }}>{p.tagline}</p>
        <ul className="badges" aria-label="Label claims">{p.badges.map(b => <li className="badge" key={b}><LeafIcon />{b}</li>)}</ul>
      </div>
      <div className="lp-card-score">
        <ScoreBadge score={score} label="Plattr score" />
        <ul className="rows">
          <Row to={to} ico={<SproutIcon />} title="Farm Origin" sub={[p.farm.name, `${p.farm.city}, ${p.farm.state}, ${p.farm.country}`]} evidence={p.origin[0]?.evidence ?? 'missing'} />
          <Row to={to} ico={<SoilIcon />} icoClass="lp-ico-soil" title="Soil Health" sub={[soil ? `${soil.label}: ${soil.value}` : 'Not provided']} evidence={soil?.evidence ?? 'missing'} part={part('soil')} />
          <Row to={to} ico={<DropIcon />} icoClass="lp-ico-water" title="Water Quality" sub={[water ? water.value : 'Not provided']} evidence={water?.evidence ?? 'missing'} part={part('water')} />
          <Row to={to} ico={<ShieldIcon />} title="Certifications" sub={[`${verified} verified`]} evidence={verified ? 'verified' : undefined} />
        </ul>
      </div>
      <div className="lp-card-foot">
        {p.sample && <p className="sample-banner" role="note">SAMPLE — fictional demo passport</p>}
        <p className="caveat">The score shows how much of this food's story is documented and backed up — not a medical or food-safety guarantee.</p>
      </div>
    </article>
  )
}

const FEATURES = [
  { art: <SoilArt />, bg: '#eef3e2', title: 'Soil', text: 'See how soil is managed, organic matter levels, and key minerals.', link: 'Explore soil data' },
  { art: <WaterArt />, bg: '#e4eff9', title: 'Water', text: 'Check water sources, quality testing, and safety results.', link: 'Explore water data' },
  { art: <CowArt />, bg: '#fde6d3', title: 'Animal Feed', text: "Learn what animals eat, where it comes from, and how it's sourced.", link: 'Explore feed data' },
]

/** Decorative margin note (wide screens only); the same words are not needed by screen readers. */
function Note({ at, lines }: { at: 'l' | 'r' | 'tr'; lines: string[] }) {
  return <span className={`hand lp-note lp-note-${at}`} aria-hidden="true">{lines.map(l => <span key={l} style={{ display: 'block' }}>{l}</span>)}<Squiggle /></span>
}

export default function Landing() {
  const { passports, error } = usePassports()
  const hero = passports?.find(p => p.id === HERO_ID)
  const samples = passports?.filter(p => p.sample) ?? []
  return (
    <div className="lp">
      <style>{CSS}</style>
      <Blob className="lp-blob lp-blob-hero" shape="a" />
      <Blob className="lp-blob lp-blob-left" shape="b" />
      <Blob className="lp-blob lp-blob-bottom" shape="c" />

      <section className="hero">
        <div>
          <h1>Know what's behind every bite.</h1>
          <p className="lede">Trace soil, water, feed, and certifications from source to shelf.</p>
          <div className="hero-cta">
            <Link to="/explore" className="btn">Explore a food <span aria-hidden="true">→</span></Link>
            <Link to="/how-it-works" className="btn secondary">How it works</Link>
          </div>
          <ul className="trust"><li>Real sources</li><li>Independent data</li><li>A healthier food system</li></ul>
        </div>
        <div className="lp-cardwrap">
          <Leaf className="lp-leaf lp-leaf-a" />
          <Leaf className="lp-leaf lp-leaf-b" light />
          <Leaf className="lp-leaf lp-leaf-c" />
          {hero ? <PassportCard p={hero} />
            : error ? <p className="warn" role="alert">Could not load the sample passports: {error}</p>
            : passports ? <p className="note">The sample passport is unavailable. <Link to="/explore">Browse the food library</Link>.</p>
            : <Loading what="the sample passport" />}
          <Note at="tr" lines={['Good', 'food goes', 'deeper']} />
        </div>
        <Note at="l" lines={['Better', 'food', 'brighter', 'tomorrows']} />
        <Note at="r" lines={['People', 'Plants', 'Food', 'Forward']} />
      </section>

      <section className="lp-features" aria-labelledby="lp-trace">
        <h2 id="lp-trace" style={srOnly}>What you can trace</h2>
        <Sprig className="lp-sprig" />
        <ul className="features">
          {FEATURES.map(f => (
            <li className="panel feature" key={f.title}>
              <span className="ico" aria-hidden="true" style={{ background: f.bg }}>{f.art}</span>
              <div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
                <Link to="/explore" className="link-arrow">{f.link}</Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel lp-band" aria-labelledby="lp-farmers">
        <Leaf className="lp-band-leaf" light />
        <div>
          <h2 id="lp-farmers"><span aria-hidden="true">🚜 </span>Are you a farmer?</h2>
          <p>Create product passports and let shoppers find you.</p>
        </div>
        <Link to="/login" className="btn">Create a product passport <span aria-hidden="true">→</span></Link>
      </section>

      {samples.length > 0 && (
        <section aria-labelledby="lp-stats">
          <h2 id="lp-stats">In the sample food library right now</h2>
          <div className="stats">
            <div className="panel"><div className="stat">{samples.length}</div><span className="muted">foods with a product passport</span></div>
            <div className="panel"><div className="stat">{new Set(samples.map(p => p.farm.name)).size}</div><span className="muted">farms and producers</span></div>
            <div className="panel"><div className="stat">{averageScore(samples)}<small className="muted" style={{ fontSize: '1rem' }}> /100</small></div><span className="muted">average Plattr score</span></div>
          </div>
          <p className="caveat">Counted live from the SAMPLE passports, which are fictional demo data. The Plattr score measures how much of a food's story is documented and backed up — not a medical or food-safety guarantee. <Link to="/how-it-works">See how the score works</Link>.</p>
        </section>
      )}

      <p className="lp-strip"><span className="hand">Better food, brighter tomorrows — from the ground up<Squiggle /></span></p>
    </div>
  )
}
