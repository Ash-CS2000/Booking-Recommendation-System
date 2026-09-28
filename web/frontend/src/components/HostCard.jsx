import Badge from "./Badge";

const AVATAR_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23dbe6ff'/%3E%3C/svg%3E";

export default function HostCard({ listing }) {
  const years = listing.hosts_time_as_host_years ?? null;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-black/5">
      <div className="flex items-center gap-4">
        <img
          src={listing.host_picture_url || AVATAR_FALLBACK}
          onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)}
          alt={listing.host_name}
          className="h-16 w-16 rounded-full object-cover ring-2 ring-white shadow-sm"
        />
        <div>
          <p className="font-display text-lg font-bold text-gray-900">
            Hosted by {listing.host_name || "this host"}
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {listing.host_is_superhost ? <Badge variant="brand">★ Superhost</Badge> : null}
            {listing.host_identity_verified ? <Badge variant="neutral">✓ Identity verified</Badge> : null}
            {years !== null ? <Badge variant="neutral">{years}+ yrs hosting</Badge> : null}
          </div>
        </div>
      </div>

      {listing.host_about ? (
        <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-gray-600">{listing.host_about}</p>
      ) : null}

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 text-sm">
        {listing.host_location ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Based in</dt>
            <dd className="font-medium text-gray-800">{listing.host_location}</dd>
          </div>
        ) : null}
        {listing.calculated_host_listings_count ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Listings</dt>
            <dd className="font-medium text-gray-800">{listing.calculated_host_listings_count} on Nestay</dd>
          </div>
        ) : null}
      </dl>

      {listing.host_url ? (
        <a
          href={listing.host_url}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-4 inline-flex text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          View host profile →
        </a>
      ) : null}
    </div>
  );
}
