// Approximate map placement for live Open Food Facts records: state / country CENTRES, never an address.
export interface Place { name: string; state: string; country: string; lat: number; lon: number }

// [code, name, lat, lon]
const STATES: [string, string, number, number][] = [
  ['AL', 'Alabama', 32.8, -86.8], ['AK', 'Alaska', 64.0, -152.0], ['AZ', 'Arizona', 34.2, -111.7], ['AR', 'Arkansas', 34.9, -92.4],
  ['CA', 'California', 37.2, -119.4], ['CO', 'Colorado', 39.0, -105.5], ['CT', 'Connecticut', 41.6, -72.7], ['DE', 'Delaware', 39.0, -75.5],
  ['FL', 'Florida', 28.6, -82.4], ['GA', 'Georgia', 32.7, -83.4], ['HI', 'Hawaii', 20.3, -156.4], ['ID', 'Idaho', 44.4, -114.6],
  ['IL', 'Illinois', 40.0, -89.2], ['IN', 'Indiana', 39.9, -86.3], ['IA', 'Iowa', 42.1, -93.5], ['KS', 'Kansas', 38.5, -98.4],
  ['KY', 'Kentucky', 37.5, -85.3], ['LA', 'Louisiana', 31.1, -92.0], ['ME', 'Maine', 45.4, -69.2], ['MD', 'Maryland', 39.0, -76.8],
  ['MA', 'Massachusetts', 42.3, -71.8], ['MI', 'Michigan', 44.3, -85.4], ['MN', 'Minnesota', 46.3, -94.3], ['MS', 'Mississippi', 32.7, -89.7],
  ['MO', 'Missouri', 38.4, -92.5], ['MT', 'Montana', 47.0, -109.6], ['NE', 'Nebraska', 41.5, -99.8], ['NV', 'Nevada', 39.3, -116.6],
  ['NH', 'New Hampshire', 43.7, -71.6], ['NJ', 'New Jersey', 40.2, -74.7], ['NM', 'New Mexico', 34.4, -106.1], ['NY', 'New York', 42.9, -75.5],
  ['NC', 'North Carolina', 35.6, -79.4], ['ND', 'North Dakota', 47.5, -100.5], ['OH', 'Ohio', 40.3, -82.8], ['OK', 'Oklahoma', 35.6, -97.5],
  ['OR', 'Oregon', 43.9, -120.6], ['PA', 'Pennsylvania', 40.9, -77.8], ['RI', 'Rhode Island', 41.7, -71.6], ['SC', 'South Carolina', 33.9, -80.9],
  ['SD', 'South Dakota', 44.4, -100.2], ['TN', 'Tennessee', 35.9, -86.4], ['TX', 'Texas', 31.5, -99.3], ['UT', 'Utah', 39.3, -111.7],
  ['VT', 'Vermont', 44.1, -72.7], ['VA', 'Virginia', 37.5, -78.9], ['WA', 'Washington', 47.4, -120.5], ['WV', 'West Virginia', 38.6, -80.6],
  ['WI', 'Wisconsin', 44.6, -89.9], ['WY', 'Wyoming', 43.0, -107.5],
]

// [name, lat, lon, ...aliases]
const COUNTRIES: [string, number, number, ...string[]][] = [
  ['Canada', 56.1, -106.3], ['Mexico', 23.6, -102.5, 'méxico'], ['United Kingdom', 54.0, -2.0, 'uk', 'england', 'scotland', 'wales'],
  ['France', 46.6, 2.4], ['Germany', 51.2, 10.4, 'deutschland'], ['Italy', 42.8, 12.6, 'italia'], ['Spain', 40.2, -3.6, 'españa'],
  ['Netherlands', 52.2, 5.3], ['Belgium', 50.6, 4.6], ['Switzerland', 46.8, 8.2], ['Ireland', 53.2, -8.0], ['Poland', 52.0, 19.3],
  ['China', 35.0, 103.8], ['India', 22.0, 79.0], ['Japan', 36.5, 138.0], ['Thailand', 15.5, 101.0], ['Vietnam', 16.0, 107.8],
  ['Brazil', -10.8, -52.9], ['Australia', -25.7, 134.5], ['New Zealand', -41.5, 172.8],
]

export const USA: Place = { name: 'the United States', state: '', country: 'USA', lat: 39.8, lon: -98.6 }
const USA_NAMES = /\b(united states( of america)?|usa|u\.s\.a?\.?|us)\b/i

/** Find a state or country in free text like "Orrville, Ohio" / "Austin, TX" / "en:france". Null when nothing is recognised. */
export function findPlace(text: string | undefined): Place | null {
  if (!text) return null
  const t = text.replace(/\b[a-z]{2}:/g, '').replace(/-/g, ' ')
  const lower = t.toLowerCase()
  // longest names first so "West Virginia" wins over "Virginia"
  const byName = [...STATES].sort((a, b) => b[1].length - a[1].length).find(s => new RegExp(`\\b${s[1]}\\b`, 'i').test(t))
  const byCode = byName ? undefined : STATES.find(s => new RegExp(`,\\s*${s[0]}\\b`).test(t))   // 2-letter code only after a comma, upper-case
  const st = byName ?? byCode
  if (st) return { name: st[1], state: st[0], country: 'USA', lat: st[2], lon: st[3] }
  const c = COUNTRIES.find(([name, , , ...aliases]) => [name.toLowerCase(), ...aliases].some(n => new RegExp(`\\b${n}\\b`).test(lower)))
  if (c) return { name: c[0], state: '', country: c[0], lat: c[1], lon: c[2] }
  return USA_NAMES.test(t) ? USA : null
}
