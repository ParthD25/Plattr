// /p/:code - what the words on the label legally mean, then the hand-off to the plant lookup.
import { Link, useParams } from 'react-router-dom'
import { Card, Loading, Quote, SourceLine, useData } from '../components/ui'
import { loadClaims, loadProducts } from '../data'
import EstForm from '../est/EstForm'
import { detectLabels } from '../labels/detect'
import { LabelCards } from '../labels/LabelCards'

export default function ProductPage() {
  const { code } = useParams()
  const products = useData(loadProducts)
  const claims = useData(loadClaims)

  const error = products.error ?? claims.error
  if (error) return <p role="alert">{error}</p>
  if (!products.data || !claims.data) return <Loading what="product record" />

  const p = products.data.products.find(x => x.code === code)
  if (!p) {
    return (
      <>
        <h1>Product not found</h1>
        <p>No product with barcode “{code}” is in Plattr's Open Food Facts snapshot.</p>
        <p><Link to="/">Back to the Plattr start page</Link></p>
      </>
    )
  }

  const found = detectLabels(p, claims.data)
  const offUrl = `https://world.openfoodfacts.org/product/${p.code}`
  const edited = p.last_modified_t ? new Date(p.last_modified_t * 1000).toISOString().slice(0, 10) : null
  const nutrition = Object.entries(p.per_100g)

  return (
    <>
      <h1>{p.product_name}</h1>
      <p className="lede">{p.brands && <>{p.brands} · </>}barcode {p.code}</p>
      <p className="muted">
        As recorded in Open Food Facts on {p.retrieved_at}{edited && <>; record last edited {edited}</>}.
        It may not match the label in your hand - the label wins.{' '}
        <a href={offUrl} target="_blank" rel="noreferrer">Open this record on openfoodfacts.org</a>.
        Product data © Open Food Facts contributors,{' '}
        <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noreferrer">Open Database License (ODbL)</a>.
      </p>

      <h2>Ingredient statement</h2>
      {p.ingredients_text
        ? <Quote>{p.ingredients_text}</Quote>
        : <p>No ingredient statement is recorded for this product.</p>}

      <h2>What the words on this label mean</h2>
      {found.labelRules.length + found.labelClaims.length + found.otherLabels.length === 0 && (
        <p>Nothing in this record matched the label rules and claims Plattr covers. That says nothing about the product.</p>
      )}
      <LabelCards product={p} found={found} snapshot={claims.data.retrieved} offUrl={offUrl} />

      <h2>Nutrition per 100 g</h2>
      {nutrition.length === 0 ? <p>No nutrition values are recorded for this product.</p> : (
        <table>
          <caption className="caveat" style={{ captionSide: 'bottom', textAlign: 'left' }}>
            Values are as recorded by Open Food Facts contributors on {p.retrieved_at}, shown to three significant figures.
            Sodium is recorded in grams.
          </caption>
          <thead><tr><th scope="col">Per 100 g</th><th scope="col">As recorded</th></tr></thead>
          <tbody>
            {nutrition.map(([k, v]) => (
              <tr key={k}>
                <th scope="row">{k === 'energy-kcal' ? 'energy' : k.replace(/-/g, ' ')}</th>
                <td>{Number(v.toPrecision(3))} {k === 'energy-kcal' ? 'kcal' : 'g'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Which plant processed it?</h2>
      {found.est ? (
        <Card
          tier="inference"
          title={`This Open Food Facts record carries establishment number ${found.est}`}
          source={<SourceLine source={`Open Food Facts record for barcode ${p.code}`} url={offUrl} date={p.retrieved_at} />}
        >
          <p>
            The record's packaging-code field reads “{p.emb_codes}”. Open Food Facts contributors typed it; Plattr read the
            number out of it and has not checked it against a pack. This is rare - barcode databases almost never carry the
            US plant number. If the number inside the USDA mark of inspection on your pack is different, the pack wins.
            The establishment number identifies a plant, not a farm or ranch.
          </p>
          <p><Link to={`/est/${found.est}`}>See what FSIS lists for establishment number {found.est}</Link></p>
        </Card>
      ) : (
        <>
          <p>
            Barcode databases do not carry the US plant number - type the EST from your pack.
            The number identifies a plant, not a farm or ranch.
          </p>
          <EstForm />
        </>
      )}
    </>
  )
}
