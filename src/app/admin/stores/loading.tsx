export default function AdminStoresLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-4 w-56 bg-gray-100 rounded-lg animate-pulse" />
        </div>
        <div className="h-9 w-32 bg-gray-200 rounded-xl animate-pulse" />
      </div>

      {/* Quick filter pills */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-8 w-24 bg-gray-100 rounded-full animate-pulse"
          />
        ))}
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* Filters row */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="h-9 w-56 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-9 w-32 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-9 w-32 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-9 w-28 bg-gray-100 rounded-xl animate-pulse" />
          <div className="ml-auto h-5 w-24 bg-gray-100 rounded animate-pulse" />
        </div>

        {/* Table header */}
        <div className="hidden md:grid grid-cols-8 px-6 py-3 bg-slate-50 border-b border-slate-100 gap-4">
          {[80, 56, 64, 48, 64, 56, 56, 40].map((w, idx) => (
            <div
              key={idx}
              className={`h-3 bg-gray-200 rounded animate-pulse`}
              style={{ width: `${w}%` }}
            />
          ))}
        </div>

        {/* Table rows */}
        <div className="divide-y divide-slate-50">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-6 py-4"
            >
              <div className="w-9 h-9 bg-gray-100 rounded-xl animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="hidden md:flex items-center gap-6 ml-auto">
                <div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" />
                <div className="h-5 w-20 bg-gray-100 rounded-full animate-pulse" />
                <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                <div className="h-8 w-8 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
