// Smoke check: the two producer pages render for a fish farm account without a browser (store hooks are mocked - the real one has no server snapshot).
import { expect, test, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'

const email = 'fish@example.test'
const farm = { name: 'Cold Spring Trout', city: '', state: 'PA', country: 'USA', farm_type: 'fish_farm', species: 'rainbow trout', aquaculture_system: 'flow-through raceways', stocking_density: '25 kg per cubic metre',
  markets: [], specialties: [], about: '', water_source: 'Spring', water_last_test: '', water_result: '', fertilizers: '', pesticides: '', organic: false, health_records: [], parasite_watch: [] }
const state = { accounts: [{ email, name: 'Fin', role: 'producer', password: 'x' }], session: { email }, profiles: {}, carts: {}, farms: { [email]: farm }, passports: [] }
vi.mock('../../store', async orig => ({ ...(await orig<object>()), useStore: () => state, useAccount: () => state.accounts[0] }))

test('fish farm: dashboard shows fish fields and hides pasture; builder loads', async () => {
  const { default: Dashboard } = await import('../../pages/ProducerDashboard')
  const { default: Builder } = await import('../../pages/PassportBuilder')
  const dash = renderToString(<MemoryRouter><Dashboard /></MemoryRouter>)
  expect(dash).toContain('What kind of operation is this?')
  expect(dash).toContain('Species raised')
  expect(dash).toContain('Water source and quality')
  expect(dash).toContain('Fish farm (farm-raised)')
  expect(dash).not.toContain('Pasture acres')
  expect(renderToString(<MemoryRouter><Builder /></MemoryRouter>)).toContain('New passport')
})
