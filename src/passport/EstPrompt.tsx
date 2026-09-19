// Meat or poultry with no plant number: the shopper types the USDA establishment number from the pack and we resolve it in the FSIS directory.
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { loadPlants } from '../data'
import { findPlants, parseEst, type EstMatch } from '../est/normalize'
import { actions, useStore } from '../store'
import { needsEstNumber, withPlant } from './source'
import type { Passport } from './types'

type Step =
  | { kind: 'idle' | 'busy' | 'invalid' }
  | { kind: 'none'; typed: string; retrieved: string }
  | { kind: 'many'; matches: EstMatch[]; retrieved: string }
  | { kind: 'found'; match: EstMatch; saved: boolean }
  | { kind: 'error'; message: string }

export default function EstPrompt({ passport: p }: { passport: Passport }) {
  // Only passports kept in this browser (looked up live, or made in the producer portal) can be updated. Samples are read-only.
  const stored = useStore().passports.some(x => x.id === p.id)
  const [typed, setTyped] = useState('')
  const [step, setStep] = useState<Step>({ kind: 'idle' })

  function apply(match: EstMatch, retrieved: string) {
    if (stored) actions.savePassport(withPlant(p, match, retrieved))
    setStep({ kind: 'found', match, saved: stored })
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!parseEst(typed)) return setStep({ kind: 'invalid' })
    setStep({ kind: 'busy' })
    try {
      const file = await loadPlants()
      const matches = findPlants(file, typed)
      if (matches.length === 1) apply(matches[0], file.retrieved)
      else setStep(matches.length ? { kind: 'many', matches, retrieved: file.retrieved } : { kind: 'none', typed: typed.trim(), retrieved: file.retrieved })
    } catch (err) {
      setStep({ kind: 'error', message: String((err as Error)?.message ?? err) })
    }
  }

  if (step.kind === 'found') {
    const { plant, token } = step.match
    return (
      <div className="note" role="status">
        <p style={{ margin: 0 }}>
          <strong>{step.saved ? 'Saved.' : 'Match found.'}</strong> The USDA FSIS directory lists EST. {token} as <strong>{plant.name}</strong>, {plant.city}, {plant.state}.{' '}
          {step.saved
            ? 'The plant is now on this passport as a verified record, the score has been recalculated and your food map shows the plant’s location.'
            : p.sample ? 'This is a sample passport, so nothing was saved.' : 'This passport is not kept in this browser, so the number was not saved.'}
        </p>
        <p className="caveat">The number tells you where the product was processed or packed. It is not the farm or ranch the animal came from.</p>
        {/* once saved, the panel above already carries this link */}
        {!step.saved && <Link className="link-arrow" to={`/est/${encodeURIComponent(token)}`}>See the real USDA plant record (recalls, sampling, enforcement)</Link>}
      </div>
    )
  }
  if (!needsEstNumber(p)) return null

  return (
    <div className="pv-est">
      <h3>Processing plant: Not provided</h3>
      <p className="muted" style={{ margin: '4px 0 0' }}>
        This looks like a meat or poultry product, and no USDA plant number is recorded for it. If you have the pack, the number on it tells you which inspected plant processed it.
      </p>
      <form className="inline" onSubmit={submit}>
        <label htmlFor="pv-est-input" style={{ flexBasis: '100%', margin: 0 }}>Type the USDA establishment number printed on the pack (EST. or P- number)</label>
        <input id="pv-est-input" type="text" required autoComplete="off" placeholder="EST. 86R or P-13556" value={typed} onChange={e => setTyped(e.target.value)} aria-describedby="pv-est-help" />
        <button type="submit" disabled={step.kind === 'busy'}>{step.kind === 'busy' ? 'Searching the USDA directory…' : 'Find the plant'}</button>
      </form>
      <p className="caveat" id="pv-est-help">Look inside or near the round USDA mark of inspection. It may also be printed elsewhere on the pack with an “EST.” prefix.</p>

      <div aria-live="polite">
        {step.kind === 'invalid' && <p>That does not look like an establishment number. It is usually “EST.”, “M-” or “P-” followed by up to five digits, sometimes with a letter.</p>}
        {step.kind === 'none' && <p>“{step.typed}” was not found in the USDA FSIS directory (snapshot {step.retrieved}). Check the digits on the pack and try again. State-inspected plants are not in this directory.</p>}
        {step.kind === 'error' && <p role="alert">We could not load the USDA directory: {step.message}</p>}
        {step.kind === 'many' && (
          <>
            <p><strong>That number matches {step.matches.length} plants.</strong> Meat (M) and poultry (P) numbers are separate lists. Choose the one that fits your pack:</p>
            <ul className="rows">
              {step.matches.map(m => (
                <li key={m.token + m.plant.number} className="row pv-fact">
                  <div>
                    <strong>{m.plant.name}</strong>
                    <span className="sub">{[m.plant.city, m.plant.state].filter(Boolean).join(', ')} · EST. {m.token}{m.plant.activities && <> · {m.plant.activities}</>}</span>
                  </div>
                  <button type="button" className="small" onClick={() => apply(m, step.retrieved)}>Choose EST. {m.token}</button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
