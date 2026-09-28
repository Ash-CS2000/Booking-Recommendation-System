/**
 * Talks to two things this backend doesn't own:
 *   1. The local embedding service (web/embedding-service) — turns query
 *      text into the same kind of vector the Vector Search index holds.
 *   2. Databricks Vector Search — finds the nearest chunks to that vector.
 *
 * NOT verified end-to-end against a real Databricks workspace — I don't
 * have credentials for one. The embedding service call IS verified (see
 * web/embedding-service). If step 2 errors or isn't configured, the
 * caller (server.js) falls back to keyword search — that path is
 * unaffected either way.
 */

const EMBEDDING_SERVICE_URL = process.env.EMBEDDING_SERVICE_URL || "http://localhost:5001";
const DATABRICKS_HOST = process.env.DATABRICKS_HOST;         // e.g. https://<workspace>.cloud.databricks.com
const DATABRICKS_TOKEN = process.env.DATABRICKS_TOKEN;       // a personal access token — keep in .env, never in frontend code
const DATABRICKS_VS_INDEX = process.env.DATABRICKS_VS_INDEX; // full 3-part name, e.g. main.booking_system.documents_index

export function isConfigured() {
  return Boolean(DATABRICKS_HOST && DATABRICKS_TOKEN && DATABRICKS_VS_INDEX);
}

async function embedQuery(text) {
  const res = await fetch(`${EMBEDDING_SERVICE_URL}/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, kind: "query" }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`embedding service returned ${res.status}: ${body.slice(0, 200)}`);
  }
  const { embedding } = await res.json();
  return embedding;
}

// Databricks Vector Search's filter syntax: a plain key means equals; a key
// suffixed "col <=" / "col >=" means that comparison. Only the filters this
// app actually offers are translated here.
export function buildFilters({ priceMin, priceMax, region, neighbourhood, roomType }) {
  const filters = {};
  if (priceMin) filters["price >="] = Number(priceMin);
  if (priceMax) filters["price <="] = Number(priceMax);
  if (region) filters["neighbourhood_group_cleansed"] = region;
  if (neighbourhood) filters["neighbourhood_cleansed"] = neighbourhood;
  if (roomType) filters["room_type"] = roomType;
  return filters;
}

async function queryIndex(queryVector, filters, numResults) {
  const url = `${DATABRICKS_HOST}/api/2.0/vector-search/indexes/${DATABRICKS_VS_INDEX}/query`;
  const body = {
    query_vector: queryVector,
    columns: ["listing_id", "doc_type"],
    num_results: numResults,
  };
  if (Object.keys(filters).length > 0) body.filters_json = JSON.stringify(filters);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DATABRICKS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Vector Search returned ${res.status}: ${errText.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.result?.data_array ?? [];
}

/**
 * Returns listing IDs ranked by relevance to `queryText` (best first).
 * The index holds CHUNKS (a listing can have a `listing` chunk and one or
 * more `reviews` chunks), so several rows can share a listing_id — this
 * keeps only each listing's first (best) occurrence. Databricks returns
 * data_array already sorted by relevance, so "first occurrence" is always
 * that listing's best-matching chunk; this way we never have to know or
 * assume whether the underlying distance metric ranks low-to-high or the
 * reverse.
 */
export async function semanticSearchListingIds(queryText, filters, { maxCandidates = 200 } = {}) {
  if (!isConfigured()) {
    throw new Error("Vector Search is not configured (DATABRICKS_HOST/TOKEN/VS_INDEX missing)");
  }

  const queryVector = await embedQuery(queryText);
  const rows = await queryIndex(queryVector, buildFilters(filters), maxCandidates);

  const seen = new Set();
  const ranked = [];
  for (const [listingId] of rows) {
    if (seen.has(listingId)) continue;
    seen.add(listingId);
    ranked.push(listingId);
  }
  return ranked;
}
