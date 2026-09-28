const VARIANTS = {
  brand: "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200",
  accent: "bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent-200",
  neutral: "bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200",
  gold: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
};

export default function Badge({ children, variant = "neutral", icon }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${VARIANTS[variant]}`}
    >
      {icon}
      {children}
    </span>
  );
}
