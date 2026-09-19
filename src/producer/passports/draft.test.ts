import { expect, test } from 'vitest'
import { scorePassport } from '../../passport/score'
import { buildPassport, newDraft, newId, validate, withCategory } from './draft'

const beef = () => {
  const d = withCategory({ ...newDraft(), name: 'Ridge Beef', serving_g: '112' }, 'beef')
  d.farm = { ...d.farm, name: 'Ridge Farm', lat: '40.4', lon: '-79.9' }
  return d
}

test('empty starter rows are dropped, never invented', () => {
  const p = buildPassport(beef(), 'a@b.c', 'x')
  expect(p.feed).toEqual([])
  expect(p.soil).toEqual([])
  expect(p.food_group).toBe('protein')
  expect(p.sample).toBe(false)
  expect(p.created_by).toBe('a@b.c')
  expect(p.nutrition.per_serving).toEqual({})
  expect(scorePassport(p).total).toBe(0)
})

test('attaching a document raises the score over a bare declaration', () => {
  const d = beef()
  d.sections.feed = [{ label: 'Grass-fed', value: '100 %', evidence: 'declared', source: '', date: '' }]
  const declared = scorePassport(buildPassport(d, 'a@b.c', 'x')).total
  d.sections.feed = [{ ...d.sections.feed[0], evidence: 'document', source: 'AGA certificate', date: '2026-05-01' }]
  const p = buildPassport(d, 'a@b.c', 'x')
  expect(scorePassport(p).total).toBeGreaterThan(declared)
  expect(p.feed[0]).toEqual({ label: 'Grass-fed', value: '100 %', evidence: 'document', source: 'AGA certificate', date: '2026-05-01' })
})

test('validation: required fields, produce group, document needs a source', () => {
  expect(validate(newDraft()).length).toBeGreaterThanOrEqual(4)
  expect(validate(beef())).toEqual([])
  const d = beef()
  d.sections.feed = [{ label: 'Grass-fed', value: 'yes', evidence: 'document', source: '', date: '' }]
  expect(validate(d)).toHaveLength(1)
  expect(validate(withCategory(beef(), 'produce'))[0]).toMatch(/fruit or a vegetable/)
})

test('switching category keeps filled rows and sets the food group', () => {
  const d = beef()
  d.sections.water[0] = { ...d.sections.water[0], value: 'Spring' }
  const next = withCategory({ ...d, produce_group: 'fruits' }, 'produce')
  expect(next.sections.water[0].value).toBe('Spring')
  expect(next.sections.water.filter(r => r.label === 'Source')).toHaveLength(1)
  expect(buildPassport(next, 'a@b.c', 'x').food_group).toBe('fruits')
})

test('a hazard copied with only a name and source never reaches shoppers with blank fields', () => {
  const d = beef()
  d.hazards = [{ name: 'Liver fluke', kind: 'parasite', regional_relevance: '', likelihood: 'low', outlook: ' ', what_the_farm_does: '', source: 'Farm parasite watch log' }]
  const h = buildPassport(d, 'a@b.c', 'x').hazards[0]
  expect(h.regional_relevance).toBe('Not provided')
  expect(h.outlook).toBe('Not provided')
  expect(h.what_the_farm_does).toBeUndefined()
})

test('id is a slug plus a short random suffix', () => {
  expect(newId('  Ridge Beef — 1 lb! ')).toMatch(/^ridge-beef-1-lb-[0-9a-f]{6}$/)
})

test('fish must say wild-caught or farm-raised, and the passport carries it', () => {
  const fish = { ...withCategory(beef(), 'fish'), name: 'Ridge Trout' }
  expect(validate(fish).join(' ')).toMatch(/wild-caught or farm-raised/)
  expect(buildPassport(fish, 'a@b.c', 'x').production_method).toBeUndefined()

  const farmed = withCategory(fish, 'fish', undefined, 'farm_raised')
  expect(validate(farmed)).toEqual([])
  expect(farmed.sections.origin.map(r => r.label)).toEqual(expect.arrayContaining(['Fish farm', 'Wild or farmed']))
  expect(farmed.sections.water.map(r => r.label)).toContain('Last test (dissolved oxygen, ammonia)')
  const p = buildPassport(farmed, 'a@b.c', 'x')
  expect(p.production_method).toBe('farm_raised')
  expect(p.origin).toContainEqual({ label: 'Wild or farmed', value: 'Farm-raised (aquaculture)', evidence: 'declared' })

  // Switching to wild-caught swaps the untouched starter rows and keeps what the producer typed.
  farmed.sections.safety[0] = { ...farmed.sections.safety[0], value: 'Mercury below 0.1 ppm' }
  const wild = withCategory(farmed, 'fish', undefined, 'wild_caught')
  expect(wild.sections.origin.map(r => r.label)).toEqual(expect.arrayContaining(['Fishery and waters', 'Vessel and landing port', 'Catch method']))
  expect(wild.sections.origin.some(r => r.label === 'Fish farm')).toBe(false)
  expect(wild.sections.origin.find(r => r.label === 'Wild or farmed')?.value).toBe('Wild-caught')
  expect(wild.sections.safety.map(r => r.label)).toEqual(['Heavy metals', 'Frozen for parasite control', 'Recalls'])
  expect(wild.sections.safety[0].value).toBe('Mercury below 0.1 ppm')
  expect(wild.sections.feed).toEqual([])
  expect(buildPassport({ ...wild, category: 'beef' }, 'a@b.c', 'x').production_method).toBeUndefined()
})

test('a fish farm profile prefills farm-raised and its own figures, nothing else', () => {
  const profile = { name: 'Cold Spring Trout', city: '', state: 'PA', country: 'USA', farm_type: 'fish_farm' as const, species: 'rainbow trout', aquaculture_system: 'flow-through raceways',
    stocking_density: '25 kg per cubic metre', markets: [], specialties: [], about: '', water_source: 'Spring', water_last_test: '', water_result: '', fertilizers: '', pesticides: '', organic: false, health_records: [], parasite_watch: [] }
  const d = withCategory(newDraft(profile), 'fish', profile)
  expect(d.production_method).toBe('farm_raised')
  expect(d.sections.animal_welfare.find(r => r.label === 'Stocking density')?.value).toBe('25 kg per cubic metre')
  expect(d.sections.feed.every(r => r.value === '')).toBe(true)
  expect(newDraft({ ...profile, farm_type: 'fishery' }).production_method).toBe('wild_caught')
})
