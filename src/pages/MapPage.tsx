// My food map: where the shopper's purchased food came from. The table below the map carries the same data.
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Loading } from '../components/ui'
import { GRADE_BANDS, GRADE_COLOR } from '../passport/score'
import type { Evidence, Passport, Score } from '../passport/types'
import { usePassports } from '../passport/usePassports'
import { useAccount, useStore } from '../store'
import { HOME, TIMEFRAMES, fromOrigin, groupFarms, inTimeframe, type FarmPoint, type LatLon, type Timeframe } from '../consumer/map/farms'

// Local copy: PassportView owns the shared one and is being built in parallel.
const EVIDENCE_LABEL: Record<Evidence, string> = { verified: 'Verified record', document: 'Document on file', declared: 'Producer-declared', community: 'Community record', missing: 'Not provided' }
const GRADE_WORD = Object.fromEntries(GRADE_BANDS.map(b => [b.grade, b.word])) as Record<Score['grade'], string>
const place = (f: FarmPoint) => [f.city, f.state, f.country].filter(Boolean).join(', ')

/** Popup built from DOM nodes + textContent: producer-typed names never reach innerHTML. */
function popup(f: FarmPoint): HTMLElement {
  const el = document.createElement('div')
  const line = (text: string, tag = 'div') => { const n = document.createElement(tag); n.textContent = text; el.append(n) }
  line(f.name, 'strong')
  line(place(f))
  line(f.products.map(p => (p.times > 1 ? `${p.name} ×${p.times}` : p.name)).join(' · '))
  line(`Plattr score ${f.score}/100 · Grade ${f.grade} (${GRADE_WORD[f.grade]})`)
  line(`Farm origin: ${EVIDENCE_LABEL[f.originEvidence]}`)
  if (f.sample) line('SAMPLE - fictional demo data')
  return el
}

const USER_ZOOM = 6 // regional: the shopper plus the farms within a few hundred miles
const GEO_FAIL = ['permission was denied', 'your position is unavailable', 'the request timed out'] as const // GeolocationPositionError codes 1-3
const motionOk = () => !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const CSS = `.fmap-map .leaflet-tooltip { font: inherit; font-size: 0.8rem; font-weight: 800; color: #2b2118; border-radius: 999px; padding: 3px 10px; }`

export default function MapPage() {
  const account = useAccount()
  const cart = useStore().carts[account?.email ?? ''] ?? []
  const { passports, error } = usePassports()
  const [tf, setTf] = useState<Timeframe>('lifetime')
  const mapEl = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  // The shopper's location lives in this component's state only: never in the store, localStorage or a request.
  const [loc, setLoc] = useState<LatLon | null>(null)
  const [geo, setGeo] = useState<'asking' | 'ok' | (typeof GEO_FAIL)[number]>('asking')
  const req = useRef(0) // bumped on every request and on unmount, so a late or stale answer is ignored

  const locate = () => {
    const id = ++req.current
    if (!navigator.geolocation) { setGeo(GEO_FAIL[1]); return }
    setGeo('asking')
    navigator.geolocation.getCurrentPosition(
      pos => { if (req.current === id) { setLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setGeo('ok') } },
      err => { if (req.current === id) setGeo(GEO_FAIL[err.code - 1] ?? GEO_FAIL[1]) },
      { timeout: 8000, maximumAge: 600_000, enableHighAccuracy: false },
    )
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { locate(); return () => { req.current++ } }, [])

  const hasPurchases = cart.some(c => c.purchased_at)
  const byId = new Map((passports ?? []).map(p => [p.id, p]))
  const bought = inTimeframe(cart, tf).map(c => byId.get(c.passport_id)).filter((p): p is Passport => !!p)
  const grouped = groupFarms(hasPurchases ? bought : (passports ?? []).filter(p => p.sample))
  const origin = loc ?? HOME
  const fromLabel = loc ? 'your location' : HOME.label
  const farms = fromOrigin(grouped, origin) // distances + nearest-first order follow the origin
  const sig = grouped.map(f => `${f.key}|${f.count}|${f.score}`).join(';') // usePassports returns a new array each render; redraw only when the farms change

  /** Every marker in view: all farms plus the origin marker. */
  const fitAll = (map: L.Map) => map.fitBounds(L.latLngBounds([...grouped, origin].map(p => [p.lat, p.lon] as [number, number])), { padding: [40, 40], maxZoom: 8 })

  useEffect(() => {
    if (!mapEl.current || !farms.length) return
    const map = L.map(mapEl.current, { scrollWheelZoom: false })
    mapRef.current = map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map)
    for (const f of farms) {
      L.circleMarker([f.lat, f.lon], { radius: 8 + Math.min(f.count, 6) * 3, color: '#fff', weight: 2, fillColor: GRADE_COLOR[f.grade], fillOpacity: 0.85 }).bindPopup(popup(f)).addTo(map)
    }
    if (loc) map.setView([loc.lat, loc.lon], USER_ZOOM)
    else fitAll(map)
    return () => { mapRef.current = null; map.remove() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig])

  // Origin marker: white circle, dark ring, always-visible text label. Runs after the map effect; flies to the shopper once the browser answers.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const marker = L.circleMarker([origin.lat, origin.lon], { radius: 8, color: '#2b2118', weight: 3, fillColor: '#fff', fillOpacity: 1 })
      .bindTooltip(loc ? 'You are here' : HOME.label, { permanent: true, direction: 'top', offset: [0, -8] }).addTo(map)
    if (loc) map.flyTo([loc.lat, loc.lon], USER_ZOOM, { animate: motionOk() })
    return () => { if (mapRef.current === map) marker.remove() } // a removed map has already dropped its layers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc, sig])

  if (error) return <p className="warn" role="alert">Could not load the passports: {error}</p>
  if (!passports) return <Loading what="your food map" />

  const furthest = farms.reduce<FarmPoint | null>((m, f) => (!m || f.miles > m.miles ? f : m), null)
  const items = farms.reduce((s, f) => s + f.count, 0)
  const avg = items ? Math.round(farms.reduce((s, f) => s + f.score * f.count, 0) / items) : null

  return (
    <div>
      <h1>My food map</h1>
      <p className="muted">Every farm, ranch, fishery and bakery behind the food you bought. Bigger circles mean more items from that place.</p>

      {hasPurchases ? (
        <div className="tabs" role="group" aria-label="Timeframe">
          {TIMEFRAMES.map(([key, label]) => <button key={key} type="button" aria-pressed={tf === key} onClick={() => setTf(key)}>{label}</button>)}
        </div>
      ) : (
        <p className="note">You have not marked anything as purchased yet, so this map shows the farms in the <strong>sample library</strong> instead. <Link to="/explore">Scan or browse a food</Link>, add it to your cart and check out to start your own map.</p>
      )}

      {farms.some(f => f.sample) && <div className="sample-banner" role="note">SAMPLE - farms marked “sample” are fictional demo data, placed near real towns for illustration.</div>}

      {farms.length === 0 ? (
        <p className="note">Nothing purchased in this timeframe. Try a longer one, such as <button type="button" className="btn secondary small" onClick={() => setTf('lifetime')}>Lifetime</button></p>
      ) : (
        <>
          <style>{CSS}</style>
          <div className="tabs" role="group" aria-label="Map view">
            <button type="button" className="secondary" disabled={geo === 'asking'} onClick={() => (loc ? mapRef.current?.flyTo([loc.lat, loc.lon], USER_ZOOM, { animate: motionOk() }) : locate())}>My location</button>
            <button type="button" className="secondary" onClick={() => mapRef.current && fitAll(mapRef.current)}>All farms</button>
          </div>
          <div role="status">
            {geo === 'asking' && <p className="muted">Asking your browser for your location… Until it answers, distances are from {HOME.label}.</p>}
            {geo === 'ok' && <p className="muted">Map zoomed to your location. Distances are measured from your location.</p>}
            {geo !== 'asking' && geo !== 'ok' && (
              <p className="note">
                Location not shared - showing distances from {HOME.label}. <span className="muted">({geo}; if your browser blocked it, allow location for this site and try again.)</span>{' '}
                <button type="button" className="secondary small" onClick={locate}>Use my location</button>
              </p>
            )}
          </div>
          <div ref={mapEl} className="map fmap-map" style={{ isolation: 'isolate' }} role="region" aria-label="Map of the farms your food came from. The same information is listed in the table below." />
          <p className="muted" style={{ fontSize: '0.85rem' }}>
            Circle colour follows the grade:{' '}
            {GRADE_BANDS.map(b => b.grade).map(g => (
              <span key={g} style={{ marginRight: 12, whiteSpace: 'nowrap' }}><span aria-hidden="true" style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 999, background: GRADE_COLOR[g], marginRight: 4 }} />{g} {GRADE_WORD[g]}</span>
            ))}
            · white circle with a dark ring, labelled “{loc ? 'You are here' : HOME.label}” = where distances are measured from. Tap a circle for details.
          </p>
          <p className="muted" style={{ fontSize: '0.85rem' }}>Your location stays in this browser tab; Plattr does not save or send it. The map pictures themselves are loaded from OpenStreetMap for whatever area is in view.</p>

          <div className="stats">
            <div className="panel"><div className="stat">{farms.length}</div><div className="muted">{farms.length === 1 ? 'farm' : 'farms'}</div></div>
            <div className="panel"><div className="stat">{new Set(farms.map(f => f.state)).size}</div><div className="muted">states</div></div>
            <div className="panel"><div className="stat">{furthest ? Math.round(furthest.miles).toLocaleString() : '-'}<small style={{ fontSize: '1rem' }}> mi</small></div><div className="muted">furthest farm from {fromLabel}{furthest && <>: {furthest.name}</>}</div></div>
            <div className="panel"><div className="stat">{avg ?? '-'}<small style={{ fontSize: '1rem' }}> /100</small></div><div className="muted">average Plattr score</div></div>
          </div>

          <h2>Farms in this view</h2>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <caption className="muted" style={{ textAlign: 'left', paddingBottom: 6 }}>Same data as the map, nearest first. Distances are straight-line from {fromLabel}.</caption>
              <thead><tr><th scope="col">Farm</th><th scope="col">Place</th><th scope="col">Products</th><th scope="col">Distance <span className="muted" style={{ fontWeight: 400, whiteSpace: 'nowrap' }}>from {loc ? 'your location' : 'Pittsburgh (demo)'}</span></th><th scope="col">Score</th></tr></thead>
              <tbody>
                {farms.map(f => (
                  <tr key={f.key}>
                    <th scope="row">{f.name} {f.sample && <span className="chip ev-declared">Sample</span>}</th>
                    <td>{place(f)}<br /><span className={`chip ev-${f.originEvidence}`}>{EVIDENCE_LABEL[f.originEvidence]}</span></td>
                    <td>{f.products.map((p, i) => <span key={p.id}>{i > 0 && ', '}<Link to={`/food/${p.id}`}>{p.name}</Link>{p.times > 1 && ` ×${p.times}`}</span>)}</td>
                    <td>{Math.round(f.miles).toLocaleString()} mi</td>
                    <td><span className="grade-pill" style={{ color: GRADE_COLOR[f.grade], background: `${GRADE_COLOR[f.grade]}22` }}>{f.score} · {f.grade}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted" style={{ fontSize: '0.85rem' }}>The chip under each place shows how well the farm-origin statement is backed up. The Plattr score is how much of this food’s story is documented and backed up - not a medical or food-safety guarantee.</p>
        </>
      )}
    </div>
  )
}
