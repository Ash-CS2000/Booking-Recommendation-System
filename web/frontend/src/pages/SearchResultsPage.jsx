import { useEffect, useState, useCallback } from "react";
import { fetchMeta, fetchListings } from "../api";
import SearchBar from "../components/SearchBar";
import FilterPanel from "../components/FilterPanel";
import ListingCard from "../components/ListingCard";
import CardSkeleton from "../components/CardSkeleton";
import Pagination from "../components/Pagination";

const SORT_OPTIONS = [
  { value: "rating_desc", label: "Top rated" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "reviews_desc", label: "Most reviewed" },
];

export default function SearchResultsPage() {
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState({ q: "", sort: "rating_desc", page: 1, pageSize: 12 });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMeta().then(setMeta).catch((e) => setError(e.message));
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    fetchListings(filters)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600">
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M32 0H0V32" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        <div className="relative mx-auto max-w-7xl px-4 pb-28 pt-14 sm:px-6 sm:pb-36 sm:pt-20 lg:px-8">
          <h1 className="font-display max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Find your next short stay in Singapore
          </h1>
          <p className="mt-3 max-w-xl text-base text-brand-100 sm:text-lg">
            {meta ? `${meta.regions.length} regions, thousands of nights available.` : "Loading listings…"}{" "}
            Search by neighbourhood, price, or what you're looking for.
          </p>
          <div className="mt-6 max-w-2xl sm:mt-8">
            <SearchBar initialQuery={filters.q} onSearch={(q) => setFilters((f) => ({ ...f, q, page: 1 }))} />
            {/* Reflects what actually happened on the last request (data.searchMode from
                the backend), not a static claim — semantic search depends on Databricks
                being configured and reachable, so this can genuinely differ per search. */}
            {filters.q && data ? (
              data.searchMode === "semantic" ? (
                <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs font-medium text-brand-100">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-gold-500">
                    <path d="M10 1.5l1.5 4.5 4.5 1.5-4.5 1.5-1.5 4.5-1.5-4.5-4.5-1.5 4.5-1.5z" />
                  </svg>
                  AI search — matching by meaning, not just the exact words
                  {/* Makes an otherwise invisible backend decision visible: a number typed
                      into the sentence itself ("under $200") became a real filter, same as
                      typing it into the Max Price box — this is confirming that happened,
                      not just decoration. */}
                  {data.priceFromQueryText && data.appliedPriceMax ? (
                    <span className="rounded-full bg-white/15 px-2 py-0.5 text-brand-50">
                      capped at ${data.appliedPriceMax} (from your search)
                    </span>
                  ) : null}
                </p>
              ) : (
                <p className="mt-2 text-xs text-brand-200">
                  Keyword search (AI search is temporarily unavailable — showing exact-word matches instead)
                </p>
              )
            ) : (
              <p className="mt-2 text-xs text-brand-200">
                Try a full sentence — our AI understands meaning, not just keywords.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Filters + results */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="relative z-10 -mt-16 mb-6 sm:-mt-20">
          <FilterPanel meta={meta} filters={filters} onChange={setFilters} />
        </div>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-gray-600">
            {loading ? "Searching…" : data ? `${data.total.toLocaleString()} stays found` : null}
          </p>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Sort by</span>
            <select
              value={filters.sort}
              onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value, page: 1 }))}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error ? (
          <div className="rounded-2xl bg-red-50 p-6 text-sm font-medium text-red-700">
            Couldn't load listings: {error}
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : data && data.results.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.results.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              onChange={(page) => {
                setFilters((f) => ({ ...f, page }));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </>
        ) : (
          <div className="rounded-2xl bg-white p-12 text-center shadow-card ring-1 ring-black/5">
            <p className="font-display text-lg font-bold text-gray-900">No stays match those filters</p>
            <p className="mt-1 text-sm text-gray-500">Try widening your price range or clearing a filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
