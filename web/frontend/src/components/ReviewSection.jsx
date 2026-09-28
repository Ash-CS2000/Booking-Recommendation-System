import { useState } from "react";
import StarRating from "./StarRating";

const SUBSCORES = [
  ["review_scores_cleanliness", "Cleanliness"],
  ["review_scores_accuracy", "Accuracy"],
  ["review_scores_checkin", "Check-in"],
  ["review_scores_communication", "Communication"],
  ["review_scores_location", "Location"],
  ["review_scores_value", "Value"],
];

const AVATAR_COLORS = [
  "bg-brand-100 text-brand-700",
  "bg-accent-100 text-accent-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
];

function avatarColor(name) {
  const idx = (name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function ReviewCard({ review }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.comments.length > 320;
  const shown = expanded || !isLong ? review.comments : review.comments.slice(0, 320) + "…";

  return (
    <div className="rounded-xl border border-gray-100 p-4">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarColor(
            review.reviewer_name
          )}`}
        >
          {review.reviewer_name?.[0]?.toUpperCase() ?? "?"}
        </span>
        <div>
          <p className="text-sm font-semibold text-gray-900">{review.reviewer_name}</p>
          <p className="text-xs text-gray-400">{formatDate(review.date)}</p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-gray-700">{shown}</p>
      {isLong ? (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}

export default function ReviewSection({ listing }) {
  const [visibleCount, setVisibleCount] = useState(6);
  const reviews = listing.reviews ?? [];

  if (!listing.has_reviews || reviews.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center shadow-card ring-1 ring-black/5">
        <p className="font-display text-base font-bold text-gray-900">No reviews yet</p>
        <p className="mt-1 text-sm text-gray-500">This listing is new — be among the first to stay.</p>
      </div>
    );
  }

  const visible = reviews.slice(0, visibleCount);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-black/5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StarRating
          rating={listing.review_scores_rating}
          reviewCount={listing.number_of_reviews}
          hasReviews={listing.has_reviews}
          size="lg"
        />
        <span className="text-xs text-gray-400">Showing the {reviews.length} most recent reviews</span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-y border-gray-100 py-4 sm:grid-cols-3">
        {SUBSCORES.map(([key, label]) =>
          listing[key] !== null && listing[key] !== undefined ? (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{label}</span>
              <span className="font-semibold text-gray-800">{listing[key].toFixed(1)}</span>
            </div>
          ) : null
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {visible.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {visibleCount < reviews.length ? (
        <button
          onClick={() => setVisibleCount((c) => c + 6)}
          className="mt-5 w-full rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Show more reviews ({reviews.length - visibleCount} left)
        </button>
      ) : null}
    </div>
  );
}
