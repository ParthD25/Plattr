// /lookup/:barcode - a barcode Plattr has no passport for: look it up live in Open Food Facts, save the record, show its passport.
import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { importProduct } from '../off'
import { findPassport, usePassports } from '../passport/usePassports'
import { actions } from '../store'

const CSS = `
.lookup-panel { margin-top: 24px; text-align: center; }
.lookup-panel h1 { overflow-wrap: anywhere; }
.lookup-panel h2 { margin-top: 22px; font-size: 1.1rem; }
.lookup-icon { font-size: 3rem; line-height: 1; }
.lookup-try { text-align: left; max-width: 520px; margin: 8px auto 18px; padding-left: 20px; }
.lookup-try li { margin: 8px 0; }
.lookup-actions { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin: 16px 0; }
.lookup-dots span { display: inline-block; width: 10px; height: 10px; margin: 14px 4px 0; border-radius: 50%; background: var(--red, #d9412f); animation: lookup-bounce 1s infinite ease-in-out; }
.lookup-dots span:nth-child(2) { animation-delay: 0.15s; } .lookup-dots span:nth-child(3) { animation-delay: 0.3s; }
@keyframes lookup-bounce { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .lookup-dots span { animation: none; } }
`

const Credit = () => (
  <p className="caveat">
    Open Food Facts is a crowd-sourced database: its entries are community records, not checked by Plattr. Data is available under the{' '}
    <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noreferrer">Open Database License (ODbL)</a> from{' '}
    <a href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer">Open Food Facts</a>. The label in your hand always wins.
  </p>
)

export default function LookupPage() {
  const { barcode = '' } = useParams()
  const code = barcode.replace(/\D/g, '')
  const navigate = useNavigate()
  const { passports, error } = usePassports()
  const [status, setStatus] = useState<'looking' | 'notfound' | 'error'>('looking')
  const [attempt, setAttempt] = useState(0)

  const ready = !!passports || !!error   // if the sample set fails to load we can still look the barcode up live
  const known = passports && code ? findPassport(passports, code) : undefined

  useEffect(() => {
    if (!ready || known) return
    if (!code) { setStatus('notfound'); return }
    let live = true
    setStatus('looking')
    importProduct(code).then(p => {
      if (!live) return
      if (!p) return setStatus('notfound')
      actions.savePassport(p)
      navigate('/food/' + p.id, { replace: true })
    }, () => live && setStatus('error'))
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, known?.id, code, attempt])

  if (known) return <Navigate replace to={'/food/' + known.id} />

  const samples = (passports ?? []).filter(p => p.sample && p.barcode).slice(0, 3)

  return (
    <div className="narrow panel lookup-panel">
      <style>{CSS}</style>
      {status === 'looking' && (
        <div role="status" aria-live="polite">
          <div className="lookup-icon" aria-hidden="true">🔎</div>
          <h1>Looking up {code || barcode} in Open Food Facts…</h1>
          <p className="muted">Plattr has no passport of its own for this barcode, so we are checking the public, crowd-sourced product database.</p>
          <div className="lookup-dots" aria-hidden="true"><span /><span /><span /></div>
        </div>
      )}

      {status === 'notfound' && (
        <>
          <div className="lookup-icon" aria-hidden="true">🧺</div>
          <h1>No product with this barcode in Open Food Facts</h1>
          <p className="lede">
            {code ? <>We looked up <strong>{code}</strong> and nothing came back.</> : <>“{barcode}” has no digits in it, so there was nothing to look up.</>}{' '}
            That only means nobody has added it to the community database yet - it says nothing about the food itself.
          </p>
          <h2>What to try</h2>
          <ul className="lookup-try">
            <li><strong>Check the digits.</strong> Type every number printed under the bars, including the small ones at each end (usually 12 or 13 digits).</li>
            <li>
              <strong>Try a sample barcode</strong> to see a full passport{samples.length ? ': ' : '.'}
              {samples.map((s, i) => <span key={s.id}>{i > 0 && ', '}<Link to={'/food/' + s.id}>{s.barcode}</Link> ({s.name}, SAMPLE)</span>)}
            </li>
            <li><strong>Search by name</strong> instead - brand or product name both work.</li>
          </ul>
          <div className="lookup-actions">
            <Link className="btn" to="/explore">Search by name or scan again</Link>
          </div>
          <Credit />
        </>
      )}

      {status === 'error' && (
        <>
          <div className="lookup-icon" aria-hidden="true">📡</div>
          <h1>We could not reach Open Food Facts</h1>
          <p className="warn" role="alert">The lookup for {code} did not get an answer. This is a connection problem (yours or theirs), not a verdict on the product.</p>
          <div className="lookup-actions">
            <button type="button" onClick={() => setAttempt(a => a + 1)}>Try again</button>
            <Link className="btn secondary" to="/explore">Find a food another way</Link>
          </div>
          <Credit />
        </>
      )}
    </div>
  )
}
