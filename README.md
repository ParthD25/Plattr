# Plattr

**Know what's behind every bite.** Scan a food's QR code or barcode and see its **product passport** — farm origin, soil, water, feed and grazing, space and welfare, animal health history, certifications, safety testing, a parasite and hazard outlook for the sourcing region, and nutrition — plus a transparent 0-100 **Plattr score** graded A+ to F. Shoppers sign in to get allergen and health-condition warnings, a grocery history with an overall score, and a map of where their food came from. Producers sign in to publish their farm data and create passports with a QR code for the pack. Every fact carries a text label saying how well it is backed up, so a producer's own statement never passes as a verified record.

Built for parents, older shoppers and people managing a health condition. Plattr is a student prototype: **the product passports in the demo are fictional SAMPLE data** (see [What is real vs sample](#what-is-real-vs-sample)).

## What shoppers can do

- **Search or scan any real product** (`/explore`): type a food, a brand or a barcode. Results come from Plattr's own passports and, live, from Open Food Facts; opening a real product imports its record and shows **where it comes from** straight away (brand owner, manufacturing place, origin of ingredients, and the USDA plant when the record carries an establishment number). On a meat product you can type the EST number from the pack and the real USDA plant record appears. The plant record is a verified public record; that this pack came from that plant rests on the number you typed. Live records are crowd-sourced: they are labelled **Community record**, "not checked by Plattr", and anything missing is shown as "Not provided".
- **Scan a label**: camera scanning works in Chrome through `BarcodeDetector` and everywhere else (Safari, Firefox, iPhone) through the ZXing decoder; you can also upload a photo of a barcode.
- **Browse the sample food library** (`/explore`): type the numbers under a barcode or paste the link from a Plattr QR code. Search and filter the library by food, farm or category.
- **Read the product passport** (`/food/:id`): each section lists its facts with an evidence chip — **Verified record**, **Document on file**, **Producer-declared** or **Not provided** — never colour alone. The passport also shows a hazard outlook for the sourcing region and the score broken down part by part. At the bottom of every product, two drop-downs open on demand: **Nutrition facts** (laid out like a Nutrition Facts label, with % Daily Value from FDA values - blank, never 0%, where FDA sets none) and **Your health data and this product** (the serving against what you logged today). Allergen and condition warnings are never tucked away: they stay at the top of the page. Sample passports always carry a SAMPLE marker.
- **Demo accounts have their own page** (`/demo-account`): one click for a demo shopper or a demo producer, what is preloaded, what to try next, and a reset button.
- **Create an account and a profile** (`/login`, `/profile`): record allergens (the FDA major allergens **plus your own, typed in**), health conditions (**plus a free-text box for ones not listed** - shown back as reminders, since Plattr has no rules for them), dietary preferences (halal, kosher, vegetarian, **vegan**, gluten-free), optional lab values and today's intake. One tap deletes the health data.
- **Get personal notes on a passport**: for example "this product lists eggs, which is in your allergen list", or a serving's share of the FDA Daily Value for sodium next to what you logged today. Informational only — not medical advice.
- **Take a grocery trip** (`/shop`): pick foods off a shelf of sample passports; the cart shows a running overall score and grade, food groups covered, the price total, and your personal warnings per item. "Finish trip" records the purchase (history, overall score and food map update), and an optional button logs one serving of each item into today's intake so the personal notes on product pages reflect it.
- **Keep a cart and a grocery history** (`/history`): add scanned items to a cart, mark them purchased as one shopping trip, see past trips, an overall Plattr score per timeframe, and how the groceries complement each other (food groups covered, nutrients against FDA Daily Values).
- **See a food map** (`/map`): the farms behind purchased items plotted on a Leaflet map. The map **auto-zooms to your location** and measures distances from you (nearest farm first); if the browser does not share a location it falls back to a labelled Pittsburgh demo location. Your location stays in the browser tab - it is never stored or sent.
- **Watch your health trends** (`/trends`): every profile save and logged grocery trip is kept as a dated intake log, charted over 7, 30 or 90 days against the FDA Daily Values (sodium, saturated fat, added sugars, calories, protein, exercise), with lab values over time and the Plattr score of each grocery trip. Days you did not log show as gaps, never as zero. Informational only - not medical advice.
- **Look up a USDA plant number** (`/plant-lookup`, `/est/:number`): the real federal record behind the establishment number printed on meat packages.

## What producers can do

- **Sign in as a producer** and keep a **farm profile** (`/producer`): location, acreage, pasture and coop size, herd size, markets, specialties, water source and last test result, fertilizers and pesticides, livestock health records, and a parasite watch list.
- **Fish farms and fisheries are first-class**: the farm profile asks whether the operation is a land farm, a fish farm (aquaculture) or a wild-catch fishery, with species, system and stocking density for fish farms. Every fish passport must say **wild-caught or farm-raised**; shoppers see it as a text chip and can filter by it.
- **Create product passports** (`/producer/passports`): fill in the passport sections and get a **QR code** that resolves to the product's `/food/:id` page. Passports made here are stored in the same browser and appear in the food library alongside the samples.
- What a producer types is shown as **Producer-declared**, or as **Document on file** when the producer names and dates a report or certificate they hold. Nothing is uploaded or checked in this prototype, Plattr does not inspect farms, and the score reflects that: declared facts earn half the points of a verified record.
- The earlier rancher profile pages (`/ranchers`, `/r/:slug`) are still available. Their profiles are fictional SAMPLE data; the one check Plattr makes is that the processor a rancher names exists in the USDA FSIS directory and is listed as slaughtering cattle.

## Finding your way around

The strawberry logo and name sit at the top of every page. Below them: a navigation bar that follows who is signed in, with the current page highlighted - signed out: Home, Find a food, How it works, Library, Field notes, Our impact, For producers, About; shopper: Home, Find a food, Grocery trip, My groceries, Map, Health trends, Library, Profile; producer: Home, Find a food, My farm, Product passports, Library, Field notes - a breadcrumb trail on every inner page, and a footer sitemap listing every page.

## Library

- **Parasites and hazards** (`/library/hazards`): what each one is, the foods and regions where it matters, who is most at risk and how it is controlled (farm and kitchen), each citing a CDC / FDA / USDA page. Hazard names on passports link here.
- **Nutrients and food groups** (`/library/nutrients`): what each nutrient does, its FDA Daily Value, whether it is one to get enough of or stay under, which food groups supply it, and how each MyPlate food group serves you. Nutrition rows on passports link here.

General information from public health agencies - not medical advice.

## More pages

- **Landing** (`/`) — follows an AI-generated mock-up the team used as its design reference ([`docs/design-reference.png`](docs/design-reference.png); the brand name and certification marks in it are placeholders, not affiliations): organic blobs, leaves, hand-written notes, and a live sample passport card.
- **How it works** (`/how-it-works`) — shopper and producer steps, and the score rubric rendered from the real scoring function.
- **Our impact** (`/impact`) — the problem and what Plattr changes, with numbers computed from the data in this repo (each says what it is).
- **Field notes** (`/learn`) — short explainers written only from the verified regulation quotes in `public/data/claims.json`.
- **For producers** (`/for-producers`) and **About** (`/about`).
- **Demo walkthrough** (`/demo`) — a click-through script for judges, the sample barcodes, and a "Reset demo data" button.

## How the Plattr score works

The score measures **how much of this food's story is documented and backed up — it is not a medical or food-safety guarantee.** A high score means the producer has shown their work. It does not mean a food is safe, healthy or right for you, and a low score does not mean a food is unsafe.

The code is one small pure function, [`src/passport/score.ts`](src/passport/score.ts), and every part is shown on screen with its points.

**1. Each fact is weighted by its evidence level**

| Evidence chip | Meaning | Weight |
|---|---|---|
| Verified record | Checked against a public record or a certifier's listing | 1.0 |
| Document on file | The producer names and dates a report or certificate they hold; nothing is uploaded or checked in this prototype | 0.9 |
| Producer-declared | The producer's own statement | 0.5 |
| Community record | A crowd-sourced Open Food Facts record, not checked by Plattr | 0.5 |
| Not provided | Nothing was given | 0 |

**2. Each section earns** (average weight of its facts) × (the section's maximum points), rounded. An empty section earns 0.

| Section | Animal products (beef, poultry, eggs, dairy, fish) | Plant products (produce, grain) |
|---|---|---|
| Farm origin | 20 | 20 |
| Feed and grazing | 15 | — |
| Space and welfare | 15 | — |
| Animal health records | 15 | — |
| Soil, fertilizers and pesticides | — | 25 |
| Water quality | 10 | 20 |
| Certifications | 10 | 15 |
| Safety testing and recalls | 15 | 20 |
| **Total** | **100** | **100** |

**3. The total is graded on the usual school scale:** A+ (Outstanding) 97-100 · A (Excellent) 90-96 · B (Good) 80-89 · C (Fair) 70-79 · D (Limited) 60-69 · F (Minimal) below 60. An F means little is documented, not that a food is unsafe. The bands live in one place, `GRADE_BANDS` in `score.ts`. The grade is always shown as a letter and a word, not just a colour.

The overall score on the history page is the plain average of the purchased items' totals. Hazard notes, nutrition and price do not affect the score.

## What is real vs sample

**Real public data**

- The USDA FSIS plant directory, recalls and public-health alerts, FY2025 raw-beef sampling results and humane-handling enforcement postings behind `/plant-lookup` and `/est/:number`. They are build-time snapshots (2026-09-19) in [`public/data`](public/data), each shown with FSIS's own caveats. A recall is linked to a plant by a text match on the establishment number, and the matched sentence is shown. "Nothing found" is never presented as "clean" or "safe".
- The regulation and guidance quotes behind label claims (`claims.json`), each checked verbatim against a snapshot of its source by a checking script the team ran when the snapshots were built.
- FDA Daily Values (21 CFR 101.9) and the other reference values used by the health layer, cited in [`src/health/references.ts`](src/health/references.ts).

**Sample (fictional) data**

- **The nine product passports and the farms behind them are fictional.** They exist so every page has something to show, and each one is marked SAMPLE on screen. The rancher profiles in `ranchers.json` and the two demo accounts are fictional too.
- **Hazard and parasite notes are general background** about a type of food and a region. They are not measurements, forecasts or findings about any farm or product.
- Passports created in the producer portal are whatever the producer typed — shown as Producer-declared or Document on file (self-reported either way), not checked by Plattr.

**Demo-grade storage**

- Accounts, health profiles, carts, farm profiles and producer-made passports live **only in this browser's `localStorage`**. There is no server and no real authentication, and passwords are stored unencrypted. Do not reuse a real password or enter real medical data. A hosted auth service is the first step before real users.

## Health layer

- **Deterministic and on-device.** Warnings and notes come from pure functions ([`src/consumer/warnings.ts`](src/consumer/warnings.ts), [`src/health/evaluate.ts`](src/health/evaluate.ts)) over what the shopper entered and what the passport records. No language model decides or words anything, and the health profile never leaves the browser.
- **Informational, not medical advice.** A warning states a match ("this product lists eggs, which is in your allergen list") or arithmetic against a cited public reference value. It never diagnoses, and a nutrient the passport does not record is treated as unknown, never as zero.
- **No direct Apple Health or Health Connect sync.** Both are on-device stores with no web API, so a web app cannot read them. Today's intake and activity are entered by hand. Direct sync through a native wrapper is roadmap, not a current feature.
- The design reasoning is in [`docs/HEALTH-ARCHITECTURE.md`](docs/HEALTH-ARCHITECTURE.md).

## Run it

```sh
npm install
npm run dev      # Vite dev server
npm test         # Vitest
npm run build    # type-check, then production build into dist/
npm run start    # serve the production build (vite preview) on $PORT or 4173
```

Needs a current Node.js LTS. The demo-account page (`/demo-account`, linked from `/login`) has one-click **demo accounts**: a demo shopper (sample profile with an eggs allergen, three weeks of logged intake, six synthetic lab values and three past grocery trips, so warnings, history, the food map and Health trends all have data - everything marked SAMPLE) and a demo producer (a fictional farm ready for creating passports).

## Deploy on Replit

Import this repository into Replit. The included [`.replit`](.replit) file does the rest:

- **Run** starts the dev server on port 5000 (`npm install && npm run dev -- --port 5000`). Vite is configured to accept Replit's generated hostnames.
- **Deploy** (Autoscale) builds with `npm install && npm run build` and serves with `npm run start`. Serving through `vite preview` keeps deep links such as `/food/strawberry-riverbend` working, which the QR codes rely on. For a static host instead, publish `dist/` — the build also writes `dist/404.html` as a single-page-app fallback.

No environment variables or secrets are needed: the prototype has no server and calls no paid API.

## Tested flows

Checked by hand in the browser on 2026-09-19 (no console errors), on top of the 109 automated tests:

typed scan (a 12-digit UPC resolves to the stored 13-digit code) · new shopper sign-up · profile save · allergen, gluten and immune-risk warnings · add to cart, "I bought these", history stats and overall grade · food map · demo producer, farm profile, passport builder with live score and QR · producer passport appears in the food library · real USDA plant pages and rancher profile · Health trends with the seeded demo data · nutrition and health-data drop-downs with warnings kept on top · map auto-zoom (location shared and not shared) · role-aware tabs · landing page at 1440 px and 375 px with no horizontal scroll.

## Tech stack

- **Vite + React + TypeScript**, with **react-router** for routing; plain CSS
- **Leaflet** for the food map, with OpenStreetMap tiles
- **qrcode** for passport QR codes
- **@zxing/browser** for camera and photo barcode decoding where the browser has no `BarcodeDetector`
- **Vitest** for unit tests of the pure logic (score, warnings, scan resolution, plant lookups, data checks)
- **Vercel** for static hosting, with **Vercel Web Analytics** (cookie-free page-view counts: page path, referrer, device type and country; switched off on the profile and health-trends pages; no profile or health value and no GPS location is ever sent)
- Everything runs in the browser over static JSON in `public/data`; persistence is `localStorage`. No backend and no LLM.

## Data sources and attribution

- USDA FSIS — Meat, Poultry and Egg Product Inspection Directory, establishment data, Recall API, raw-beef laboratory sampling data, humane-handling enforcement postings, labeling guidance (public domain)
- FDA — Substances Added to Food, GRAS Notice Inventory, Color Additive Status List (public domain)
- eCFR and Federal Register APIs (public domain)
- European Commission, DG SANTE — food additives database; EUR-Lex legal texts
- Open Food Facts — product data © Open Food Facts contributors, [ODbL](https://opendatacommons.org/licenses/odbl/1-0/)
- Map tiles and map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors

Plattr is a student project. It is not legal, medical, or dietary advice.

## Research and raw data

This repository is the app on its own. The research notes, the unmodified public source files that `public/data` was built from, and the scripts that built and quote-checked those snapshots are kept in the team's private working repository. The public sources behind the app and that research are named under [Data sources and attribution](#data-sources-and-attribution), and the design reasoning for the personal health layer is in [`docs/HEALTH-ARCHITECTURE.md`](docs/HEALTH-ARCHITECTURE.md).

## Repository layout

| Path | What is in it |
|---|---|
| `src/pages` | One component per route (landing, food library, passport, sign-in, profile, history, map, producer pages, plant lookup) |
| `src/passport` | Passport types, the score, the passport view, the hook that loads sample and producer-made passports |
| `src/consumer` | Personal warnings, profile form, grocery trip, grocery-history, food-map and health-trends helpers |
| `src/producer` | Farm profile form helpers |
| `src/hazards` | Parasite and hazard outlook panel |
| `src/health` | On-device health engine and its cited reference values |
| `src/est` | USDA establishment-number lookup: normalising the number, plant records |
| `src/rancher` | Rancher profile view and the processor cross-check |
| `src/labels` | Label-claim detection and cards |
| `src/off` | Live Open Food Facts search and import into a passport |
| `src/library` | Parasite / hazard and nutrient library content |
| `src/scan`, `src/auth`, `src/components` | Camera scanner and code resolution, demo accounts, shared UI |
| `public/data` | Static JSON: sample passports and the FSIS / claims snapshots |
| `docs` | Health-layer architecture and the design reference |

## Database design (PostgreSQL)

The prototype runs entirely in the browser. The team has also designed a production data model - a PostgreSQL traceability schema (farms, batches, batch-to-farm sources with verification status, provenance claims and evidence, FDA enforcement alerts, grading metrics and observations). It is not part of this repository.

- Design: [Figma site](https://flight-pouch-78474354.figma.site/)

## License

The code is released under the [MIT License](LICENSE). The data keeps its own terms: USDA FSIS, FDA, eCFR and Federal Register material is US-government public domain; the Open Food Facts product data in `public/data/products.json`, the additive-name table in `public/data/synonyms.json` (from the Open Food Facts taxonomy) and anything looked up live are © Open Food Facts contributors under the [ODbL](https://opendatacommons.org/licenses/odbl/1-0/); map tiles are © OpenStreetMap contributors. The sample passports, farms, ranchers and demo accounts are fictional demo data.

## Team

- Parth Dave — [@ParthD25](https://github.com/ParthD25)
- [@ali-findra](https://github.com/ali-findra)
- Gabriela Hamdieh — [@ghamdieh-create](https://github.com/ghamdieh-create)
- Connor Young — [@conyoung18](https://github.com/conyoung18)
- [@Tanvirfs29](https://github.com/Tanvirfs29)
