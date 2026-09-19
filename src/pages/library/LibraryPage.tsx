// Library index: plain-language reference pages that passports link out to.
import { Link } from 'react-router-dom'

export default function LibraryPage() {
  return (
    <div className="narrow">
      <h1>Library</h1>
      <p className="lede">Plain-language reference pages. Passports link here whenever they mention a parasite, a germ or a nutrient.</p>
      <ul className="features" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <li className="panel feature"><div className="ico" aria-hidden="true">🔬</div><div><h2 style={{ margin: 0 }}>Parasites and hazards</h2><p>What each one is, which foods and regions it matters for, who is most at risk, and how it is controlled.</p><Link className="link-arrow" to="/library/hazards">Open the hazards guide</Link></div></li>
        <li className="panel feature"><div className="ico" aria-hidden="true">🥗</div><div><h2 style={{ margin: 0 }}>Nutrients and food groups</h2><p>What each nutrient does, its daily value, and how each food group serves you.</p><Link className="link-arrow" to="/library/nutrients">Open the nutrients guide</Link></div></li>
        <li className="panel feature"><div className="ico" aria-hidden="true">📖</div><div><h2 style={{ margin: 0 }}>Field notes</h2><p>Short explainers on label claims, written from the regulation text.</p><Link className="link-arrow" to="/learn">Read the field notes</Link></div></li>
      </ul>
      <p className="muted">General information from public health agencies, not medical advice.</p>
    </div>
  )
}
