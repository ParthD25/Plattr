// Find a food: one search box (Plattr passports + live Open Food Facts), the label scanner, and the browse grid. Owner: explore/scan module.
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { GradeDot } from '../components/ScoreBadge'
import { Loading, SampleBanner } from '../components/ui'
import { searchProducts, type OffHit } from '../off'
import { scorePassport } from '../passport/score'
import type { Category, Passport } from '../passport/types'
import { usePassports } from '../passport/usePassports'
import CameraScanner, { decodeImageFile } from '../scan/CameraScanner'
import { barcodeOf, scanDestination } from '../scan/resolve'

const CATEGORIES: Category[] = ['beef', 'poultry', 'eggs', 'dairy', 'fish', 'produce', 'grain']
const METHODS = { wild_caught: 'Wild-caught', farm_raised: 'Farm-raised' } as const
type Method = keyof typeof METHODS
const REAL_BARCODES = ['0850388002291', '0099482460839']   // exist in Open Food Facts; we say nothing about them until the live record loads
const DEBOUNCE_MS = 350
const MAX_HITS = 12
const title = (s: string) => s[0].toUpperCase() + s.slice(1)
const haystack = (p: Passport) =>
  [p.name, p.tagline, p.category, p.farm.name, p.farm.city, p.farm.state, p.barcode, p.production_method && METHODS[p.production_method], ...p.badges].join(' ').toLowerCase()

/** Where the record comes from - always as words, never colour alone. */
function OriginChip({ p }: { p: Passport }) {
  if (p.imported_from) return <span className="chip ex-community">Open Food Facts</span>
  if (p.sample) return <span className="chip ex-sample">Sample</span>
  return <span className="chip ev-declared">Added by producer</span>
}

const CSS = `
.ex-hero { position: relative; }
.ex-hero::before { content: ""; position: absolute; top: -70px; right: calc(50% - 50vw); width: min(520px, 55vw); height: 420px; background: var(--blob); border-radius: 58% 0 0 46% / 52% 0 0 48%; z-index: -1; }   /* flush with the viewport edge: no sideways scroll */
.ex-find > label { margin-top: 0; font-size: 1.1rem; }
.ex-search { display: flex; flex-wrap: wrap; gap: 10px; margin: 6px 0 0; }
.ex-search input { flex: 1 1 260px; width: auto; min-width: 0; font-size: 1.15rem; padding: 15px 22px; border-radius: 999px; border: 2px solid #e9cdb9; }
.ex-search input:focus-visible { outline: 3px solid var(--red); outline-offset: 2px; }
.ex-help { margin: 8px 0 0; font-size: 0.9rem; }
.ex-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.ex-results { margin-top: 18px; padding-top: 4px; border-top: 1px dashed var(--line); }
.ex-results h3 { font-size: 1.05rem; margin: 18px 0 0; }
.ex-row:hover { border-color: var(--red); }
.ex-row .ex-end { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; justify-content: flex-end; }
.ex-community { color: #1d5fa3; background: #eef6fd; }
.ex-sample { color: #6b5400; background: #fff3c4; }
.ex-credit { font-size: 0.85rem; margin: 10px 0 0; }
.ex-try { margin-top: 18px; }
.ex-try strong { display: block; margin-bottom: 2px; }
.ex-try .badges { margin-top: 6px; }
.ex-try button { flex-wrap: wrap; }
.ex-vh { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); margin: 0; }
.ex-method { color: var(--ink); background: #fff; }
.ex-tilechips { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 10px; }
@media (max-width: 520px) {
  .ex-search button { flex: 1 1 auto; justify-content: center; }
  .ex-row { grid-template-columns: 46px 1fr; }
  .ex-row .ex-end { grid-column: 2; justify-content: flex-start; }
}
`

export default function Explore() {
  const { passports, error } = usePassports()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const fileInput = useRef<HTMLInputElement>(null)

  // Search text and filters live in the URL so /explore?q=eggs&category=eggs is a shareable deep link.
  const urlQ = params.get('q') ?? ''
  const wanted = (params.get('category') ?? '').toLowerCase() as Category
  const category: Category | 'all' = CATEGORIES.includes(wanted) ? wanted : 'all'
  const method = category === 'fish' && (params.get('method') ?? '') in METHODS ? (params.get('method') as Method) : 'all'
  const sort = params.get('sort') === 'name' ? 'name' : 'score'
  const setParam = (key: string, value: string) =>
    setParams(prev => { const next = new URLSearchParams(prev); if (value) next.set(key, value); else next.delete(key); return next }, { replace: true })

  const [text, setText] = useState(urlQ)     // what is in the box - local passports filter on this instantly
  const [term, setTerm] = useState(urlQ)     // debounced - drives the Open Food Facts request and ?q=
  const [off, setOff] = useState<{ for: string; hits?: OffHit[]; error?: string }>({ for: '' })
  const [camera, setCamera] = useState(false)
  const [reading, setReading] = useState(false)
  const [scanError, setScanError] = useState('')

  useEffect(() => {
    const id = window.setTimeout(() => { setTerm(text); setParam('q', text.trim()) }, DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [text])   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (urlQ !== term.trim()) { setText(urlQ); setTerm(urlQ) } }, [urlQ])   // eslint-disable-line react-hooks/exhaustive-deps -- a link changed ?q= from outside

  const needle = text.trim().toLowerCase()
  const typedCode = barcodeOf(text)
  const wantOff = (t: string) => t.length >= 2 && !/^[\d\s-]+$/.test(t)   // digits are a barcode, not a product name

  useEffect(() => {
    const t = term.trim()
    if (!wantOff(t)) return setOff({ for: '' })
    let live = true
    setOff({ for: t })
    searchProducts(t).then(hits => live && setOff({ for: t, hits }), e => live && setOff({ for: t, error: String(e?.message ?? e) }))
    return () => { live = false }
  }, [term])

  const all = useMemo(() => (passports ?? []).map(p => ({ p, score: scorePassport(p), hay: haystack(p) })), [passports])
  const words = needle.split(/\s+/).filter(Boolean)
  const local = needle.length >= 2 ? all.filter(({ hay }) => words.every(w => hay.includes(w))) : []
  const offLoading = wantOff(needle) && (off.for !== text.trim() || (!off.hits && !off.error))
  const shown = all
    .filter(({ p }) => category === 'all' || p.category === category)
    .filter(({ p }) => method === 'all' || p.production_method === method)
    .sort((a, b) => (sort === 'score' ? b.score.total - a.score.total : 0) || a.p.name.localeCompare(b.p.name))

  const go = (value: string) => {
    const dest = scanDestination(passports ?? [], value)
    if (dest) return navigate(dest)
    setScanError(`“${value.trim().slice(0, 60)}” is not a product barcode or a Plattr QR code. Try the numbers printed under the barcode.`)
  }
  const onSubmit = (e: FormEvent) => { e.preventDefault(); if (scanDestination(passports ?? [], text)) go(text) }
  const onPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''   // picking the same photo again still fires change
    if (!file) return
    setCamera(false); setScanError(''); setReading(true)
    try { go(await decodeImageFile(file)) } catch (err) { setScanError(err instanceof Error ? err.message : 'Could not read that photo.') }
    setReading(false)
  }

  const samples = (passports ?? []).filter(p => p.sample && p.barcode).slice(0, 4)

  return (
    <div className="ex-hero">
      <style>{CSS}</style>
      <h1>Find a food</h1>
      <p className="lede">Search anything or scan the label in your hand, and see where it comes from.</p>
      {error && <p className="warn" role="alert">Could not load Plattr passports: {error}. Live product search still works.</p>}

      <section className="panel ex-find" aria-label="Search or scan">
        <label htmlFor="ex-q">Search a food or brand, or type a barcode</label>
        <form className="ex-search" role="search" onSubmit={onSubmit}>
          <input id="ex-q" type="search" autoComplete="off" enterKeyHint="search" placeholder="Strawberries, a brand name, or 0850001000042" aria-describedby="ex-help"
            value={text} onChange={e => { setText(e.target.value); setScanError('') }} />
          {typedCode && <button type="submit">Look up barcode {typedCode}</button>}
        </form>
        <p id="ex-help" className="muted ex-help">Results appear as you type. Plattr passports come first, then real products from Open Food Facts.</p>

        <div className="ex-actions">
          <button type="button" className="secondary" aria-pressed={camera} onClick={() => { setCamera(c => !c); setScanError('') }}>
            <span aria-hidden="true">📷</span> {camera ? 'Stop camera' : 'Scan with camera'}
          </button>
          <button type="button" className="secondary" disabled={reading} onClick={() => fileInput.current?.click()}>
            <span aria-hidden="true">🖼️</span> Upload a photo of the barcode
          </button>
          <input ref={fileInput} type="file" accept="image/*" hidden tabIndex={-1} aria-label="Photo of the barcode" onChange={onPhoto} />
        </div>
        {camera && <CameraScanner onScan={value => { setCamera(false); go(value) }} />}
        {reading && <p className="muted" role="status">Reading the photo…</p>}
        {scanError && <p className="warn" role="alert">{scanError}</p>}

        {needle.length >= 2 && (
          <div className="ex-results">
            <h2 className="ex-vh">Search results</h2>
            <section aria-labelledby="ex-local-h">
              <h3 id="ex-local-h">Plattr passports</h3>
              {!passports && !error ? <Loading what="Plattr passports" /> : local.length === 0 ? (
                <p className="muted" role="status" style={{ margin: '6px 0 0' }}>No Plattr passport matches “{text.trim()}” yet.</p>
              ) : (
                <ul className="rows">
                  {local.map(({ p, score }) => (
                    <li key={p.id}>
                      <Link className="row ex-row" to={`/food/${p.id}`}>
                        <span className="ico" aria-hidden="true">{p.emoji}</span>
                        <span><strong>{p.name}</strong><span className="sub">{[p.farm.name, p.farm.state].filter(Boolean).join(' · ') || 'Source not provided'}</span></span>
                        <span className="ex-end"><GradeDot score={score} /><OriginChip p={p} /></span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {wantOff(needle) && (
              <section aria-labelledby="ex-off-h">
                <h3 id="ex-off-h">Real products from Open Food Facts</h3>
                {offLoading ? <p className="muted" role="status" style={{ margin: '6px 0 0' }}>Searching Open Food Facts…</p>
                  : off.error ? <p className="note" role="alert">Open Food Facts could not be reached just now ({off.error}). Try again in a moment, or type the barcode.</p>
                  : off.hits!.length === 0 ? <p className="muted" role="status" style={{ margin: '6px 0 0' }}>No product in Open Food Facts matches “{off.for}”. Try the brand name, or type the barcode from the pack.</p>
                  : (
                    <ul className="rows">
                      {off.hits!.slice(0, MAX_HITS).map(h => (
                        <li key={h.code}>
                          <Link className="row ex-row" to={`/lookup/${h.code}`}>
                            <span className="ico" aria-hidden="true">🛒</span>
                            <span><strong>{h.name || 'Name not provided'}</strong><span className="sub">{h.brand || 'Brand not provided'} · barcode {h.code}</span></span>
                            <span className="ex-end"><span className="chip ex-community">Community record</span></span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                <p className="muted ex-credit">
                  Community records are crowd-sourced and not checked by Plattr - the label in your hand wins. Data from{' '}
                  <a href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer">Open Food Facts</a>, available under the{' '}
                  <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noreferrer">Open Database License (ODbL)</a>.
                </p>
              </section>
            )}
          </div>
        )}

        {needle.length < 2 && <div className="ex-try">
          <strong>Try these</strong>
          <span className="muted" style={{ fontSize: '0.9rem' }}>Sample barcodes open a fictional demo passport. The last two are real barcodes, looked up live in Open Food Facts.</span>
          <ul className="badges">
            {samples.map(p => (
              <li key={p.id}>
                <button type="button" className="secondary small" onClick={() => go(p.barcode!)} aria-label={`Sample barcode ${p.barcode}, ${p.name}`}>
                  <span aria-hidden="true">{p.emoji}</span> {p.barcode} <span className="chip ex-sample">Sample</span>
                </button>
              </li>
            ))}
            {REAL_BARCODES.map(code => (
              <li key={code}>
                <button type="button" className="secondary small" onClick={() => go(code)} aria-label={`Real barcode ${code}, live Open Food Facts lookup`}>
                  <span aria-hidden="true">🛒</span> {code} <span className="chip ex-community">Open Food Facts</span>
                </button>
              </li>
            ))}
          </ul>
        </div>}
      </section>

      <h2 id="browse-h">Browse Plattr passports</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        The number on each food is its Plattr score. It measures how much of a food's story is documented and backed up - not a medical or food-safety guarantee.
      </p>
      {all.some(({ p }) => p.sample) && <SampleBanner text="Foods marked SAMPLE are fictional demo data, made to show how a passport works." />}

      <div className="tabs" role="group" aria-label="Filter by category">
        {(['all', ...CATEGORIES] as const).map(c => (
          <button key={c} type="button" aria-pressed={category === c}
            onClick={() => setParams(prev => { const next = new URLSearchParams(prev); next.delete('method'); if (c === 'all') next.delete('category'); else next.set('category', c); return next }, { replace: true })}>
            {title(c)}
          </button>
        ))}
      </div>
      {category === 'fish' && (
        <div className="tabs" role="group" aria-label="Filter fish by how it was produced">
          {(['all', 'wild_caught', 'farm_raised'] as const).map(m => (
            <button key={m} type="button" className="small" aria-pressed={method === m} onClick={() => setParam('method', m === 'all' ? '' : m)}>
              {m === 'all' ? 'All fish' : METHODS[m]}
            </button>
          ))}
        </div>
      )}
      <div style={{ maxWidth: 280 }}>
        <label htmlFor="ex-sort">Sort by</label>
        <select id="ex-sort" value={sort} onChange={e => setParam('sort', e.target.value === 'name' ? 'name' : '')}>
          <option value="score">Score, high to low</option>
          <option value="name">Name, A to Z</option>
        </select>
      </div>

      {!passports ? (!error && <Loading what="Plattr passports" />) : (
        <>
          <p className="muted" aria-live="polite" style={{ margin: '12px 0' }}>
            {shown.length} {shown.length === 1 ? 'food' : 'foods'}{category !== 'all' && ` in ${title(category)}`}{method !== 'all' && `, ${METHODS[method].toLowerCase()}`}
          </p>
          {shown.length === 0 ? (
            <div className="panel" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '2.4rem', margin: 0 }} aria-hidden="true">🧺</p>
              <p><strong>No passports here yet.</strong> Pick “All”, or search above to look a real product up in Open Food Facts.</p>
              <button type="button" className="secondary small" onClick={() => setParams(text.trim() ? { q: text.trim() } : {}, { replace: true })}>Clear filters</button>
            </div>
          ) : (
            <ul className="tiles" aria-labelledby="browse-h">
              {shown.map(({ p, score }) => {
                const fishMethod = p.category === 'fish' ? (p.production_method ? METHODS[p.production_method] : 'Wild or farmed: not provided') : ''
                const origin = p.imported_from ? 'Community record from Open Food Facts, not checked by Plattr' : p.sample ? 'Sample data' : 'Added by producer'
                const from = [p.farm.name, p.farm.state].filter(Boolean).join(' · ') || 'Source not provided'
                return (
                  <li key={p.id}>
                    <Link to={`/food/${p.id}`} aria-label={`${p.name}, ${from}${fishMethod && `, ${fishMethod}`}. Plattr score ${score.total} out of 100, grade ${score.grade}. ${origin}`}>
                      <span className="emoji" aria-hidden="true">{p.emoji}</span>
                      <strong>{p.name}</strong>
                      <small>{from}</small>
                      <span className="ex-tilechips">
                        <GradeDot score={score} />
                        {fishMethod && <span className="chip ex-method">{fishMethod}</span>}
                        <OriginChip p={p} />
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
