/**
 * Client-side ONLY preview — mirrors the patterns in
 * web/backend/src/queryUnderstanding.js so the search bar can show what it
 * understood with zero network round-trip while you type. The backend is
 * still what actually enforces anything; this file must never be treated
 * as the source of truth. If you change one, change the other, or the
 * live preview and the real search behavior will silently drift apart.
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

const BUDGET_WORDS = /\b(cheap(?:est|er)?|affordable|budget|inexpensive|low[- ]cost)\b/i;
const NEAR_MRT_WORDS = /\b(near|close to|nearby|walking distance to|next to)\b[^.]{0,15}\bmrt\b/i;

// Not enforced anywhere server-side — these are genuinely just "the
// embedding model will pick up on this word's meaning," which is true of
// any word in the sentence. Shown as the softest chip style on purpose.
const VIBE_WORDS = [
  { re: /\b(quiet|peaceful|calm|serene)\b/i, label: "Quiet", icon: "🤫" },
  { re: /\b(famil(?:y|ies)|kids?|children)\b/i, label: "Family-friendly", icon: "👨‍👩‍👧" },
  { re: /\bpets?\b|\bdog\b|\bcat\b/i, label: "Pet-friendly", icon: "🐾" },
  { re: /\b(view|scenic|skyline)\b/i, label: "Great view", icon: "🌆" },
  { re: /\b(luxury|luxurious|upscale|high[- ]end)\b/i, label: "Luxury", icon: "✨" },
  { re: /\b(cozy|cosy|homey|homely)\b/i, label: "Cozy", icon: "🛋️" },
  { re: /\b(spacious|large|big)\b/i, label: "Spacious", icon: "📐" },
];

export function previewChips(query) {
  const chips = [];
  if (!query || !query.trim()) return chips;

  for (const re of PRICE_MAX_PATTERNS) {
    const m = query.match(re);
    if (m) {
      chips.push({ type: "filter", label: `≤ $${m[1]}`, icon: "💵" });
      break;
    }
  }
  for (const re of PRICE_MIN_PATTERNS) {
    const m = query.match(re);
    if (m) {
      chips.push({ type: "filter", label: `≥ $${m[1]}`, icon: "💵" });
      break;
    }
  }
  if (BUDGET_WORDS.test(query)) chips.push({ type: "boost", label: "Cheaper preferred", icon: "💰" });
  if (NEAR_MRT_WORDS.test(query)) chips.push({ type: "boost", label: "Near MRT preferred", icon: "🚇" });

  for (const v of VIBE_WORDS) {
    if (v.re.test(query)) chips.push({ type: "vibe", label: v.label, icon: v.icon });
  }

  return chips;
}
