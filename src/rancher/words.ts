// Fixed wording shared by the profile view and the builder form.
import type { Rancher } from '../types'

export const PATH_LABEL: Record<Rancher['inspection_path'], string> = {
  usda: 'USDA-inspected',
  state: 'State-inspected',
  custom_exempt: 'Custom-exempt',
}

/** Follow-up questions, keyed by claims.json form_questions. */
export const QUESTIONS: Record<string, string> = {
  ever_fed_grain: 'After weaning, were the cattle ever fed grain or grain by-products?',
  ever_in_feedlot: 'Were the cattle ever confined to a feedlot?',
  implants: 'Were the cattle ever given hormone implants?',
  ionophores: 'Were the cattle ever given ionophores?',
}

export const leadIn = (isBindingLaw: boolean) => (isBindingLaw ? 'The regulation says' : 'FSIS guidance (not law) says')
