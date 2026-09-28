import "dotenv/config";
import express from "express";
import cors from "cors";
import { loadDataset } from "./data.js";
import * as semanticSearch from "./semanticSearch.js";
import * as queryUnderstanding from "./queryUnderstanding.js";

const { listings, poi, haversineKm } = loadDataset();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// ---------- helpers ----------

function matchesKeyword(listing, q) {
  if (!q) return true;
  const needle = q.toLowerCase();
  const haystack = [listing.name, listing.description, listing.amenities]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

function toCard(listing) {
  // Slim shape for list/grid views — full detail is fetched per-listing on demand.
  return {
    id: listing.id,
    name: listing.name,
    picture_url: listing.picture_url,
    price: listing.price,
    room_type: listing.room_type,
    property_type: listing.property_type,
    neighbourhood_cleansed: listing.neighbourhood_cleansed,
    neighbourhood_group_cleansed: listing.neighbourhood_group_cleansed,
    accommodates: listing.accommodates,
    bedrooms: listing.bedrooms,
    beds: listing.beds,
    bathrooms_text: listing.bathrooms_text,
    review_scores_rating: listing.review_scores_rating,
    number_of_reviews: listing.number_of_reviews,
    has_reviews: listing.has_reviews,
    host_is_superhost: listing.host_is_superhost,
    minimum_nights: listing.minimum_nights,
    mrt_nearest_km: listing.proximity?.mrt_station_nearest_km ?? null,
  };
}

// ---------- routes ----------

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    listings: listings.length,
    poi: poi.length,
    semanticSearch: semanticSearch.isConfigured() ? "configured" : "not configured (keyword search only)",
  });
});

// Filter option metadata for building the search/filter UI.
app.get("/api/meta", (_req, res) => {
  const regions = [...new Set(listings.map((l) => l.neighbourhood_group_cleansed).filter(Boolean))].sort();
  const neighbourhoods = [...new Set(listings.map((l) => l.neighbourhood_cleansed).filter(Boolean))].sort();
  const roomTypes = [...new Set(listings.map((l) => l.room_type).filter(Boolean))].sort();
  const prices = listings.map((l) => l.price).filter((p) => p !== null);
  res.json({
    regions,
    neighbourhoods,
    roomTypes,
    priceMin: Math.floor(Math.min(...prices)),
    priceMax: Math.ceil(Math.max(...prices)),
    maxGuests: Math.max(...listings.map((l) => l.accommodates ?? 0)),
  });
});

// Search/results. Structured filters are always real. `q` tries semantic
// search first (Databricks Vector Search) when configured, and falls back
// to plain keyword matching on any failure — including "not configured",
// which is the default until DATABRICKS_* env vars are set. Either path
// converges on the same `results` array below, so filtering/sorting/paging
// is identical regardless of which one ran.
app.get("/api/listings", async (req, res) => {
  const {
    q = "",
    priceMin,
    priceMax,
    region,
    neighbourhood,
    roomType,
    guests,
    sort = "rating_desc",
    page = "1",
    pageSize = "12",
  } = req.query;

  // An explicit number typed in the sentence ("under $200") becomes a real
  // filter, same as typing it into the Max Price box — but only fills in
  // what the box left blank; a value the user typed there directly is a
  // more deliberate action and wins. Applies to both search modes below,
  // since it's just as valid a thing to want with keyword search.
  const extractedPrice = q ? queryUnderstanding.extractPriceConstraint(q) : {};
  const effectivePriceMin = priceMin || extractedPrice.priceMin;
  const effectivePriceMax = priceMax || extractedPrice.priceMax;

  let results;
  let searchMode = "keyword";

  if (q && semanticSearch.isConfigured()) {
    try {
      const rankedIds = await semanticSearch.semanticSearchListingIds(q, {
        priceMin: effectivePriceMin, priceMax: effectivePriceMax, region, neighbourhood, roomType,
      });
      const rank = new Map(rankedIds.map((id, i) => [id, i]));
      let candidates = listings.filter((l) => rank.has(l.id));
      candidates.sort((a, b) => rank.get(a.id) - rank.get(b.id));

      // Fuzzy preference words ("cheap", "close to MRT") have no single
      // correct threshold, so instead of filtering, nudge the ranking
      // toward cheaper / MRT-closer listings within what the vector
      // search already judged relevant.
      results = queryUnderstanding.applyPreferenceBoost(candidates, queryUnderstanding.detectPreferences(q));
      searchMode = "semantic";
    } catch (err) {
      console.warn(`Semantic search failed ("${err.message}") — falling back to keyword search`);
      results = listings.filter((l) => matchesKeyword(l, q));
    }
  } else {
    results = listings.filter((l) => matchesKeyword(l, q));
  }

  // Re-applied in JS regardless of path: a safety net for the semantic path
  // (its Databricks-side filters_json isn't verified end-to-end yet), and
  // the only filtering step for the keyword path.
  if (effectivePriceMin) results = results.filter((l) => l.price !== null && l.price >= Number(effectivePriceMin));
  if (effectivePriceMax) results = results.filter((l) => l.price !== null && l.price <= Number(effectivePriceMax));
  if (region) results = results.filter((l) => l.neighbourhood_group_cleansed === region);
  if (neighbourhood) results = results.filter((l) => l.neighbourhood_cleansed === neighbourhood);
  if (roomType) results = results.filter((l) => l.room_type === roomType);
  if (guests) results = results.filter((l) => (l.accommodates ?? 0) >= Number(guests));

  const sorters = {
    rating_desc: (a, b) => (b.review_scores_rating ?? -1) - (a.review_scores_rating ?? -1),
    price_asc: (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity),
    price_desc: (a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity),
    reviews_desc: (a, b) => (b.number_of_reviews ?? 0) - (a.number_of_reviews ?? 0),
  };
  // "rating_desc" doubles as "no explicit sort chosen" from the frontend's
  // default — keep semantic relevance order in that case. Any other sort
  // choice is an explicit override and wins regardless of search mode.
  const keepRelevanceOrder = searchMode === "semantic" && sort === "rating_desc";
  if (!keepRelevanceOrder) {
    results = [...results].sort(sorters[sort] ?? sorters.rating_desc);
  }

  const total = results.length;
  const p = Math.max(1, Number(page));
  const size = Math.max(1, Number(pageSize));
  const paged = results.slice((p - 1) * size, p * size);

  res.json({
    total,
    page: p,
    pageSize: size,
    totalPages: Math.ceil(total / size),
    searchMode,
    // Lets the frontend show what was actually applied — e.g. a price cap
    // that came from the sentence itself, not the Min/Max Price boxes.
    appliedPriceMin: effectivePriceMin ? Number(effectivePriceMin) : null,
    appliedPriceMax: effectivePriceMax ? Number(effectivePriceMax) : null,
    priceFromQueryText: Boolean((extractedPrice.priceMin && !priceMin) || (extractedPrice.priceMax && !priceMax)),
    results: paged.map(toCard),
  });
});

// Full detail for one listing, plus nearby POIs (for the map) grouped by category.
app.get("/api/listings/:id", (req, res) => {
  const id = req.params.id; // string — see note in data.js on why IDs aren't Number()'d
  const listing = listings.find((l) => l.id === id);
  if (!listing) return res.status(404).json({ error: "Listing not found" });

  const NEARBY_RADIUS_KM = 2;
  const MAX_PER_CATEGORY = 8;

  const nearbyByCategory = {};
  if (listing.latitude !== null && listing.longitude !== null) {
    for (const p of poi) {
      const dist = haversineKm(listing.latitude, listing.longitude, p.latitude, p.longitude);
      if (dist > NEARBY_RADIUS_KM) continue;
      (nearbyByCategory[p.category] ??= []).push({ ...p, distance_km: Math.round(dist * 1000) / 1000 });
    }
    for (const cat of Object.keys(nearbyByCategory)) {
      nearbyByCategory[cat].sort((a, b) => a.distance_km - b.distance_km);
      nearbyByCategory[cat] = nearbyByCategory[cat].slice(0, MAX_PER_CATEGORY);
    }
  }

  res.json({ ...listing, nearby: nearbyByCategory });
});

app.listen(PORT, () => {
  console.log(`Booking System API listening on http://localhost:${PORT}`);
});
