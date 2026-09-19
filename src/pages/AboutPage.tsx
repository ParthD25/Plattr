// About page: mission, how it works in three lines, real vs sample (summarises README), team, built-with, contact.
// Static on purpose: every claim here comes from README.md. All art is inline SVG, hidden from screen readers.
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'

const REPO = 'https://github.com/ParthD25/Plattr'
const srOnly: CSSProperties = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }

const STEPS = [
  { ico: '📷', to: '/explore', title: 'Scan or look up a food', text: 'Use the QR code or barcode on the pack, or search the food library.' },
  { ico: '📖', to: '/how-it-works', title: 'Read its product passport', text: 'Origin, soil, water, feed, welfare, certifications and safety — each fact labelled with how well it is backed up.' },
  { ico: '📊', to: '/how-it-works', title: 'See the Plattr score', text: 'A 0-100 score graded A to F, broken down part by part so you can see where every point came from.' },
]

// Names and handles exactly as listed in README.md. No roles or bios: we have not been given any.
const TEAM = [
  { name: 'Parth Dave', handle: 'ParthD25' },
  { name: null, handle: 'ali-findra' },
  { name: 'Gabriela Hamdieh', handle: 'ghamdieh-create' },
  { name: 'Connor Young', handle: 'conyoung18' },
  { name: null, handle: 'Tanvirfs29' },
]

const BUILT_WITH = [
  { name: 'Vite', note: 'build tool and dev server' },
  { name: 'React', note: 'the interface' },
  { name: 'TypeScript', note: 'typed logic, including the score' },
  { name: 'Leaflet', note: 'the food map' },
  { name: 'OpenStreetMap', note: 'map tiles and data © OpenStreetMap contributors' },
  { name: 'USDA FSIS open data', note: 'plant directory, recalls, sampling and enforcement records (public domain)' },
  { name: 'Open Food Facts', note: 'some product data © Open Food Facts contributors, ODbL' },
]

const CSS = `
.ab { position: relative; isolation: isolate; }
.ab section { position: relative; }
.ab-art { position: absolute; z-index: -1; pointer-events: none; }
.ab-leaf { color: var(--green); }
.ab-leaf.light { color: #57b868; }
.ab-blob { color: var(--blob); }

.ab-hero { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr); gap: 28px; align-items: center; padding: 18px 0 8px; }
.ab-hero h1 { font-size: clamp(2.2rem, 5.4vw, 3.6rem); margin-top: 6px; }
.ab-eyebrow { margin: 0; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; font-size: 0.78rem; color: var(--green); }
.ab-hero .lede { font-size: 1.2rem; max-width: 36ch; }
.ab-cta { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 20px; }
.ab-hero-art { position: relative; }
.ab-hero-art > svg { display: block; width: 100%; height: auto; max-width: 460px; margin: 0 auto; }
.ab-hero-blob { top: -90px; right: -300px; width: 640px; }
.ab-note { position: absolute; font-size: 1.15rem; text-align: center; }
.ab-note svg { display: block; width: 64px; margin: 2px auto 0; }
.ab-note-hero { right: 0; top: 4px; }

.ab-mission { margin-top: 26px; padding: 28px clamp(20px, 4vw, 40px); }
.ab-mission h2 { margin-top: 0; font-size: 1.6rem; }
.ab-mission p { max-width: 68ch; font-size: 1.05rem; }
.ab-mission p:last-child { margin-bottom: 0; }
.ab-mission-wrap .ab-leaf-a { width: 150px; left: -58px; bottom: -34px; transform: rotate(-28deg); }
.ab-mission-wrap .ab-leaf-b { width: 120px; right: -40px; top: -18px; transform: rotate(150deg); }

.ab-steps .row { grid-template-columns: 54px 1fr auto; padding: 12px 16px; }
.ab-steps .row .ico { width: 54px; height: 54px; font-size: 1.5rem; }
.ab-steps .row:hover { border-color: var(--red); }
.ab-steps li:nth-child(2) .ico { background: #fdebdc; }
.ab-steps li:nth-child(3) .ico { background: #e6f0f8; }
.ab-chev { color: var(--muted); font-size: 1.4rem; font-weight: 800; }

.ab-rvs { display: grid; grid-template-columns: repeat(auto-fit, minmax(270px, 1fr)); gap: 16px; align-items: start; }
.ab-rvs .card { margin: 0; border-radius: 20px; }
.ab-rvs h3 { margin: 8px 0 6px; font-size: 1.1rem; }
.ab-rvs ul { margin: 0; padding-left: 18px; font-size: 0.95rem; }
.ab-rvs li { margin: 6px 0; }

.ab-team-head { display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between; gap: 8px 24px; }
.ab-team-head .ab-note { position: static; margin: 0 18px 6px 0; }
.ab-team-blob { left: -320px; top: -40px; width: 520px; }
.ab-team { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 22px 18px; padding: 0; margin: 18px 0 0; list-style: none; }
.ab-team > li { position: relative; isolation: isolate; }
.ab-member { height: 100%; text-align: center; padding: 24px 16px 20px; border-radius: 28px 22px 30px 22px; }
.ab-member h3 { margin: 12px 0 2px; font-size: 1.08rem; overflow-wrap: anywhere; }
.ab-member p { margin: 0 0 10px; font-size: 0.86rem; color: var(--muted); }
.ab-member a { font-weight: 800; text-decoration: none; overflow-wrap: anywhere; }
.ab-member a:hover { text-decoration: underline; }
.ab-avatar { width: 84px; height: 84px; margin: 0 auto; display: grid; place-items: center; font-weight: 900; font-size: 1.5rem; letter-spacing: -0.02em; color: var(--verified); background: var(--green-soft); border-radius: 58% 42% 48% 52% / 50% 56% 44% 50%; }
.ab-team > li:nth-child(3n+2) .ab-avatar { background: #fdebdc; color: #a5441f; border-radius: 44% 56% 58% 42% / 54% 46% 54% 46%; }
.ab-team > li:nth-child(3n) .ab-avatar { background: #e6f0f8; color: #1d5f9e; border-radius: 52% 48% 40% 60% / 46% 52% 48% 54%; }
.ab-team .ab-leaf { width: 96px; top: -26px; right: -18px; transform: rotate(-38deg); }
.ab-team > li:nth-child(even) .ab-leaf { right: auto; left: -20px; top: auto; bottom: -24px; transform: rotate(152deg); }

.ab-contact { display: flex; flex-wrap: wrap; gap: 14px 24px; align-items: center; justify-content: space-between; margin-top: 34px; background: var(--green-soft); }
.ab-contact h2 { margin: 0 0 4px; }
.ab-contact p { margin: 0; max-width: 56ch; }
.ab-contact-wrap .ab-leaf { width: 130px; right: -46px; bottom: -40px; transform: rotate(24deg); }

@media (max-width: 860px) {
  /* full-bleed wrapper (main has 20px side padding) so art is clipped at the screen edge even where body overflow-x is ignored */
  .ab { margin: 0 -20px; padding: 0 20px; overflow-x: clip; }
  .ab-hero { grid-template-columns: 1fr; }
  .ab-hero-art > svg { max-width: 320px; }
  .ab-hero-blob { top: 40%; right: -220px; width: 480px; }
  .ab-note-hero { right: 4px; }
}
@media (max-width: 480px) {
  .ab-cta .btn { width: 100%; justify-content: center; }
  .ab-team { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 12px; }
  .ab-member { padding: 18px 10px 16px; }
  .ab-avatar { width: 68px; height: 68px; font-size: 1.25rem; }
  .ab-note-hero { display: none; }
}
`

function Leaf({ className = '' }: { className?: string }) {
  return (
    <svg className={`ab-art ab-leaf ${className}`} viewBox="0 0 120 84" aria-hidden="true" focusable="false">
      <path d="M5 46 C 20 10, 68 -2, 116 8 C 113 52, 76 86, 24 72 C 14 66, 8 56, 5 46 Z" fill="currentColor" />
      <path d="M12 50 C 44 40, 80 28, 108 14" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

function Blob({ className = '' }: { className?: string }) {
  return (
    <svg className={`ab-art ab-blob ${className}`} viewBox="0 0 420 380" aria-hidden="true" focusable="false">
      <path d="M62 72 C 122 -12, 300 -8, 368 70 C 438 150, 404 302, 292 340 C 182 376, 52 336, 24 232 C 4 152, 22 112, 62 72 Z" fill="currentColor" />
    </svg>
  )
}

/** Handwritten margin note with a little underline stroke. Decorative, like the ones on the landing page. */
function Note({ lines, className = '' }: { lines: string[]; className?: string }) {
  return (
    <span className={`hand ab-note ${className}`} aria-hidden="true">
      {lines.map(l => <span key={l} style={{ display: 'block' }}>{l}</span>)}
      <svg viewBox="0 0 64 12" focusable="false"><path d="M3 8 C 14 2, 22 11, 33 6 S 52 3, 61 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
    </span>
  )
}

/** Hero art: a plate with a sprout on a peach blob, leaves tucked behind. */
function PlateArt() {
  return (
    <svg viewBox="0 0 420 380" aria-hidden="true" focusable="false">
      <path d="M62 72 C 122 -12, 300 -8, 368 70 C 438 150, 404 302, 292 340 C 182 376, 52 336, 24 232 C 4 152, 22 112, 62 72 Z" fill="#fde3d2" />
      <g fill="#2e9e44">
        <path transform="translate(8 250) rotate(-32) scale(1.15)" d="M5 46 C 20 10, 68 -2, 116 8 C 113 52, 76 86, 24 72 C 14 66, 8 56, 5 46 Z" />
        <path transform="translate(408 196) rotate(118) scale(1.25)" d="M5 46 C 20 10, 68 -2, 116 8 C 113 52, 76 86, 24 72 C 14 66, 8 56, 5 46 Z" />
      </g>
      <path transform="translate(40 318) rotate(-8) scale(0.8)" fill="#57b868" d="M5 46 C 20 10, 68 -2, 116 8 C 113 52, 76 86, 24 72 C 14 66, 8 56, 5 46 Z" />
      <ellipse cx="212" cy="318" rx="120" ry="12" fill="rgba(120,72,40,0.12)" />
      <circle cx="210" cy="200" r="128" fill="#fffdf9" stroke="#efe3d6" strokeWidth="2" />
      <circle cx="210" cy="200" r="90" fill="#fff" stroke="#efe3d6" strokeWidth="2" />
      <path d="M156 252 C 168 220, 252 220, 264 252 C 240 262, 180 262, 156 252 Z" fill="#7a4a2b" />
      <path d="M210 244 C 207 222, 213 200, 210 172" fill="none" stroke="#2e9e44" strokeWidth="7" strokeLinecap="round" />
      <path d="M210 186 C 190 148, 148 142, 134 156 C 142 190, 184 202, 210 186 Z" fill="#2e9e44" />
      <path d="M210 174 C 226 132, 272 124, 290 138 C 284 176, 242 190, 210 174 Z" fill="#57b868" />
    </svg>
  )
}

const initials = (m: (typeof TEAM)[number]) =>
  m.name ? m.name.split(' ').map(w => w[0]).join('') : m.handle[0].toUpperCase()

export default function AboutPage() {
  return (
    <div className="ab">
      <style>{CSS}</style>

      <section className="ab-hero" aria-labelledby="ab-h1">
        <Blob className="ab-hero-blob" />
        <div>
          <p className="ab-eyebrow">About Plattr</p>
          <h1 id="ab-h1">Food has a story. We help you read it.</h1>
          <p className="lede">Plattr is a student prototype from HackCMU 2026 that shows what is known about a food — and says plainly what is not.</p>
          <div className="ab-cta">
            <Link to="/explore" className="btn">Explore a food <span aria-hidden="true">→</span></Link>
            <Link to="/how-it-works" className="btn secondary">How it works</Link>
          </div>
        </div>
        <div className="ab-hero-art">
          <PlateArt />
          <Note className="ab-note-hero" lines={['Good', 'food goes', 'deeper']} />
        </div>
      </section>

      <section className="ab-mission-wrap" aria-labelledby="ab-mission">
        <Leaf className="ab-leaf-a" />
        <Leaf className="ab-leaf-b light" />
        <div className="panel ab-mission">
          <h2 id="ab-mission">Our mission</h2>
          <p>
            Most of us live a long way from where our food begins. It passes through farms, plants, trucks and shelves before it reaches
            the plate, and the pack rarely tells that story.
          </p>
          <p>
            Plattr exists to bring that story back within reach. Whatever your background or your needs — feeding a family, shopping later
            in life, or managing a health condition — you should be able to see what is known about a food, how well it is backed up, and
            make the choice that is good for you.
          </p>
          <p>
            We do not inspect farms and we do not tell you what to eat. Plattr shows what has been documented, labels what is only a
            producer's word, marks what is missing, and leaves the decision with you.
          </p>
        </div>
      </section>

      <section aria-labelledby="ab-how">
        <h2 id="ab-how">How Plattr works, in three lines</h2>
        <ol className="rows ab-steps">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <Link to={s.to} className="row">
                <span className="ico" aria-hidden="true">{s.ico}</span>
                <span><strong>{i + 1}. {s.title}</strong><span className="sub">{s.text}</span></span>
                <span className="ab-chev" aria-hidden="true">›</span>
              </Link>
            </li>
          ))}
        </ol>
        <p><Link to="/how-it-works" className="link-arrow">See the full walkthrough and the score rubric</Link></p>
      </section>

      <section aria-labelledby="ab-real">
        <h2 id="ab-real">What is real and what is sample</h2>
        <p className="muted" style={{ marginTop: 0 }}>Plattr is a prototype, so we would rather be clear than impressive. This is a summary of the project README.</p>
        <div className="ab-rvs">
          <article className="card card-verified">
            <span className="chip chip-verified">Real public data</span>
            <h3>Federal records and cited references</h3>
            <ul>
              <li>The USDA FSIS plant directory, recalls and public-health alerts, FY2025 raw-beef sampling results and humane-handling enforcement postings behind the <Link to="/plant-lookup">USDA plant lookup</Link>. They are snapshots taken on 2026-09-19, shown with FSIS's own caveats.</li>
              <li>The regulation and guidance quotes behind label claims, each checked word for word against a snapshot of its source.</li>
              <li>FDA Daily Values (21 CFR 101.9) and the other cited reference values used for personal notes.</li>
              <li>"Nothing found" is never presented as "clean" or "safe".</li>
            </ul>
          </article>
          <article className="card card-floor">
            <span className="chip chip-floor">Sample — fictional</span>
            <h3>The demo passports and farms</h3>
            <ul>
              <li>The sample product passports in the <Link to="/explore">food library</Link>, and the farms behind them, are fictional. Each one is marked SAMPLE on screen.</li>
              <li>The rancher profiles and the two demo accounts are fictional too.</li>
              <li>Hazard and parasite notes are general background about a type of food and a region — not measurements or findings about any farm or product.</li>
              <li>Passports made in the producer portal are whatever the producer typed, shown as Producer-declared and not checked by Plattr.</li>
            </ul>
          </article>
          <article className="card card-label">
            <span className="chip chip-label">Demo-grade storage</span>
            <h3>Everything stays in your browser</h3>
            <ul>
              <li>Accounts, health profiles, carts, farm profiles and producer-made passports live only in this browser's storage. There is no server.</li>
              <li>There is no real authentication, and passwords are stored unencrypted. Please do not reuse a real password or enter real medical data.</li>
              <li>A hosted sign-in service is the first step before real users.</li>
            </ul>
          </article>
        </div>
        <div className="note" role="note">
          The Plattr score measures how much of a food's story is documented and backed up — not a medical or food-safety guarantee.
          Allergen and health notes are informational only and never medical advice.
        </div>
      </section>

      <section aria-labelledby="ab-team">
        <Blob className="ab-team-blob" />
        <div className="ab-team-head">
          <div>
            <h2 id="ab-team">The team</h2>
            <p className="muted" style={{ margin: 0 }}>Five students who built Plattr together at HackCMU 2026.</p>
          </div>
          <Note lines={['People Plants', 'Food Forward']} />
        </div>
        <ul className="ab-team">
          {TEAM.map((m, i) => (
            <li key={m.handle}>
              <Leaf className={i % 2 ? 'light' : ''} />
              <div className="panel ab-member">
                <div className="ab-avatar" aria-hidden="true">{initials(m)}</div>
                <h3>{m.name ?? `@${m.handle}`}</h3>
                <p>Team Plattr, HackCMU 2026</p>
                <a href={`https://github.com/${m.handle}`} target="_blank" rel="noopener noreferrer">
                  <span style={srOnly}>{m.name ?? m.handle} on GitHub: </span>@{m.handle} <span aria-hidden="true">↗</span>
                  <span style={srOnly}> (opens in a new tab)</span>
                </a>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ab-built">
        <h2 id="ab-built">Built with</h2>
        <p className="muted" style={{ marginTop: 0 }}>Everything runs in the browser over static data files. No backend, and no language model decides or words anything.</p>
        <ul className="badges">
          {BUILT_WITH.map(b => <li className="badge" key={b.name}><span><strong>{b.name}</strong> <span className="muted" style={{ fontWeight: 600 }}>· {b.note}</span></span></li>)}
        </ul>
      </section>

      <section className="ab-contact-wrap" aria-labelledby="ab-contact">
        <Leaf />
        <div className="panel ab-contact">
          <div>
            <h2 id="ab-contact">Get in touch</h2>
            <p>Questions, ideas or a bug to report? The project lives on GitHub — that is the best place to reach the team.</p>
          </div>
          <a className="btn" href={REPO} target="_blank" rel="noopener noreferrer">
            Plattr on GitHub <span aria-hidden="true">↗</span><span style={srOnly}> (opens in a new tab)</span>
          </a>
        </div>
      </section>
    </div>
  )
}
