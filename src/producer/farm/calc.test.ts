import { expect, test } from 'vitest'
import { fromDraft, num, perHead, splitList, toDraft } from './calc'

test('blank and junk numbers are undefined, never 0', () => {
  expect(num('')).toBeUndefined()
  expect(num('abc')).toBeUndefined()
  expect(num('-79.94')).toBe(-79.94)
})

test('space per animal needs two positive numbers', () => {
  expect(perHead(40, 120)).toBe(0.333)
  expect(perHead(1200, 300)).toBe(4)
  expect(perHead(40, 0)).toBeNull()
  expect(perHead(undefined, 10)).toBeNull()
})

test('draft round trip: comma lists, numbers, empty rows dropped', () => {
  expect(splitList(' Bloomfield Saturday Market, , Squirrel Hill ')).toEqual(['Bloomfield Saturday Market', 'Squirrel Hill'])
  const d = toDraft()
  const farm = fromDraft({
    ...d, name: ' Hill Farm ', lat: '40.44', acres: '', markets: 'A, B',
    health_records: [{ date: '', animal_or_lot: '', event: '', vet: '' }, { date: '2026-05-01', animal_or_lot: 'Lot 4', event: 'Vet visit - herd check', vet: 'Dr. Lee' }],
  })
  expect(farm.name).toBe('Hill Farm')
  expect(farm.lat).toBe(40.44)
  expect(farm.acres).toBeUndefined()
  expect(farm.markets).toEqual(['A', 'B'])
  expect(farm.health_records).toHaveLength(1)
  expect(toDraft(farm).markets).toBe('A, B')
})

test('fish fields are stored only for the operation that shows them', () => {
  const d = { ...toDraft(), farm_type: 'fish_farm' as const, species: ' Rainbow trout ', aquaculture_system: 'flow-through raceways', stocking_density: '25 kg per cubic metre' }
  expect(fromDraft(d)).toMatchObject({ farm_type: 'fish_farm', species: 'Rainbow trout', stocking_density: '25 kg per cubic metre' })
  expect(fromDraft({ ...d, farm_type: 'fishery' }).stocking_density).toBeUndefined()
  expect(fromDraft({ ...d, farm_type: 'land' }).species).toBeUndefined()
  expect(toDraft(fromDraft({ ...d, farm_type: 'land' })).species).toBe('')
  expect(toDraft().farm_type).toBe('land')
})
