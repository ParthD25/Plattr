import { Link } from 'react-router-dom'
import { Loading, useData } from '../components/ui'
import { loadProducts } from '../data'
import EstForm from '../est/EstForm'

export default function Home() {
  const { data, error } = useData(loadProducts)
  return (
    <>
      <h1>Type the number on a beef package. See what the public record says.</h1>
      <p className="lede">
        Every federally inspected beef package carries a USDA establishment number, and Plattr shows what the public federal record says about that
        establishment, with a source and a date on every card. Below that record, ranchers who opt in describe their cattle in their own words,
        labelled as rancher-declared and unverified — beef only, for now.
      </p>

      <EstForm />

      <h2>Or start from a product</h2>
      {error && <p role="alert">Could not load the products: {error}</p>}
      {!data && !error && <Loading what="products" />}
      {data && (
        <>
          <ul className="tiles">
            {data.products.map(p => (
              <li key={p.code}>
                <Link to={`/p/${p.code}`}>
                  <small>{p.brands}</small>
                  {p.product_name}
                </Link>
              </li>
            ))}
          </ul>
          <p className="caveat">
            Barcode databases almost never carry the US plant number, so the establishment number is typed from the pack. Product names: {data.source}.
          </p>
        </>
      )}

      <h2>Raise cattle?</h2>
      <p><Link to="/ranchers">Go to the page for ranchers</Link> — profiles are opt-in, and everything in them is shown as the rancher’s own words.</p>
    </>
  )
}
