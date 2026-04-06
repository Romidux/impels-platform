export default function CouponsLoading() {
  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-28 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-4 w-44 bg-gray-100 rounded-lg animate-pulse" />
        </div>
        <div className="h-9 w-36 bg-gray-200 rounded-xl animate-pulse" />
      </div>

      {/* Coupons card */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Table header */}
        <div className="hidden md:flex items-center gap-6 px-6 py-3 bg-slate-50 border-b border-slate-100">
          {[64, 80, 56, 56, 48, 80].map((w, idx) => (
            <div
              key={idx}
              className="h-3 bg-gray-200 rounded animate-pulse"
              style={{ width: `${w}px` }}
            />
          ))}
        </div>

        {/* Coupon rows */}
        <div className="divide-y divide-slate-50">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-6 px-6 py-4">
              {/* Code */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gray-100 rounded-lg animate-pulse flex-shrink-0" />
                <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
              {/* Type badge */}
              <div className="h-5 w-20 bg-gray-100 rounded-full animate-pulse" />
              {/* Value */}
              <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
              {/* Min purchase */}
              <div className="h-4 w-14 bg-gray-100 rounded animate-pulse" />
              {/* Usage */}
              <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
              {/* Actions */}
              <div className="flex gap-2 ml-auto">
                <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse" />
                <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
