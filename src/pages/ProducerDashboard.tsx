// MY FARM (/producer): farm profile form + a live "what shoppers will see" preview.
// Everything typed here is the producer's own statement, so the preview labels it "Producer-declared" (or "Not provided").
// Documents that lift a fact to "Document on file" are attached per passport, not here.
import { useId, useState, type ChangeEvent, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { actions, useAccount, useStore, type FarmProfile } from '../store'
import { averageScore, scorePassport } from '../passport/score'
import { GradeDot } from '../components/ScoreBadge'
import { fromDraft, kindLabel, perHead, toDraft, type FarmDraft, type FarmType } from '../producer/farm/calc'

const CSS = `
.pf-layout { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 24px; align-items: start; }
.pf-preview { position: sticky; top: 16px; }
.pf-preview h2 { margin-top: 0; }
@media (max-width: 880px) { .pf-layout { grid-template-columns: minmax(0, 1fr); } .pf-preview { position: static; } }
.pf-form fieldset { background: var(--card); }
.pf-hint { font-size: 0.88rem; color: var(--muted); margin: 4px 0 0; }
.pf-calc { background: var(--green-soft, #eef3e6); border-radius: 14px; padding: 10px 14px; margin: 14px 0 4px; font-size: 0.95rem; }
.pf-calc p { margin: 2px 0; }
.pf-rec { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0 12px; align-items: end; padding: 0 0 12px; margin-bottom: 4px; border-bottom: 1px dashed var(--line); }
.pf-rec button { margin-top: 14px; justify-self: start; }
.pf-row.row { grid-template-columns: 46px minmax(0, 1fr); align-items: start; }
.pf-row .chip { margin-top: 6px; }
.pf-row ul { margin: 4px 0 0; padding-left: 18px; color: var(--muted); font-size: 0.88rem; }
.pf-save { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin: 18px 0; }
.pf-cta { display: grid; align-content: center; gap: 8px; }
.pf-stat small { font-size: 1rem; color: var(--muted); }
`

type TextKey = NonNullable<{ [K in keyof FarmDraft]: FarmDraft[K] extends string ? K : never }[keyof FarmDraft]>
type Change = ChangeEvent<HTMLInputElement | HTMLTextAreaElement>

function Field({ label, hint, multiline, value, onChange, ...rest }: {
  label: string; hint?: ReactNode; multiline?: boolean; value: string; onChange: (e: Change) => void
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  const id = useId()
  const describedBy = hint ? `${id}-hint` : undefined
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      {multiline
        ? <textarea id={id} rows={3} value={value} onChange={onChange} placeholder={rest.placeholder} aria-describedby={describedBy} />
        : <input id={id} value={value} onChange={onChange} aria-describedby={describedBy} {...rest} />}
      {hint && <p className="pf-hint" id={describedBy}>{hint}</p>}
    </div>
  )
}

const KINDS: [FarmType, string][] = [['land', 'Land farm or ranch'], ['fish_farm', 'Fish farm – aquaculture (farm-raised)'], ['fishery', 'Wild-catch fishery']]
const SYSTEMS = ['ponds', 'flow-through raceways', 'net pens', 'recirculating tanks (RAS)', 'other']
const NON_NEG = { type: 'number', min: 0, step: 'any', inputMode: 'decimal' } as const

export default function ProducerDashboard() {
  const account = useAccount()
  const store = useStore()
  const email = account?.email ?? ''
  const [d, setD] = useState<FarmDraft>(() => toDraft(store.farms[email]))
  const [saved, setSaved] = useState(false)
  if (!account) return null

  const mine = store.passports.filter(p => p.created_by === email)
  const avg = averageScore(mine)
  const farm = fromDraft(d)
  const kind = d.farm_type
  const land = kind === 'land'
  // Pasture and coop boxes are hidden for fish operations, so their numbers are not shown to shoppers either.
  const pasturePer = land ? perHead(farm.pasture_acres, farm.herd_size) : null
  const coopPer = land ? perHead(farm.coop_sqft, farm.herd_size) : null

  const set = (patch: Partial<FarmDraft>) => { setD(p => ({ ...p, ...patch })); setSaved(false) }
  const bind = (k: TextKey) => ({ value: d[k], onChange: (e: Change) => set({ [k]: e.target.value } as Partial<FarmDraft>) })
  const setRow = <K extends 'health_records' | 'parasite_watch'>(k: K, i: number, patch: Partial<FarmDraft[K][number]>) =>
    set({ [k]: d[k].map((r, j) => (j === i ? { ...r, ...patch } : r)) } as Partial<FarmDraft>)
  const dropRow = (k: 'health_records' | 'parasite_watch', i: number) => set({ [k]: d[k].filter((_, j) => j !== i) } as Partial<FarmDraft>)

  function save(e: FormEvent) {
    e.preventDefault()
    actions.saveFarm(email, farm)
    setD(toDraft(farm)) // drops rows left completely blank
    setSaved(true)
  }

  return (
    <>
      <style>{CSS}</style>
      <h1>My farm</h1>
      <p className="lede">Tell shoppers where their food comes from. This profile feeds every product passport you create.</p>

      <div className="stats">
        <div className="panel pf-stat">
          <div className="stat">{mine.length}</div>
          <div className="muted">product passport{mine.length === 1 ? '' : 's'} created</div>
        </div>
        <div className="panel pf-stat">
          <div className="stat">{avg ?? '–'}<small> /100</small></div>
          {avg !== null && <div className="bar" role="img" aria-label={`Average Plattr score ${avg} out of 100`}><span style={{ width: `${avg}%` }} /></div>}
          <div className="muted">average Plattr score{avg === null && ' – no passports yet'}</div>
        </div>
        <div className="panel pf-cta">
          <Link className="btn" to="/producer/passports">Create a product passport</Link>
          <span className="pf-hint">Each passport gets its own QR code.</span>
        </div>
      </div>
      <p className="pf-hint">The Plattr score measures how much of a food's story is documented and backed up – not a medical or food-safety guarantee.</p>

      {mine.length > 0 && (
        <>
          <h2>Your passports</h2>
          <ul className="tiles">
            {mine.map(p => (
              <li key={p.id}>
                <Link to={`/food/${p.id}`}>
                  <span className="emoji" aria-hidden="true">{p.emoji}</span>
                  <strong>{p.name}</strong>{p.sample && <> <span className="chip ev-missing">SAMPLE</span></>}
                  <small>{p.category}</small>
                  <GradeDot score={scorePassport(p)} />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="pf-layout">
        <form className="pf-form" onSubmit={save}>
          <h2>Farm profile</h2>

          <fieldset>
            <legend>What kind of operation is this?</legend>
            {KINDS.map(([v, label]) => (
              <label className="check" key={v}>
                <input type="radio" name="pf-farm-type" value={v} checked={kind === v} onChange={() => set({ farm_type: v, aquaculture_system: '' })} />{label}
              </label>
            ))}
            <p className="pf-hint">Shoppers see this on your profile, and fish passports start with the matching "wild-caught" or "farm-raised" choice. The form below changes to fit.</p>
          </fieldset>

          <fieldset>
            <legend>{land ? 'Farm' : kind === 'fish_farm' ? 'Fish farm' : 'Fishery'}</legend>
            <div className="grid-2">
              <Field label={kind === 'fishery' ? 'Fishery or vessel name' : 'Farm name'} required autoComplete="organization" {...bind('name')} />
              <Field label="City or town" autoComplete="address-level2" {...bind('city')} />
              <Field label="State or region" autoComplete="address-level1" {...bind('state')} />
              <Field label="Country" autoComplete="country-name" {...bind('country')} />
              <Field label="Latitude" type="number" min={-90} max={90} step="any" inputMode="decimal" placeholder="e.g. 40.4406" {...bind('lat')} />
              <Field label="Longitude" type="number" min={-180} max={180} step="any" inputMode="decimal" placeholder="e.g. -79.9959" {...bind('lon')} />
            </div>
            <p className="pf-hint">Latitude and longitude place your farm on shoppers' "where my food came from" maps. West of Greenwich (all of the Americas) is a negative longitude.</p>
            <Field label="About the farm" multiline placeholder="Who you are, what you grow or raise, how long you have farmed here" {...bind('about')} />
          </fieldset>

          {kind === 'fish_farm' && (
            <fieldset>
              <legend>Fish and rearing system</legend>
              <div className="grid-2">
                <Field label="Species raised" placeholder="e.g. rainbow trout" {...bind('species')} />
                <div>
                  <label htmlFor="pf-system">System</label>
                  <select id="pf-system" value={d.aquaculture_system} onChange={e => set({ aquaculture_system: e.target.value })}>
                    <option value="">Choose…</option>
                    {SYSTEMS.map(x => <option key={x} value={x}>{x[0].toUpperCase() + x.slice(1)}</option>)}
                  </select>
                </div>
                <Field label="Stocking density" hint="How much fish per volume of water, in your own units." placeholder="e.g. 25 kg per cubic metre" {...bind('stocking_density')} />
                <Field label="Site size (acres)" {...NON_NEG} {...bind('acres')} />
              </div>
            </fieldset>
          )}

          {kind === 'fishery' && (
            <fieldset>
              <legend>Catch</legend>
              <div className="grid-2">
                <Field label="Species caught" placeholder="e.g. Atlantic cod, haddock" {...bind('species')} />
                <Field label="Fishing area and gear" multiline placeholder="e.g. Gulf of Maine (FAO area 21), hook and line" {...bind('aquaculture_system')} />
              </div>
            </fieldset>
          )}

          {land && <fieldset>
            <legend>Land and animals</legend>
            <div className="grid-2">
              <Field label="Total acres" {...NON_NEG} {...bind('acres')} />
              <Field label="Pasture acres" {...NON_NEG} {...bind('pasture_acres')} />
              <Field label="Chicken coop size (sq ft)" {...NON_NEG} {...bind('coop_sqft')} />
              <Field label="Herd or flock size (animals)" {...NON_NEG} step={1} inputMode="numeric" {...bind('herd_size')} />
            </div>
            <div className="pf-calc" aria-live="polite">
              <p><strong>Pasture per animal:</strong> {pasturePer !== null ? `${pasturePer} acres` : 'enter pasture acres and herd size'}</p>
              <p><strong>Coop space per bird:</strong> {coopPer !== null ? `${coopPer} sq ft` : 'enter coop size and flock size'}</p>
            </div>
            <p className="pf-hint">These two figures are calculated from the numbers above and back up "free range" and "pasture-raised" facts on your passports.</p>
          </fieldset>}

          <fieldset>
            <legend>Where you sell</legend>
            <div className="grid-2">
              <Field label="Farmers markets" hint="Separate with commas." placeholder="Bloomfield Saturday Market, Squirrel Hill Market" {...bind('markets')} />
              <Field label="Specialties" hint="Separate with commas." placeholder="Pasture-raised eggs, heirloom tomatoes" {...bind('specialties')} />
            </div>
          </fieldset>

          <fieldset>
            <legend>{kind === 'fish_farm' ? 'Water source and quality' : 'Water'}</legend>
            {kind === 'fish_farm' && <p className="pf-hint">Water tests matter most for a fish farm: the water is where the fish live. Record the latest dissolved oxygen and ammonia readings, and keep the lab report to attach to your passports.</p>}
            {kind === 'fishery' && <p className="pf-hint">For a fishery this is the water and ice used on board or at the dock, not the sea you fish in.</p>}
            <div className="grid-2">
              <Field label="Water source" placeholder={kind === 'fish_farm' ? 'Spring, well, river intake, recirculated' : 'Well, spring, municipal, river'} {...bind('water_source')} />
              <Field label="Last water test date" type="date" {...bind('water_last_test')} />
              <Field label="Test result" placeholder={kind === 'fish_farm' ? 'e.g. Dissolved oxygen 8 mg/L; ammonia below 0.02 mg/L' : 'e.g. No E. coli detected; nitrate 2 mg/L'} {...bind('water_result')} />
            </div>
          </fieldset>

          <fieldset>
            <legend>Soil inputs</legend>
            <div className="grid-2">
              <Field label="Fertilizers" multiline placeholder="e.g. Composted manure, fish emulsion" {...bind('fertilizers')} />
              <Field label="Pesticides and insecticides" multiline placeholder="List what you use, or write: none used" {...bind('pesticides')} />
            </div>
            <label className="check">
              <input type="checkbox" checked={d.organic} onChange={e => set({ organic: e.target.checked })} aria-describedby="pf-organic-hint" />
              We farm organically
            </label>
            <p className="pf-hint" id="pf-organic-hint">Organic claims are backed by feed and input invoices, which you upload as documents when you create a passport. Until then shoppers see "Producer-declared".</p>
          </fieldset>

          <fieldset>
            <legend>{land ? 'Livestock health records' : 'Fish health records'}</legend>
            <p className="pf-hint">{land ? 'Vet visits, vaccinations, treatments.' : 'Fish health inspections, treatments, parasite checks.'} Shoppers see these as your animal health history.</p>
            {d.health_records.map((r, i) => (
              <div className="pf-rec" key={i} role="group" aria-label={`Health record ${i + 1}`}>
                <Field label="Date" type="date" value={r.date} onChange={e => setRow('health_records', i, { date: e.target.value })} />
                <Field label="Animal or lot" placeholder="Lot 4 / Hen house B" value={r.animal_or_lot} onChange={e => setRow('health_records', i, { animal_or_lot: e.target.value })} />
                <Field label="Event" list="pf-events" placeholder="Vet visit - herd check" value={r.event} onChange={e => setRow('health_records', i, { event: e.target.value })} />
                <Field label="Vet" placeholder="Dr. name or clinic" value={r.vet} onChange={e => setRow('health_records', i, { vet: e.target.value })} />
                <button type="button" className="small secondary" onClick={() => dropRow('health_records', i)} aria-label={`Remove health record ${i + 1}`}>Remove</button>
              </div>
            ))}
            <datalist id="pf-events">
              <option value="Vet visit - herd check" /><option value="Fish health inspection" /><option value="Vaccination" /><option value="Treatment (with withdrawal period)" /><option value="Deworming" />
            </datalist>
            <p><button type="button" className="small secondary" onClick={() => set({ health_records: [...d.health_records, { date: '', animal_or_lot: '', event: '', vet: '' }] })}>+ Add health record</button></p>
          </fieldset>

          <fieldset>
            <legend>Parasite and pest watch</legend>
            <p className="pf-hint">These appear to shoppers as "what the farm does" next to the parasite and hazard outlook for your region.</p>
            {d.parasite_watch.map((r, i) => (
              <div className="pf-rec" key={i} role="group" aria-label={`Parasite or pest ${i + 1}`}>
                <Field label="Parasite or pest" placeholder="Liver fluke, coccidia, aphids" value={r.name} onChange={e => setRow('parasite_watch', i, { name: e.target.value })} />
                <Field label="Status" list="pf-status" placeholder="none seen / monitoring / treated" value={r.status} onChange={e => setRow('parasite_watch', i, { status: e.target.value })} />
                <Field label="Noted on" type="date" value={r.noted_on} onChange={e => setRow('parasite_watch', i, { noted_on: e.target.value })} />
                <button type="button" className="small secondary" onClick={() => dropRow('parasite_watch', i)} aria-label={`Remove parasite or pest ${i + 1}`}>Remove</button>
              </div>
            ))}
            <datalist id="pf-status"><option value="none seen" /><option value="monitoring" /><option value="treated" /></datalist>
            <p><button type="button" className="small secondary" onClick={() => set({ parasite_watch: [...d.parasite_watch, { name: '', status: '', noted_on: '' }] })}>+ Add parasite or pest</button></p>
          </fieldset>

          <div className="pf-save">
            <button type="submit">Save farm profile</button>
            <span role="status" aria-live="polite">{saved && <strong>✓ Saved. Your farm profile is stored in this browser.</strong>}</span>
          </div>
        </form>

        <FarmPreview farm={farm} pasturePer={pasturePer} coopPer={coopPer} />
      </div>
    </>
  )
}

function PRow({ ico, title, value, children }: { ico: string; title: string; value: string; children?: ReactNode }) {
  return (
    <li className="row pf-row">
      <span className="ico" aria-hidden="true">{ico}</span>
      <div>
        <strong>{title}</strong>
        <span className="sub">{value || 'Nothing entered yet'}</span>
        {children}
        <span className={`chip ${value ? 'ev-declared' : 'ev-missing'}`}>{value ? 'Producer-declared' : 'Not provided'}</span>
      </div>
    </li>
  )
}

function FarmPreview({ farm, pasturePer, coopPer }: { farm: FarmProfile; pasturePer: number | null; coopPer: number | null }) {
  const place = [farm.city, farm.state, farm.country].filter(Boolean).join(', ')
  const space = [pasturePer !== null && `${pasturePer} acres of pasture per animal`, coopPer !== null && `${coopPer} sq ft of coop per bird`].filter(Boolean).join(' · ')
  const water = [farm.water_source, farm.water_last_test && `tested ${farm.water_last_test}`, farm.water_result].filter(Boolean).join(' · ')
  const inputs = [farm.fertilizers && `Fertilizers: ${farm.fertilizers}`, farm.pesticides && `Pesticides: ${farm.pesticides}`].filter(Boolean).join(' · ')
  const latest = [...farm.health_records].sort((a, b) => b.date.localeCompare(a.date))[0]
  const health = latest ? `${farm.health_records.length} record${farm.health_records.length === 1 ? '' : 's'} · latest: ${[latest.date, latest.event, latest.vet].filter(Boolean).join(', ')}` : ''
  const kind = kindLabel(farm.farm_type)
  const fishFarm = farm.farm_type === 'fish_farm'
  const badges = [...(kind ? [kind] : []), ...farm.specialties, ...(farm.organic ? ['Organic (producer-declared)'] : [])]

  return (
    <aside className="panel pf-preview" aria-labelledby="pf-preview-h">
      <h2 id="pf-preview-h">What shoppers will see</h2>
      <h3>{farm.name || 'Your farm name'}</h3>
      <p className="muted" style={{ margin: '2px 0 8px' }}>{place || 'Location not provided'}{farm.acres !== undefined && farm.farm_type !== 'fishery' && ` · ${farm.acres} acres`}</p>
      {farm.about && <p style={{ margin: '0 0 8px' }}>{farm.about}</p>}
      {badges.length > 0 && <ul className="badges">{badges.map(b => <li className="badge" key={b}>{b}</li>)}</ul>}

      <ul className="rows">
        {kind && <PRow ico={fishFarm ? '🐟' : '🎣'} title="Kind of operation" value={kind} />}
        <PRow ico="🌱" title={farm.farm_type === 'fishery' ? 'Home port' : 'Farm origin'} value={place} />
        <PRow ico="📍" title="On the food map" value={farm.lat !== undefined && farm.lon !== undefined ? `Pinned at ${farm.lat}, ${farm.lon}` : ''} />
        {kind && <PRow ico="🐠" title={fishFarm ? 'Species raised' : 'Species caught'} value={farm.species ?? ''} />}
        {fishFarm && <PRow ico="🏞️" title="Rearing system" value={farm.aquaculture_system ?? ''} />}
        {fishFarm && <PRow ico="📏" title="Stocking density" value={farm.stocking_density ?? ''} />}
        {farm.farm_type === 'fishery' && <PRow ico="🌊" title="Fishing area and gear" value={farm.aquaculture_system ?? ''} />}
        {!kind && <PRow ico="🐄" title="Space and welfare" value={space} />}
        <PRow ico="🧺" title="Where to buy" value={farm.markets.join(', ')} />
        <PRow ico="💧" title={fishFarm ? 'Water source and quality' : 'Water quality'} value={water} />
        <PRow ico="🟤" title="Soil inputs" value={inputs} />
        <PRow ico="🩺" title={kind ? 'Fish health records' : 'Animal health records'} value={health} />
        <PRow ico="🔎" title="Parasite and pest watch – what the farm does" value={farm.parasite_watch.length ? `${farm.parasite_watch.length} on watch` : ''}>
          {farm.parasite_watch.length > 0 && (
            <ul>{farm.parasite_watch.map((w, i) => <li key={i}>{[w.name || 'Unnamed', w.status, w.noted_on && `noted ${w.noted_on}`].filter(Boolean).join(' – ')}</li>)}</ul>
          )}
        </PRow>
      </ul>

      <p className="note" style={{ fontSize: '0.88rem' }}>
        Everything on this page is your own statement, so shoppers see it marked <strong>Producer-declared</strong>. Attach water test reports, vet reports and
        feed or input invoices when you create a passport to raise it to <strong>Document on file</strong>.
      </p>
    </aside>
  )
}
