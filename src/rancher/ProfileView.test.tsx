import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { expect, test } from 'vitest'
import type { ClaimsFile, PlantsFile, RanchersFile } from '../types'
import ProfileView from './ProfileView'

const read = (name: string) => JSON.parse(readFileSync(`public/data/${name}.json`, 'utf8'))
const plants: PlantsFile = read('plants'), claims: ClaimsFile = read('claims'), ranchers: RanchersFile = read('ranchers')

// Rendered text only: source URLs legitimately contain words like "food-safety".
const renderHtml = (slug: string) => renderToStaticMarkup(
  <MemoryRouter><ProfileView rancher={ranchers.ranchers.find(r => r.slug === slug)!} claims={claims} plants={plants} /></MemoryRouter>,
)
const render = (slug: string) => renderHtml(slug).replace(/href="[^"]*"/g, '')

const VERDICT_WORDS = /\b(clean|safe|unsafe|dirty|violator|bad|good|trusted|worst|best)\b|verified public record|ranch behind your beef/i

test('USDA-path sample: banner, quoted words, live plant check, no verdict words', () => {
  expect(renderHtml('sample-ridge-cattle')).toContain('href="/est/M9714"')
  const text = render('sample-ridge-cattle')
  expect(text).toContain('SAMPLE DATA')
  expect(text).toContain('“100% grass-fed and grass-finished. Hay from our own fields in winter.”')
  expect(text).toContain('Thoma Meat Market, Saxonburg, PA')
  expect(text).toContain('Plattr has not confirmed with the plant that this ranch is a customer.')
  expect(text).toContain('FSIS guidance (not law) says')
  expect(text).toContain('The regulation says')
  expect(text.indexOf('Other statements')).toBeGreaterThan(text.indexOf('Raised without antibiotics'))   // breed sits apart
  expect(text.indexOf('Breed (for example Angus)')).toBeGreaterThan(text.indexOf('Other statements'))
  expect(text).not.toMatch(VERDICT_WORDS)
})

test('custom-exempt sample: rule quoted, no plant link, no package or QR wording', () => {
  const text = render('sample-hollow-farm')
  expect(text).toContain('Not for Sale')
  expect(text).toContain('9 CFR 303.1(a)(2)(iii)')
  expect(renderHtml('sample-hollow-farm')).not.toContain('href="/est/')
  expect(text).not.toMatch(/package|\bQR\b/i)
  expect(text).not.toMatch(VERDICT_WORDS)
})
