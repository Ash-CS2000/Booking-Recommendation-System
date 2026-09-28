/**
 * Two different jobs, kept deliberately separate:
 *
 *  1. extractPriceConstraint — an EXPLICIT number in the sentence ("under
 *     $200") becomes a real, hard filter. The user gave an exact number;
 *     it gets enforced exactly, the same as if they'd typed it into the
 *     Max Price box.
 *
 *  2. detectPreferences + applyPreferenceBoost — a FUZZY word ("cheap",
 *     "close to MRT") has no single correct threshold. "Cheap" for a
 *     shared hostel bed and "cheap" for a 3-bedroom apartment aren't the
 *     same number, and there's no honest way to turn "close" into an
 *     exact distance. So these don't filter anything out — they nudge
 *     the ranking, inside the set of listings the vector search already
 *     judged topically relevant, toward cheaper / MRT-closer options.
 *     Faking a hard cutoff from a vague word would be worse than not
 *     handling it at all.
 */

const PRICE_MAX_PATTERNS = [
  /under\s*\$?\s*(\d+)/i,
  /below\s*\$?\s*(\d+)/i,
  /less than\s*\$?\s*(\d+)/i,
  /cheaper than\s*\$?\s*(\d+)/i,
  /(?:up to|max(?:imum)?)\s*\$?\s*(\d+)/i,
  /\$?\s*(\d+)\s*(?:or less|and under|and below)/i,
];

const PRICE_MIN_PATTERNS = [
  /over\s*\$?\s*(\d+)/i,
  /above\s*\$?\s*(\d+)/i,
  /more than\s*\$?\s*(\d+)/i,
  /at least\s*\$?\s*(\d+)/i,
  /\$?\s*(\d+)\s*(?:or more|and up|and above)/i,
];

export function extractPriceConstraint(query) {
  for (const re of PRICE_MAX_PATTERNS) {
    const m = query.match(re);
    if (m) return { priceMax: Number(m[1]) };
  }
  for (const re of PRICE_MIN_PATTERNS) {
    const m = query.match(re);
    if (m) return { priceMin: Number(m[1]) };
  }
  return {};
}

const BUDGET_WORDS = /\b(cheap(?:est|er)?|affordable|budget|inexpensive|low[- ]cost)\b/i;
const NEAR_MRT_WORDS = /\b(near|close to|nearby|walking distance to|next to)\b[^.]{0,15}\bmrt\b/i;

export function detectPreferences(query) {
  return {
    wantsCheap: BUDGET_WORDS.test(query),
    wantsNearMrt: NEAR_MRT_WORDS.test(query),
  };
}

function normalize(value, min, max) {
  // 1 = best (cheapest / closest), 0 = worst — guards the min===max case
  // (every candidate the same price/distance) where there's nothing to
  // distinguish, rather than dividing by zero.
  if (max <= min) return 1;
  return 1 - (value - min) / (max - min);
}

/**
 * Re-orders `rankedListings` (already sorted best-match-first by the
 * vector search) by blending that relevance order with price/proximity
 * when the query asked for them. Returns the listings unchanged, in the
 * same order, if neither preference was detected — so a query with no
 * fuzzy preference words behaves exactly as before this feature existed.
 */
export function applyPreferenceBoost(rankedListings, { wantsCheap, wantsNearMrt }) {
  if (!wantsCheap && !wantsNearMrt) return rankedListings;

  const n = rankedListings.length;
  if (n === 0) return rankedListings;

  const prices = rankedListings.map((l) => l.price).filter((p) => p !== null && p !== undefined);
  const priceMin = Math.min(...prices);
  const priceMax = Math.max(...prices);

  const dists = rankedListings
    .map((l) => l.proximity?.mrt_station_nearest_km)
    .filter((d) => d !== null && d !== undefined);
  const distMin = Math.min(...dists);
  const distMax = Math.max(...dists);

  const RELEVANCE_WEIGHT = 0.6;
  const PREFERENCE_WEIGHT = 0.25; // per active preference (price and/or MRT distance)

  const scored = rankedListings.map((listing, rank) => {
    const relevanceScore = 1 - rank / n; // rank 0 (best match) -> 1, last -> ~0
    let score = relevanceScore * RELEVANCE_WEIGHT;
    let weightUsed = RELEVANCE_WEIGHT;

    if (wantsCheap && listing.price !== null && listing.price !== undefined) {
      score += normalize(listing.price, priceMin, priceMax) * PREFERENCE_WEIGHT;
      weightUsed += PREFERENCE_WEIGHT;
    }

    const dist = listing.proximity?.mrt_station_nearest_km;
    if (wantsNearMrt && dist !== null && dist !== undefined) {
      score += normalize(dist, distMin, distMax) * PREFERENCE_WEIGHT;
      weightUsed += PREFERENCE_WEIGHT;
    }

    // A listing missing price/distance data still gets scored fairly,
    // just on whatever signals it actually has (weightUsed < intended
    // total in that case, so re-normalize rather than silently penalize it).
    return { listing, score: score / weightUsed };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.listing);
}
