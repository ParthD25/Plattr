// /ranchers - what a profile is, the promises, and a preview-only builder. The builder keeps everything in
// component state: nothing is stored and nothing is sent.
import { Fragment, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { Loading, Quote, useData } from '../components/ui'
import { loadClaims, loadPlants, loadRanchers } from '../data'
import { listedKey, type ClaimDefQ } from '../rancher/check'
import ProfileView, { ProcessorResult } from '../rancher/ProfileView'
import { leadIn, PATH_LABEL, QUESTIONS } from '../rancher/words'
import type { ClaimsFile, PlantsFile, Rancher } from '../types'

type Picked = { words: string; answers: Record<string, string> }

/** A ticked claim joins the preview once it has words and every follow-up question is answered. */
const ready = (def: ClaimDefQ, v: Picked) => v.words.trim() !== '' && (def.form_questions ?? []).every(q => v.answers[q])

function ClaimField({ def, claims, value, onChange }: { def: ClaimDefQ; claims: ClaimsFile; value?: Picked; onChange: (v?: Picked) => void }) {
  const questions = def.form_questions ?? []
  const listed = value ? listedKey(def, value.answers) : def.key
  return (
    <div>
      <label style={{ fontWeight: 400 }}>
        <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked ? { words: '', answers: {} } : undefined)} /> {def.label}
      </label>
      {value && (
        <div style={{ marginLeft: 28 }}>
          <label htmlFor={`words-${def.key}`}>Your words for “{def.label}” (shown in quotation marks)</label>
          <input id={`words-${def.key}`} type="text" maxLength={200} style={{ width: '100%' }} value={value.words}
            onChange={e => onChange({ ...value, words: e.target.value })} />
          {questions.map(q => (
            <Fragment key={q}>
              <label htmlFor={`q-${q}`}>{QUESTIONS[q] ?? q}</label>
              <select id={`q-${q}`} value={value.answers[q] ?? ''} onChange={e => onChange({ ...value, answers: { ...value.answers, [q]: e.target.value } })}>
                <option value="">Choose…</option>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </Fragment>
          ))}
          {listed !== def.key && (
            <div role="status">
              <p>
                <strong>
                  Because you answered yes, this {listed
                    ? `is listed as “${claims.claims.find(d => d.key === listed)?.label ?? listed}”, not “${def.label}”`
                    : `cannot be listed as “${def.label}”`}.
                </strong>
                {def.key === 'raised_without_antibiotics' && ' FSIS counts ionophores as antibiotics.'}
                {def.quote && <> {leadIn(def.is_binding_law)}:</>}
              </p>
              {def.quote && <Quote>{def.quote}</Quote>}
              {def.source && <p className="caveat">Source: {def.url ? <a href={def.url} target="_blank" rel="noreferrer">{def.source}</a> : def.source} · snapshot {claims.retrieved}</p>}
            </div>
          )}
          {!ready(def, value) && (
            <p className="caveat">This claim joins the preview once you have typed your words{questions.length > 0 && ' and answered the questions'}.</p>
          )}
          <p className="caveat">Always shown with this claim, and you cannot remove it: {def.caveat}</p>
        </div>
      )}
    </div>
  )
}

function Builder({ claims, plants }: { claims: ClaimsFile; plants: PlantsFile }) {
  const [f, setF] = useState({ name: '', county: '', state: '', path: 'usda' as Rancher['inspection_path'], est: '', by: '', story: '' })
  const [picked, setPicked] = useState<Record<string, Picked>>({})
  const [copyNote, setCopyNote] = useState('')
  const field = (k: keyof typeof f) => ({
    id: `rf-${k}`,
    value: f[k],
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value }),
  })

  const defs = claims.claims as ClaimDefQ[]
  const groups = [
    { legend: 'How you raise your cattle', defs: defs.filter(d => d.raising_claim !== false) },
    { legend: 'Other statements (shown in a separate, quieter group)', defs: defs.filter(d => d.key === 'breed' || d.key === 'local') },
  ]
  const today = new Date().toLocaleDateString('en-CA')   // YYYY-MM-DD, local time
  const customExempt = f.path === 'custom_exempt'

  const rancher: Rancher = {
    slug: f.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    status: 'pending',
    ranch: { name: f.name.trim(), county: f.county.trim(), state: f.state.trim().toUpperCase() },
    last_confirmed: today,
    inspection_path: f.path,
    processors: customExempt || !f.est.trim() ? [] : [{ est: f.est.trim(), role: 'unspecified', declared_at: today }],
    story: f.story.trim() ? { text: f.story.trim(), by: f.by.trim() || f.name.trim() || 'the rancher', date: today } : undefined,
    claims: defs.flatMap(def => {
      const v = picked[def.key]
      const key = v && ready(def, v) ? listedKey(def, v.answers) : null
      return key ? [{ key, words: v.words.trim(), answers: v.answers, declared_at: today, level: 'rancher_declared' as const, evidence: [] }] : []
    }),
  }
  const json = JSON.stringify(rancher, null, 2)

  async function copy() {
    try {
      await navigator.clipboard.writeText(json)
      setCopyNote('Copied to your clipboard.')
    } catch {
      setCopyNote('Could not copy - open “Show profile JSON” below and copy it by hand.')
    }
  }

  return (
    <>
      <form onSubmit={e => e.preventDefault()}>
        <label htmlFor="rf-name">Ranch name</label>
        <input type="text" maxLength={80} style={{ width: '100%' }} {...field('name')} />
        <label htmlFor="rf-county">County</label>
        <input type="text" maxLength={60} {...field('county')} />
        <label htmlFor="rf-state">State (two letters)</label>
        <input type="text" maxLength={2} size={4} {...field('state')} />

        <label htmlFor="rf-path">How is your beef inspected?</label>
        <select {...field('path')}>
          {Object.entries(PATH_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>

        {customExempt ? (
          <p className="caveat">Custom-exempt beef carries no establishment number, so there is no processor number to enter. The preview below shows how Plattr explains this.</p>
        ) : (
          <>
            <label htmlFor="rf-est">Processor establishment number (the number inside the USDA mark of inspection)</label>
            <input type="text" maxLength={12} {...field('est')} />
            <div aria-live="polite" className="caveat">
              {f.est.trim() && <ProcessorResult plants={plants} est={f.est.trim()} />}
            </div>
          </>
        )}

        <label htmlFor="rf-by">Your name and role (shown with your story)</label>
        <input type="text" maxLength={80} {...field('by')} />
        <label htmlFor="rf-story">Your story, in your own words (shown in quotation marks)</label>
        <textarea rows={5} maxLength={600} style={{ width: '100%' }} aria-describedby="rf-story-count" {...field('story')} />
        <p className="caveat" id="rf-story-count">{f.story.length} of 600 characters</p>

        {groups.map(g => (
          <fieldset key={g.legend} style={{ margin: '16px 0' }}>
            <legend>{g.legend}</legend>
            {g.defs.map(def => (
              <ClaimField key={def.key} def={def} claims={claims} value={picked[def.key]} onChange={v => {
                const next = { ...picked }
                if (v) next[def.key] = v
                else delete next[def.key]
                setPicked(next)
              }} />
            ))}
          </fieldset>
        ))}
      </form>

      <ProfileView rancher={rancher} claims={claims} plants={plants} />

      <p>
        <button type="button" onClick={copy}>Copy profile JSON</button> <span role="status">{copyNote}</span>
      </p>
      <p className="caveat">
        Copying puts the JSON on your clipboard and does nothing else. A submission is reviewed by a person before anything is published.
      </p>
      <details>
        <summary>Show profile JSON</summary>
        <pre style={{ overflowX: 'auto' }}>{json}</pre>
      </details>
    </>
  )
}

export default function RanchersPage() {
  const ranchers = useData(loadRanchers)
  const claims = useData(loadClaims)
  const plants = useData(loadPlants)
  const samples = ranchers.data?.ranchers.filter(r => r.status === 'sample') ?? []
  const error = claims.error ?? plants.error

  return (
    <>
      <h1>Put your ranch on the package - free.</h1>
      <p className="lede">
        Shoppers type the establishment number printed on a beef package and see the plant's public record. Below that record,
        ranchers who say they process at that plant can tell shoppers how they raise their cattle - in their own words.
      </p>

      <h2>What a profile shows</h2>
      <ul>
        <li>Your ranch name, county and state.</li>
        <li>Your story, in quotation marks, with your name and the date.</li>
        <li>How you raise your cattle: each statement in your own words, tagged Rancher-declared, beside what the term means and its caveat.</li>
        <li>The plant that processes your cattle, linked to its FSIS record. We verify the plant, never the ranch: the one check Plattr runs is whether the number you give is in the FSIS directory and listed as slaughtering cattle.</li>
        <li>The date you last confirmed the profile.</li>
      </ul>

      <h2>What we promise</h2>
      <ul>
        <li>Nothing you type is ever labelled verified.</li>
        <li>Some claims carry a caveat you cannot remove - for example, grass-fed is not the same claim as grass-finished.</li>
        <li>You can withdraw at any time.</li>
        <li>A person reviews every profile before it is published.</li>
        <li>Your consent is recorded. Plattr never builds a profile for a ranch that has not asked for one.</li>
      </ul>

      <h2>Sample profiles</h2>
      <p className="muted">These ranches are fictional and labelled SAMPLE.</p>
      {ranchers.error ? <p role="alert">{ranchers.error}</p>
        : !ranchers.data ? <Loading what="the sample profiles" />
        : (
          <ul className="tiles">
            {samples.map(r => (
              <li key={r.slug}>
                <Link to={`/r/${r.slug}`}>{r.ranch.name} <small>Sample profile · {r.ranch.county}, {r.ranch.state}</small></Link>
              </li>
            ))}
          </ul>
        )}

      <h2>Build a preview</h2>
      <p>Preview only: nothing you type here is saved or sent anywhere. Every claim in the preview is Rancher-declared.</p>
      {error ? <p role="alert">{error}</p>
        : claims.data && plants.data ? <Builder claims={claims.data} plants={plants.data} />
        : <Loading what="the builder" />}
    </>
  )
}
