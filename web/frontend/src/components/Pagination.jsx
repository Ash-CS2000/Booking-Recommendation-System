export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let p = start; p <= end; p++) pages.push(p);

  const btn = (active) =>
    `h-10 min-w-10 rounded-xl px-3 text-sm font-semibold transition ${
      active
        ? "bg-brand-600 text-white shadow-sm"
        : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
    }`;

  return (
    <div className="flex items-center justify-center gap-2 py-8">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className={`${btn(false)} disabled:cursor-not-allowed disabled:opacity-40`}
      >
        Prev
      </button>
      {pages.map((p) => (
        <button key={p} onClick={() => onChange(p)} className={btn(p === page)}>
          {p}
        </button>
      ))}
      <button
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className={`${btn(false)} disabled:cursor-not-allowed disabled:opacity-40`}
      >
        Next
      </button>
    </div>
  );
}
