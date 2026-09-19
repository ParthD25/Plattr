// /food/:id - what a QR code or barcode resolves to.
import { Link, useParams } from 'react-router-dom'
import { Loading } from '../components/ui'
import PassportView from '../passport/PassportView'
import { findPassport, usePassports } from '../passport/usePassports'

export default function FoodPage() {
  const { id = '' } = useParams()
  const { passports, error } = usePassports()
  if (error) return <p className="warn" role="alert">We could not load the product passports: {error}</p>
  if (!passports) return <Loading what="product passport" />
  const passport = findPassport(passports, id)
  if (!passport) {
    return (
      <div className="narrow panel" style={{ marginTop: 24, textAlign: 'center' }}>
        <div style={{ fontSize: '3rem' }} aria-hidden="true">🔎</div>
        <h1>We could not find that passport</h1>
        <p className="lede">Nothing in Plattr matches “{id}”. The code may be mistyped, or the producer has not published a passport yet.</p>
        <Link className="btn" to="/explore">Browse the food library</Link>
      </div>
    )
  }
  return <PassportView key={passport.id} passport={passport} />
}
