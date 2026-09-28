import { CATEGORY_META } from "./MapView";

export default function NearbyPlaces({ nearby }) {
  const categories = Object.keys(CATEGORY_META);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {categories.map((cat) => {
        const items = nearby?.[cat] ?? [];
        const nearest = items[0];
        const meta = CATEGORY_META[cat];
        return (
          <div
            key={cat}
            className="flex flex-col items-start gap-1 rounded-xl bg-white p-3.5 shadow-card ring-1 ring-black/5"
          >
            <span className="text-xl">{meta.emoji}</span>
            <span className="text-xs font-semibold text-gray-500">{meta.label}</span>
            {nearest ? (
              <span className="font-display text-sm font-bold text-gray-900">
                {(nearest.distance_km * 1000).toFixed(0)}m
              </span>
            ) : (
              <span className="text-sm font-medium text-gray-400">2km+</span>
            )}
            {items.length > 1 ? (
              <span className="text-xs text-gray-400">+{items.length - 1} more nearby</span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
