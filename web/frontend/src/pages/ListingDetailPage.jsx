import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchListing } from "../api";
import StarRating from "../components/StarRating";
import Badge from "../components/Badge";
import HostCard from "../components/HostCard";
import MapView from "../components/MapView";
import NearbyPlaces from "../components/NearbyPlaces";
import ReviewSection from "../components/ReviewSection";

const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='500'%3E%3Crect width='800' height='500' fill='%23eef0f3'/%3E%3C/svg%3E";

function Fact({ label, value }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex flex-col items-center rounded-xl bg-white px-4 py-3 text-center shadow-card ring-1 ring-black/5">
      <span className="font-display text-lg font-extrabold text-gray-900">{value}</span>
      <span className="text-xs font-medium text-gray-500">{label}</span>
    </div>
  );
}

export default function ListingDetailPage() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setListing(null);
    setError(null);
    fetchListing(id)
      .then(setListing)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="font-display text-xl font-bold text-gray-900">Listing not found</p>
        <p className="mt-2 text-sm text-gray-500">{error}</p>
        <Link to="/" className="mt-6 inline-block text-sm font-semibold text-brand-600">
          ← Back to search
        </Link>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="skeleton h-96 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-brand-600">
        ← Back to search
      </Link>

      {/* Hero image */}
      <div className="relative h-72 w-full overflow-hidden rounded-3xl bg-gray-100 sm:h-104">
        <img
          src={listing.picture_url || FALLBACK_IMG}
          onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
          alt={listing.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
          {listing.host_is_superhost ? <Badge variant="brand">★ Superhost</Badge> : null}
          <Badge variant="neutral">{listing.room_type}</Badge>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-8 lg:col-span-2">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
              {listing.name}
            </h1>
            <p className="mt-1.5 text-sm font-medium text-gray-500">
              {listing.neighbourhood_cleansed}, {listing.neighbourhood_group_cleansed} · {listing.property_type}
            </p>
            <div className="mt-3">
              <StarRating
                rating={listing.review_scores_rating}
                reviewCount={listing.number_of_reviews}
                hasReviews={listing.has_reviews}
                size="lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Fact label="Guests" value={listing.accommodates} />
            <Fact label="Bedrooms" value={listing.bedrooms ?? "Studio"} />
            <Fact label="Beds" value={listing.beds} />
            <Fact label="Bathrooms" value={listing.bathrooms_text} />
          </div>

          {listing.description ? (
            <div>
              <h2 className="font-display text-lg font-bold text-gray-900">About this place</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                {listing.description}
              </p>
            </div>
          ) : null}

          {listing.amenities_list?.length ? (
            <div>
              <h2 className="font-display text-lg font-bold text-gray-900">What this place offers</h2>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                {listing.amenities_list.map((a) => (
                  <div key={a} className="flex items-center gap-2 text-sm text-gray-700">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-brand-500">
                      <path
                        fillRule="evenodd"
                        d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="truncate">{a}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <h2 className="font-display text-lg font-bold text-gray-900">Getting around</h2>
            <p className="mt-1 text-sm text-gray-500">Distances to nearby MRT, shops, and attractions.</p>
            <div className="mt-3">
              <NearbyPlaces nearby={listing.nearby} />
            </div>
            <div className="mt-4">
              <MapView latitude={listing.latitude} longitude={listing.longitude} nearby={listing.nearby} />
            </div>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-gray-900">Reviews</h2>
            <div className="mt-3">
              <ReviewSection listing={listing} />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="sticky top-24 space-y-6">
            <div className="rounded-2xl bg-white p-5 shadow-card-hover ring-1 ring-black/5">
              <div className="flex items-baseline gap-1">
                {listing.price !== null && listing.price !== undefined ? (
                  <>
                    <span className="font-display text-3xl font-extrabold text-gray-900">
                      ${listing.price.toFixed(0)}
                    </span>
                    <span className="text-sm font-medium text-gray-500">/ night</span>
                  </>
                ) : (
                  <span className="font-display text-xl font-extrabold text-gray-500">Price on request</span>
                )}
              </div>
              <dl className="mt-4 space-y-2 border-y border-gray-100 py-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Minimum stay</dt>
                  <dd className="font-semibold text-gray-800">{listing.minimum_nights} nights</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Available (next 90d)</dt>
                  <dd className="font-semibold text-gray-800">{listing.availability_90} nights</dd>
                </div>
              </dl>
              {listing.listing_url ? (
                <a
                  href={listing.listing_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-4 block rounded-xl bg-accent-500 px-4 py-3 text-center text-sm font-bold text-white shadow-sm transition hover:bg-accent-600 active:scale-[0.98]"
                >
                  View & book on Airbnb
                </a>
              ) : null}
              <p className="mt-2 text-center text-xs text-gray-400">You won't be charged yet</p>
            </div>

            <HostCard listing={listing} />
          </div>
        </div>
      </div>
    </div>
  );
}
