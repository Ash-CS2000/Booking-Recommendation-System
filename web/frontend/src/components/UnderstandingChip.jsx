// Three genuinely different visual weights, matching three genuinely
// different levels of certainty in what the backend actually does with
// each kind of match — not just three colors for variety.
const STYLES = {
  // "filter": an exact number in the sentence became a real, hard filter.
  // Solid fill = the most certain, most literal outcome.
  filter: "border-transparent bg-brand-600 text-white shadow-sm",
  // "boost": a fuzzy word (cheap, near MRT) nudges ranking, doesn't filter
  // anything out. Outlined = present, but not absolute.
  boost: "border-accent-400 bg-accent-50 text-accent-700",
  // "vibe": a word the embedding model will pick up on by meaning, with no
  // dedicated logic behind it. Dashed + soft = the least certain, most
  // impressionistic match — visually the opposite of the solid filter chip.
  vibe: "border-dashed border-amber-300 bg-amber-50/70 text-amber-700",
};

export default function UnderstandingChip({ icon, label, type, style }) {
  return (
    <span
      className={`chip-in inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${STYLES[type]}`}
      style={style}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
  );
}
