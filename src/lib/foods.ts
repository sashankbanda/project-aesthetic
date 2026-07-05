// ============================================================
// Budget-protein food database — PG-friendly Indian staples.
// costPerServing in ₹ (approx; editable later in settings).
// ============================================================

export interface Food {
  id: string;
  name: string;
  serving: string;
  proteinG: number;
  calories: number;
  costRs: number;
  veg: boolean;
  /** no cooking / minimal cooking — PG friendly */
  pgFriendly: boolean;
}

export const FOODS: Food[] = [
  { id: "egg", name: "Whole Egg (boiled)", serving: "1 egg", proteinG: 6, calories: 78, costRs: 7, veg: false, pgFriendly: true },
  { id: "egg-white", name: "Egg White", serving: "1 white", proteinG: 3.5, calories: 17, costRs: 7, veg: false, pgFriendly: true },
  { id: "milk", name: "Milk (toned)", serving: "250 ml", proteinG: 8, calories: 150, costRs: 15, veg: true, pgFriendly: true },
  { id: "curd", name: "Curd / Dahi", serving: "100 g", proteinG: 5, calories: 60, costRs: 10, veg: true, pgFriendly: true },
  { id: "paneer", name: "Paneer", serving: "100 g", proteinG: 18, calories: 265, costRs: 40, veg: true, pgFriendly: true },
  { id: "chicken", name: "Chicken Breast (cooked)", serving: "100 g", proteinG: 27, calories: 165, costRs: 35, veg: false, pgFriendly: false },
  { id: "soya", name: "Soya Chunks (dry)", serving: "50 g", proteinG: 26, calories: 173, costRs: 8, veg: true, pgFriendly: false },
  { id: "whey", name: "Whey Protein", serving: "1 scoop (30 g)", proteinG: 24, calories: 120, costRs: 60, veg: true, pgFriendly: true },
  { id: "peanut-butter", name: "Peanut Butter", serving: "2 tbsp (32 g)", proteinG: 8, calories: 190, costRs: 12, veg: true, pgFriendly: true },
  { id: "peanuts", name: "Roasted Peanuts", serving: "50 g", proteinG: 13, calories: 290, costRs: 8, veg: true, pgFriendly: true },
  { id: "chana", name: "Roasted Chana", serving: "50 g", proteinG: 10, calories: 180, costRs: 6, veg: true, pgFriendly: true },
  { id: "dal", name: "Dal (cooked)", serving: "1 katori (150 g)", proteinG: 7, calories: 130, costRs: 10, veg: true, pgFriendly: false },
  { id: "rajma", name: "Rajma / Chole (cooked)", serving: "1 katori (150 g)", proteinG: 8, calories: 160, costRs: 12, veg: true, pgFriendly: false },
  { id: "tofu", name: "Tofu", serving: "100 g", proteinG: 12, calories: 110, costRs: 25, veg: true, pgFriendly: true },
  { id: "oats", name: "Oats (raw)", serving: "50 g", proteinG: 6, calories: 190, costRs: 8, veg: true, pgFriendly: true },
  { id: "sattu", name: "Sattu Drink", serving: "40 g in water", proteinG: 8, calories: 150, costRs: 6, veg: true, pgFriendly: true },
  { id: "fish", name: "Fish (rohu, cooked)", serving: "100 g", proteinG: 20, calories: 130, costRs: 30, veg: false, pgFriendly: false },
  { id: "cheese-slice", name: "Cheese Slice", serving: "1 slice", proteinG: 4, calories: 60, costRs: 12, veg: true, pgFriendly: true },
];

export const FOOD_MAP: Record<string, Food> = Object.fromEntries(FOODS.map((f) => [f.id, f]));

/**
 * Greedy cheapest-first combo to close a protein gap.
 * Caps per-food servings to keep suggestions realistic.
 */
export function budgetPlan(
  gapG: number,
  opts: { vegOnly?: boolean; pgOnly?: boolean } = {},
): { food: Food; servings: number; proteinG: number; costRs: number }[] {
  const caps: Record<string, number> = {
    egg: 4, "egg-white": 6, milk: 2, curd: 2, soya: 2, whey: 1, chana: 2,
    peanuts: 1, "peanut-butter": 2, sattu: 2, paneer: 2, chicken: 2, dal: 2,
    rajma: 2, tofu: 2, oats: 1, fish: 2, "cheese-slice": 2,
  };
  const pool = FOODS.filter(
    (f) => (!opts.vegOnly || f.veg) && (!opts.pgOnly || f.pgFriendly),
  ).sort((a, b) => a.costRs / a.proteinG - b.costRs / b.proteinG);

  const out: { food: Food; servings: number; proteinG: number; costRs: number }[] = [];
  let remaining = gapG;
  for (const food of pool) {
    if (remaining <= 0) break;
    const maxServ = caps[food.id] ?? 1;
    const servings = Math.min(maxServ, Math.ceil(remaining / food.proteinG));
    if (servings <= 0) continue;
    out.push({ food, servings, proteinG: servings * food.proteinG, costRs: servings * food.costRs });
    remaining -= servings * food.proteinG;
  }
  return out;
}
