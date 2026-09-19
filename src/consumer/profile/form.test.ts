import { describe, expect, it, vi } from 'vitest'

vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {} })
const { EMPTY_PROFILE } = await import('../../store')
const { toForm, toProfile, cleanAllergens, parseConditions } = await import('./form')

describe('profile form', () => {
  it('leaves empty values undefined, never 0', () => {
    const p = toProfile(toForm(EMPTY_PROFILE))
    expect(p).toEqual(EMPTY_PROFILE)
    expect('age' in p).toBe(false)
  })

  it('stores health numbers only with consent and drops incomplete lab rows', () => {
    const f = toForm(EMPTY_PROFILE)
    f.today.sodium_mg = '900'
    f.labs = [
      { code: 'hba1c', value: '6.1', unit: '%', drawn_on: '2026-08-01' },
      { code: 'ldl', value: '', unit: 'mg/dL', drawn_on: '2026-08-01' },
      { code: 'hdl', value: '50', unit: 'mg/dL', drawn_on: '' },
    ]
    expect(toProfile(f).labs).toEqual([])
    expect(toProfile(f).today).toEqual({})
    const p = toProfile({ ...f, consent: true })
    expect(p.today).toEqual({ sodium_mg: 900 })
    expect(p.labs).toEqual([{ code: 'hba1c', value: 6.1, unit: '%', drawn_on: '2026-08-01' }])
    expect(toForm(p).consent).toBe(true)
  })

  it('round-trips vegan, custom allergens and custom conditions', () => {
    const f = toForm(EMPTY_PROFILE)
    f.dietary = ['vegan']
    f.custom_allergens = ['  Strawberry ', 'strawberry', 'MUSTARD', '']
    f.custom_conditions = 'Gout, IBS\ngout\n\n  Lactose intolerance '
    const p = toProfile(f)
    expect(p.dietary).toEqual(['vegan'])
    expect(p.custom_allergens).toEqual(['strawberry', 'mustard'])
    expect(p.custom_conditions).toEqual(['Gout', 'IBS', 'Lactose intolerance'])
    expect(toProfile(toForm(p))).toEqual(p)
    expect(toForm(p).custom_conditions).toBe('Gout\nIBS\nLactose intolerance')
  })

  it('caps custom entries: 40 chars and 12 allergens, 200 chars of conditions', () => {
    expect(cleanAllergens(['x'.repeat(60)])).toEqual(['x'.repeat(40)])
    expect(cleanAllergens(Array.from({ length: 20 }, (_, i) => `food ${i}`))).toHaveLength(12)
    expect(parseConditions('a'.repeat(300)).join('')).toHaveLength(200)
  })

  it('loads an older stored profile that has no custom fields', () => {
    const old = JSON.parse(JSON.stringify(EMPTY_PROFILE)) // as read back from localStorage, before these fields existed
    const f = toForm(old)
    expect(f.custom_allergens).toEqual([])
    expect(f.custom_conditions).toBe('')
    const p = toProfile(f)
    expect('custom_allergens' in p).toBe(false)
    expect('custom_conditions' in p).toBe(false)
  })
})
