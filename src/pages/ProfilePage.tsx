// Shopper profile: allergens, conditions and optional health numbers, kept in this browser only.
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { actions, EMPTY_PROFILE, useAccount, useStore } from '../store'
import { SampleBanner } from '../components/ui'
import { MAX_CUSTOM_ALLERGENS, MAX_CUSTOM_ALLERGEN_CHARS, MAX_CUSTOM_CONDITIONS_CHARS, MAX_LABS, TODAY_KEYS, cleanAllergens, toForm, toProfile, type LabCode, type LabRow, type ProfileForm, type TodayKey } from '../consumer/profile/form'

const ALLERGENS = ['milk', 'eggs', 'fish', 'shellfish', 'tree nuts', 'peanuts', 'wheat', 'soybeans', 'sesame']
const CONDITIONS: [string, string][] = [
  ['immunocompromised', 'Weakened immune system (immunocompromised)'],
  ['pregnant', 'Pregnant'],
  ['celiac', 'Celiac disease'],
  ['high_blood_pressure', 'High blood pressure'],
  ['high_cholesterol', 'High cholesterol'],
  ['diabetes_or_prediabetes', 'Diabetes or prediabetes'],
  ['kidney_disease', 'Kidney disease'],
]
const DIETARY: [string, string][] = [['halal', 'Halal'], ['kosher', 'Kosher'], ['vegetarian', 'Vegetarian'], ['vegan', 'Vegan'], ['gluten_free', 'Gluten-free']]
const LAB_LABEL: Record<LabCode, string> = {
  hba1c: 'HbA1c', fasting_glucose: 'Fasting glucose', ldl: 'LDL cholesterol', hdl: 'HDL cholesterol',
  total_cholesterol: 'Total cholesterol', triglycerides: 'Triglycerides',
}
const TODAY_LABEL: Record<TodayKey, string> = {
  sodium_mg: 'Sodium (mg)', saturated_fat_g: 'Saturated fat (g)', added_sugars_g: 'Added sugars (g)',
  energy_kcal: 'Calories (kcal)', protein_g: 'Protein (g)', exercise_min: 'Exercise (minutes)',
}
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)
const unitFor = (code: LabCode): LabRow['unit'] => (code === 'hba1c' ? '%' : 'mg/dL')

const CSS = `
.pf-checks { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 0 14px; }
.pf-lab { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0 12px; align-items: end; padding: 4px 12px 12px; margin: 10px 0; border: 1px dashed var(--line); border-radius: 14px; }
.pf-lab label { margin-top: 10px; font-size: 0.85rem; }
.pf-hint { color: var(--muted); font-size: 0.9rem; margin: 4px 0 8px; font-weight: 400; }
.pf-actions { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-top: 18px; }
.pf-saved { font-weight: 800; color: var(--verified); }
.pf-add { display: flex; gap: 8px; align-items: center; max-width: 440px; }
.pf-add input { flex: 1; min-width: 0; }
.pf-chips { display: flex; flex-wrap: wrap; gap: 8px; list-style: none; padding: 0; margin: 10px 0 0; }
.pf-chips li { display: inline-flex; align-items: center; gap: 4px; padding: 3px 4px 3px 12px; border-radius: 999px; border: 1.5px solid var(--red); background: #fde9e6; font-weight: 700; font-size: 0.9rem; overflow-wrap: anywhere; }
.pf-chips button { padding: 0; width: 26px; height: 26px; justify-content: center; border-width: 0; background: transparent; color: var(--red); font-size: 1.1rem; line-height: 1; flex: none; }
.pf-chips button:hover, .pf-chips button:focus-visible { background: var(--red); color: #fff; }
`

function Checks({ name, options, value, onChange }: { name: string; options: [string, string][]; value: string[]; onChange: (next: string[]) => void }) {
  return (
    <div className="pf-checks">
      {options.map(([key, label]) => (
        <label className="check" key={key}>
          <input type="checkbox" name={name} value={key} checked={value.includes(key)}
            onChange={e => onChange(e.target.checked ? [...value, key] : value.filter(v => v !== key))} />
          {label}
        </label>
      ))}
    </div>
  )
}

export default function ProfilePage() {
  const account = useAccount()
  const stored = useStore().profiles[account?.email ?? ''] ?? EMPTY_PROFILE
  const [form, setForm] = useState<ProfileForm>(() => toForm(stored))
  const [status, setStatus] = useState('')
  const [word, setWord] = useState('')

  if (!account) return <p>Please <Link to="/login">sign in</Link> to edit your profile.</p>

  const set = (patch: Partial<ProfileForm>) => { setForm(f => ({ ...f, ...patch })); setStatus('') }
  const setLab = (i: number, patch: Partial<LabRow>) => set({ labs: form.labs.map((l, j) => (j === i ? { ...l, ...patch } : l)) })

  function addAllergen() {
    const [w] = cleanAllergens([word])
    if (!w) return
    setWord('')
    if (ALLERGENS.includes(w)) { // already one of the nine: tick it instead of duplicating it
      set({ allergens: [...new Set([...form.allergens, w])] })
      setStatus(`“${cap(w)}” is in the list above - ticked it for you. Save your profile to keep it.`)
    } else if (form.custom_allergens.includes(w)) setStatus(`“${w}” is already in your list.`)
    else {
      set({ custom_allergens: cleanAllergens([...form.custom_allergens, w]) })
      setStatus(`Added “${w}”. Save your profile to keep it.`)
    }
  }
  const allergensFull = form.custom_allergens.length >= MAX_CUSTOM_ALLERGENS

  function save(e: FormEvent) {
    e.preventDefault()
    const profile = toProfile(form)
    actions.saveProfile(account!.email, profile)
    setForm(toForm(profile)) // show exactly what was stored (incomplete lab rows are dropped)
    setStatus('Saved ✓ Your profile is stored in this browser.')
  }
  function wipe() {
    if (!window.confirm('Delete all the health information you entered here? This cannot be undone.')) return
    actions.deleteHealthData(account!.email)
    setForm(toForm(EMPTY_PROFILE))
    setStatus('Deleted. No health data is stored for this account.')
  }

  return (
    <div className="narrow">
      <style>{CSS}</style>
      <h1>Your profile</h1>
      <p className="lede">
        Tell Plattr what to watch for. We use this only to show informational warnings on product pages - for example
        “this product lists eggs, which is in your allergen list”.
      </p>
      <SampleBanner text="Demo mode - do not enter real medical information. Everything here stays in this browser." />

      <form className="panel" onSubmit={save}>
        <p className="muted" style={{ marginTop: 0 }}>Signed in as <strong>{account.name}</strong> ({account.email}). Every field is optional.</p>

        <fieldset>
          <legend>About you</legend>
          <label htmlFor="pf-age">Age</label>
          <input id="pf-age" type="number" inputMode="numeric" min={0} max={120} step={1} style={{ maxWidth: 160 }}
            value={form.age} onChange={e => set({ age: e.target.value })} />
          <label className="check" style={{ marginTop: 12 }}>
            <input type="checkbox" checked={form.shopping_for_children} onChange={e => set({ shopping_for_children: e.target.checked })} />
            I also shop for children
          </label>
        </fieldset>

        <fieldset>
          <legend>Allergens</legend>
          <p className="pf-hint">The nine major food allergens named by the US FDA. Tick any you avoid.</p>
          <Checks name="allergens" options={ALLERGENS.map(a => [a, cap(a)])} value={form.allergens} onChange={allergens => set({ allergens })} />

          <label htmlFor="pf-allergen-word">Something not listed?</label>
          <p className="pf-hint" id="pf-allergen-help">
            Add a food or ingredient to avoid, such as strawberry or mustard. Plattr will flag products whose name, ingredients or listed
            allergens contain this word. It is a simple text match that can miss things - always read the label.
          </p>
          <div className="pf-add">
            <input id="pf-allergen-word" type="text" autoComplete="off" maxLength={MAX_CUSTOM_ALLERGEN_CHARS} aria-describedby="pf-allergen-help"
              disabled={allergensFull} value={word} onChange={e => setWord(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAllergen() } }} />
            <button type="button" className="secondary small" disabled={allergensFull || !word.trim()} onClick={addAllergen}>Add</button>
          </div>
          {allergensFull && <p className="pf-hint">That is the maximum of {MAX_CUSTOM_ALLERGENS}. Remove one to add another.</p>}
          {form.custom_allergens.length > 0 && (
            <ul className="pf-chips" aria-label="Your added allergens">
              {form.custom_allergens.map(a => (
                <li key={a}>
                  {a}
                  <button type="button" aria-label={`Remove ${a}`} title={`Remove ${a}`}
                    onClick={() => set({ custom_allergens: form.custom_allergens.filter(x => x !== a) })}>×</button>
                </li>
              ))}
            </ul>
          )}
        </fieldset>

        <fieldset>
          <legend>Health conditions to watch for</legend>
          <p className="pf-hint">Plattr does not diagnose anything - it only points out product facts that may matter to you.</p>
          <Checks name="conditions" options={CONDITIONS} value={form.conditions} onChange={conditions => set({ conditions })} />

          <label htmlFor="pf-conditions-other">A health condition not listed?</label>
          <p className="pf-hint" id="pf-conditions-help">
            One per line, or separated by commas. Plattr has no rules for conditions it does not know, so these trigger no warnings - they are
            shown back to you on product pages as a reminder to check with your clinician.
          </p>
          <textarea id="pf-conditions-other" rows={3} maxLength={MAX_CUSTOM_CONDITIONS_CHARS} aria-describedby="pf-conditions-help"
            value={form.custom_conditions} onChange={e => set({ custom_conditions: e.target.value })} />
          <p className="pf-hint" style={{ textAlign: 'right' }}>{form.custom_conditions.length} / {MAX_CUSTOM_CONDITIONS_CHARS} characters</p>
        </fieldset>

        <fieldset>
          <legend>Dietary preferences</legend>
          <Checks name="dietary" options={DIETARY} value={form.dietary} onChange={dietary => set({ dietary })} />
        </fieldset>

        <fieldset>
          <legend>Do you take prescription medicines?</legend>
          <p className="pf-hint">Some foods interact with medicines, so food-pairing tips are hidden unless your answer is “None”.</p>
          {([['none', 'None'], ['some', 'Yes, one or more']] as const).map(([key, label]) => (
            <label className="check" key={key}>
              <input type="radio" name="takes_medicines" value={key} checked={form.takes_medicines === key} onChange={() => set({ takes_medicines: key })} />
              {label}
            </label>
          ))}
          {form.takes_medicines === 'unanswered' && <p className="pf-hint">Not answered yet - pairing tips stay hidden.</p>}
        </fieldset>

        <fieldset>
          <legend>Health numbers (optional)</legend>
          <label className="check">
            <input type="checkbox" checked={form.consent} onChange={e => set({ consent: e.target.checked })} />
            I understand these values stay in this browser and I should not enter real lab results in this demo
          </label>
          {!form.consent && <p className="pf-hint">Tick the box to add lab values and today’s intake. Without it, no health numbers are saved.</p>}

          {form.consent && (
            <>
              <h2 style={{ marginTop: 18 }}>Lab values</h2>
              <p className="pf-hint">Up to {MAX_LABS}. A row needs a value and a draw date to be saved. Plattr repeats these back for context only - it never interprets them.</p>
              {form.labs.map((lab, i) => (
                <div className="pf-lab" role="group" aria-label={`Lab value ${i + 1}`} key={i}>
                  <div>
                    <label htmlFor={`pf-lab-${i}-code`}>Marker</label>
                    <select id={`pf-lab-${i}-code`} value={lab.code}
                      onChange={e => { const code = e.target.value as LabCode; setLab(i, { code, unit: unitFor(code) }) }}>
                      {(Object.keys(LAB_LABEL) as LabCode[]).map(c => <option key={c} value={c}>{LAB_LABEL[c]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`pf-lab-${i}-value`}>Value</label>
                    <input id={`pf-lab-${i}-value`} type="number" inputMode="decimal" min={0} step="any" value={lab.value} onChange={e => setLab(i, { value: e.target.value })} />
                  </div>
                  <div>
                    <label htmlFor={`pf-lab-${i}-unit`}>Unit</label>
                    <select id={`pf-lab-${i}-unit`} value={lab.unit} onChange={e => setLab(i, { unit: e.target.value as LabRow['unit'] })}>
                      <option value="%">%</option>
                      <option value="mg/dL">mg/dL</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`pf-lab-${i}-date`}>Draw date</label>
                    <input id={`pf-lab-${i}-date`} type="date" max={new Date().toISOString().slice(0, 10)} value={lab.drawn_on} onChange={e => setLab(i, { drawn_on: e.target.value })} />
                  </div>
                  <div>
                    <button type="button" className="secondary small" onClick={() => set({ labs: form.labs.filter((_, j) => j !== i) })}
                      aria-label={`Remove lab value ${i + 1}`}>Remove</button>
                  </div>
                </div>
              ))}
              <button type="button" className="secondary small" disabled={form.labs.length >= MAX_LABS}
                onClick={() => set({ labs: [...form.labs, { code: 'hba1c', value: '', unit: '%', drawn_on: '' }] })}>
                + Add a lab value
              </button>

              <h2>Today so far</h2>
              <p className="pf-hint">What you have already eaten and done today. Leave a box empty if you do not know - empty is not the same as zero.</p>
              <div className="grid-2">
                {TODAY_KEYS.map(k => (
                  <div key={k}>
                    <label htmlFor={`pf-today-${k}`}>{TODAY_LABEL[k]}</label>
                    <input id={`pf-today-${k}`} type="number" inputMode="decimal" min={0} step="any" value={form.today[k]}
                      onChange={e => set({ today: { ...form.today, [k]: e.target.value } })} />
                  </div>
                ))}
              </div>
            </>
          )}
        </fieldset>

        <div className="pf-actions">
          <button type="submit">Save profile</button>
          <button type="button" className="secondary" onClick={wipe}>Delete my health data</button>
          <span className="pf-saved" role="status" aria-live="polite">{status}</span>
        </div>
      </form>

      <p className="note">
        <strong>Not medical advice.</strong> Plattr’s warnings are informational: they repeat what a product’s passport lists next to what you
        entered here. They are not a diagnosis or a food-safety guarantee - always check the label in your hand and ask your doctor or
        pharmacist about your own health.
      </p>
    </div>
  )
}
