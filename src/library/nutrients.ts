// Glossary of nutrients and the five MyPlate food groups. General information from FDA, NIH ODS and USDA MyPlate - not medical advice.
import type { FoodGroup } from '../passport/types'

const FDA_DV = { source: 'FDA, Daily Value on the Nutrition and Supplement Facts Labels (21 CFR 101.9)', url: 'https://www.fda.gov/food/nutrition-facts-label/daily-value-nutrition-and-supplement-facts-labels' }
const ods = (name: string, page: string) => ({ source: `NIH Office of Dietary Supplements, ${name} fact sheet for consumers`, url: `https://ods.od.nih.gov/factsheets/${page}-Consumer/` })

export interface Nutrient {
  slug: string
  key: string                   // the passport nutrition key, e.g. "protein_g"
  name: string
  unit: string
  daily_value: number | null    // FDA Daily Value for adults and children 4+; null = there is none
  dv_label?: string             // shown instead of "<daily_value> <unit> a day" when that would mislead
  dv_note?: string              // anything the reader must know about that number
  pct_dv: boolean               // false when the passport figure cannot honestly be divided by the DV (calories, total sugars)
  limit: boolean                // true = the DV is an amount to stay under
  goal: 'Get enough' | 'Stay under' | 'Reference amount'
  what_it_does: string
  food_groups: FoodGroup[]
  good_to_know: string
  source: string
  url: string
}

export const NUTRIENTS: Nutrient[] = [
  { slug: 'calories', key: 'kcal', name: 'Calories', unit: 'kcal', daily_value: null, pct_dv: false, limit: false, goal: 'Reference amount', dv_label: '2,000 kcal reference diet',
    dv_note: 'There is no Daily Value for calories. 2,000 calories a day is the reference diet that the other Daily Values are built on; your own needs may be higher or lower.',
    what_it_does: 'Calories measure the energy a food provides. The body spends that energy on everything from breathing and keeping warm to moving.',
    food_groups: ['protein', 'vegetables', 'fruits', 'grains', 'dairy'],
    good_to_know: 'Every food group supplies calories. They come from carbohydrate and protein (about 4 per gram) and fat (about 9 per gram).', ...FDA_DV },
  { slug: 'protein', key: 'protein_g', name: 'Protein', unit: 'g', daily_value: 50, pct_dv: true, limit: false, goal: 'Get enough',
    what_it_does: 'Protein supplies the amino acids the body uses to build and repair muscle, skin, bone and other tissues, and to make enzymes and hormones.',
    food_groups: ['protein', 'dairy'],
    good_to_know: 'Beans, peas, lentils, nuts and soy foods count as protein foods too. Grains and vegetables add smaller amounts across the day.', ...FDA_DV },
  { slug: 'total-fat', key: 'fat_g', name: 'Total fat', unit: 'g', daily_value: 78, pct_dv: true, limit: false, goal: 'Reference amount',
    what_it_does: 'Fat provides energy, is part of every cell membrane, and helps the body absorb vitamins A, D, E and K.',
    food_groups: ['protein', 'dairy'],
    good_to_know: 'Total fat adds up several kinds. The label lists saturated fat separately because that is the kind to stay under; fish, nuts and vegetable oils supply mostly unsaturated fat. Oils are not one of the five MyPlate groups.', ...FDA_DV },
  { slug: 'saturated-fat', key: 'saturated_fat_g', name: 'Saturated fat', unit: 'g', daily_value: 20, pct_dv: true, limit: true, goal: 'Stay under',
    what_it_does: 'Eating a lot of saturated fat can raise LDL cholesterol in the blood, which is linked with a higher risk of heart disease. It is one of several kinds of fat in food.',
    food_groups: ['protein', 'dairy'],
    good_to_know: 'It is found mostly in fatty meats, full-fat dairy, butter, and coconut and palm oils. The 20 g Daily Value is 10% of a 2,000-calorie diet.', ...FDA_DV },
  { slug: 'carbohydrate', key: 'carbs_g', name: 'Total carbohydrate', unit: 'g', daily_value: 275, pct_dv: true, limit: false, goal: 'Reference amount',
    what_it_does: 'Carbohydrates - sugars, starches and fiber - are the body\'s main source of energy. Sugars and starches are broken down into glucose, which fuels cells, including the brain.',
    food_groups: ['grains', 'fruits', 'vegetables', 'dairy'],
    good_to_know: 'Total carbohydrate on a label includes fiber and sugars. Whole grains, fruits and vegetables carry fiber along with their carbohydrate.', ...FDA_DV },
  { slug: 'fiber', key: 'fiber_g', name: 'Dietary fiber', unit: 'g', daily_value: 28, pct_dv: true, limit: false, goal: 'Get enough',
    what_it_does: 'Fiber helps keep bowel movements regular and helps you feel full, and diets higher in fiber are linked with lower blood cholesterol. It is the part of plant foods the body cannot digest.',
    food_groups: ['vegetables', 'fruits', 'grains'],
    good_to_know: 'Fiber is found only in plant foods - meat, fish, eggs and milk have none. Beans, peas, lentils, nuts and whole grains are among the richest sources.', ...FDA_DV },
  { slug: 'sugars', key: 'sugars_g', name: 'Sugars', unit: 'g', daily_value: 50, pct_dv: false, limit: true, goal: 'Stay under', dv_label: '50 g a day of added sugars',
    dv_note: 'The 50 g Daily Value is for added sugars only. There is no Daily Value for total sugars. Plattr passports record total sugars, which include the sugars naturally in fruit and milk, so no % Daily Value is shown for them.',
    what_it_does: 'Sugars are the simplest carbohydrates and give quick energy. Added sugars bring calories without other nutrients.',
    food_groups: ['fruits', 'dairy'],
    good_to_know: 'Fruit and plain milk contain natural sugars along with fiber, vitamins or calcium. Added sugars come mostly from sweetened drinks, desserts and sweets - the Nutrition Facts label lists them on their own line.', ...FDA_DV },
  { slug: 'sodium', key: 'sodium_mg', name: 'Sodium', unit: 'mg', daily_value: 2300, pct_dv: true, limit: true, goal: 'Stay under',
    what_it_does: 'Sodium helps nerves and muscles work and keeps the body\'s fluids in balance. Eating too much is linked with high blood pressure.',
    food_groups: ['grains', 'protein', 'dairy'],
    good_to_know: 'Most sodium comes from packaged, prepared and restaurant foods - breads, cured and deli meats, cheese, soups - rather than the salt shaker. Fresh produce, plain meat and milk are naturally low.', ...FDA_DV },
  { slug: 'cholesterol', key: 'cholesterol_mg', name: 'Cholesterol', unit: 'mg', daily_value: 300, pct_dv: true, limit: true, goal: 'Stay under',
    what_it_does: 'Cholesterol is a waxy substance the body uses to build cell membranes and to make vitamin D and some hormones. The liver makes all the cholesterol the body needs.',
    food_groups: ['protein', 'dairy'],
    good_to_know: 'Cholesterol is found only in animal foods: meat, poultry, seafood, eggs and dairy. Plant foods have none.', ...FDA_DV },
  { slug: 'vitamin-c', key: 'vitamin_c_mg', name: 'Vitamin C', unit: 'mg', daily_value: 90, pct_dv: true, limit: false, goal: 'Get enough',
    what_it_does: 'The body needs vitamin C to make collagen, which helps wounds heal, and it supports the immune system. It is also an antioxidant.',
    food_groups: ['fruits', 'vegetables'],
    good_to_know: 'Vitamin C helps the body absorb iron from plant foods eaten in the same meal. Long storage and cooking lower it, so fresh or lightly cooked produce keeps the most.', ...ods('Vitamin C', 'VitaminC') },
  { slug: 'iron', key: 'iron_mg', name: 'Iron', unit: 'mg', daily_value: 18, pct_dv: true, limit: false, goal: 'Get enough',
    what_it_does: 'Iron is part of hemoglobin, the protein in red blood cells that carries oxygen from the lungs to the rest of the body.',
    food_groups: ['protein', 'grains', 'vegetables'],
    good_to_know: 'Heme iron in meat, poultry and seafood is absorbed more easily than the non-heme iron in beans, spinach and fortified grains. Vitamin C in the same meal helps the body absorb more of the plant kind.', ...ods('Iron', 'Iron') },
  { slug: 'calcium', key: 'calcium_mg', name: 'Calcium', unit: 'mg', daily_value: 1300, pct_dv: true, limit: false, goal: 'Get enough',
    what_it_does: 'Calcium builds and maintains bones and teeth. Muscles need it to move and nerves need it to carry messages.',
    food_groups: ['dairy', 'vegetables', 'protein'],
    good_to_know: 'Milk, yogurt and cheese are the main sources in US diets. Kale, broccoli, canned fish with soft bones, and calcium-set tofu or fortified foods supply it too. The body needs vitamin D to absorb calcium.', ...ods('Calcium', 'Calcium') },
  { slug: 'potassium', key: 'potassium_mg', name: 'Potassium', unit: 'mg', daily_value: 4700, pct_dv: true, limit: false, goal: 'Get enough',
    what_it_does: 'Potassium helps nerves signal, muscles contract and the heart keep a steady beat, and it helps balance the body\'s fluids.',
    food_groups: ['fruits', 'vegetables', 'dairy', 'protein'],
    good_to_know: 'Many people in the US get less potassium than recommended. Some people, such as those with kidney disease, are told by their doctor to limit it - follow that advice over any label.', ...ods('Potassium', 'Potassium') },
]

export interface FoodGroupEntry {
  slug: string                  // "group-protein" - shares the /library/nutrients/:slug route
  group: FoodGroup
  name: string
  emoji: string
  what_it_is: string
  how_it_serves_you: string
  nutrients: string[]           // slugs of the NUTRIENTS this group mainly contributes (only those Plattr passports record)
  tip: string
  source: string
  url: string
}

const MYPLATE = { source: 'USDA MyPlate, What is MyPlate?', url: 'https://www.myplate.gov/eat-healthy/what-is-myplate' }

export const FOOD_GROUPS: FoodGroupEntry[] = [
  { slug: 'group-protein', group: 'protein', name: 'Protein foods', emoji: '🥩',
    what_it_is: 'Meat, poultry, seafood and eggs, plus beans, peas, lentils, nuts, seeds and soy foods.',
    how_it_serves_you: 'This group is the main supplier of protein, the building material for muscle, skin and bone. Meat, poultry and seafood also bring iron in its most easily absorbed form, along with B vitamins and zinc; seafood adds omega-3 fats.',
    nutrients: ['protein', 'iron', 'potassium', 'total-fat', 'saturated-fat', 'cholesterol'],
    tip: 'MyPlate suggests varying your protein routine - seafood, beans and lentils as well as meat - and choosing lean cuts.', ...MYPLATE },
  { slug: 'group-vegetables', group: 'vegetables', name: 'Vegetables', emoji: '🥬',
    what_it_is: 'Any vegetable or 100% vegetable juice: dark green, red and orange, starchy, beans, peas and lentils, and others - fresh, frozen, canned or dried.',
    how_it_serves_you: 'Vegetables supply potassium, fiber, vitamin C, vitamin A and folate for very few calories. Fiber keeps digestion regular, and potassium supports nerves, muscles and the heart.',
    nutrients: ['fiber', 'potassium', 'vitamin-c', 'iron', 'calcium'],
    tip: 'MyPlate suggests making half your plate fruits and vegetables, and varying your veggies across colors.', ...MYPLATE },
  { slug: 'group-fruits', group: 'fruits', name: 'Fruits', emoji: '🍓',
    what_it_is: 'Any fruit or 100% fruit juice - fresh, frozen, canned or dried.',
    how_it_serves_you: 'Fruits supply vitamin C, potassium, fiber and folate. Vitamin C helps wounds heal and helps the body take up iron from plant foods; the sugars in whole fruit come packaged with fiber.',
    nutrients: ['vitamin-c', 'fiber', 'potassium', 'carbohydrate', 'sugars'],
    tip: 'MyPlate suggests focusing on whole fruits rather than juice, because whole fruit keeps its fiber.', ...MYPLATE },
  { slug: 'group-grains', group: 'grains', name: 'Grains', emoji: '🍞',
    what_it_is: 'Foods made from wheat, rice, oats, cornmeal, barley or another cereal grain: bread, pasta, breakfast cereals, tortillas. Whole grains keep the entire kernel; refined grains have the bran and germ removed.',
    how_it_serves_you: 'Grains are a main source of carbohydrate, the body\'s everyday fuel. Whole grains add fiber, B vitamins, iron and magnesium; enriched refined grains have iron and some B vitamins added back, but not the fiber.',
    nutrients: ['carbohydrate', 'fiber', 'iron', 'sodium'],
    tip: 'MyPlate suggests making at least half your grains whole grains.', ...MYPLATE },
  { slug: 'group-dairy', group: 'dairy', name: 'Dairy', emoji: '🥛',
    what_it_is: 'Milk, yogurt and cheese, lactose-free milk, and fortified soy milk and yogurt. Foods made from milk that keep little calcium - butter, cream, cream cheese - are not counted.',
    how_it_serves_you: 'Dairy is the main source of calcium in US diets, and also supplies protein, potassium and, when fortified, vitamin D. Calcium and vitamin D together build and maintain bones and teeth.',
    nutrients: ['calcium', 'protein', 'potassium', 'saturated-fat', 'sugars'],
    tip: 'MyPlate suggests moving to low-fat or fat-free milk and yogurt, which keep the calcium with less saturated fat.', ...MYPLATE },
]

/** Slug of the library entry for a nutrition key such as "sodium_mg" or "fiber_g", or null. */
export function nutrientSlug(key: string): string | null {
  return NUTRIENTS.find(n => n.key === key)?.slug ?? null
}
