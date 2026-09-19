// Contract between the plant page (imports this) and the rancher module (implements it). Owner: rancher builder.
import { Link } from 'react-router-dom'
import { Card, useData } from '../components/ui'
import { loadRanchers } from '../data'
import { tokenMatchesPlant } from '../est/normalize'
import type { Plant, Rancher } from '../types'

/** ranchers.json records consent scopes; the shared Rancher type does not carry them. */
type WithConsent = Rancher & { consent?: { scopes?: string[] } }

/** "Ranchers who say they process at this plant" - rancher-declared listings for one plant. */
export default function RanchersAtPlant({ plant }: { plant: Plant }) {
  const { data, error } = useData(loadRanchers)
  if (error) return <p className="muted">Rancher listings could not be loaded.</p>
  if (!data) return null

  // ponytail: a declaration stored without its prefix ("96") lists at both the M and the P plant; ranchers.json stores prefixed numbers.
  const listed = (data.ranchers as WithConsent[]).flatMap(r => {
    const shown = (r.status === 'sample' || r.status === 'published')
      && r.inspection_path !== 'custom_exempt'
      && r.consent?.scopes?.includes('list_on_plant_page')
    const processor = shown && r.processors.find(p => tokenMatchesPlant(p.est, plant))
    return processor ? [{ r, processor }] : []
  }).sort((a, b) => a.r.ranch.name.localeCompare(b.r.ranch.name))

  if (listed.length === 0) return (
    <p className="muted">
      No rancher on Plattr has said they process at this plant yet. If you do, <Link to="/ranchers">put your ranch on Plattr - free</Link>.
    </p>
  )

  return (
    <Card
      tier="rancher"
      title="Ranchers who say they process at this plant"
      source="Source: each rancher's own Plattr profile, dated as shown. This list is not an FSIS record."
    >
      <p>Many ranches can use one plant. Plattr cannot tell which ranch's cattle are in your package - a plant is not a farm.</p>
      <ul>
        {listed.map(({ r, processor }) => (
          <li key={r.slug}>
            <Link to={`/r/${r.slug}`}>{r.ranch.name} - rancher profile</Link>, {r.ranch.county}, {r.ranch.state}
            {r.status === 'sample' && <> · <strong>SAMPLE - fictional demo profile</strong></>}
            {' '}· declared by the rancher on {processor.declared_at}
          </li>
        ))}
      </ul>
      <p className="caveat">Plattr has not confirmed with the plant that any ranch listed here is a customer.</p>
    </Card>
  )
}
