// Producer portal: this producer's product passports (with QR codes) + the form that builds a new one.
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import QRCode from 'qrcode'
import { actions, useAccount, useStore } from '../store'
import { scorePassport } from '../passport/score'
import { GradeDot, ScoreBadge } from '../components/ScoreBadge'
import type { Category, Hazard, Passport } from '../passport/types'
import {
  ALLERGENS, CATEGORIES, DIETARY, EMOJI, EVIDENCE_LABEL, METHOD_LABEL, NUTRIENTS, SECTION_META, buildPassport, emptyFact, emptyHazard, hasEstNumber, newDraft, newId,
  sectionsFor, validate, withCategory, type Draft, type FactDraft, type HazardDraft, type Method, type ProducerEvidence,
} from '../producer/passports/draft'

const CSS = `
.pb-layout { display: grid; gap: 22px; grid-template-columns: minmax(0, 1fr); align-items: start; }
.pb-score { position: sticky; top: 8px; z-index: 5; order: -1; padding: 14px 16px; max-height: 85vh; overflow-y: auto; }
.pb-layout label:not(.check) > :is(input, select, textarea) { margin-top: 4px; }
.pb-score summary { cursor: pointer; font-weight: 800; margin-top: 6px; }
@media (min-width: 960px) { .pb-layout { grid-template-columns: minmax(0, 1fr) 340px; } .pb-score { order: 0; top: 16px; padding: 22px; } }
.pb-parts { list-style: none; padding: 0; margin: 10px 0 0; display: grid; gap: 10px; font-size: 0.9rem; }
.pb-fact { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0 12px; padding: 0 12px 12px; border: 1px solid var(--line); border-radius: 16px; background: #fff; margin: 10px 0; }
.pb-foot { grid-column: 1 / -1; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px; margin-top: 12px; }
.pb-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); }
.pb-item { display: grid; grid-template-columns: 56px minmax(0, 1fr) auto; gap: 14px; align-items: start; }
.pb-item h3 { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.pb-item p { margin: 4px 0 8px; overflow-wrap: anywhere; }
@media (max-width: 480px) { .pb-item { grid-template-columns: 56px minmax(0, 1fr); } .pb-item .pb-qr { grid-column: 1 / -1; } }
.pb-emoji { width: 56px; height: 56px; border-radius: 50%; background: #fdebdc; display: grid; place-items: center; font-size: 1.8rem; }
.pb-qr { display: grid; gap: 8px; justify-items: center; }
.pb-qr img { border-radius: 12px; border: 1px solid var(--line); background: #fff; max-width: 100%; height: auto; }
.pb-checks { display: flex; flex-wrap: wrap; gap: 0 20px; }
.pb-nutri { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0 12px; }
.pb-method { grid-column: 1 / -1; background: #fff; }
.pb-method p { margin: 6px 0 0; font-size: 0.9rem; }
.pb-hint { font-weight: 400; color: var(--muted); font-size: 0.85rem; display: block; }
`

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label>{label}{hint && <span className="pb-hint">{hint}</span>}{children}</label>
}

function Qr({ id, name, size }: { id: string; name: string; size: number }) {
  const url = `${location.origin}/food/${id}`
  const [src, setSrc] = useState<string>()
  useEffect(() => {
    let live = true
    QRCode.toDataURL(url, { width: 480, margin: 2 }).then(s => live && setSrc(s), () => undefined)
    return () => { live = false }
  }, [url])
  if (!src) return <span className="muted">Making QR code…</span>
  return (
    <div className="pb-qr">
      <img src={src} width={size} height={size} alt={`QR code that opens the ${name} passport`} />
      <a className="btn small secondary" href={src} download={`plattr-${id}.png`}>Download QR</a>
    </div>
  )
}

function FactGroup({ title, hint, rows, onChange }: { title: string; hint: string; rows: FactDraft[]; onChange: (rows: FactDraft[]) => void }) {
  const patch = (i: number, p: Partial<FactDraft>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...p } : r)))
  return (
    <fieldset>
      <legend>{title}</legend>
      <p className="muted" style={{ margin: 0 }}>{hint}</p>
      {rows.map((r, i) => {
        const shown = r.label.trim() && r.value.trim() ? r.evidence : 'missing'
        return (
          <div className="pb-fact" role="group" aria-label={`${title}: ${r.label || `row ${i + 1}`}`} key={i}>
            <Field label="What"><input value={r.label} onChange={e => patch(i, { label: e.target.value })} placeholder="e.g. Grazing time" /></Field>
            <Field label="Value"><input value={r.value} onChange={e => patch(i, { value: e.target.value })} placeholder="Leave empty if unknown" /></Field>
            <Field label="Evidence">
              <select value={r.evidence} onChange={e => patch(i, { evidence: e.target.value as ProducerEvidence })}>
                <option value="declared">{EVIDENCE_LABEL.declared}</option>
                <option value="document">{EVIDENCE_LABEL.document}</option>
              </select>
            </Field>
            {r.evidence === 'document' && <>
              <Field label="Document (source)"><input value={r.source} onChange={e => patch(i, { source: e.target.value })} placeholder="e.g. Water lab report" /></Field>
              <Field label="Document date"><input type="date" value={r.date} onChange={e => patch(i, { date: e.target.value })} /></Field>
            </>}
            <div className="pb-foot">
              <span>Shoppers will see: <span className={`chip ev-${shown}`}>{EVIDENCE_LABEL[shown]}</span></span>
              <button type="button" className="small secondary" aria-label={`Remove ${title} row ${r.label || i + 1}`} onClick={() => onChange(rows.filter((_, j) => j !== i))}>Remove</button>
            </div>
          </div>
        )
      })}
      <button type="button" className="small secondary" onClick={() => onChange([...rows, emptyFact()])}>+ Add a row to {title.toLowerCase()}</button>
    </fieldset>
  )
}

function Checks({ legend, options, picked, onChange, note }: { legend: string; options: string[]; picked: string[]; onChange: (next: string[]) => void; note?: string }) {
  return (
    <fieldset>
      <legend>{legend}</legend>
      {note && <p className="muted" style={{ margin: 0 }}>{note}</p>}
      <div className="pb-checks">
        {options.map(o => (
          <label className="check" key={o}>
            <input type="checkbox" checked={picked.includes(o)} onChange={e => onChange(e.target.checked ? [...picked, o] : picked.filter(x => x !== o))} />{o}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function Builder({ email }: { email: string }) {
  const store = useStore()
  const farm = store.farms[email]
  const mine = store.passports.filter(p => p.created_by === email)
  const [d, setD] = useState<Draft>(() => newDraft(farm))
  const [errors, setErrors] = useState<string[]>([])
  const [saved, setSaved] = useState<Passport>()
  const [partsOpen] = useState(() => typeof matchMedia === 'function' && matchMedia('(min-width: 960px)').matches)
  const errorBox = useRef<HTMLDivElement>(null)
  const savedBox = useRef<HTMLElement>(null)

  const set = (p: Partial<Draft>) => setD(prev => ({ ...prev, ...p }))
  const setFarm = (p: Partial<Draft['farm']>) => setD(prev => ({ ...prev, farm: { ...prev.farm, ...p } }))
  const patchHazard = (i: number, p: Partial<HazardDraft>) => set({ hazards: d.hazards.map((h, j) => (j === i ? { ...h, ...p } : h)) })
  const score = d.category ? scorePassport(buildPassport(d, email, 'draft')) : undefined

  useEffect(() => { if (errors.length) errorBox.current?.focus() }, [errors])
  useEffect(() => { if (saved) savedBox.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, [saved])

  function submit(e: FormEvent) {
    e.preventDefault()
    const problems = validate(d)
    setErrors(problems)
    if (problems.length) return
    const p = buildPassport(d, email, newId(d.name))
    actions.savePassport(p)
    setSaved(p)
    setD(newDraft(farm))
  }

  function remove(p: Passport) {
    if (!confirm(`Delete the passport for "${p.name}"? Its QR code will stop working.`)) return
    actions.deletePassport(p.id)
    if (saved?.id === p.id) setSaved(undefined)
  }

  return (
    <>
      <style>{CSS}</style>
      <h1>Product passports</h1>
      <p className="lede">Build the passport shoppers see when they scan your pack, then print its QR code.</p>

      {saved && (
        <section className="panel" ref={savedBox} role="status" style={{ margin: '16px 0' }}>
          <h2 style={{ marginTop: 0 }}>Saved: {saved.name}</h2>
          <p>Print this QR code on the pack. Scanning it opens <Link to={`/food/${saved.id}`}>{location.origin}/food/{saved.id}</Link>.</p>
          <Qr id={saved.id} name={saved.name} size={220} />
        </section>
      )}

      <h2>Your passports</h2>
      {mine.length === 0
        ? <p className="muted">No passports yet. Fill in the form below to make your first one.</p>
        : (
          <ul className="pb-list">
            {mine.map(p => (
              <li className="panel pb-item" key={p.id}>
                <span className="pb-emoji" aria-hidden="true">{p.emoji}</span>
                <div>
                  <h3>{p.name} <GradeDot score={scorePassport(p)} />{p.sample && <span className="chip">Sample</span>}</h3>
                  <p className="muted">{p.tagline || p.category} · /food/{p.id}</p>
                  <div className="pb-foot" style={{ marginTop: 0, justifyContent: 'flex-start' }}>
                    <Link className="link-arrow" to={`/food/${p.id}`}>Open passport</Link>
                    <button type="button" className="small secondary" aria-label={`Delete passport for ${p.name}`} onClick={() => remove(p)}>Delete</button>
                  </div>
                </div>
                <Qr id={p.id} name={p.name} size={104} />
              </li>
            ))}
          </ul>
        )}
      <p className="note">Prototype: passports are kept in this browser only, so a QR code opens the passport on this device. A hosted version would make it open on any phone.</p>

      <h2>New passport</h2>
      <div className="pb-layout">
        <form onSubmit={submit} noValidate>
          <fieldset>
            <legend>The product</legend>
            <div className="grid-2">
              <Field label="Product name (required)"><input value={d.name} onChange={e => set({ name: e.target.value })} required /></Field>
              <Field label="Tagline"><input value={d.tagline} onChange={e => set({ tagline: e.target.value })} placeholder="One friendly line" /></Field>
              <Field label="Category (required)">
                <select value={d.category} onChange={e => setD(prev => withCategory(prev, e.target.value as Category | '', farm))} required>
                  <option value="">Choose…</option>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </Field>
              {d.category === 'produce' && (
                <Field label="Fruit or vegetable? (required)" hint="Sets the food group shoppers see in their nutrition balance.">
                  <select value={d.produce_group} onChange={e => set({ produce_group: e.target.value as Draft['produce_group'] })}>
                    <option value="">Choose…</option><option value="fruits">Fruit</option><option value="vegetables">Vegetable</option>
                  </select>
                </Field>
              )}
              {d.category === 'fish' && (
                <fieldset className="pb-method">
                  <legend>Wild-caught or farm-raised? (required)</legend>
                  {(Object.keys(METHOD_LABEL) as Method[]).map(m => (
                    <label className="check" key={m}>
                      <input type="radio" name="pb-method" value={m} checked={d.production_method === m} onChange={() => setD(prev => withCategory(prev, 'fish', farm, m))} required />{METHOD_LABEL[m]}
                    </label>
                  ))}
                  <p className="muted">
                    US law requires fish and shellfish labels to say this: USDA country-of-origin labeling, 7 CFR Part 60, covers both where the fish is from and whether it is wild-caught or farm-raised.
                    Shoppers see your answer at the top of the passport.
                  </p>
                  {d.production_method && d.production_method === newDraft(farm).production_method && <p className="muted">Pre-selected from your farm profile – change it if this product is different.</p>}
                  {d.production_method === 'wild_caught' && (
                    <p className="muted">Feed, welfare and health-history sections start empty for wild fish. Add a row only if you have something real to record. The score still counts those sections, so it reflects what is documented – not the quality of the fish.</p>
                  )}
                </fieldset>
              )}
              <Field label="Picture">
                <select value={d.emoji} onChange={e => set({ emoji: e.target.value })}>{EMOJI.map(([em, n]) => <option key={em} value={em}>{em} {n}</option>)}</select>
              </Field>
              <Field label="Price (USD)"><input type="number" min="0" step="0.01" inputMode="decimal" value={d.price} onChange={e => set({ price: e.target.value })} /></Field>
              <Field label="Barcode" hint="Digits under the barcode, if the pack has one."><input inputMode="numeric" value={d.barcode} onChange={e => set({ barcode: e.target.value })} /></Field>
              <Field label="Badges" hint="Comma separated, e.g. Organic, Grass-fed"><input value={d.badges} onChange={e => set({ badges: e.target.value })} /></Field>
              {hasEstNumber(d.category) && (
                <Field label="USDA establishment number (optional)" hint="The number inside the USDA mark, e.g. M-1234 or P-1234. Shoppers can open the real USDA plant record from your passport.">
                  <input value={d.est_number} onChange={e => set({ est_number: e.target.value })} />
                </Field>
              )}
            </div>
          </fieldset>

          <fieldset>
            <legend>The farm</legend>
            {!farm && <p className="note">No farm profile yet. <Link to="/producer">Set up your farm profile</Link> and this block (plus water, soil and vet rows) fills itself in next time.</p>}
            <div className="grid-2">
              <Field label="Farm name (required)"><input value={d.farm.name} onChange={e => setFarm({ name: e.target.value })} required /></Field>
              <Field label="City / town"><input value={d.farm.city} onChange={e => setFarm({ city: e.target.value })} /></Field>
              <Field label="State / region"><input value={d.farm.state} onChange={e => setFarm({ state: e.target.value })} /></Field>
              <Field label="Country"><input value={d.farm.country} onChange={e => setFarm({ country: e.target.value })} /></Field>
              <Field label="Latitude (required)" hint="For the shopper's food map, e.g. 40.44"><input type="number" step="any" min="-90" max="90" value={d.farm.lat} onChange={e => setFarm({ lat: e.target.value })} /></Field>
              <Field label="Longitude (required)" hint="e.g. -79.99"><input type="number" step="any" min="-180" max="180" value={d.farm.lon} onChange={e => setFarm({ lon: e.target.value })} /></Field>
              <Field label="Acres"><input type="number" min="0" step="any" value={d.farm.acres} onChange={e => setFarm({ acres: e.target.value })} /></Field>
              <Field label="Markets" hint="Comma separated"><input value={d.farm.markets} onChange={e => setFarm({ markets: e.target.value })} /></Field>
            </div>
            <Field label="About the farm"><textarea rows={2} value={d.farm.about} onChange={e => setFarm({ about: e.target.value })} /></Field>
          </fieldset>

          <div className="note">
            <strong>How evidence works.</strong> Every row is shown to shoppers with a label. <span className="chip ev-declared">Producer-declared</span> is your own statement.{' '}
            <span className="chip ev-document">Document on file</span> means you hold the report or certificate and can show it - name it and date it.{' '}
            <span className="chip ev-verified">Verified record</span> is reserved for checks Plattr does against public records, so you cannot pick it.{' '}
            <span className="chip ev-missing">Not provided</span> is simply the absence of a row: leave a value empty and the row is left out.
          </div>

          {!d.category && <p className="muted">Choose a category above to get starter rows for each section.</p>}
          {d.category && sectionsFor(d.category).map(k => (
            <FactGroup key={k} title={SECTION_META[k].title} hint={SECTION_META[k].hint} rows={d.sections[k]} onChange={rows => setD(prev => ({ ...prev, sections: { ...prev.sections, [k]: rows } }))} />
          ))}

          <fieldset>
            <legend>Parasite and hazard outlook (optional)</legend>
            <p className="muted" style={{ margin: 0 }}>Hazards that matter where this food is sourced, and what you do about them. General background for shoppers - not a diagnosis or a safety guarantee.</p>
            {d.hazards.map((h, i) => (
              <div className="pb-fact" role="group" aria-label={`Hazard ${h.name || i + 1}`} key={i}>
                <Field label="Hazard name"><input value={h.name} onChange={e => patchHazard(i, { name: e.target.value })} placeholder="e.g. Liver fluke" /></Field>
                <Field label="Kind">
                  <select value={h.kind} onChange={e => patchHazard(i, { kind: e.target.value as Hazard['kind'] })}>
                    <option value="parasite">Parasite</option><option value="bacteria">Bacteria</option><option value="heavy_metal">Heavy metal</option><option value="toxin">Natural toxin</option>
                  </select>
                </Field>
                <Field label="Likelihood">
                  <select value={h.likelihood} onChange={e => patchHazard(i, { likelihood: e.target.value as Hazard['likelihood'] })}>
                    <option value="low">Low</option><option value="moderate">Moderate</option><option value="elevated">Elevated</option>
                  </select>
                </Field>
                <Field label="Why it matters in this region"><input value={h.regional_relevance} onChange={e => patchHazard(i, { regional_relevance: e.target.value })} /></Field>
                <Field label="Outlook" hint="Season, weather"><input value={h.outlook} onChange={e => patchHazard(i, { outlook: e.target.value })} /></Field>
                <Field label="What the farm does"><input value={h.what_the_farm_does} onChange={e => patchHazard(i, { what_the_farm_does: e.target.value })} /></Field>
                <Field label="Source (required)" hint="Where this information comes from"><input value={h.source} onChange={e => patchHazard(i, { source: e.target.value })} /></Field>
                <div className="pb-foot">
                  <span className="chip ev-declared">Producer-declared</span>
                  <button type="button" className="small secondary" aria-label={`Remove hazard ${h.name || i + 1}`} onClick={() => set({ hazards: d.hazards.filter((_, j) => j !== i) })}>Remove</button>
                </div>
              </div>
            ))}
            <div className="pb-foot" style={{ justifyContent: 'flex-start' }}>
              <button type="button" className="small secondary" onClick={() => set({ hazards: [...d.hazards, emptyHazard()] })}>+ Add a hazard</button>
              {!!farm?.parasite_watch?.length && (
                <button type="button" className="small secondary" onClick={() => set({ hazards: [...d.hazards, ...farm.parasite_watch.filter(w => !d.hazards.some(h => h.name === w.name))
                  .map(w => ({ ...emptyHazard(), name: w.name, what_the_farm_does: `${w.status}${w.noted_on ? ` (noted ${w.noted_on})` : ''}`, source: 'Farm parasite watch log' }))] })}>
                  + Copy from my farm's parasite watch
                </button>
              )}
            </div>
          </fieldset>

          <fieldset>
            <legend>Nutrition per serving</legend>
            <div className="grid-2">
              <Field label="Serving" hint="As on the pack, e.g. 1 cup (152 g)"><input value={d.serving} onChange={e => set({ serving: e.target.value })} /></Field>
              <Field label="Serving size in grams (required)"><input type="number" min="0" step="any" value={d.serving_g} onChange={e => set({ serving_g: e.target.value })} required /></Field>
            </div>
            <p className="muted" style={{ marginBottom: 0 }}>Copy the numbers from your nutrition label. Leave a box empty if you do not have the figure - nothing is guessed.</p>
            <div className="pb-nutri">
              {NUTRIENTS.map(([k, label]) => (
                <Field key={k} label={label}><input type="number" min="0" step="any" inputMode="decimal" value={d.per_serving[k] ?? ''} onChange={e => set({ per_serving: { ...d.per_serving, [k]: e.target.value } })} /></Field>
              ))}
            </div>
          </fieldset>

          <Checks legend="Allergens in this product" options={ALLERGENS} picked={d.allergens} onChange={allergens => set({ allergens })}
            note="Tick every major allergen the product contains. Shoppers who listed one get an informational heads-up - not medical advice." />
          <fieldset>
            <legend>Gluten</legend>
            <label className="check"><input type="checkbox" checked={d.gluten_free} onChange={e => set({ gluten_free: e.target.checked })} />This product is gluten-free</label>
          </fieldset>
          <Checks legend="Dietary" options={DIETARY} picked={d.dietary} onChange={dietary => set({ dietary })} />

          {errors.length > 0 && (
            <div className="warn" role="alert" tabIndex={-1} ref={errorBox}>
              <strong>Please fix before saving:</strong>
              <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>{errors.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </div>
          )}
          <button type="submit">Save passport and make QR code</button>
        </form>

        <aside className="panel pb-score" aria-label="Live score preview">
          {score ? (
            <>
              <ScoreBadge score={score} label="Live Plattr score" />
              <details open={partsOpen}>
                <summary>Where the points come from</summary>
                <ul className="pb-parts">
                  {score.parts.map(x => (
                    <li key={x.key}>
                      <div className="score-head"><span>{x.label}</span><strong>{x.points} / {x.max}</strong></div>
                      <div className="bar" role="img" aria-label={`${x.points} of ${x.max} points`}><span style={{ width: `${(x.points / x.max) * 100}%` }} /></div>
                      <span className="muted">{x.note}</span>
                    </li>
                  ))}
                </ul>
                <p className="caveat">A producer-declared row earns half its points; a document on file earns 90 %; a Plattr-verified record earns all of them. Name and date the documents you hold to raise the score.</p>
                <p className="caveat">The score shows how much of this food's story is documented and backed up - not a medical or food-safety guarantee.</p>
              </details>
            </>
          ) : (
            <p className="muted" style={{ margin: 0 }}><strong>Live Plattr score</strong><br />Choose a category and the score appears here, updating as you type.</p>
          )}
        </aside>
      </div>
    </>
  )
}

export default function PassportBuilder() {
  const account = useAccount()
  return account ? <Builder email={account.email} /> : null
}
