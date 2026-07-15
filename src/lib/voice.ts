// ============================================================
// Voice set entry — parse a spoken phrase into weight/reps.
// "62.5 for 8" · "60 kilos 10 reps" · "8 reps" · "goblet 22 by 12"
// Speech recognition returns numbers as digits, so parsing is
// number extraction + unit-word disambiguation.
// ============================================================

export function parseSetSpeech(text: string): { weight?: number; reps?: number } {
  const nums = [...text.matchAll(/\d+(?:[.,]\d+)?/g)].map((m) => parseFloat(m[0].replace(",", ".")));
  if (nums.length === 0) return {};

  if (nums.length >= 2) {
    // convention everywhere in lifting: weight first, reps last
    return { weight: nums[0], reps: Math.round(nums[nums.length - 1]) };
  }

  // one number — let unit words decide, then fall back to magnitude
  const n = nums[0];
  if (/\brep/i.test(text)) return { reps: Math.round(n) };
  if (/\b(kg|kilo|kilogram|pound|lb)/i.test(text)) return { weight: n };
  return n <= 30 ? { reps: Math.round(n) } : { weight: n };
}
