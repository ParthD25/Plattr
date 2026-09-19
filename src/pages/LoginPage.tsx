// Sign in / create account. Demo-grade: accounts live in this browser's localStorage (see src/store.ts).
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { actions, useAccount, useStore, type Role } from '../store'
import { safeNext } from '../auth/demo'

const ROLES: { role: Role; emoji: string; title: string; blurb: string }[] = [
  { role: 'consumer', emoji: '🛒', title: "I'm a shopper", blurb: 'Scan foods, get allergen and health warnings, and track your groceries.' },
  { role: 'producer', emoji: '🚜', title: "I'm a producer", blurb: 'Keep a farm profile and create product passports with a QR code.' },
]
const roleWord = (r: Role) => (r === 'consumer' ? 'shopper' : 'producer')

const CSS = `
.lp-cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 18px; align-items: start; }
.lp-cols h2 { margin-top: 0; }
.lp-roles { border: 0; padding: 0; margin: 14px 0 0; min-width: 0; }
.lp-roles legend { font-weight: 700; padding: 0; margin-bottom: 6px; }
.lp-roles > div { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr)); gap: 12px; }
.lp-role { display: flex; gap: 10px; align-items: flex-start; margin: 0; padding: 16px; border: 2px solid var(--line); border-radius: 18px; background: var(--card); cursor: pointer; font-weight: 600; }
.lp-role:has(input:checked) { border-color: var(--red); background: #fde9e6; }
.lp-role:focus-within { outline: 3px solid var(--blue); outline-offset: 2px; }
.lp-role input { margin-top: 5px; flex: none; }
.lp-role strong { display: block; font-size: 1.05rem; }
.lp-role small { display: block; font-weight: 500; color: var(--muted); }
.lp-submit { margin-top: 18px; }
.lp-demo { display: flex; flex-wrap: wrap; gap: 10px; margin: 12px 0; }
.lp-try { position: relative; overflow: hidden; display: block; text-decoration: none; color: inherit; border: 2px solid var(--red); border-radius: 30px; background: #fdebdc; }
.lp-try:hover { background: #fde3d2; }
.lp-try:focus-visible { outline: 3px solid var(--blue); outline-offset: 3px; }
.lp-try > * { position: relative; }
.lp-try::before { content: ""; position: absolute; right: -70px; bottom: -90px; width: 240px; height: 220px; background: var(--green-soft); border-radius: 46% 54% 60% 40% / 50% 45% 55% 50%; }
.lp-try .lp-art { display: grid; place-items: center; width: 84px; height: 84px; border-radius: 50%; background: #fff; font-size: 2.4rem; }
.lp-try h2 { margin: 12px 0 6px; font-size: 1.5rem; }
.lp-try p { margin: 0 0 14px; }
`

export default function LoginPage() {
  const account = useAccount()
  const store = useStore()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))

  const [tab, setTab] = useState<'in' | 'up'>('in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('consumer')
  const [error, setError] = useState<string | null>(null)

  // After success: ?next= wins; new shoppers fill in their profile first; producers go to their farm.
  const go = (r: Role, mail: string) =>
    navigate(next ?? (r === 'producer' ? '/producer' : store.profiles[mail] ? '/history' : '/profile'), { replace: true })

  function submit(e: FormEvent) {
    e.preventDefault()
    const mail = email.trim().toLowerCase()
    if (tab === 'in') {
      const err = actions.signIn(mail, password)
      if (err) return setError(err)
      go(store.accounts.find(a => a.email === mail)!.role, mail)
    } else {
      const err = actions.signUp({ email: mail, name: name.trim(), role, password })
      if (err) return setError(err)
      go(role, mail)
    }
  }

  if (account) {
    return (
      <div className="narrow">
        <style>{CSS}</style>
        <h1>You're signed in</h1>
        <div className="panel">
          <p style={{ marginTop: 0 }}>
            Signed in as <strong>{account.name}</strong> ({account.email}) — {roleWord(account.role)} account.
          </p>
          <div className="lp-demo">
            {account.role === 'consumer'
              ? <><Link className="btn" to="/profile">My profile</Link><Link className="btn secondary" to="/history">My groceries</Link></>
              : <><Link className="btn" to="/producer">My farm</Link><Link className="btn secondary" to="/producer/passports">Product passports</Link></>}
            <button type="button" className="secondary" onClick={() => actions.signOut()}>Sign out</button>
          </div>
        </div>
        <p className="note">Accounts live only in this browser. Do not reuse a real password. <Link to="/demo-account">Switch to a demo account</Link></p>
      </div>
    )
  }

  return (
    <div>
      <style>{CSS}</style>
      <h1>Welcome to Plattr</h1>
      <p className="lede">Sign in to get allergen warnings and track your groceries — or, if you grow food, to publish its story.</p>
      <p className="note"><strong>Accounts live only in this browser. Do not reuse a real password.</strong></p>
      {next && <p className="muted">Sign in to continue to <code>{next}</code>.</p>}

      <div className="lp-cols">
        <section className="panel" aria-labelledby="lp-form-h">
          <div className="tabs" role="group" aria-label="Sign in or create an account">
            <button type="button" aria-pressed={tab === 'in'} onClick={() => { setTab('in'); setError(null) }}>Sign in</button>
            <button type="button" aria-pressed={tab === 'up'} onClick={() => { setTab('up'); setError(null) }}>Create account</button>
          </div>
          <h2 id="lp-form-h">{tab === 'in' ? 'Sign in' : 'Create account'}</h2>
          <form onSubmit={submit}>
            {tab === 'up' && <>
              <label htmlFor="lp-name">Your name</label>
              <input id="lp-name" value={name} onChange={e => setName(e.target.value)} required autoComplete="name" />
            </>}
            <label htmlFor="lp-email">Email</label>
            <input id="lp-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            <label htmlFor="lp-password">Password</label>
            <input id="lp-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required
              autoComplete={tab === 'in' ? 'current-password' : 'new-password'} aria-describedby="lp-pw-hint" />
            <small id="lp-pw-hint" className="muted">Stored only in this browser, unencrypted. Make one up for this demo.</small>
            {tab === 'up' && (
              <fieldset className="lp-roles">
                <legend>How will you use Plattr?</legend>
                <div>
                  {ROLES.map(r => (
                    <label key={r.role} className="lp-role">
                      <input type="radio" name="lp-role" value={r.role} checked={role === r.role} onChange={() => setRole(r.role)} />
                      <span><strong><span aria-hidden="true">{r.emoji} </span>{r.title}</strong><small>{r.blurb}</small></span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            {error && <p className="warn" role="alert">{error}</p>}
            <button type="submit" className="lp-submit">{tab === 'in' ? 'Sign in' : `Create ${roleWord(role)} account`}</button>
          </form>
        </section>

        <Link className="panel lp-try" to={`/demo-account${next ? `?next=${encodeURIComponent(next)}` : ''}`} aria-labelledby="lp-demo-h" aria-describedby="lp-demo-p">
          <span className="lp-art" aria-hidden="true">🍓</span>
          <h2 id="lp-demo-h">Just want to look around? Use a demo account</h2>
          <p id="lp-demo-p">One click, no typing. The demo shopper and the demo producer are filled with SAMPLE data, so every page has something to show.</p>
          <span className="btn">See the demo accounts <span aria-hidden="true">→</span></span>
        </Link>
      </div>
    </div>
  )
}
