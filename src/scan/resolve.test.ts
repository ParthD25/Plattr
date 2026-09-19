import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { barcodeOf, resolveScan, scanDestination } from './resolve'
import type { Passport } from '../passport/types'

const { passports } = JSON.parse(readFileSync('public/data/passports.json', 'utf8')) as { passports: Passport[] }

test('resolves barcode, UPC-A without the leading zero, id and QR link; misses cleanly', () => {
  expect(resolveScan(passports, '0850001000042')?.id).toBe('eggs-meadowlark')
  expect(resolveScan(passports, ' 850001000042 ')?.id).toBe('eggs-meadowlark')
  expect(resolveScan(passports, 'eggs-meadowlark')?.id).toBe('eggs-meadowlark')
  expect(resolveScan(passports, 'https://plattr.example/food/eggs-meadowlark?src=qr')?.id).toBe('eggs-meadowlark')
  expect(resolveScan(passports, '0000000000000')).toBeUndefined()
  expect(resolveScan(passports, '')).toBeUndefined()
})

test('free text never matches a passport that has an empty barcode', () => {
  const blank = { ...passports[0], id: 'mine', barcode: '' }
  expect(resolveScan([blank], 'salmon')).toBeUndefined()
})

test('scanDestination: passport -> /food, Plattr QR -> /food, other barcode -> /lookup, anything else -> undefined', () => {
  expect(scanDestination(passports, '850001000042')).toBe('/food/eggs-meadowlark')
  expect(scanDestination(passports, 'https://plattr.example/food/made-elsewhere')).toBe('/food/made-elsewhere')
  expect(scanDestination(passports, '0850388002291')).toBe('/lookup/0850388002291')
  expect(scanDestination(passports, '850388002291')).toBe('/lookup/0850388002291')
  expect(scanDestination(passports, '0994 8246 0839')).toBe('/lookup/0099482460839')
  expect(scanDestination(passports, 'https://example.com/menu')).toBeUndefined()
  expect(scanDestination(passports, 'greek yogurt')).toBeUndefined()
  expect(barcodeOf('1234567')).toBe('')
})
