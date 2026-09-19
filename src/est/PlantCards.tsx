// The verified spine: everything the public FSIS record says about one establishment, one card per record.
// Wording rules: attributive and dated, no verdict words, absence is only ever "not found in <source> as of <date>".
import { Card, Chip, Loading, Quote, SourceLine, useData } from '../components/ui'
import { loadClaims, loadHumane, loadRecalls, loadSampling } from '../data'
import type { Plant, PlantsFile } from '../types'
import { plantTokens } from './normalize'
import { humaneForPlant, postedEst, recallsForPlant, samplingForPlant, volumeBand } from './records'

const CATTLE_CLASS: Record<string, string> = {
  steer: 'steers', heifer: 'heifers', beef_cow: 'beef cows', dairy_cow: 'dairy cows',
  bull_stag: 'bulls/stags', heavy_calf: 'heavy calves', bob_veal: 'bob veal',
}

function Pending({ error, what }: { error?: string; what: string }) {
  return error ? <p role="alert">Could not load {what}: {error}</p> : <Loading what={what} />
}

function Row({ label, value }: { label: string; value: string }) {
  return value ? <tr><th scope="row">{label}</th><td>{value}</td></tr> : null
}

function Identity({ plant, file }: { plant: Plant; file: PlantsFile }) {
  return (
    <Card tier="verified" title="The establishment" source={<SourceLine source={file.source} date={file.retrieved} />}>
      <p>FSIS lists this establishment as <strong>{plant.name}</strong>. Listed in the directory as of {file.retrieved}.</p>
      <table>
        <tbody>
          <Row label="Doing business as (DBA)" value={plant.dbas} />
          <Row label="Location" value={[plant.city, plant.state, plant.county].filter(Boolean).join(', ')} />
          <Row label="Grant date" value={plant.grant_date} />
          <Row label="Activities" value={plant.activities} />
          <Row label="HACCP size" value={plant.size} />
          <Row label="Numbers on packs" value={plantTokens(plant).join(', ')} />
        </tbody>
      </table>
      <p className="caveat">
        This is the establishment whose number is on the pack — where the product was processed or packed. It is not the ranch, the feedlot or the brand.
      </p>
    </Card>
  )
}

function CattleClasses({ classes, file }: { classes: string[]; file: PlantsFile }) {
  return (
    <Card tier="verified" title="Cattle classes slaughtered" source={<SourceLine source={file.source} date={file.retrieved} />}>
      <p>FSIS lists this establishment as slaughtering: {classes.map(c => CATTLE_CLASS[c] ?? c).join(', ')}.</p>
      <p className="caveat">
        FSIS’s meaning: the establishment slaughtered at least one animal in the category in the last 360 days. A listed class does not say what is in
        any one package, and Plattr draws no conclusion from it.
      </p>
    </Card>
  )
}

function Scale({ plant, file }: { plant: Plant; file: PlantsFile }) {
  const rows = [
    { what: 'Slaughter', category: plant.slaughter_volume_category, legend: file.volume_legend.slaughter },
    { what: 'Processing', category: plant.processing_volume_category, legend: file.volume_legend.processing },
  ].filter(r => r.category !== undefined)
  return (
    <Card tier="verified" title="Scale, as categorised by FSIS" source={<SourceLine source={`${file.source}; band text from the ${file.volume_legend.source}`} date={file.retrieved} />}>
      {rows.length === 0 && <p>FSIS lists no volume category for this establishment as of {file.retrieved}.</p>}
      {rows.map(r => {
        const { measure, band } = volumeBand(r.legend, r.category!)
        return <p key={r.what}>{r.what} volume category {r.category} of 5{band && <>: “{band}”</>} — {measure}.</p>
      })}
      <p className="caveat">Each category covers all species and all products at the establishment combined, not beef alone.</p>
    </Card>
  )
}

function NoCattleSlaughter({ file }: { file: PlantsFile }) {
  return (
    <Card tier="inference" title="No cattle slaughter listed" source={<SourceLine source={file.source} date={file.retrieved} />}>
      <p>
        FSIS does not list this establishment as slaughtering cattle in the last 360 days. Any beef packed here was slaughtered somewhere else, and
        public FSIS data does not say where.
      </p>
      <p className="caveat">This is Plattr’s reading of the directory as of {file.retrieved}, not a statement by FSIS about any package.</p>
    </Card>
  )
}

function Recalls({ plant }: { plant: Plant }) {
  const { data, error } = useData(loadRecalls)
  const found = data && recallsForPlant(data.recalls, plant)
  return (
    <Card
      tier="verified"
      title="FSIS recalls and public health alerts naming this number"
      source={data && <SourceLine source={data.source} date={data.retrieved} />}
    >
      {!found && <Pending error={error} what="FSIS recall notices" />}
      {found?.length === 0 && (
        <p>No FSIS notice naming this number was found in notices from 2014 to {data!.retrieved}. That is not evidence of safety.</p>
      )}
      {found?.map(({ recall, sentences, nameMatch }) => (
        <div key={recall.number} style={{ marginBottom: 14 }}>
          <p style={{ marginBottom: 0 }}>
            FSIS posted notice {recall.number} on {recall.date}: <a href={recall.url} target="_blank" rel="noreferrer">{recall.title}</a>
          </p>
          <p className="caveat">{[recall.type, recall.risk, `reason: ${recall.reason}`].join(' · ')}</p>
          {sentences.map(s => <Quote key={s}>{s}</Quote>)}
          <Chip tier="inference">{nameMatch ? 'Plattr text match: number and name match' : 'Plattr text match: number match only'}</Chip>
        </div>
      ))}
      <p className="caveat">
        A recall names specific products and dates, not everything the plant makes. The link between a notice and this establishment is a text match
        by Plattr on the number in the notice, not an FSIS field.
      </p>
    </Card>
  )
}

function Sampling({ plant }: { plant: Plant }) {
  const { data, error } = useData(loadSampling)
  const row = data && samplingForPlant(data, plant)
  return (
    <Card tier="verified" title="FSIS raw-beef sampling, FY2025" source={data && <SourceLine source={data.source} url={data.url} date={data.retrieved} />}>
      {!data && <Pending error={error} what="FSIS raw-beef sampling data" />}
      {data && (row ? (
        <p>
          FSIS collected {row.n} raw-beef samples at this establishment between {row.first} and {row.last}: {row.stec_pos} tested positive for STEC
          and {row.salm_pos} for Salmonella.
        </p>
      ) : (
        <p>
          No FY2025 raw-beef samples are listed for this establishment ({data.window[0]} to {data.window[1]}). That is not a statement about safety:
          FSIS sets sampling by volume and risk, and many plants do not grind beef.
        </p>
      ))}
      {data && (
        <>
          <p className="caveat">{data.scope}</p>
          <p className="caveat" style={{ marginBottom: 0 }}>FSIS’s note on this data:</p>
          <Quote>{data.fsis_disclaimer}</Quote>
        </>
      )}
    </Card>
  )
}

function Humane({ plant }: { plant: Plant }) {
  const { data, error } = useData(loadHumane)
  const found = data && humaneForPlant(data, plant)
  return (
    <Card
      tier="verified"
      title="Humane-handling enforcement actions posted by FSIS"
      source={data && <SourceLine source={data.source} url={data.url} date={data.retrieved} />}
    >
      {!found && <Pending error={error} what="FSIS humane-handling enforcement actions" />}
      {found?.length === 0 && <p>No enforcement action for this establishment is posted on the FSIS page as of {data!.retrieved}.</p>}
      {found?.map((e, i) => (
        <div key={i}>
          <p>FSIS posted these actions for {e.name_as_posted} ({postedEst(e.est)}):</p>
          <table>
            <thead><tr><th scope="col">Action</th><th scope="col">Date of action</th><th scope="col">Date posted</th><th scope="col">FSIS letter</th></tr></thead>
            <tbody>
              {e.actions.map(a => (
                <tr key={a.pdf}>
                  <td>{a.action}</td>
                  <td>{a.date_of_action}</td>
                  <td>{a.date_posted}</td>
                  <td><a href={a.pdf} target="_blank" rel="noreferrer">FSIS letter of {a.date_of_action} (PDF)</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {data && (
        <>
          <p className="caveat">These actions concern animal handling under the Humane Methods of Slaughter Act, not product safety.</p>
          <p className="caveat" style={{ marginBottom: 0 }}>From the FSIS page:</p>
          <Quote>{data.retention}</Quote>
        </>
      )}
    </Card>
  )
}

function Floor() {
  const { data, error } = useData(loadClaims)
  return (
    <>
      <Card tier="floor" title="Where the public record stops" source={data && <SourceLine source="Plattr claims table" date={data.retrieved} />}>
        {data ? <p>{data.floor.split('. ').slice(0, 2).join('. ')}.</p> : <Pending error={error} what="the floor statement" />}
      </Card>
      <div className="divider">Everything below this line is what a rancher told us, in their own words, dated and unverified.</div>
    </>
  )
}

export default function PlantCards({ plant, file }: { plant: Plant; file: PlantsFile }) {
  return (
    <>
      <h2>What the public federal record says</h2>
      <Identity plant={plant} file={file} />
      {plant.cattle_slaughter?.length ? <CattleClasses classes={plant.cattle_slaughter} file={file} /> : null}
      <Scale plant={plant} file={file} />
      {plant.cattle_slaughter?.length ? null : <NoCattleSlaughter file={file} />}
      <Recalls plant={plant} />
      <Sampling plant={plant} />
      <Humane plant={plant} />
      <Floor />
    </>
  )
}
