export default function StarRating({ rating, reviewCount, hasReviews, size = "sm" }) {
  const textSize = size === "lg" ? "text-base" : "text-sm";

  if (!hasReviews || rating === null || rating === undefined) {
    return (
      <span className={`inline-flex items-center gap-1 ${textSize} font-medium text-gray-500`}>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
          New
        </span>
        No reviews yet
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 ${textSize} font-semibold text-gray-900`}>
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-gold-500">
        <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3-5.4 3 1.3-6-4.6-4.1 6.1-.6z" />
      </svg>
      {rating.toFixed(2)}
      {reviewCount ? (
        <span className="font-normal text-gray-500">· {reviewCount.toLocaleString()} reviews</span>
      ) : null}
    </span>
  );
}
