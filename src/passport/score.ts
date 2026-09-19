// The Plattr score: 0-100, graded A-F on the usual school scale. It measures how much of a food's story is documented and how well it is
// backed up - NOT a medical or safety guarantee. Transparent by design: every part is shown with its points.
// Shared file: builders import, do not edit.
import type { Evidence, Fact, Passport, Score, ScorePart } from './types'

/** Grade bands - the single source of truth. Every page that shows or explains a grade reads this. */
export const GRADE_BANDS = [
  { grade: 'A+', word: 'Outstanding', min: 97, band: '97 to 100' },
  { grade: 'A', word: 'Excellent', min: 90, band: '90 to 96' },
  { grade: 'B', word: 'Good', min: 80, band: '80 to 89' },
  { grade: 'C', word: 'Fair', min: 70, band: '70 to 79' },
  { grade: 'D', word: 'Limited', min: 60, band: '60 to 69' },
  { grade: 'F', word: 'Minimal', min: 0, band: 'below 60' },
] as const

/** The band a 0-100 total falls in. An F means little is documented - not that a food is unsafe. */
export const gradeFor = (total: number) => GRADE_BANDS.find(b => total >= b.min)!

const WEIGHT: Record<Evidence, number> = { verified: 1, document: 0.9, declared: 0.5, community: 0.5, missing: 0 }

/** Average backing of a section's facts, 0-1. An empty section scores 0. */
const backing = (facts: Fact[]) => (facts.length ? facts.reduce((s, f) => s + WEIGHT[f.evidence], 0) / facts.length : 0)

export function scorePassport(p: Passport): Score {
  const animal = ['beef', 'poultry', 'eggs', 'dairy', 'fish'].includes(p.category)
  // Animal products are judged on feed, welfare and health history; plants on soil instead.
  const sections: [string, string, Fact[], number][] = animal
    ? [['origin', 'Farm origin', p.origin, 20], ['feed', 'Feed and grazing', p.feed, 15], ['welfare', 'Space and welfare', p.animal_welfare, 15],
       ['health', 'Animal health records', p.health_history, 15], ['water', 'Water quality', p.water, 10], ['certs', 'Certifications', p.certifications, 10], ['safety', 'Safety testing and recalls', p.safety, 15]]
    : [['origin', 'Farm origin', p.origin, 20], ['soil', 'Soil, fertilizers and pesticides', p.soil, 25], ['water', 'Water quality', p.water, 20],
       ['certs', 'Certifications', p.certifications, 15], ['safety', 'Safety testing and recalls', p.safety, 20]]

  const parts: ScorePart[] = sections.map(([key, label, facts, max]) => {
    const b = backing(facts)
    const verified = facts.filter(f => f.evidence === 'verified' || f.evidence === 'document').length
    return { key, label, max, points: Math.round(b * max), note: facts.length ? `${verified} of ${facts.length} items backed by a record or document` : 'Nothing provided' }
  })
  const total = parts.reduce((s, x) => s + x.points, 0)
  const { grade, word } = gradeFor(total)
  return { total, grade, word, parts }
}

export const GRADE_COLOR: Record<Score['grade'], string> = { 'A+': '#1f8a3b', A: '#2e9e44', B: '#8ab833', C: '#e69a17', D: '#e0701f', F: '#d9412f' }

/** Average score of a set of passports (shopping history). Null when empty. */
export function averageScore(passports: Passport[]): number | null {
  return passports.length ? Math.round(passports.reduce((s, p) => s + scorePassport(p).total, 0) / passports.length) : null
}
