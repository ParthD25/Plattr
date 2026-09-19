// Glossary of parasites, bacteria and other food hazards. General, well-established background from
// CDC / FDA / USDA only - no statistics, no symptom lists, nothing about any specific product or farm.
import type { Category } from '../passport/types'

export type HazardKind = 'parasite' | 'bacteria' | 'virus' | 'toxin' | 'heavy_metal'

export interface HazardEntry {
  slug: string
  name: string
  kind: HazardKind
  also_called: string[]
  what_it_is: string
  foods: { name: string; category?: Category }[]   // category = a Plattr food category we can link to
  where_it_matters: string
  who_is_most_at_risk: string
  how_it_is_controlled: { farm: string; kitchen: string }
  source: string
  url: string
}

export const NOT_MEDICAL_ADVICE = 'General information, not medical advice - if you think you are ill, contact a clinician.'

export const SAFE_TEMPS_URL = 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures'
/** USDA safe minimum internal temperatures (FoodSafety.gov chart). */
export const SAFE_TEMPS = [
  { temp: '160 F', what: 'Ground meats (beef, pork, lamb)' },
  { temp: '165 F', what: 'All poultry, whole or ground' },
  { temp: '145 F', what: 'Whole cuts of beef, pork and lamb, then a 3-minute rest' },
  { temp: '145 F', what: 'Fish' },
]

export const HAZARDS: HazardEntry[] = [
  {
    slug: 'e-coli-stec', name: 'E. coli O157:H7 and other STEC', kind: 'bacteria',
    also_called: ['Shiga toxin-producing E. coli', 'STEC', 'E. coli O157:H7'],
    what_it_is: 'Most E. coli are harmless gut bacteria, but Shiga toxin-producing strains (STEC) such as O157:H7 can make people ill. They live in the intestines of cattle and other animals and reach food through manure, contaminated water or contact during slaughter. Infection typically causes stomach cramps and diarrhea, and some infections become serious.',
    foods: [{ name: 'Ground beef', category: 'beef' }, { name: 'Leafy greens and other raw produce', category: 'produce' }, { name: 'Raw (unpasteurized) milk', category: 'dairy' }, { name: 'Unpasteurized juice' }, { name: 'Raw flour and dough', category: 'grain' }],
    where_it_matters: 'Produce fields that sit near cattle operations or are irrigated with surface water that can carry runoff, and ground beef, because grinding mixes any bacteria on the surface through the meat.',
    who_is_most_at_risk: 'Children under 5, adults 65 and older, and people with weakened immune systems.',
    how_it_is_controlled: {
      farm: 'Testing irrigation water, keeping distance between livestock and produce fields, keeping raw manure off crops, clean slaughter practices and testing of raw ground beef.',
      kitchen: 'Cook ground beef to 160 F (whole cuts to 145 F with a 3-minute rest). Rinse produce under running water, choose pasteurized milk and juice, do not taste raw dough, and wash hands and boards after handling raw meat.',
    },
    source: 'CDC, E. coli infection', url: 'https://www.cdc.gov/ecoli/',
  },
  {
    slug: 'salmonella', name: 'Salmonella', kind: 'bacteria',
    also_called: ['Salmonella Enteritidis', 'Salmonellosis'],
    what_it_is: 'Bacteria that live in the intestines of animals, including poultry. They can be on raw poultry, meat and produce, and can be inside eggs that look completely normal. Infection typically causes diarrhea, fever and stomach cramps.',
    foods: [{ name: 'Eggs', category: 'eggs' }, { name: 'Chicken and turkey', category: 'poultry' }, { name: 'Ground meat', category: 'beef' }, { name: 'Raw sprouts and other produce', category: 'produce' }],
    where_it_matters: 'Anywhere poultry and eggs are produced, and wherever raw animal foods can touch ready-to-eat foods. Warm temperatures let it multiply, so unrefrigerated eggs and food left out matter most.',
    who_is_most_at_risk: 'Children under 5, adults 65 and older, and people with weakened immune systems.',
    how_it_is_controlled: {
      farm: 'Flock testing and vaccination, rodent and pest control in hen houses, and prompt refrigeration of eggs after lay.',
      kitchen: 'Cook poultry to 165 F and ground meats to 160 F; cook eggs until yolks and whites are firm. Keep eggs refrigerated at 40 F or below, do not wash raw poultry, and keep raw meat away from ready-to-eat food.',
    },
    source: 'CDC, Salmonella infection', url: 'https://www.cdc.gov/salmonella/',
  },
  {
    slug: 'listeria', name: 'Listeria monocytogenes', kind: 'bacteria',
    also_called: ['Listeria', 'Listeriosis'],
    what_it_is: 'Bacteria found in soil, water and damp food-processing environments. Unlike most foodborne bacteria, Listeria can keep growing at refrigerator temperatures. Listeriosis is uncommon but can be severe, especially during pregnancy.',
    foods: [{ name: 'Raw (unpasteurized) milk and soft cheeses made from it', category: 'dairy' }, { name: 'Deli meats and hot dogs' }, { name: 'Refrigerated smoked fish', category: 'fish' }, { name: 'Melons, cut fruit and raw sprouts', category: 'produce' }],
    where_it_matters: 'Packing houses and processing plants, where it can settle into drains and equipment, and refrigerated ready-to-eat foods that are stored for a long time and eaten without cooking.',
    who_is_most_at_risk: 'People who are pregnant and their newborns, adults 65 and older, and people with weakened immune systems.',
    how_it_is_controlled: {
      farm: 'Pasteurization of milk, strict sanitation, and routine environmental testing of packing and processing facilities.',
      kitchen: 'Choose pasteurized milk and cheese. Keep the refrigerator at 40 F or below and eat ready-to-eat foods promptly. If you are at higher risk, heat deli meats and hot dogs to 165 F (steaming hot). Scrub melon rinds before cutting.',
    },
    source: 'CDC, Listeria infection', url: 'https://www.cdc.gov/listeria/',
  },
  {
    slug: 'campylobacter', name: 'Campylobacter', kind: 'bacteria',
    also_called: ['Campylobacteriosis'],
    what_it_is: 'Bacteria commonly carried by poultry and other animals without making them sick. People are usually infected by raw or undercooked poultry, or by something that touched it. Infection typically causes diarrhea, fever and stomach cramps.',
    foods: [{ name: 'Raw or undercooked chicken and turkey', category: 'poultry' }, { name: 'Raw (unpasteurized) milk', category: 'dairy' }, { name: 'Untreated water' }],
    where_it_matters: 'Any kitchen where raw poultry is handled: juices on cutting boards, knives and hands carry it to salads and other ready-to-eat food.',
    who_is_most_at_risk: 'Young children, adults 65 and older, and people with weakened immune systems.',
    how_it_is_controlled: {
      farm: 'Biosecurity in poultry houses and hygienic processing that limits contamination of the meat.',
      kitchen: 'Cook poultry to 165 F. Do not wash raw chicken, use a separate cutting board for raw meat, wash hands after handling it, and choose pasteurized milk.',
    },
    source: 'CDC, Campylobacter infection', url: 'https://www.cdc.gov/campylobacter/',
  },
  {
    slug: 'cyclospora', name: 'Cyclospora', kind: 'parasite',
    also_called: ['Cyclospora cayetanensis', 'Cyclosporiasis'],
    what_it_is: 'A microscopic single-celled parasite that spreads when food or water is contaminated with human faeces. It needs time in the environment before it can infect, so it is unlikely to pass directly from person to person. Infection causes an intestinal illness, usually with watery diarrhea.',
    foods: [{ name: 'Fresh berries, herbs, lettuce and other produce eaten raw', category: 'produce' }],
    where_it_matters: 'Most common in tropical and subtropical regions. In the United States, outbreaks have been linked to various kinds of fresh produce, and reported cases tend to rise in spring and summer.',
    who_is_most_at_risk: 'Anyone can be infected; people living or travelling in regions where it is common are at increased risk.',
    how_it_is_controlled: {
      farm: 'Clean agricultural water, and toilets and handwashing stations for field workers so human waste never reaches crops or water.',
      kitchen: 'Rinse produce under running water, knowing that rinsing may not remove it completely and routine chemical sanitizers are unlikely to kill it. Cooking does.',
    },
    source: 'CDC, Cyclosporiasis', url: 'https://www.cdc.gov/cyclosporiasis/',
  },
  {
    slug: 'toxoplasma', name: 'Toxoplasma gondii', kind: 'parasite',
    also_called: ['Toxoplasmosis', 'Toxo'],
    what_it_is: 'A single-celled parasite that completes its life cycle in cats. People can be infected by eating undercooked meat or shellfish that carries it, or by accidentally swallowing it from soil, unwashed produce or cat litter. Most healthy people never notice an infection, but it can be serious during pregnancy and for people with weakened immune systems.',
    foods: [{ name: 'Undercooked pork, lamb and venison' }, { name: 'Raw oysters, clams and mussels', category: 'fish' }, { name: 'Unwashed fruit and vegetables', category: 'produce' }, { name: 'Unpasteurized goat milk', category: 'dairy' }],
    where_it_matters: 'Found worldwide. On farms it matters wherever cats can reach animal feed, barns or vegetable plots.',
    who_is_most_at_risk: 'People who are pregnant (infection can pass to the baby) and people with weakened immune systems.',
    how_it_is_controlled: {
      farm: 'Keeping cats and rodents out of feed stores and animal housing.',
      kitchen: 'Cook whole cuts of meat to 145 F with a 3-minute rest, ground meats to 160 F and poultry to 165 F. Freezing meat for several days at sub-zero (0 F) temperatures greatly reduces the chance of infection. Wash produce, and wash hands after gardening or handling raw meat.',
    },
    source: 'CDC, Toxoplasmosis', url: 'https://www.cdc.gov/toxoplasmosis/',
  },
  {
    slug: 'trichinella', name: 'Trichinella', kind: 'parasite',
    also_called: ['Trichinellosis', 'Trichinosis'],
    what_it_is: 'A roundworm whose larvae live in the muscle of meat-eating animals. People are infected by eating raw or undercooked meat from an infected animal; early infection typically causes stomach upset.',
    foods: [{ name: 'Wild game such as bear and wild boar' }, { name: 'Undercooked pork' }],
    where_it_matters: 'In the United States it is now mostly linked to wild game; it has become much less common in commercial pork because of changes in how pigs are raised and fed.',
    who_is_most_at_risk: 'People who eat raw or undercooked wild game or pork, including home-made sausage and jerky.',
    how_it_is_controlled: {
      farm: 'Not feeding pigs raw meat scraps, controlling rodents, and raising pigs in managed housing.',
      kitchen: 'Cook whole cuts of pork to 145 F with a 3-minute rest, and ground meats and wild game to 160 F. Curing, drying, smoking or microwaving does not reliably kill it, and freezing may not kill the kinds found in wild game.',
    },
    source: 'CDC, Trichinellosis', url: 'https://www.cdc.gov/trichinellosis/',
  },
  {
    slug: 'beef-tapeworm', name: 'Beef tapeworm (Taenia saginata)', kind: 'parasite',
    also_called: ['Taeniasis', 'Taenia saginata'],
    what_it_is: 'A tapeworm whose larval cysts form in the muscle of cattle that graze on pasture or feed contaminated with human faeces. People are infected by eating raw or undercooked beef that contains cysts. Infections are often mild or go unnoticed.',
    foods: [{ name: 'Raw or undercooked beef', category: 'beef' }],
    where_it_matters: 'Most common where sanitation is poor and beef is eaten raw or undercooked. It is uncommon in the United States.',
    who_is_most_at_risk: 'People who eat raw or undercooked beef, especially in regions where the tapeworm is common.',
    how_it_is_controlled: {
      farm: 'Toilets and sanitation for farm workers, keeping human sewage off pasture and feed, and inspection of carcasses for cysts at slaughter.',
      kitchen: 'Cook whole cuts of beef to 145 F with a 3-minute rest and ground beef to 160 F.',
    },
    source: 'CDC, Taeniasis', url: 'https://www.cdc.gov/taeniasis/',
  },
  {
    slug: 'liver-fluke', name: 'Liver fluke (Fasciola hepatica)', kind: 'parasite',
    also_called: ['Fasciola hepatica', 'Common liver fluke', 'Fascioliasis'],
    what_it_is: 'A flat parasitic worm that infects the livers of cattle and sheep. It is mainly an animal-health issue: it lowers the health and condition of the herd. People do not get it from beef muscle meat; human infection comes from eating raw watercress or other freshwater plants that carry the larvae, and it affects the liver.',
    foods: [{ name: 'Raw watercress and other freshwater plants from grazing areas', category: 'produce' }, { name: 'Beef and lamb liver', category: 'beef' }],
    where_it_matters: 'Wet, low-lying or poorly drained pasture, because the fluke needs a freshwater snail to complete its life cycle. It is found in many parts of the world where cattle and sheep are raised.',
    who_is_most_at_risk: 'For people: those who eat raw freshwater plants gathered near grazing land. For animals: cattle and sheep on wet pasture.',
    how_it_is_controlled: {
      farm: 'Draining or fencing off wet ground, veterinary-guided parasite treatment with withdrawal periods observed, and inspection at slaughter, where affected livers are condemned and kept out of the food supply.',
      kitchen: 'No special step is needed for beef muscle meat beyond normal cooking (whole cuts 145 F with a 3-minute rest, ground beef 160 F). Do not eat raw wild watercress gathered near grazing animals.',
    },
    source: 'CDC, Fasciola (liver flukes)', url: 'https://www.cdc.gov/liver-flukes/fasciola/index.html',
  },
  {
    slug: 'anisakis', name: 'Anisakis', kind: 'parasite',
    also_called: ['Herring worm', 'Cod worm', 'Anisakiasis'],
    what_it_is: 'A roundworm whose larvae live in marine fish and squid. People are infected by eating raw or undercooked infected fish or squid; the larva can attach to the stomach or intestine wall and cause pain and nausea.',
    foods: [{ name: 'Raw or undercooked ocean fish and squid', category: 'fish' }, { name: 'Sushi, sashimi, ceviche and pickled fish', category: 'fish' }],
    where_it_matters: 'Wild-caught ocean fish, and wherever fish is eaten raw or lightly cured.',
    who_is_most_at_risk: 'People who eat raw or undercooked marine fish or squid.',
    how_it_is_controlled: {
      farm: 'Processors inspect and trim fillets, and fish intended to be eaten raw is frozen first. FDA freezing guidance: -4 F or below for 7 days (or -31 F until solid, then held at -31 F for 15 hours or at -4 F for 24 hours).',
      kitchen: 'Cook fish to 145 F. If you prepare fish to eat raw at home, use fish that has been frozen to the FDA guidance above; a home freezer may not get cold enough.',
    },
    source: 'CDC, Anisakiasis', url: 'https://www.cdc.gov/anisakiasis/',
  },
  {
    slug: 'fish-gill-parasites', name: 'Gill and skin parasites of farmed fish (Ich)', kind: 'parasite',
    also_called: ['Ich', 'Ichthyophthirius multifiliis', 'White spot disease', 'Gill flukes'],
    what_it_is: 'Tiny parasites that live on the skin and gills of freshwater fish. They are a fish-health and welfare problem on fish farms: they affect fish, not people, and are not a food-safety hazard for shoppers.',
    foods: [{ name: 'Farm-raised freshwater fish such as trout', category: 'fish' }],
    where_it_matters: 'Ponds, raceways and tanks where fish are kept close together, especially when water quality or temperature stresses the fish.',
    who_is_most_at_risk: 'The fish. These parasites do not infect people.',
    how_it_is_controlled: {
      farm: 'Good water quality and flow, sensible stocking density, quarantine of new fish, and veterinary-guided treatment with withdrawal periods observed before harvest.',
      kitchen: 'Nothing specific to these parasites. Cook fish to 145 F as usual.',
    },
    source: 'USDA APHIS, Aquaculture health', url: 'https://www.aphis.usda.gov/livestock-poultry-disease/aquaculture',
  },
  {
    slug: 'mercury', name: 'Mercury in fish', kind: 'heavy_metal',
    also_called: ['Methylmercury'],
    what_it_is: 'Mercury reaches water naturally and from pollution, where it becomes methylmercury and builds up in fish. Large, long-lived predatory fish carry the most. Too much over time can harm the developing brain and nervous system.',
    foods: [{ name: 'Large predatory fish such as shark and swordfish', category: 'fish' }, { name: 'Lower-mercury Best Choices such as salmon and trout', category: 'fish' }],
    where_it_matters: 'It depends on the species, size and waters the fish came from, not on how it was handled. The FDA/EPA advice sorts fish into Best Choices, Good Choices and Choices to Avoid: salmon and trout are Best Choices, while shark, swordfish, king mackerel, marlin, orange roughy, bigeye tuna and Gulf of Mexico tilefish are Choices to Avoid. For fish you catch yourself, check local fish advisories.',
    who_is_most_at_risk: 'People who are or might become pregnant, people who are breastfeeding, and young children.',
    how_it_is_controlled: {
      farm: 'It cannot be washed, trimmed or processed out. Producers control it through the species and size they harvest and can publish test results.',
      kitchen: 'Cooking does not remove mercury. Follow the FDA/EPA advice: eat a variety of fish from the Best Choices list, which includes salmon and trout.',
    },
    source: 'FDA/EPA, Advice about Eating Fish', url: 'https://www.fda.gov/food/consumers/advice-about-eating-fish',
  },
  {
    slug: 'lead-heavy-metals', name: 'Lead and other heavy metals', kind: 'heavy_metal',
    also_called: ['Lead', 'Arsenic', 'Cadmium'],
    what_it_is: 'Lead, arsenic and cadmium occur in soil, water and air, both naturally and from past pollution. Crops can take them up as they grow, so they cannot be completely removed from the food supply. Exposure over time matters most for the developing brain in babies and young children.',
    foods: [{ name: 'Root and leafy vegetables', category: 'produce' }, { name: 'Rice and other grains', category: 'grain' }, { name: 'Fruit juices and some spices' }],
    where_it_matters: 'Fields with a history of contamination, such as land near old industry, busy roads or past use of lead-based products, and crops irrigated with contaminated water.',
    who_is_most_at_risk: 'Babies and young children, and people who are pregnant.',
    how_it_is_controlled: {
      farm: 'Testing soil and irrigation water before planting, choosing fields away from known contamination, and testing finished products.',
      kitchen: 'Wash produce to remove soil and dust, and eat a varied diet so that no single food dominates. Cooking does not remove metals.',
    },
    source: 'FDA, Lead in Food and Foodwares', url: 'https://www.fda.gov/food/environmental-contaminants-food/lead-food-and-foodwares',
  },
  {
    slug: 'vomitoxin-don', name: 'Vomitoxin (DON) in grain', kind: 'toxin',
    also_called: ['Deoxynivalenol', 'DON', 'Fusarium mould toxin'],
    what_it_is: 'A natural toxin made by Fusarium mould, which infects wheat, barley and corn in the field. Eating heavily contaminated grain can cause nausea and vomiting, which is where the nickname comes from.',
    foods: [{ name: 'Wheat flour, bran and germ', category: 'grain' }, { name: 'Bread and other wheat, barley and corn products', category: 'grain' }],
    where_it_matters: 'Grain-growing regions in years when the weather is wet and humid while the crop is flowering, which favours the mould.',
    who_is_most_at_risk: 'FDA sets one advisory level to protect all consumers: 1 ppm of DON in finished wheat products such as flour, bran and germ.',
    how_it_is_controlled: {
      farm: 'Crop rotation and resistant varieties, testing grain at harvest and at the mill, and cleaning or diverting lots so finished wheat products stay at or below the FDA advisory level of 1 ppm.',
      kitchen: 'Baking and cooking do not reliably destroy it, so control happens before flour reaches you. Discard flour or grain that looks or smells mouldy.',
    },
    source: 'FDA, Advisory Levels for Deoxynivalenol (DON) in Finished Wheat Products', url: 'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/guidance-industry-and-fda-advisory-levels-deoxynivalenol-don-finished-wheat-products-human',
  },
]

// ponytail: keyword match, first rule wins. Order matters (gill flukes before liver fluke). Add a rule when a new entry lands.
const RULES: [RegExp, string][] = [
  [/gill|\bich\b|ichthyo|white spot/, 'fish-gill-parasites'],
  [/e\.?\s*coli|stec|shiga|o157/, 'e-coli-stec'],
  [/salmonell/, 'salmonella'],
  [/listeri/, 'listeria'],
  [/campylo/, 'campylobacter'],
  [/cyclospor/, 'cyclospora'],
  [/toxoplasm/, 'toxoplasma'],
  [/trichin/, 'trichinella'],
  [/tapeworm|taenia/, 'beef-tapeworm'],
  [/fluke|fasciol/, 'liver-fluke'],
  [/anisak|herring worm|cod worm/, 'anisakis'],
  [/mercury/, 'mercury'],
  [/\blead\b|arsenic|cadmium|heavy metal/, 'lead-heavy-metals'],
  [/vomitoxin|deoxynivalenol|\bdon\b/, 'vomitoxin-don'],
]

/** Slug of the library entry that explains this hazard name, or null. e.g. "E. coli O157:H7" -> "e-coli-stec" */
export function hazardSlug(name: string): string | null {
  const n = name.toLowerCase()
  return RULES.find(([re]) => re.test(n))?.[1] ?? null
}
