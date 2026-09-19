import { Link, useParams } from 'react-router-dom'
import { Loading, SourceLine, useData } from '../components/ui'
import { loadPlants } from '../data'
import EstForm from '../est/EstForm'
import { findPlants } from '../est/normalize'
import PlantCards from '../est/PlantCards'
import RanchersAtPlant from '../rancher/RanchersAtPlant'

// The letter in front of the number tells the namespaces apart (see est/normalize.ts).
const PREFIX: Record<string, string> = { M: 'meat', P: 'poultry', G: 'egg products', V: 'voluntary inspection' }

export default function PlantPage() {
  const { est = '' } = useParams()
  const { data: file, error } = useData(loadPlants)
  if (error) return <p role="alert">Could not load the FSIS establishment directory: {error}</p>
  if (!file) return <Loading what="the FSIS establishment directory" />

  const matches = findPlants(file, est)

  if (matches.length === 0) {
    return (
      <>
        <h1>No establishment found for “{est}”</h1>
        <p>No federal establishment with this number in the FSIS directory snapshot of {file.retrieved}.</p>
        <p>This is not a finding about the product. Possible reasons:</p>
        <ul>
          <li>a typo in the number;</li>
          <li>state-inspected beef — some states run their own programmes;</li>
          <li>beef cut and packed in a retail store;</li>
          <li>custom-exempt beef, which is marked “Not for Sale” and carries no number.</li>
        </ul>
        <p className="caveat"><SourceLine source={file.source} date={file.retrieved} /></p>
        <h2>Try another number</h2>
        <EstForm />
      </>
    )
  }

  if (matches.length > 1) {
    return (
      <>
        <h1>This number is used by more than one establishment</h1>
        <p>
          The number “{est}” appears with more than one prefix letter in the FSIS directory snapshot of {file.retrieved}. Plattr does not guess:
          check the letter in front of the number on the pack, then choose.
        </p>
        <ul className="tiles">
          {matches.map(({ plant, token }) => (
            <li key={token}>
              <Link to={`/est/${token}`}>
                <strong>{token}</strong> — {plant.name}
                <small>{plant.city}, {plant.state}</small>
                <small>Look for the letter {token[0]} ({PREFIX[token[0]]}) on the pack</small>
              </Link>
            </li>
          ))}
        </ul>
        <p className="caveat"><SourceLine source={file.source} date={file.retrieved} /></p>
      </>
    )
  }

  const { plant } = matches[0]
  return (
    <>
      <h1>{plant.name}</h1>
      <p className="lede">
        {plant.city}, {plant.state} · FSIS establishment {plant.number.split('+').join(' / ')} · the plant whose number is on the pack, not a ranch.
      </p>
      <PlantCards plant={plant} file={file} />
      <RanchersAtPlant plant={plant} />
    </>
  )
}
