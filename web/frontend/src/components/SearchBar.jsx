import { useEffect, useMemo, useState } from "react";
import { previewChips } from "../lib/queryPreview";
import UnderstandingChip from "./UnderstandingChip";

const EXAMPLES = [
  "quiet studio near MRT under $200",
  "cheap place close to MRT for 2 guests",
  "cozy loft with a view, pet friendly",
  "family-friendly apartment in Orchard",
];

// Types out each example placeholder letter by letter, pauses, then moves
// to the next — only runs while the box is empty, so it never fights with
// what the user is actually typing.
function useTypewriter(examples, { typingSpeedMs = 38, pauseMs = 1500, active = true } = {}) {
  const [exampleIndex, setExampleIndex] = useState(0);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!active) return undefined;
    let charIndex = 0;
    setText("");
    const current = examples[exampleIndex % examples.length];

    const typing = setInterval(() => {
      charIndex += 1;
      setText(current.slice(0, charIndex));
      if (charIndex >= current.length) clearInterval(typing);
    }, typingSpeedMs);

    const advance = setTimeout(
      () => setExampleIndex((i) => (i + 1) % examples.length),
      current.length * typingSpeedMs + pauseMs
    );

    return () => {
      clearInterval(typing);
      clearTimeout(advance);
    };
  }, [exampleIndex, active, examples, typingSpeedMs, pauseMs]);

  return text;
}

export default function SearchBar({ initialQuery = "", onSearch }) {
  const [value, setValue] = useState(initialQuery);
  const [focused, setFocused] = useState(false);

  const typedPlaceholder = useTypewriter(EXAMPLES, { active: !focused && value === "" });
  const chips = useMemo(() => previewChips(value), [value]);

  function submit(e) {
    e.preventDefault();
    onSearch(value.trim());
  }

  return (
    <div>
      {/* Gradient glow ring — hidden at rest, fades in only while the input
          has focus (group-focus-within, no JS needed for this part). */}
      <div className="group relative">
        <div className="ai-glow-ring pointer-events-none absolute -inset-2.5 rounded-3xl opacity-0 blur-lg transition-opacity duration-500 group-focus-within:opacity-90" />

        <form
          onSubmit={submit}
          className="relative flex w-full items-center gap-2 rounded-2xl bg-white p-2 shadow-card-hover ring-1 ring-black/5"
        >
          <span className="ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-brand-500 to-accent-500">
            <svg viewBox="0 0 20 20" fill="currentColor" className="ai-sparkle h-4 w-4 text-white">
              <path d="M10 1.5l1.5 4.5 4.5 1.5-4.5 1.5-1.5 4.5-1.5-4.5-4.5-1.5 4.5-1.5z" />
            </svg>
          </span>

          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            type="text"
            placeholder={value ? "" : typedPlaceholder}
            className="min-w-0 flex-1 bg-transparent px-1 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.98]"
          >
            Search
          </button>
        </form>
      </div>

      {/* Live "understanding" chips — parsed from the sentence as you type,
          before you ever hit Search. Solid = an exact filter, outlined = a
          ranking nudge, dashed = a soft meaning-match — matching exactly
          what the backend does with each kind of word (see queryPreview.js). */}
      {chips.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {chips.map((chip, i) => (
            <UnderstandingChip key={`${chip.type}-${chip.label}`} {...chip} style={{ animationDelay: `${i * 40}ms` }} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
