# Nestay — AI-Powered Booking Search & Recommendation System

An end-to-end project that turns raw Singapore short-stay listing data into a
working semantic search web app: data cleaning → feature engineering →
geospatial enrichment → deep learning embeddings on Databricks → a full-stack
React/Node.js application with hybrid AI + structured search.

**Live demo:** not deployed — see [Running it locally](#running-it-locally).

## What it does

Type a sentence like *"quiet studio near MRT under $200"* into the search
bar. The query is tokenized and embedded with a pretrained multilingual
transformer (`intfloat/multilingual-e5-small`, 117M parameters), compared
against listing/review embeddings stored in a Databricks Vector Search
index, and combined with structured filters (price, location, room type) —
including automatically detecting explicit numbers ("under $200") as hard
filters, and fuzzy preference words ("cheap", "near MRT") as ranking boosts.
The search bar itself shows this understanding live, as you type.

## Project structure

```
raw data/           Source CSVs (Singapore Airbnb-style listings, calendar, reviews)
analysis/           Jupyter notebooks: data cleaning, feature selection, POI
                     collection, and the Databricks tokenize/embed/index pipeline
web/
  backend/          Node.js/Express API — serves listings, runs semantic +
                     keyword search, talks to Databricks Vector Search
  frontend/         React (Vite) + Tailwind — search UI, listing detail pages,
                     interactive map
  embedding-service/  Small Python service that embeds search queries with
                       the same model used to build the index
DATA_PREPARATION.md   Full write-up of the data pipeline
web/README.md         Backend/frontend setup and API reference
```

## Pipeline summary

1. **Data prep** — filtered ~1.18M calendar rows to "short-stay" listings
   (`minimum_nights < 29`), selected and cleaned 59 features across 1,483
   listings (`DATA_PREPARATION.md` has the full detail: null-handling
   strategy, type fixes, dropped columns and why).
2. **Geospatial enrichment** — pulled 2,000 points of interest (MRT
   stations, malls, attractions) from OpenStreetMap and computed per-listing
   proximity via haversine distance.
3. **Deep learning** — tokenized and chunked listing/review text (2,912
   chunks), embedded with a pretrained transformer, and indexed in
   Databricks Vector Search for similarity-based retrieval.
4. **Application** — a React/Node.js web app serving that search over a
   real UI, with a keyword-search fallback if the vector index is
   unreachable, and a rule-based layer that catches what pure embeddings
   can't (exact numbers, "cheap"/"near X" preferences).

## Tech stack

**Data/ML:** Python, Pandas, PySpark, Databricks (Delta Lake, Vector Search),
Hugging Face Transformers, Sentence-Transformers
**Backend:** Node.js, Express
**Frontend:** React, Vite, Tailwind CSS, Leaflet (OpenStreetMap)
**Data sources:** Singapore short-term rental listing data, OpenStreetMap
(Overpass API)

## Running it locally

Three services, three terminals:

```bash
# 1. Query-embedding service (Python)
cd web/embedding-service && pip install -r requirements.txt && python app.py

# 2. Backend API (Node.js) — copy .env.example to .env and fill in
#    Databricks credentials to enable semantic search (optional; falls
#    back to keyword search if not configured)
cd web/backend && npm install && npm run dev

# 3. Frontend (React)
cd web/frontend && npm install && npm run dev
```

Then open `http://localhost:5173`. See `web/README.md` for the full API
reference and Databricks setup notes.

## Notebooks

Run in this order (each depends on the previous one's output):

1. `analysis/short_stay_nights.ipynb`
2. `analysis/short_stay_detailed_listings.ipynb`
3. `analysis/short_stay_review_text.ipynb`
4. `analysis/poi_proximity_features.ipynb`
5. `analysis/databricks/import_to_delta.ipynb` *(run inside Databricks)*
6. `analysis/databricks/embed_to_vector_search.ipynb` *(run inside Databricks)*

## Known limitations

- No trained ranking/personalization model yet — the search uses a
  pretrained embedding model for retrieval; ranking on real user
  interaction data is a natural next step once the app has real usage.
- MRT/LRT station coverage from OpenStreetMap is likely incomplete (93
  found vs. Singapore's actual 180+ network) — other POI categories are
  more complete.
- No authentication/booking flow — public search and browsing only, by
  design.
