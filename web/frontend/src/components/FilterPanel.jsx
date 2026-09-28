function Select({ label, value, onChange, options, placeholder }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-800 shadow-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function FilterPanel({ meta, filters, onChange }) {
  if (!meta) return null;

  const update = (patch) => onChange({ ...filters, ...patch, page: 1 });

  return (
    <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-black/5 sm:grid-cols-3 lg:grid-cols-6">
      <label className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Min price</span>
        <input
          type="number"
          min={meta.priceMin}
          max={meta.priceMax}
          placeholder={`$${meta.priceMin}`}
          value={filters.priceMin ?? ""}
          onChange={(e) => update({ priceMin: e.target.value || undefined })}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-800 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </label>

      <label className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Max price</span>
        <input
          type="number"
          min={meta.priceMin}
          max={meta.priceMax}
          placeholder={`$${meta.priceMax}`}
          value={filters.priceMax ?? ""}
          onChange={(e) => update({ priceMax: e.target.value || undefined })}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-800 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </label>

      <Select
        label="Region"
        placeholder="Any region"
        value={filters.region}
        onChange={(v) => update({ region: v })}
        options={meta.regions}
      />

      <Select
        label="Neighbourhood"
        placeholder="Any neighbourhood"
        value={filters.neighbourhood}
        onChange={(v) => update({ neighbourhood: v })}
        options={meta.neighbourhoods}
      />

      <Select
        label="Room type"
        placeholder="Any room type"
        value={filters.roomType}
        onChange={(v) => update({ roomType: v })}
        options={meta.roomTypes}
      />

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Guests</span>
        <select
          value={filters.guests ?? ""}
          onChange={(e) => update({ guests: e.target.value || undefined })}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-800 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          <option value="">Any</option>
          {Array.from({ length: Math.min(meta.maxGuests, 10) }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}+ guest{n > 1 ? "s" : ""}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
