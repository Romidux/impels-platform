export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-4 w-32 bg-gray-100 rounded-lg animate-pulse mt-2" />
        </div>
        <div className="h-10 w-36 bg-gray-200 rounded-xl animate-pulse" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gray-100 rounded-xl animate-pulse" />
              <div className="h-4 w-24 bg-gray-100 rounded-lg animate-pulse" />
            </div>
            <div className="h-8 w-20 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="h-6 w-40 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="divide-y divide-gray-50">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <div className="w-10 h-10 bg-gray-100 rounded-xl animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-3 w-24 bg-gray-50 rounded-lg animate-pulse" />
              </div>
              <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
