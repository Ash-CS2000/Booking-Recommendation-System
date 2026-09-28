# Data Preparation

How the source data was collected, filtered, and shaped into the datasets used
for the search/recommendation system and the web app. All work lives in
Jupyter notebooks under `analysis/`; `raw data/` is never modified.

## 1. Raw data

Singapore short-term rental listing data, in `raw data/`:

| File | Grain | Contents |
|---|---|---|
| `listings.csv` | 1 row / listing | Summary listing fields (3,247 listings) |
| `detailed_listings.csv` | 1 row / listing | Full listing detail — pricing, host, amenities, review scores, etc. (3,097 listings) |
| `calendar.csv` | 1 row / listing / night | Daily availability and minimum/maximum night requirements (1,185,155 rows) |
| `reviews.csv` | 1 row / review | Individual guest reviews — reviewer, date, comment text (41,265 rows) |
| `neighbourhoods.csv` | 1 row / neighbourhood | The 55 official neighbourhood → region mappings |

`neighbourhoods.geojson` (project root) holds the boundary polygons for
those same 55 neighbourhoods — used for map display, not listing data.

## 2. Defining "short stay"

**Notebook:** `analysis/short_stay_nights.ipynb`

A calendar night is a **short-stay night** when `minimum_nights < 29`.
Applied to `calendar.csv`:

- 593,456 of 1,185,155 nights (50.1%) qualify
- 1,633 of 3,247 listings offer at least one short-stay night

**Output:** `analysis/short_stay_nights.csv` — the filtered calendar rows.

## 3. Listing feature selection

**Notebook:** `analysis/short_stay_detailed_listings.ipynb`

`detailed_listings.csv` is filtered down to the 1,633 short-stay listing
IDs, matching 1,483 rows (`detailed_listings.csv` covers 3,097 of the
3,247 listings in `listings.csv` overall).

From the 90 available columns, 59 are kept, organized by how they're used:

| Group | Count | Purpose |
|---|---|---|
| **Text** (`name`, `description`, `amenities`, `property_type`, `room_type`) | 5 | Input for embedding-based semantic search |
| **Structured** (price, location, capacity, review scores, availability, minimum/maximum nights, etc.) | 31 | Filtering and ranking for the model, also shown on the page |
| **Host profile / display** (host name, photo, bio, verification badges, hosting tenure, license, etc.) | 21 | Web UI only — not used by the model |
| **Keys** (`id`, `host_id`) | 2 | Join keys |

Columns were dropped when they were: completely empty in this dataset (12
columns — verified, not assumed), pure scraping metadata (`scrape_id`,
`last_scraped`, etc.), redundant with a kept column (numeric `bathrooms` vs.
the more complete `bathrooms_text`; several duplicate min/max-nights
variants), a date-specific price quote rather than a stable price, or
internal host business metrics not relevant to a guest.

Cleaning applied during selection:
- `price` converted from currency-formatted text (`"$114.00"`) to a numeric value
- `amenities` converted from a JSON-encoded string to clean, readable text
- `description` had embedded HTML markup removed
- A `has_reviews` flag was added (`number_of_reviews > 0`) so the ~36% of
  listings with no reviews yet are distinguishable from missing data —
  their review-score fields are intentionally left null rather than
  imputed, since the null itself is meaningful (new listing, no track
  record yet)

**Output:** `analysis/short_stay_listing_features.csv` — 1,483 rows × 59 columns.

## 4. Review text

**Notebook:** `analysis/short_stay_review_text.ipynb`

For the future embedding step, each listing's most recent 20 reviews (from
`reviews.csv`) are combined into a single cleaned text field — HTML
stripped, one row per listing at the same grain as the feature file. This
aggregated version is for the model; the web app displays reviews
individually rather than as this combined blob.

**Output:** `analysis/short_stay_review_text.csv` — 1,483 rows, joins 1:1 on `listing_id`.

## 5. Location & nearby-places data

**Notebook:** `analysis/poi_proximity_features.ipynb`

Points of interest relevant to travelers were collected from OpenStreetMap
(Overpass API) across five categories: MRT/train stations, convenience
stores, supermarkets, malls, and attractions. This was a one-time pull —
the result is cached locally, so no live API calls are needed afterward,
and no paid mapping API (e.g. Google Maps) was required.

**Output:** `analysis/poi/singapore_poi.csv` — 2,000 POIs (name, category, coordinates).

For every short-stay listing, straight-line (haversine) distance to the
nearest POI in each category was computed, along with a count of POIs
within 1km.

**Output:** `analysis/short_stay_listing_proximity.csv`

## 6. How the datasets fit together

Each dataset is kept at its own natural grain — one row per listing, one
row per review, one row per calendar night, one row per POI — rather than
flattened into a single file. They're joined by `listing_id` only at the
point of use (e.g. when the web backend assembles a listing's detail page,
or when a future training pipeline builds its input table). This avoids
duplicating a listing's 59 static columns across hundreds of calendar or
review rows.

| File | Grain | Rows | Role |
|---|---|---|---|
| `short_stay_nights.csv` | listing × night | 593,456 | Availability lookup |
| `short_stay_listing_features.csv` | listing | 1,483 | Core features — filtering, ranking, display |
| `short_stay_review_text.csv` | listing | 1,483 | Aggregated review text for embeddings |
| `short_stay_listing_proximity.csv` | listing | 1,483 | Nearby-places distances |
| `poi/singapore_poi.csv` | POI | 2,000 | Map display, proximity source data |
| `reviews.csv` (raw) | review | 41,265 | Individual reviews — used directly for display, and reserved for future personalization work |

## 7. Tokenizing, embedding, and vector search (Databricks)

**Notebooks:** `analysis/databricks/import_to_delta.ipynb`, `analysis/databricks/embed_to_vector_search.ipynb`

The four listing-level files above were imported into Databricks as Delta
tables, then combined into search documents: one `listing` document per
listing (name, type, location, description, amenities) and one `reviews`
document per listing with reviews (the aggregated review text).

Each document was tokenized with the embedding model's own tokenizer
(`intfloat/multilingual-e5-small`, chosen for its multilingual reviews) and
any document over the model's input limit was split into overlapping
480-token chunks so no text was truncated. Every chunk was embedded (384
dimensions) and written to a `documents` Delta table alongside the
listing's filterable fields (price, region, room type, ratings, distances
to nearby places). A Vector Search endpoint and index were built over that
table.

This produced 2,912 chunks (1,483 `listing` chunks + 1,429 `reviews`
chunks across 950 listings with reviews), confirmed working end to end with
a filtered similarity search (a "quiet, near MRT, under $200" query
correctly returned only listings at or under $200).

**Not yet connected:** the web app's search still runs on keyword matching
against the CSVs, as originally planned — this step was intentionally kept
as preparation, not a live feature yet.

## Status

Done: feature selection and cleaning, review text, POI/proximity, and
now tokenizing + embedding + a working vector index. Not yet started:
a general feature-engineering pass on the structured columns (imputation
strategy for remaining nulls, scaling, categorical encoding), and wiring
the vector index into the web app's search endpoint.
