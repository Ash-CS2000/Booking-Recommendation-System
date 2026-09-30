# Nestay — web platform

Public, no-login booking search & recommendation site for the short-stay
Singapore listings prepared in `../analysis/`. Built as the MVP layer ahead
of the deep-learning recommendation work: structured filters are fully
functional today; the free-text search box uses a keyword fallback until
semantic search (embeddings) is trained and wired in.

## Structure

- **`backend/`** — Node.js + Express. Reads the CSVs in `../analysis/`
  straight off disk on startup (no database, no duplicated data) and serves
  a small read-only REST API.
- **`frontend/`** — React (Vite) + Tailwind CSS + React Router + Leaflet
  (OpenStreetMap tiles — no API key needed, same source as the POI data).

## Run it

Two terminals:

```bash
cd backend && npm install && npm run dev   # http://localhost:4000
cd frontend && npm install && npm run dev  # http://localhost:5173
```

The frontend dev server proxies `/api/*` to `localhost:4000` (see
`frontend/vite.config.js`), so just open `http://localhost:5173`.

## API

| Route | Purpose |
|---|---|
| `GET /api/meta` | Filter options (regions, neighbourhoods, room types, price/guest ranges) |
| `GET /api/listings` | Search/filter/sort/paginate — `q`, `priceMin`, `priceMax`, `region`, `neighbourhood`, `roomType`, `guests`, `sort`, `page`, `pageSize` |
| `GET /api/listings/:id` | Full listing detail + review text + nearby POIs (grouped by category, within 2km, haversine distance) |

## Known follow-ups

- MRT/LRT proximity data is likely undercounted (OpenStreetMap pull found
  93 stations; Singapore's actual network is 180+).
- Free-text search is keyword-only; swap in embedding-based semantic search
  once trained, behind the same `/api/listings?q=` param.
- No booking/auth flow by design (public pages + search only) — the
  "View & book" CTA on listing detail links out to the original Airbnb
  listing.
