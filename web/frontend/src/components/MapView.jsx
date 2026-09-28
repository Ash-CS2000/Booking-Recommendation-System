import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const CATEGORY_META = {
  mrt_station: { label: "MRT / Train", color: "#3563f0", emoji: "🚇" },
  convenience_store: { label: "Convenience store", color: "#16a34a", emoji: "🏪" },
  supermarket: { label: "Supermarket", color: "#ea580c", emoji: "🛒" },
  mall: { label: "Mall", color: "#7c3aed", emoji: "🛍️" },
  attraction: { label: "Attraction", color: "#db2777", emoji: "📍" },
};

function dotIcon(color, size = 26) {
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:9999px;
      background:${color};border:2.5px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,0.35);
    "></div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const LISTING_ICON = L.divIcon({
  html: `<div style="
    width:34px;height:34px;border-radius:9999px 9999px 9999px 2px;
    transform:rotate(45deg);
    background:#f8543a;border:3px solid white;
    box-shadow:0 2px 6px rgba(0,0,0,0.4);
  "></div>`,
  className: "",
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

export default function MapView({ latitude, longitude, nearby }) {
  if (latitude === null || longitude === null || latitude === undefined) {
    return (
      <div className="flex h-80 items-center justify-center rounded-2xl bg-gray-100 text-sm text-gray-500">
        Location unavailable for this listing
      </div>
    );
  }

  const categories = Object.keys(nearby || {});

  return (
    <div className="space-y-3">
      <div className="h-80 overflow-hidden rounded-2xl ring-1 ring-black/5 sm:h-96">
        <MapContainer center={[latitude, longitude]} zoom={15} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[latitude, longitude]} icon={LISTING_ICON}>
            <Popup>This listing</Popup>
          </Marker>
          {categories.flatMap((cat) =>
            (nearby[cat] || []).map((poi) => (
              <Marker
                key={`${cat}-${poi.osm_id}`}
                position={[poi.latitude, poi.longitude]}
                icon={dotIcon(CATEGORY_META[cat]?.color ?? "#667085")}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">
                      {CATEGORY_META[cat]?.emoji} {poi.name}
                    </p>
                    <p className="text-gray-500">
                      {CATEGORY_META[cat]?.label} · {(poi.distance_km * 1000).toFixed(0)}m away
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))
          )}
        </MapContainer>
      </div>

      <div className="flex flex-wrap gap-3 text-xs font-medium text-gray-600">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rotate-45 rounded-[3px] bg-accent-500" /> This listing
        </span>
        {Object.entries(CATEGORY_META).map(([key, meta]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: meta.color }} />
            {meta.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export { CATEGORY_META };
