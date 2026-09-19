// One rancher profile. Everything the rancher typed sits inside quotation marks with a name and a date;
// the only thing Plattr adds in its own voice is the plant-record check, the term definitions and the fixed caveats.
import { Link } from 'react-router-dom'
import { Card, Quote, SampleBanner, SourceLine } from '../components/ui'
import type { ClaimDef, ClaimsFile, PlantsFile, Rancher } from '../types'
import { beefPlant, checkProcessor } from './check'
import { leadIn, PATH_LABEL, QUESTIONS } from './words'

/** What the FSIS directory snapshot says about a number a rancher typed. Describes the plant record, never the ranch-plant relationship. */
export function ProcessorResult({ plants, est }: { plants: PlantsFile; est: string }) {
  const match = beefPlant(plants, est)
  if (!match) return (
    <p>
      “{est}” was not found in the FSIS directory snapshot of {plants.retrieved}. This can be a typo, a state-inspected plant,
      or a custom-exempt processor; the snapshot holds federally inspected establishments only. It is not a finding about the ranch.
    </p>
  )
  const { plant, token } = match
  return (
    <>
      <p><Link to={`/est/${token}`}>{plant.name}, {plant.city}, {plant.state} - FSIS plant record for {token}</Link></p>
      <p>
        {checkProcessor(plants, est) === 'cattle_slaughter'
          ? 'FSIS lists this establishment as slaughtering cattle.'
          : 'FSIS does not list this establishment as slaughtering cattle; it may be a cut-and-wrap processor.'}
      </p>
      <p>Plant record checked against the FSIS directory snapshot of {plants.retrieved}. Plattr has not confirmed with the plant that this ranch is a customer.</p>
    </>
  )
}

function ClaimCard({ claim, def, by, claims }: { claim: Rancher['claims'][number]; def: ClaimDef; by: string; claims: ClaimsFile }) {
  return (
    <Card
      tier="rancher"
      title={def.label}
      source={<>
        Source of the statement: the rancher, {claim.declared_at}.
        {def.source && <> Source of the term's meaning: {def.url ? <a href={def.url} target="_blank" rel="noreferrer">{def.source}</a> : def.source}.</>}
        {' '}Claims table snapshot {claims.retrieved}.
      </>}
    >
      <Quote>{claim.words}</Quote>
      <p className="caveat">- {by}, {claim.declared_at}</p>
      {Object.entries(claim.answers ?? {}).map(([q, a]) => (
        <p className="caveat" key={q}>Plattr asked: {QUESTIONS[q] ?? q} The rancher answered: “{a}”.</p>
      ))}
      <p><strong>What stands behind it:</strong> {claims.levels[claim.level]}</p>
      {claim.level !== 'rancher_declared' && (
        <ul>
          {claim.evidence.map(e => (
            <li key={e.url}><a href={e.url} target="_blank" rel="noreferrer">{e.issuer}</a> ({e.type}), checked on {e.checked_on}</li>
          ))}
        </ul>
      )}
      <p className="caveat">
        <strong>Caveat (fixed by Plattr; the rancher cannot remove it):</strong> {def.caveat}
        {def.caveat_url && <> <a href={def.caveat_url} target="_blank" rel="noreferrer">{def.caveat_source}</a></>}
      </p>
      {def.quote && (
        <>
          <p><strong>What the term means.</strong> {leadIn(def.is_binding_law)}:</p>
          <Quote>{def.quote}</Quote>
        </>
      )}
    </Card>
  )
}

export default function ProfileView({ rancher, claims, plants }: { rancher: Rancher; claims: ClaimsFile; plants: PlantsFile }) {
  const { ranch, story } = rancher
  const pending = rancher.status === 'pending'   // only the builder preview renders a pending profile
  const Name = pending ? 'h2' : 'h1'
  const name = ranch.name || 'Unnamed ranch'
  const customRule = claims.label_rules.find(r => r.key === 'custom_exempt')
  const cards = (raising: boolean) => rancher.claims.map((claim, i) => {
    const def = claims.claims.find(d => d.key === claim.key)
    return def && (def.raising_claim !== false) === raising ? <ClaimCard key={i} claim={claim} def={def} by={name} claims={claims} /> : null
  }).filter(Boolean)
  const raising = cards(true)
  const other = cards(false)

  return (
    <article>
      {rancher.status === 'sample' && <SampleBanner text={rancher.sample_banner ?? 'SAMPLE DATA - fictional profile.'} />}
      {pending && <SampleBanner text="Preview - not published" />}
      <Name>{name}</Name>
      <p className="lede">{[ranch.county, ranch.state].filter(Boolean).join(', ')}</p>

      {story && (
        <>
          <h2>Story</h2>
          <Quote>{story.text}</Quote>
          <p className="caveat">- {story.by}, {story.date}</p>
        </>
      )}

      {raising.length > 0 && <h2>Raising claims</h2>}
      {raising}

      {other.length > 0 && (
        <div className="muted" style={{ fontSize: '0.9rem' }}>
          <h2>Other statements</h2>
          <p>These statements do not describe how the cattle were raised.</p>
          {other}
        </div>
      )}

      <h2>Processor</h2>
      <p>Inspection path, as declared by the rancher: {PATH_LABEL[rancher.inspection_path]}.</p>
      {rancher.inspection_path === 'custom_exempt' ? (
        <Card tier="rancher" title="Custom-exempt beef" source={customRule && <SourceLine source={customRule.source} url={customRule.url} date={claims.retrieved} />}>
          <p>The rancher says this beef is processed custom-exempt.</p>
          {customRule && (
            <>
              <p>{leadIn(customRule.is_binding_law)}:</p>
              <Quote>{customRule.quote}</Quote>
            </>
          )}
          <p>
            Such beef is marked Not for Sale and carries no establishment number, so there is no number to look up and this
            profile links to no plant record. That is how the custom exemption works; it is not a finding about this ranch.
          </p>
        </Card>
      ) : rancher.processors.length === 0 ? (
        <p className="muted">No processor declared.</p>
      ) : rancher.processors.map(p => (
        <Card key={p.est} tier="rancher" title={`Declared processor: ${p.est}`} source={<SourceLine source={plants.source} date={plants.retrieved} />}>
          <p>The rancher declared this establishment number on {p.declared_at}.</p>
          <ProcessorResult plants={plants} est={p.est} />
        </Card>
      ))}

      {ranch.url && <p><a href={ranch.url} target="_blank" rel="noreferrer">Website of {name} (rancher's link)</a></p>}
      {ranch.buy_url && <p><a href={ranch.buy_url} target="_blank" rel="noreferrer">Where to buy from {name} (rancher's link)</a></p>}

      <p>Last confirmed by the rancher on {rancher.last_confirmed}.</p>
      <p className="muted">The statements on this page are the rancher's own. Plattr does not verify or endorse them.</p>
    </article>
  )
}
