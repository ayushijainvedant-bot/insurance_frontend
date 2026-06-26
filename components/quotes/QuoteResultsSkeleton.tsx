export default function QuoteResultsSkeleton() {
  const shimmer =
    "animate-pulse rounded-lg bg-line";
  const cards = Array.from({ length: 3 });

  return (
    <div className="space-y-4">
      {cards.map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-line bg-white p-5 shadow-sm"
        >
          {/* Header row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 shrink-0 rounded-xl ${shimmer}`} />
              <div className="space-y-2">
                <div className={`h-4 w-32 ${shimmer}`} />
                <div className={`h-3 w-20 ${shimmer}`} />
              </div>
            </div>
            <div className="text-right space-y-2">
              <div className={`h-7 w-24 ${shimmer}`} />
              <div className={`h-3 w-16 ${shimmer}`} />
            </div>
          </div>

          {/* Body */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[1, 2, 3].map((j) => (
              <div key={j} className={`h-14 rounded-xl ${shimmer}`} />
            ))}
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className={`h-8 w-40 ${shimmer}`} />
            <div className="flex gap-2">
              <div className={`h-9 w-28 ${shimmer}`} />
              <div className={`h-9 w-24 ${shimmer}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
