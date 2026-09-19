// Shared UI primitives. Shared file: builders import, do not edit.
import { useEffect, useState, type ReactNode } from 'react'

/** How much stands behind a card. Shown as a text chip and a border style - never as red/green. */
export type Tier = 'verified' | 'label' | 'inference' | 'rancher' | 'floor'

const TIER_LABEL: Record<Tier, string> = {
  verified: 'Verified public record',
  label: 'Label claim',
  inference: 'Inference',
  rancher: 'Rancher-declared',
  floor: 'Not public',
}

export function Chip({ tier, children }: { tier: Tier; children?: ReactNode }) {
  return <span className={`chip chip-${tier}`}>{children ?? TIER_LABEL[tier]}</span>
}

/** Every card carries its tier, and (for records) a source line with a date. */
export function Card({ tier, title, children, source }: { tier: Tier; title: string; children: ReactNode; source?: ReactNode }) {
  return (
    <section className={`card card-${tier}`}>
      <header className="card-head">
        <h3>{title}</h3>
        <Chip tier={tier} />
      </header>
      <div className="card-body">{children}</div>
      {source && <footer className="card-source">{source}</footer>}
    </section>
  )
}

export function SourceLine({ source, url, date }: { source: string; url?: string; date?: string }) {
  return (
    <>
      Source: {url ? <a href={url} target="_blank" rel="noreferrer">{source}</a> : source}
      {date && <> · snapshot {date}</>}
    </>
  )
}

export function Quote({ children }: { children: ReactNode }) {
  return <blockquote className="quote">“{children}”</blockquote>
}

export function SampleBanner({ text }: { text: string }) {
  return <div className="sample-banner" role="note">{text}</div>
}

/** Small async helper so pages stay declarative. */
export function useData<T>(loader: () => Promise<T>): { data?: T; error?: string } {
  const [state, setState] = useState<{ data?: T; error?: string }>({})
  useEffect(() => {
    let live = true
    loader().then(data => live && setState({ data }), e => live && setState({ error: String(e.message ?? e) }))
    return () => { live = false }
  }, [loader])
  return state
}

export function Loading({ what }: { what: string }) {
  return <p className="muted" aria-live="polite">Loading {what}…</p>
}
