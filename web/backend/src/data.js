import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Single source of truth: the CSVs already prepared in analysis/, plus the
// raw reviews.csv for individual (non-aggregated) reviews used for display.
// Nothing here is duplicated onto disk — read straight from source every start.
const ANALYSIS_DIR = path.resolve(__dirname, "../../../analysis");
const RAW_DATA_DIR = path.resolve(__dirname, "../../../raw data");

function readCsv(dir, relativePath) {
  const filePath = path.join(dir, relativePath);
  const raw = fs.readFileSync(filePath, "utf-8");
  return parse(raw, { columns: true, skip_empty_lines: true });
}

function toNum(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function toBool(v) {
  if (v === "t") return true;
  if (v === "f") return false;
  return null;
}

// NOTE: "id" and "host_id" are deliberately NOT in this list. They're 19-digit
// identifiers that exceed JS's safe integer range (Number.MAX_SAFE_INTEGER is
// ~16 digits) — converting them to Number silently rounds/corrupts them. Keep
// as strings throughout (they're identifiers, never used arithmetically).
const NUMERIC_FEATURE_FIELDS = [
  "price", "latitude", "longitude",
  "accommodates", "bedrooms", "beds",
  "review_scores_rating", "review_scores_accuracy", "review_scores_cleanliness",
  "review_scores_checkin", "review_scores_communication", "review_scores_location", "review_scores_value",
  "number_of_reviews", "number_of_reviews_ltm", "number_of_reviews_l30d", "number_of_reviews_ly",
  "reviews_per_month", "minimum_nights", "maximum_nights",
  "availability_30", "availability_60", "availability_90", "availability_365",
  "host_listings_count", "calculated_host_listings_count",
  "calculated_host_listings_count_entire_homes", "calculated_host_listings_count_private_rooms",
  "calculated_host_listings_count_shared_rooms",
  "hosts_time_as_user_years", "hosts_time_as_user_months",
  "hosts_time_as_host_years", "hosts_time_as_host_months",
  "has_reviews",
];

const BOOLEAN_FEATURE_FIELDS = [
  "has_availability", "host_is_superhost", "host_identity_verified", "host_has_profile_pic",
];

function loadListingFeatures() {
  const rows = readCsv(ANALYSIS_DIR, "short_stay_listing_features.csv");
  return rows.map((row) => {
    const out = { ...row };
    for (const f of NUMERIC_FEATURE_FIELDS) out[f] = toNum(row[f]);
    for (const f of BOOLEAN_FEATURE_FIELDS) out[f] = toBool(row[f]);
    out.amenities_list = row.amenities
      ? row.amenities.split(",").map((a) => a.trim()).filter(Boolean)
      : [];
    return out;
  });
}

function loadReviewText() {
  const rows = readCsv(ANALYSIS_DIR, "short_stay_review_text.csv");
  const byListingId = new Map();
  for (const row of rows) {
    byListingId.set(row.listing_id, {
      review_text: row.review_text || "",
      reviews_used: toNum(row.reviews_used) ?? 0,
      latest_review_used: row.latest_review_used || null,
      review_text_length: toNum(row.review_text_length) ?? 0,
    });
  }
  return byListingId;
}

const PROXIMITY_FIELDS = [
  "mrt_station_nearest_km", "mrt_station_count_within_1km",
  "convenience_store_nearest_km", "convenience_store_count_within_1km",
  "supermarket_nearest_km", "supermarket_count_within_1km",
  "mall_nearest_km", "mall_count_within_1km",
  "attraction_nearest_km", "attraction_count_within_1km",
];

function loadProximity() {
  const rows = readCsv(ANALYSIS_DIR, "short_stay_listing_proximity.csv");
  const byListingId = new Map();
  for (const row of rows) {
    const out = {};
    for (const f of PROXIMITY_FIELDS) out[f] = toNum(row[f]);
    byListingId.set(row.listing_id, out);
  }
  return byListingId;
}

function loadPoi() {
  const rows = readCsv(ANALYSIS_DIR, "poi/singapore_poi.csv");
  return rows.map((row) => ({
    osm_id: toNum(row.osm_id),
    osm_type: row.osm_type,
    category: row.category,
    name: row.name,
    latitude: toNum(row.latitude),
    longitude: toNum(row.longitude),
  }));
}

function stripHtml(text) {
  if (!text) return text;
  return text
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// This is a payload-size guard, not a curation choice — the UI already
// reveals reviews 6 at a time ("Show more"), so there's no reason to
// truncate what a listing *has*. But one listing in this dataset carries
// 1,492 reviews, and sending all of those in a single API response just to
// show 6 would be wasteful. 50 covers 1,664 of 1,839 reviewed listings
// (90%) completely; only the most-reviewed 175 get truncated.
const REVIEWS_PER_LISTING_CAP = 50;

// Individual (non-aggregated) reviews — for display. The joined-together
// version in short_stay_review_text.csv is for the future embedding
// pipeline only (its own, separate 20-review cap bounds embedding input
// length — unrelated to this one); a wall of concatenated, multi-language
// text isn't readable as a page, so the UI shows real per-review cards instead.
function loadIndividualReviews() {
  const rows = readCsv(RAW_DATA_DIR, "reviews.csv");
  const byListingId = new Map();
  for (const row of rows) {
    if (!row.comments) continue;
    const list = byListingId.get(row.listing_id) ?? [];
    list.push({
      id: row.id,
      date: row.date,
      reviewer_name: row.reviewer_name,
      comments: stripHtml(row.comments),
    });
    byListingId.set(row.listing_id, list);
  }
  for (const [listingId, list] of byListingId) {
    list.sort((a, b) => (a.date < b.date ? 1 : -1)); // most recent first
    byListingId.set(listingId, list.slice(0, REVIEWS_PER_LISTING_CAP));
  }
  return byListingId;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function loadDataset() {
  const features = loadListingFeatures();
  const reviewText = loadReviewText();
  const individualReviews = loadIndividualReviews();
  const proximity = loadProximity();
  const poi = loadPoi();

  const listings = features.map((listing) => ({
    ...listing,
    ...(reviewText.get(listing.id) ?? {
      review_text: "", reviews_used: 0, latest_review_used: null, review_text_length: 0,
    }),
    reviews: individualReviews.get(listing.id) ?? [],
    proximity: proximity.get(listing.id) ?? null,
  }));

  console.log(`Loaded ${listings.length} listings, ${poi.length} POIs from analysis/`);

  return { listings, poi, haversineKm };
}
