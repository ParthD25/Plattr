// One card per fired label rule, one per label claim, one for unmapped Open Food Facts tags. Quotes only - no verdicts.
import { Card, Quote, SourceLine } from '../components/ui'
import type { Product } from '../types'
import type { Detected } from './detect'

const says = (binding: boolean) => (binding ? 'The regulation says:' : 'FSIS guidance (not law) says:')
const quoted = (words: string[]) => words.map(w => `“${w}”`).join(', ')

export function LabelCards({ product, found, snapshot, offUrl }: { product: Product; found: Detected; snapshot: string; offUrl: string }) {
  return (
    <>
      {found.labelRules.map(rule => (
        <Card key={rule.key} tier="label" title={rule.label} source={<SourceLine source={rule.source} url={rule.url} date={snapshot} />}>
          <p>
            Shown because this product's Open Food Facts record contains {quoted(rule.matched)}.
            Plattr quotes the rule and has not checked this product against it.
          </p>
          <p>{says(rule.is_binding_law)}</p>
          <Quote>{rule.quote}</Quote>
          {rule.key === 'ground_beef' && product.ingredients_text && (
            <>
              <p>Ingredient statement recorded in Open Food Facts for this product on {product.retrieved_at}:</p>
              <Quote>{product.ingredients_text}</Quote>
            </>
          )}
          {rule.caveat && <p className="caveat">{rule.caveat}</p>}
        </Card>
      ))}

      {found.labelClaims.map(claim => (
        <Card
          key={claim.key}
          tier="label"
          title={claim.label}
          source={<SourceLine source={claim.source ?? 'Plattr claims table - no rule or guidance is quoted for this term'} url={claim.url} date={snapshot} />}
        >
          <p>Shown because this product's Open Food Facts record contains {quoted([claim.matched])}.</p>
          {claim.quote && (
            <>
              <p>{says(claim.is_binding_law)}</p>
              <Quote>{claim.quote}</Quote>
            </>
          )}
          <p className="caveat">{claim.caveat}</p>
          <p>This is the company's claim. Plattr cannot verify it.</p>
        </Card>
      ))}

      {found.otherLabels.length > 0 && (
        <Card
          tier="label"
          title="Other label statements recorded in Open Food Facts"
          source={<SourceLine source={`Open Food Facts record for barcode ${product.code}`} url={offUrl} date={product.retrieved_at} />}
        >
          <ul>{found.otherLabels.map(tag => <li key={tag}>{tag}</li>)}</ul>
          <p className="caveat">Listed exactly as Open Food Facts contributors recorded them. Plattr does not interpret them.</p>
        </Card>
      )}
    </>
  )
}
