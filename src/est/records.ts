// Pure joins between one plant and the other FSIS snapshots. No React, no fetch - checked by records.test.ts.
import type { BeefSampling, HumaneFile, Plant, Recall } from '../types'
import { tokenMatchesPlant } from './normalize'

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

export interface PlantRecall { recall: Recall; sentences: string[]; nameMatch: boolean }

/** Notices whose text names one of the plant's numbers, newest first. The link is a Plattr text match, so the matched sentences travel with it. */
export function recallsForPlant(recalls: Recall[], plant: Plant): PlantRecall[] {
  const name = squash(plant.name)
  return recalls
    .flatMap(recall => {
      const hits = recall.est.filter(e => tokenMatchesPlant(e.token, plant))
      if (!hits.length) return []
      return [{
        recall,
        sentences: [...new Set(hits.map(h => h.sentence))],
        nameMatch: name !== '' && squash(recall.establishment_name).includes(name),
      }]
    })
    .sort((a, b) => b.recall.date.localeCompare(a.recall.date))
}

export function samplingForPlant(sampling: BeefSampling, plant: Plant): BeefSampling['by_establishment'][string] | undefined {
  return sampling.by_establishment[plant.number]
}

/** "M6648," -> "M6648": many rows keep the comma that follows the number on the FSIS page. */
export const postedEst = (est: string) => est.replace(/,\s*$/, '')

export function humaneForPlant(humane: HumaneFile, plant: Plant): HumaneFile['establishments'] {
  // Two rows are posted with a bare number ("20321,") and ship with tokens: []. Without the fallback their plants would show
  // the "no action posted" sentence, which would be false.
  // ponytail: a bare number matches under any prefix (M/P/V); fine while each is one plant - tokenise them in prep to fix properly.
  return humane.establishments.filter(e => (e.tokens.length ? e.tokens : [postedEst(e.est)]).some(t => tokenMatchesPlant(t, plant)))
}

/** FSIS legend text ("<measure>: 1 = Less 1,000; 2 = ...") + a category -> the measure and that category's band, both verbatim. */
export function volumeBand(legend: string, category: number): { measure: string; band?: string } {
  const [measure, bands = ''] = legend.split(': ')
  const lead = `${category} = `
  return { measure, band: bands.split('; ').find(b => b.startsWith(lead))?.slice(lead.length) }
}
