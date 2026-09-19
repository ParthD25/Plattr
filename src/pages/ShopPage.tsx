// Grocery trip: pick foods off the shelf, watch the cart's overall score and your personal warnings, finish the
// trip - history, the food map and (if you choose) today's intake all update from it.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GradeDot } from '../components/ScoreBadge'
import { Loading } from '../components/ui'
import { GROUPS, foodGroupCoverage, missingGroups } from '../consumer/history/complement'
import { cartTotal, logServings } from '../consumer/trip'
import { personalWarnings } from '../consumer/warnings'
import { GRADE_COLOR, averageScore, gradeFor, scorePassport } from '../passport/score'
import type { Passport } from '../passport/types'
import { usePassports } from '../passport/usePassports'
import { EMPTY_PROFILE, actions, useAccount, useStore } from '../store'

export default function ShopPage() {
  const account = useAccount()!                       // route is guarded: a signed-in shopper
  const store = useStore()
  const { passports, error } = usePassports()
  const [lastTrip, setLastTrip] = useState<Passport[]>([])
  const [logged, setLogged] = useState(false)

  if (error) return <p className="warn" role="alert">{error}</p>
  if (!passports) return <Loading what="the shelf" />

  const profile = store.profiles[account.email] ?? EMPTY_PROFILE
  const inCart = new Set((store.carts[account.email] ?? []).filter(c => !c.purchased_at).map(c => c.passport_id))
  const cart = passports.filter(p => inCart.has(p.id))
  const avg = averageScore(cart)
  const missing = missingGroups(cart)
  const coverage = foodGroupCoverage(cart)

  const finish = () => {
    setLastTrip(cart)
    setLogged(false)
    actions.checkout(account.email)
  }
  const logAsEaten = () => {
    actions.saveProfile(account.email, { ...profile, today: logServings(profile.today, lastTrip) })
    setLogged(true)
  }

  return (
    <div className="shop">
      <style>{`
        .shop-grid { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(280px, 1fr); gap: 24px; align-items: start; }
        .shop-cart { position: sticky; top: 12px; }
        .shop-item { display: grid; grid-template-columns: 56px 1fr auto; gap: 12px; align-items: center; }
        .shop-item .emoji { font-size: 2.2rem; text-align: center; }
        .shop-flag { font-size: 0.85rem; margin: 4px 0 0; }
        @media (max-width: 820px) { .shop-grid { grid-template-columns: 1fr; } .shop-cart { position: static; } }
      `}</style>
      <h1>Grocery trip</h1>
      <p className="lede">Take foods off the shelf, see how your cart grades and what it means for you, then finish the trip. Your history, food map and overall score update from it.</p>
      <p className="sample-banner" role="note">The shelf holds SAMPLE foods - fictional demo passports - plus anything made in the producer portal on this device.</p>

      {lastTrip.length > 0 && (
        <section className="panel" aria-live="polite" style={{ marginBottom: 20, borderColor: 'var(--green)' }}>
          <h2 style={{ marginTop: 0 }}>Trip recorded: {lastTrip.length} {lastTrip.length === 1 ? 'item' : 'items'}</h2>
          <p>
            Overall Plattr score for this trip: <strong>{averageScore(lastTrip)} /100 · Grade {gradeFor(averageScore(lastTrip)!).grade}</strong>.
            See it in <Link to="/history">My groceries</Link> and on <Link to="/map">My food map</Link>.
          </p>
          {logged
            ? <p className="note">One serving of each item was added to “today so far” in <Link to="/profile">your profile</Link>. Open any passport to see “What's In My System” use the new totals.</p>
            : <>
                <button type="button" className="secondary" onClick={logAsEaten}>Log one serving of each as eaten today</button>
                <p className="caveat">Optional. Adds sodium, saturated fat, calories and protein from each passport's nutrition panel to today's log in your profile, so the personal notes on product pages reflect it. Not medical advice.</p>
              </>}
        </section>
      )}

      <div className="shop-grid">
        <section aria-labelledby="shelf-h">
          <h2 id="shelf-h" style={{ marginTop: 0 }}>The shelf</h2>
          {passports.map(p => {
            const warns = personalWarnings(p, profile).filter(w => w.level === 'warn')
            const added = inCart.has(p.id)
            return (
              <article key={p.id} className="panel shop-item" style={{ marginBottom: 12, padding: 16 }}>
                <div className="emoji" aria-hidden="true">{p.emoji}</div>
                <div>
                  <h3><Link to={`/food/${p.id}`}>{p.name}</Link> {p.sample && <span className="chip chip-floor">Sample</span>}</h3>
                  <span className="muted">{p.farm.name} · {p.farm.state}{p.price_usd !== undefined && <> · ${p.price_usd.toFixed(2)}</>}</span>
                  <div style={{ marginTop: 6 }}><GradeDot score={scorePassport(p)} /></div>
                  {warns.map(w => <p key={w.title} className="shop-flag"><strong>⚠ For you:</strong> {w.title}</p>)}
                </div>
                {added
                  ? <button type="button" className="small secondary" onClick={() => actions.removeFromCart(account.email, p.id)} aria-label={`Remove ${p.name} from cart`}>Remove</button>
                  : <button type="button" className="small" onClick={() => actions.addToCart(account.email, p.id)} aria-label={`Add ${p.name} to cart`}>Add to cart</button>}
              </article>
            )
          })}
        </section>

        <aside className="panel shop-cart" aria-labelledby="cart-h">
          <h2 id="cart-h" style={{ marginTop: 0 }}>Your cart ({cart.length})</h2>
          {cart.length === 0
            ? <p className="muted">Nothing yet. Add foods from the shelf.</p>
            : <>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {cart.map(p => <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '4px 0' }}><span>{p.emoji} {p.name}</span><span className="muted">{p.price_usd !== undefined ? `$${p.price_usd.toFixed(2)}` : ''}</span></li>)}
                </ul>
                <p style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, borderTop: '1px solid var(--line)', paddingTop: 8 }}><span>Total</span><span>${cartTotal(cart).toFixed(2)}</span></p>
                <p style={{ marginBottom: 4 }}><strong>Cart score: {avg} /100 · Grade {gradeFor(avg!).grade} ({gradeFor(avg!).word})</strong></p>
                <div className="bar" role="img" aria-label={`Cart score ${avg} out of 100`}><span style={{ width: `${avg}%`, background: GRADE_COLOR[gradeFor(avg!).grade] }} /></div>
                <p className="caveat">The average of these items' Plattr scores: how much of each food's story is documented and backed up - not a medical or food-safety guarantee.</p>
                <p style={{ marginBottom: 4 }}><strong>Food groups</strong></p>
                <p style={{ margin: 0 }}>{GROUPS.map(g => <span key={g} className="badge" style={{ marginRight: 6, marginBottom: 6, opacity: coverage[g] ? 1 : 0.55 }}>{g}: {coverage[g] || 'none yet'}</span>)}</p>
                {missing.length > 0 && <p className="caveat">Not in the cart yet: {missing.join(', ')}.</p>}
                <button type="button" onClick={finish} style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>Finish trip - I bought these</button>
              </>}
          <p className="caveat" style={{ marginTop: 12 }}>Warnings come from <Link to="/profile">your profile</Link> (allergens, conditions, preferences). Informational only - not medical advice.</p>
        </aside>
      </div>
    </div>
  )
}
