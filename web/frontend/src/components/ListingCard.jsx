import { Link } from "react-router-dom";
import StarRating from "./StarRating";
import Badge from "./Badge";

const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23eef0f3'/%3E%3C/svg%3E";

export default function ListingCard({ listing }) {
  return (
    <Link
      to={`/listing/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-card-hover"
    >
      <div className="relative aspect-4/3 w-full overflow-hidden bg-gray-100">
        <img
          src={listing.picture_url || FALLBACK_IMG}
          onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
          alt={listing.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {listing.host_is_superhost ? <Badge variant="brand">★ Superhost</Badge> : null}
          {listing.minimum_nights <= 3 ? <Badge variant="accent">Flexible stay</Badge> : null}
        </div>
        <div className="absolute bottom-3 left-3 rounded-xl bg-white/95 px-3 py-1.5 shadow-sm backdrop-blur">
          {listing.price !== null && listing.price !== undefined ? (
            <>
              <span className="font-display text-lg font-extrabold text-gray-900">
                ${listing.price.toFixed(0)}
              </span>
              <span className="text-xs font-medium text-gray-500"> / night</span>
            </>
          ) : (
            <span className="text-xs font-semibold text-gray-500">Price on request</span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-display text-base font-bold leading-snug text-gray-900">
            {listing.name}
          </h3>
        </div>

        <p className="text-sm text-gray-500">
          {listing.neighbourhood_cleansed}, {listing.neighbourhood_group_cleansed}
        </p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
          <span>{listing.room_type}</span>
          <span className="text-gray-300">·</span>
          <span>{listing.accommodates} guests</span>
          {listing.bedrooms ? (
            <>
              <span className="text-gray-300">·</span>
              <span>{listing.bedrooms} bed{listing.bedrooms > 1 ? "s" : ""}</span>
            </>
          ) : null}
        </div>

        {listing.mrt_nearest_km !== null && listing.mrt_nearest_km !== undefined ? (
          <p className="flex items-center gap-1 text-xs font-medium text-brand-600">
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
              <path
                d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
            </svg>
            {(listing.mrt_nearest_km * 1000).toFixed(0)}m to nearest MRT
          </p>
        ) : null}

        <div className="mt-auto pt-1">
          <StarRating
            rating={listing.review_scores_rating}
            reviewCount={listing.number_of_reviews}
            hasReviews={listing.has_reviews}
          />
        </div>
      </div>
    </Link>
  );
}
