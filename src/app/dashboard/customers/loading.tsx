export default function CustomersLoading() {
  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-28 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-4 w-44 bg-gray-100 rounded-lg animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-32 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-9 w-32 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/30">
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="overflow-x-auto">
          {/* Table header */}
          <div className="grid grid-cols-6 px-6 py-3 bg-slate-50 border-b border-slate-100 gap-4">
            {[120, 80, 64, 40, 80, 80].map((w, idx) => (
              <div
                key={idx}
                className="h-3 bg-gray-200 rounded animate-pulse"
                style={{ width: `${w}px` }}
              />
            ))}
          </div>

          {/* Table rows */}
          <div className="divide-y divide-slate-50">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                {/* Avatar + name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse flex-shrink-0" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-36 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
                {/* Phone */}
                <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                {/* City */}
                <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                {/* Orders badge */}
                <div className="h-6 w-8 bg-gray-100 rounded-full animate-pulse mx-auto" />
                {/* Total */}
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                {/* Last activity */}
                <div className="h-6 w-24 bg-gray-100 rounded-md animate-pulse ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
