import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import type { BeefSampling, HumaneFile, PlantsFile, RecallsFile } from '../types'
import { findPlants } from './normalize'
import { humaneForPlant, recallsForPlant, samplingForPlant, volumeBand } from './records'

const read = <T>(name: string): T => JSON.parse(readFileSync(`public/data/${name}.json`, 'utf8'))
const plants = read<PlantsFile>('plants')
const one = (input: string) => findPlants(plants, input)[0].plant

test('recalls join on prefixed and bare tokens, newest first, with the matched sentence', () => {
  const found = recallsForPlant(read<RecallsFile>('recalls').recalls, one('P-13556'))
  expect(found.map(r => r.recall.number)).toEqual(['009-2019', '089-2016'])
  expect(found[0].sentences[0]).toContain('P-13556')
  expect(found.every(r => r.nameMatch)).toBe(true)   // "Tyson Foods, Inc." both sides
})

test('sampling joins on the full grant string', () => {
  const plant = plants.plants.find(p => p.number === 'M245C+V245C')!
  expect(samplingForPlant(read<BeefSampling>('beef_sampling'), plant)?.n).toBe(161)
  expect(samplingForPlant(read<BeefSampling>('beef_sampling'), one('P-13556'))).toBeUndefined()
})

test('the first humane-handling entry joins to its plant when the token is in the directory', () => {
  const humane = read<HumaneFile>('humane')
  const first = humane.establishments[0]
  const i = plants.tokens[first.tokens[0]]?.[0]
  if (i === undefined) return
  expect(humaneForPlant(humane, plants.plants[i])).toContain(first)
  expect(humaneForPlant(humane, one('EST. 86R'))).toEqual([])
})

test('a humane-handling row posted with a bare number and no tokens still joins', () => {
  const found = humaneForPlant(read<HumaneFile>('humane'), one('M20321'))
  expect(found.map(e => e.est)).toEqual(['20321,'])
})

test('volume band text comes verbatim from the FSIS legend', () => {
  expect(volumeBand(plants.volume_legend.slaughter, 4)).toEqual({
    measure: 'aggregated head slaughtered for the last 360 days, all species',
    band: '>= 100,000 and < 10,000,000',
  })
  expect(volumeBand(plants.volume_legend.processing, 1).band).toBe('Less 10,000')
  expect(volumeBand(plants.volume_legend.processing, 9).band).toBeUndefined()
})
