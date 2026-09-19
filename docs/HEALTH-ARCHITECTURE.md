# Plattr — "What's In My System": architecture for the personal-health layer

*Pre-build design note, written on 2026-09-19 before the app was finished. Sign-up, roles, the profile form and in-app scanning were built afterwards - where this note and the README differ, the README describes what shipped.*

*Design document, 2026-09-19. Extends the Plattr plan (kept in the team's private working repository). The scan engine described in §4 exists and is tested: `src/health/evaluate.ts`, `src/health/references.ts`, `src/health/evaluate.test.ts`. Every number and constraint below was checked against primary sources on 2026-09-19 by a separate verification pass.*

## 0. Read this first

**What it adds.** Plattr already answers "what does the public record say about this package, and what does the rancher say?". This layer answers a third question, privately: **"how does this item fit what is already in my system today?"** — using the shopper's own blood-test markers, allergies, and today's intake and activity.

**Four "subagents" = four modules with typed contracts, not four LLMs.** Everything that touches health is a deterministic rule with a named source. No language model decides *or words* anything: rephrasing is exactly how "spike", "avoid" and disease names creep back in. That keeps the feature reviewable by a clinician and honest in a demo.

**Five findings that shape everything** (details in §5–§8):

1. **Apple Health and Google Health Connect have no web API.** Both are on-device stores readable only by a native app with the user's permission. A Vite web app cannot call them. → define one `HealthSource` adapter; the web demo uses manual/demo data, a native wrapper (Expo dev client) plugs in later.
2. **Blood-test values are the most sensitive data in the product.** → the scan engine is a pure function that runs **on the device**; biomarkers never need to reach a server. The demo uses **synthetic** blood-test data only.
3. **Wording decides whether this is a wellness tool or an unregulated medical device.** FDA's General Wellness guidance (reissued 6 Jan 2026) says a product is *not* general wellness if its interface includes "references to specific diseases, clinical conditions, or diagnostic thresholds". → A lab value appears only as something the user entered, with its draw date ("You entered LDL-C 142 mg/dL (blood draw 2026-08-01). You chose to watch saturated fat."). What to watch is **chosen by the user, never inferred from a lab value**. Guideline bands live on a static "About these numbers" page, never beside the user's value. No verdict words (avoid, limit, spike, safe, compatible), no imperatives, no disease names, no LLM-written text: every sentence is a fixed template filled with numbers. An allergen match comes first and suppresses everything positive. Food-pairing tips are default-deny: shown only to someone who reports no medicines and no condition.
4. **The two example alerts in the brief cannot ship as written.** "Your fasting glucose trends high… will rapidly spike your blood sugar" names a condition from one value (the ADA requires two abnormal results for a diagnosis), claims a trend from a single number, and overstates the evidence (the ADA calls glycemic-index evidence mixed). And the demo is beef: every product has 0–11 g carbohydrate per 100 g, so a glycemic rule could never honestly fire. The rules that *do* bind for beef are **saturated fat and sodium** — those are the headline.
5. **"Cinnamon reduces the spike" is not supported.** ADA Standards of Care 2026 (Rec. 5.16): herbs or spices such as cinnamon are "not recommended for glycemic benefits"; Cochrane found insufficient evidence; the trials used weeks of ~2 g/day cassia supplements, which reaches the tolerable daily intake for coumarin. The app therefore never claims a glycemic benefit; at the team's request it ships one hedged flavour-pairing note (`cinnamon_with_carbs` in `references.ts`, worded "some small trials... results are mixed", a flavour choice and not a treatment), hidden by the default-deny tip gate whenever a profile lists medicines or a condition. The one honest way to keep cinnamon on screen is the ADA's own advice to season with herbs and spices instead of salt.

## 1. System outline — how the four modules pass data

```
        CONSUMER (role: consumer)                                   FARMER / RANCHER (role: farmer)
                 │ sign in                                                     │ sign in
                 ▼                                                             ▼
┌─────────────────────────────────┐                         ┌─────────────────────────────────────┐
│ 1  AUTH & PROFILE               │                         │ 2  FARM DATA LEDGER                 │
│  roles · consent · allergies    │                         │  farm profile · practices (claims   │
│  lab reports → biomarker rows   │                         │  + evidence level) · soil tests ·   │
│  (entered or imported)          │                         │  products (nutrients + provenance)  │
└───────────────┬─────────────────┘                         │  → QR / product code                │
                │ HealthProfile                             └──────────────────┬──────────────────┘
                │ {biomarkers[], allergies[], goals,                           │ ProductRecord
                │  energy target, medication flag}                             │ {per_100g nutrients + nutrient_source,
                │                                                              │  GI (+source), allergens, serving,
┌───────────────┴─────────────────┐                                            │  farm_summary{about, sourcing, claims[level]},
│ 3  HEALTH APP INTEGRATION       │                                            │  plant check (EST → FSIS record)}
│  HealthSource adapter:          │                                            │
│   HealthKit │ Health Connect    │ TodaySnapshot                              │
│   │ manual │ demo               │ {intake totals, exercise min, source, as_of}
│  (runs on the device)           │──────────────┐                             │
└─────────────────────────────────┘              ▼                             ▼
                                   ┌──────────────────────────────────────────────────┐
             scan QR / barcode ──▶ │ 4  SCAN & RECOMMENDATION ENGINE                  │
                                   │  evaluateScan(product, profile, today) → Card[]  │
                                   │  pure · deterministic · on-device · rule tables  │
                                   └───────────────────────┬──────────────────────────┘
                                                           ▼
                                  "WHAT'S IN MY SYSTEM" dashboard
                 allergen card first · one card per nutrient the user chose to watch:
                 what you entered → what the product has (% Daily Value) → arithmetic vs today's log
                 "why am I seeing this?" (rule · inputs · source) · gated tips · farm summary · disclaimer
```

**Data contracts (the only things that cross module boundaries)**

| Contract | Producer → consumer | Shape | Leaves the device? |
|---|---|---|---|
| `HealthProfile` | 1 → 4 | `labs[{code, value, unit, drawn_on}]`, `allergies[]` (FDA's nine), `watching[]` (chosen by the user), `stricter{}` opt-ins, `medicines` (none / some / unanswered), `has_condition`, `data_label` | **No** in the default design (stored locally / in the platform keychain). Optional encrypted sync is a later decision |
| `ProductRecord` | 2 → 4 | `per_100g{}` + `nutrient_source` (`lab_tested` · `label` · `usda_reference` · `open_food_facts`), `serving_g`, `glycemic_index` + source, `allergens[]`, `farm_summary{}` | Public data; fetched by product code |
| `TodaySnapshot` | 3 → 4 | `intake` as a *partial* map (`sodium_mg`, `saturated_fat_g`, …) — **a missing key means unknown, never zero** — plus `exercise_min`, `source` | **No** — read on the device, used, discarded |
| `Card[]` | 4 → UI | `{id, kind, title, lines[], why{rule, inputs, source, url}}` — fixed templates, no verdict field | Nothing. No health value is ever sent to analytics |

The engine never judges the farm, and the farm never sees the consumer: module 2's `farm_summary` is passed through to the dashboard unchanged, and nothing from modules 1 or 3 is visible to farmers.

## 2. Module notes

**1 · Auth & Profile.** *In the demo: no sign-up, no roles, no server.* Health data lives in the browser's local storage under a persistent banner "Demo mode — synthetic data, do not enter real lab results", with SAMPLE personas, a separate unticked consent box before the first health field, and one-tap "Delete my health data". Blood tests are **six numeric fields + unit + draw date + a fasting (≥ 8 h) checkbox** — no PDF upload or OCR (lab PDFs carry name, date of birth and record numbers and would land in server storage). *Later:* a hosted auth service (for example Supabase Auth) with a `role` on the profile row and row-level security — holding auth, roles and farm tables only. Biomarkers stay on the device unless the user explicitly opts into encrypted sync. The one realistic import to demo is the free SMART Health IT sandbox (browser-callable FHIR; synthetic patient; returns HbA1c and lipids but no fasting glucose, and its dates are from 2021).

**2 · Farm Data Ledger.** This is the rancher profile already specified in the plan, extended with products. Same honesty rules: every practice is a *declared* claim with an evidence level and a fixed caveat; "nutritional density" may only be shown as **lab-tested** (document on file, date, lab) or else as **USDA reference values for this type of food — not measured on this farm's product**. Soil-health entries are lab reports with a date, not adjectives. The consumer-facing summary is generated from the structured fields: *About the farm* (the rancher's words, quoted, dated) · *Sourcing* (processor EST → FSIS plant record check) · *Practices* (claim chips with caveats) · *Nutrition* (values with their provenance).

**3 · Health App Integration.** One interface, several sources:

```ts
interface HealthSource {
  id: 'healthkit' | 'health_connect' | 'manual' | 'demo';
  isAvailable(): Promise<boolean>;
  requestPermissions(): Promise<boolean>;            // read-only: dietary nutrients, active energy, exercise time
  getTodaySnapshot(): Promise<TodaySnapshot>;        // totals since local midnight
}
```

Dietary totals only exist in Apple Health / Health Connect if the person logs food with an app that writes them (the platforms do not log food themselves) — so the UI must show the source and "nothing logged today" states, and offer quick manual entry.

**4 · Scan & Recommendation.** `evaluateScan(product, profile, today, date) → Card[]`. Order: allergen card first (three states: match / no match in what is recorded / nothing recorded — never "allergen-free") → one reference card per nutrient the user chose to watch (what you entered → what the product has per serving and its % Daily Value → plain arithmetic against what is logged today → the limits of the data) → carbohydrate note → post-exercise protein card → tips behind the default-deny gate. Each card carries a "Why am I seeing this?" record: rule id, inputs, source, URL. See §4.

## 3. Database blueprint (PostgreSQL / Supabase)

```sql
-- ── identity and roles ─────────────────────────────────────────────────────────────
create type user_role as enum ('consumer', 'farmer', 'moderator');

create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          user_role not null,
  display_name  text,
  created_at    timestamptz not null default now()
);

-- ── consumer health profile (most sensitive tables; consumer-only RLS; optional if kept on-device) ──
create table consumer_health_profiles (
  user_id             uuid primary key references profiles(id) on delete cascade,
  energy_kcal_target  int  not null default 2000,
  goals               text[] not null default '{}',          -- 'recovery', 'lower_sodium', ...
  allergies           text[] not null default '{}',          -- FDA major allergens, lower-case
  takes_prescription_medication boolean not null default false,
  health_consent_version text not null,
  health_consent_at      timestamptz not null
);

create table lab_reports (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  collected_on  date not null,
  fasting       boolean,
  lab_name      text,
  source        text not null check (source in ('manual', 'pdf_upload', 'fhir_import', 'healthkit_clinical')),
  file_path     text,                                        -- private storage bucket, never public
  created_at    timestamptz not null default now()
);

create table biomarker_results (
  id           uuid primary key default gen_random_uuid(),
  report_id    uuid not null references lab_reports(id) on delete cascade,
  user_id      uuid not null references profiles(id) on delete cascade,
  code         text not null check (code in ('hba1c','fasting_glucose','glucose','total_cholesterol','ldl','hdl','triglycerides')),
  loinc        text,                                         -- 4548-4, 1558-6, 2345-7, 2093-3, 13457-7, 2085-9, 2571-8
  value        numeric not null,
  unit         text not null,                                -- '%', 'mg/dL', 'mmol/L' (convert on write)
  ref_low      numeric, ref_high numeric,                    -- the lab's own reference range, if printed
  measured_on  date not null
);
create index on biomarker_results (user_id, code, measured_on desc);

-- row-level security: a consumer sees only their own rows; farmers and the public see none
alter table consumer_health_profiles enable row level security;
alter table lab_reports            enable row level security;
alter table biomarker_results      enable row level security;
create policy own_rows on biomarker_results for all using (user_id = auth.uid()) with check (user_id = auth.uid());
-- (same policy on the other two tables)

-- ── farm data ledger ───────────────────────────────────────────────────────────────
create table farms (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references profiles(id),
  slug            text unique not null,                      -- /r/{slug}
  status          text not null default 'pending' check (status in ('sample','pending','published','withdrawn')),
  name            text not null, county text, state text,
  about           text,                                      -- rancher's words; rendered in quotation marks with name + date
  inspection_path text check (inspection_path in ('usda','state','custom_exempt')),
  processors      jsonb not null default '[]',               -- [{est, role, declared_at, check:{result, snapshot}}]
  consent         jsonb not null,                            -- {given_by, role, method, given_at, terms_version, scopes[], withdrawn_at?}
  last_confirmed  date not null
);

create table farm_practices (                               -- one row per declared claim
  id          uuid primary key default gen_random_uuid(),
  farm_id     uuid not null references farms(id) on delete cascade,
  claim_key   text not null,                                 -- key into claims.json (fixed caveat lives there)
  words       text not null,                                 -- verbatim
  answers     jsonb,                                         -- structured follow-ups (ever_fed_grain, ionophores, ...)
  level       text not null default 'rancher_declared' check (level in ('usda_program','certifier_listed','document_on_file','rancher_declared')),
  evidence    jsonb not null default '[]',                   -- [{type, issuer, scope, url, checked_on, checked_by}]
  declared_at date not null
);

create table soil_tests (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  sampled_on date not null, lab_name text not null, field_label text,
  organic_matter_pct numeric, ph numeric, results jsonb,     -- remaining analytes as reported by the lab
  document_path text                                         -- the lab report itself
);

create table farm_products (
  id              uuid primary key default gen_random_uuid(),
  farm_id         uuid not null references farms(id) on delete cascade,
  code            text unique not null,                      -- what the QR encodes: https://<origin>/p/{code}
  gtin            text,                                      -- retail barcode, if any
  name            text not null, category text not null,     -- 'beef_ground', 'beef_frank', ...
  serving_g       numeric not null,
  per_100g        jsonb not null,                            -- {energy_kcal, sodium_mg, saturated_fat_g, added_sugars_g, carbs_g, fiber_g, protein_g, ...}
  nutrient_source text not null check (nutrient_source in ('lab_tested','label','usda_reference','open_food_facts')),
  nutrient_doc    jsonb,                                     -- {lab, report_date, document_path} required when lab_tested
  fdc_id          int,                                       -- USDA FoodData Central id when usda_reference
  glycemic_index  int, gi_source text,                       -- null for meat; never guessed
  allergens       text[] not null default '{}',
  ingredients     text,
  est_number      text,                                      -- processor whose mark is on this product
  lot_or_harvest  jsonb,                                     -- optional {lot, harvested_on, packed_on}
  updated_at      timestamptz not null default now(),
  check (nutrient_source <> 'lab_tested' or nutrient_doc is not null)
);

-- public can read published farms and their products; only the owner can write
alter table farms enable row level security;
create policy read_published on farms for select using (status in ('sample','published'));
create policy owner_writes  on farms for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ── optional audit (no health values stored) ───────────────────────────────────────
create table scan_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  product_code text not null, verdict text not null, rules_fired text[] not null,
  engine_version text not null, scanned_at timestamptz not null default now()
);
```

**Deliberately absent:** a server-side table of daily intake or activity. `TodaySnapshot` is read on the device and discarded.

## 4. The scan engine (built and tested)

`src/health/evaluate.ts` is a pure function over `src/health/references.ts`. Real output for the SAMPLE persona (LDL-C 142 mg/dL and HbA1c 5.9 % drawn 2026-08-01, soy allergy, watching sodium + saturated fat + post-workout protein, 1,900 mg sodium and 12 g saturated fat logged, 45 min exercise) scanning two products from the snapshot:

> **Thousand Hills Grass Fed Ground Beef 80/20** — *No match in what is recorded* (allergens). **Saturated fat:** "You entered LDL-C 142 mg/dL (blood draw 2026-08-01). You chose to watch saturated fat. One serving (112 g) has 10.1 g of saturated fat, 50% of the FDA Daily Value (20 g). FDA describes 20% or more per serving as high. With the 12 g you logged today, about 90 g of this product (less than one serving) would reach the 20 g daily reference. Based only on what is logged today; unlogged food is not counted…" **Protein after exercise:** "One serving (112 g) has 21.3 g of protein, which is within the 15-25 g that sports-nutrition position stands describe after exercise."
>
> **Nathan's Beef Franks** — **Sodium:** "One serving (50 g) has 550 mg of sodium, 24% of the FDA Daily Value (2,300 mg)… With the 1,900 mg you logged today, about 35 g of this product (less than one serving) would reach the 2,300 mg daily reference."
>
> **Jack Link's meat stick** — **Allergen match: soybeans** comes first; the protein card and all tips are suppressed.

The eight tests cover: gram→milligram sodium conversion (a 1000× trap in the source data), "unknown intake is not zero", a near-zero data-entry error producing no arithmetic (Kroger ground beef lists 0.00006 g sodium), allergen-first suppression, the default-deny tip gate, and a **language lint** that fails the build if any generated sentence contains a verdict, an imperative, a disease name, or "trend".

```ts
export function evaluateScan(product: ScanProduct, profile: HealthProfile, today: TodaySnapshot, todayIso: string): Card[] {
  const cards: Card[] = []
  const allergen = allergenCard(product, profile)            // match | no match in what is recorded | nothing recorded
  if (allergen) cards.push(allergen)
  const matched = allergen?.kind === 'allergen'               // a match suppresses every positive message

  for (const watch of profile.watching) {                     // chosen by the user - never inferred from a lab value
    const card = referenceCard(product, profile, today, watch, todayIso)
    if (card) cards.push(card)                                // entered value + date -> % Daily Value -> arithmetic vs today's log -> data limits
  }
  // ... carbohydrate note, post-exercise protein card ...
  if (!matched && profile.medicines === 'none' && !profile.has_condition) { /* tips */ }   // default deny
  return cards
}
```

## 5. Reference values (all checked 2026-09-19)

| Use | Value | Source | In the demo |
|---|---|---|---|
| Sodium daily reference | 2,300 mg (opt-in stricter: 1,500 mg) | FDA Daily Value, 21 CFR 101.9(c)(9); Dietary Guidelines 2025–2030; AHA for the stricter figure | ✔ card + arithmetic |
| Saturated fat daily reference | 20 g (opt-in stricter: ~13 g = under 6 % of calories) | FDA Daily Value; AHA | ✔ the binding rule for beef |
| Added sugars | 50 g Daily Value | 21 CFR 101.9(c)(9) | % DV only |
| % DV reading aid | ≤ 5 % low, ≥ 20 % high (per serving) | FDA | ✔ quoted as FDA's words about the product |
| Protein after exercise | 15–25 g | AND / Dietitians of Canada / ACSM position stand (2016) | ✔ when exercise is logged |
| HbA1c, fasting glucose bands | 5.7–6.4 % / ≥ 6.5 %; 100–125 / ≥ 126 mg/dL; fasting = ≥ 8 h; diagnosis needs two abnormal results | ADA Standards of Care 2026, Tables 2.1–2.2 | **reference page only** — never beside the user's value |
| Cholesterol and triglyceride bands | ATP III (2001) legacy bands, still printed by MedlinePlus/NHLBI | NHLBI | **reference page only**, labelled legacy |
| Personal LDL goal | < 100 / < 70 / < 55 mg/dL by risk tier | 2026 ACC/AHA Dyslipidemia Guideline (replaced the 2018 guideline on 13 Mar 2026) | **never shown** — needs a risk score the app cannot compute |
| Glycemic index bands | ≤ 55 / 56–69 / ≥ 70 | University of Sydney GI database | not applicable to beef; GI is never self-declared by a farm |
| Major allergens | milk, eggs, fish, Crustacean shellfish, tree nuts, peanuts, wheat, soybeans, sesame | FDA; FASTER Act | ✔ with an explicit tag/keyword map — Open Food Facts tags are not FDA's list |
| Lab staleness | > 12 months | **design choice, not sourced** — the card says so | ✔ |
| Farm "nutrient density" words | "high / rich in" ≥ 20 % DV per reference amount; "good source" 10–19 %; "more" ≥ 10 % DV above a named food | 21 CFR 101.54, 101.13 | claim words render only when a number **with provenance** meets the threshold |

## 6. Food pairings — what the evidence supports

| Pairing | Evidence | Shown? |
|---|---|---|
| **Cinnamon lowers the blood-sugar rise** | ADA 2026: "not recommended for glycemic benefits"; Cochrane: insufficient; coumarin safety limit with cassia | Hedged only: "limited, mixed evidence", a flavour choice, not a treatment; hidden when the profile lists medicines or a condition |
| Season with herbs and spices instead of salt | ADA Standards of Care 2026, Section 5 | Yes, on the sodium card |
| Vitamin C foods with plant iron | Strong for a single meal (NIH ODS) | Yes — "your body absorbs more iron from the plant foods in this meal" |
| Beef with beans or greens ("meat factor") | Moderate for one meal; not significant over a 5-day diet | Hedged; must never soften the saturated-fat card |
| Fat with carotenoid / vitamin D, K foods | Strong mechanism | Later (warfarin blocks the vitamin K variant) |
| Fibre or protein with or before carbohydrate | Strong for the short-term rise, none for HbA1c | Later, hedged, blocked for insulin users; cannot fire on beef |
| Oat / barley beta-glucan and LDL | FDA-authorised health claim (21 CFR 101.81) | Later, FDA's text verbatim |
| Turmeric + black pepper, vinegar, psyllium, plant sterols, calcium-blocks-iron | Limited, supplement-level, or safety questions | **No** |
| Grapefruit / vitamin K / potassium / licorice with certain medicines | Strong — these are safety notices | Roadmap: notices that outrank tips; today only the default-deny gate is built |

## 7. Platform constraints for "connect Apple Health / Google Health Connect"

- **HealthKit** is a native, on-device framework (entitlement + usage strings; read permission is opaque — the app cannot tell whether read access was denied). A browser or PWA has no access.
- **Health Connect** is an on-device Android store reached through Jetpack (`androidx.health.connect`); `NutritionRecord` has every field Plattr needs, all nullable.
- **Dietary totals exist only if the user logs food in another app** that writes them. Most phones will have steps and no sodium — so manual entry stays the primary path even in a native build.
- **The only first-party path a web backend can call is Google's new cloud Health API** (`health.googleapis.com`, restricted scopes that require Google's security review; sodium arrives in grams). The Fitbit Web API is being turned down this month; Google Fit REST is closed to new sign-ups and ends in 2026; MyFitnessPal offers no API.
- **Native wrapper cost:** `@kingstinct/react-native-healthkit` and `react-native-health-connect` are maintained but need an Expo dev client, Apple signing and a physical iPhone — realistically 2–4 hours before the first sample is read. Not during the event.
- **Labs:** HealthKit Clinical Records (read-only FHIR, extra capability and review) and Health Connect's Medical Records API (experimental, Android 16). The free **SMART Health IT sandbox** is callable from a browser and is the honest way to demo a FHIR lab import with a synthetic patient.
- **"Scan" in the demo** = tapping a product tile or opening a rancher QR link with the phone's own camera. No in-app scanner.

```ts
interface HealthSource {                      // naming and unit traps live in adapters, never in rules
  id: 'healthkit' | 'health_connect' | 'google_health_api' | 'manual' | 'demo'
  isAvailable(): Promise<boolean>
  requestPermissions(): Promise<boolean>      // read-only: dietary nutrients, active energy, exercise time
  getTodaySnapshot(): Promise<TodaySnapshot>  // a missing nutrient key means UNKNOWN
}
```

## 8. Privacy, regulation and the demo guardrails

Not HIPAA (a consumer entering their own values into an app they chose — HHS OCR's own scenario) until a provider or plan contracts with Plattr. But the **FTC Health Breach Notification Rule** (16 CFR 318, amended 2024) names apps that track diet and diagnostic testing and treats your own unauthorised disclosure — including leakage to analytics — as a breach, and **Washington, Nevada and Connecticut** consumer-health-data laws require separate opt-in consent. App stores add their own rules if a native build ships (Apple 5.1.3 / 1.4.1; Google Play's health declaration and its required "not a medical device" phrase).

**Non-negotiables for the demo**

1. Synthetic personas only; a persistent "Demo mode — do not enter real lab results" banner.
2. Health values stay in the browser: no server call, no serverless function, nothing in URLs, and no health value reaches any third-party script. The Vercel deployment only counts page views (path, referrer, device type, country), and that counter is switched off on the profile and health-trends pages.
3. Separate, specific, unticked consent before the first health field; one-tap delete.
4. The allergen card is first, has three states, and never says "safe" or "allergen-free".
5. Unknown is not zero; bad data produces no arithmetic; the health view is offered only for products whose nutrition a person has checked against the pack.
6. No verdicts, no disease names or bands beside the user's value, no imperatives, no "trend" from one value, no LLM in the decision or wording path — enforced by the language-lint test.
7. Tips are default-deny; nothing is ever triggered by a biomarker.
8. "Apple Health", "Health Connect" and "Connected" appear only on the roadmap slide until a native build really reads them — presenting a mocked feed as live is deception under the FTC Act.
9. The disclaimer (in `references.ts`) appears at onboarding, in the footer, and on every card; it sits on top of messages that are already accurate, because a disclaimer does not cure a misleading claim.
10. Farmers may state a nutrient number only with provenance (lab + report date, or "USDA FoodData Central typical value — not measured on this farm's product"); claim words appear only when 21 CFR 101.54 thresholds are met.

## 9. What fits in the hackathon

The rule tables, the pure engine and its tests were built first; the profile form, consent box, delete button and the product-page panel followed (the README lists what shipped). Still not built: lab PDF upload, any live Apple Health / Health Connect / Google Health connection, a native wrapper, a glycemic-index table, the full pairing and interaction engine, and any LLM.

**The honest pitch sentence:** *"What is live is a deterministic, source-cited rule engine running in your browser on a sample profile — today's logged intake, activity and lab values you type in. Apple Health and Health Connect keep data on the phone and offer no web API, so direct sync is roadmap behind the same adapter. Nothing here diagnoses or treats, no AI model decides or writes anything, and the health data never leaves this device."*
