export default function AdminOverviewLoading() {
  return (
    <div className="space-y-8">
      {/* Stats section skeleton */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-6">
        <div className="mb-6 space-y-2">
          <div className="h-7 w-52 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-4 w-80 bg-gray-100 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-[24px] border border-slate-200 bg-white p-5"
            >
              <div className="w-11 h-11 bg-gray-100 rounded-2xl animate-pulse" />
              <div className="mt-6 space-y-2">
                <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                <div className="h-8 w-10 bg-gray-200 rounded-xl animate-pulse" />
                <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Two-column grid skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.45fr,0.95fr] gap-5">
        {/* Alerts card */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-36 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="divide-y divide-slate-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-4 px-6 py-5">
                <div className="h-5 w-12 bg-gray-100 rounded-full animate-pulse mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-64 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar: 2 stacked cards */}
        <div className="space-y-5">
          {[1, 2].map((card) => (
            <div
              key={card}
              className="rounded-2xl border border-slate-200 bg-white overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
                <div className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="divide-y divide-slate-100">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-6 py-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-2xl animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                    </div>
                    <div className="h-5 w-20 bg-gray-100 rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer bar */}
      <div className="h-12 bg-white rounded-2xl border border-slate-200 animate-pulse" />
    </div>
  );
}
