import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import type { PlantsFile } from '../types'
import { findPlants, parseEst, plantTokens, tokenMatchesPlant } from './normalize'

const plants: PlantsFile = JSON.parse(readFileSync('public/data/plants.json', 'utf8'))
const names = (input: string) => findPlants(plants, input).map(m => `${m.plant.name}, ${m.plant.city}`)

test('parses the ways a number is printed on a pack', () => {
  expect(parseEst('EST. 86R')).toEqual({ prefix: undefined, digits: '86', suffix: 'R' })
  expect(parseEst('P-00874')).toEqual({ prefix: 'P', digits: '874', suffix: '' })
  expect(parseEst('Est. No. 9714')).toEqual({ prefix: undefined, digits: '9714', suffix: '' })
  expect(parseEst('ground beef')).toBeNull()
})

test('a prefixed number resolves to one plant', () => {
  expect(names('M-9714')).toEqual(['Thoma Meat Market, Saxonburg'])
  expect(names('P-13556')).toEqual(['Tyson Foods, Inc., Sedalia'])
})

test('a bare number that is the same plant under M and P resolves to one plant', () => {
  expect(names('EST. 13556')).toEqual(['Tyson Foods, Inc., Sedalia'])
  expect(names('EST. 86R')).toEqual(['Cargill Meat Solutions, Fort Morgan'])
})

test('a bare number shared by different plants returns every candidate - never a guess', () => {
  expect(names('1').length).toBe(2)   // M1 Vienna Beef, P1 Tyson
})

test('unknown numbers return nothing', () => {
  expect(names('99999')).toEqual([])
})

test('recall tokens without a prefix still join to the plant', () => {
  const [{ plant }] = findPlants(plants, 'P-13556')
  expect(plantTokens(plant)).toEqual(['M13556', 'P13556'])
  expect(tokenMatchesPlant('13556', plant)).toBe(true)
  expect(tokenMatchesPlant('P13556', plant)).toBe(true)
  expect(tokenMatchesPlant('3556', plant)).toBe(false)
})
