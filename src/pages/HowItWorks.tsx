// How it works: steps for shoppers and producers, then the real score rubric rendered from scorePassport().
import { Link } from 'react-router-dom'
import { Loading } from '../components/ui'
import { GRADE_BANDS, GRADE_COLOR, scorePassport } from '../passport/score'
import { usePassports } from '../passport/usePassports'
import type { Evidence, Passport } from '../passport/types'

// Mirrors WEIGHT in passport/score.ts (not exported there) and the evidence definitions in passport/types.ts.
const EVIDENCE: { ev: Evidence; label: string; weight: string; means: string }[] = [
  { ev: 'verified', label: 'Verified record', weight: '100%', means: "Checked against a public record or a certifier's listing." },
  { ev: 'document', label: 'Document on file', weight: '90%', means: 'The producer names and dates a report they hold (lab result, audit, log). Nothing is uploaded or checked in this prototype.' },
  { ev: 'declared', label: 'Producer-declared', weight: '50%', means: "The producer's own statement, with nothing attached." },
  { ev: 'missing', label: 'Not provided', weight: '0', means: 'Nothing was provided.' },
]
const EV_CLASS: Record<Evidence, string> = { verified: 'ev-verified', document: 'ev-document', declared: 'ev-declared', community: 'ev-declared', missing: 'ev-missing' }
const GRADES = GRADE_BANDS

const SHOPPER = [
  { ico: '📷', title: 'Scan', text: 'Scan the QR code or barcode on the pack — or type it into the food library.' },
  { ico: '📖', title: 'Read the passport', text: 'Farm origin, soil, water, feed and grazing, space and welfare, animal health history, certifications, safety, the hazard outlook for the sourcing region, and nutrition. Every fact carries its evidence level in words.' },
  { ico: '🛒', title: 'Save and track', text: 'Sign in, record allergens and health conditions to get informational warnings (not medical advice), add items to your cart, mark them purchased, and see your history, overall score, how your groceries complement each other, and a map of where your food came from.' },
]
const PRODUCER = [
  { ico: '🚜', title: 'Create your farm profile', text: 'Acreage, pasture or coop size, the markets you sell at, water quality, fertilizers and pesticides, livestock health records, and your parasite watch.' },
  { ico: '📝', title: 'Build a product passport', text: 'Fill in each section and say what backs each fact. Anything left blank shows to shoppers as "Not provided" — never hidden.' },
  { ico: '🔳', title: 'Print the QR code', text: 'Put it on the pack or your market stall. Shoppers scan it and land on your passport.' },
]

function Steps({ steps }: { steps: typeof SHOPPER }) {
  return (
    <ol className="features">
      {steps.map((s, i) => (
        <li className="panel feature" key={s.title}>
          <span className="ico" aria-hidden="true">{s.ico}</span>
          <div><h3>{i + 1}. {s.title}</h3><p>{s.text}</p></div>
        </li>
      ))}
    </ol>
  )
}

function Rubric({ kind, p }: { kind: string; p: Passport }) {
  const score = scorePassport(p)
  return (
    <section className="panel" style={{ margin: '14px 0' }}>
      <h3>{kind}</h3>
      <p className="muted" style={{ margin: '4px 0 10px' }}>
        Worked example: <span aria-hidden="true">{p.emoji}</span> <Link to={`/food/${p.id}`}>{p.name}</Link>{' '}
        {p.sample && <span className="chip ev-missing">Sample — fictional demo data</span>}
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead><tr><th scope="col">Part of the score</th><th scope="col">Max points</th><th scope="col">This example</th></tr></thead>
          <tbody>
            {score.parts.map(part => (
              <tr key={part.key}>
                <th scope="row" style={{ fontWeight: 700 }}>{part.label}<small className="muted" style={{ display: 'block', fontWeight: 400 }}>{part.note}</small></th>
                <td>{part.max}</td>
                <td>{part.points}</td>
              </tr>
            ))}
            <tr>
              <th scope="row">Total</th>
              <td><strong>{score.parts.reduce((s, x) => s + x.max, 0)}</strong></td>
              <td><strong>{score.total}</strong> · Grade {score.grade} ({score.word})</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function HowItWorks() {
  const { passports, error } = usePassports()
  const beef = passports?.find(p => p.sample && p.category === 'beef')
  const produce = passports?.find(p => p.sample && p.category === 'produce')
  return (
    <>
      <h1>How Plattr works</h1>
      <p className="lede">Scan a food, read its product passport, and see exactly how much of its story is backed up.</p>

      <h2>For shoppers</h2>
      <Steps steps={SHOPPER} />
      <p><Link to="/explore" className="btn">Explore a food <span aria-hidden="true">→</span></Link></p>

      <h2>For producers</h2>
      <Steps steps={PRODUCER} />
      <p><Link to="/login" className="btn secondary">Sign in as a producer</Link></p>

      <h2>How the Plattr score works</h2>
      <p>
        Every passport gets a score from 0 to 100 and a grade from A to F. The score adds up a fixed set of parts. Each part earns
        its maximum points multiplied by the average evidence weight of the facts in it; a part with nothing in it earns 0.
        Animal products are judged on feed, welfare and health records; plant foods are judged on soil instead.
      </p>
      <div className="note" role="note">
        <strong>Honest limits:</strong> the score shows how much of this food's story is documented and backed up — not a medical or
        food-safety guarantee. A low score means less has been documented, not that a food is unsafe; a high score does not mean a food is
        right for you. Allergen and health-condition warnings in Plattr are informational and not medical advice.
      </div>

      <h3 style={{ marginTop: 22 }}>Evidence weights</h3>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead><tr><th scope="col">Evidence level</th><th scope="col">Weight</th><th scope="col">What it means</th></tr></thead>
          <tbody>
            {EVIDENCE.map(e => (
              <tr key={e.ev}><th scope="row"><span className={`chip ${EV_CLASS[e.ev]}`}>{e.label}</span></th><td>{e.weight}</td><td>{e.means}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ marginTop: 22 }}>Grade bands</h3>
      <ul className="badges" style={{ marginTop: 8 }}>
        {GRADES.map(g => (
          <li key={g.grade}><span className="grade-pill" style={{ color: GRADE_COLOR[g.grade], background: `${GRADE_COLOR[g.grade]}22` }}>Grade {g.grade} · {g.word}</span> <span className="muted">{g.band}</span></li>
        ))}
      </ul>

      <h3 style={{ marginTop: 22 }}>The parts, with two worked examples</h3>
      {error ? <p className="warn" role="alert">Could not load the sample passports: {error}</p>
        : !passports ? <Loading what="the score rubric" />
        : <div className="grid-2" style={{ gap: '0 18px', alignItems: 'start' }}>
            {beef && <Rubric kind="Animal products (beef, poultry, eggs, dairy, fish)" p={beef} />}
            {produce && <Rubric kind="Plant foods (produce, grain)" p={produce} />}
          </div>}
    </>
  )
}
