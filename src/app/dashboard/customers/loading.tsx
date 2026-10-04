export default function CustomersLoading() {
  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="h-7 w-28 bg-neutral-200 rounded-xl animate-pulse" />
          <div className="h-4 w-44 bg-neutral-100 rounded-lg animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-32 bg-neutral-100 rounded-xl animate-pulse" />
          <div className="h-9 w-32 bg-neutral-200 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Table card */}
      <div className="dash-card overflow-hidden">
        <div className="p-4 border-b border-neutral-100 bg-neutral-50/30">
          <div className="h-5 w-32 bg-neutral-200 rounded animate-pulse" />
        </div>
        <div className="overflow-x-auto">
          {/* Table header */}
          {/* Las columnas aparecen en los mismos breakpoints que la tabla real:
              si el esqueleto muestra seis y la tabla dos, el salto se ve. */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 px-6 py-3 bg-neutral-50 border-b border-neutral-100 gap-4">
            {[
              { w: 120, cls: "" },
              { w: 80, cls: "" },
              { w: 64, cls: "hidden lg:block" },
              { w: 40, cls: "hidden sm:block" },
              { w: 80, cls: "hidden md:block" },
              { w: 80, cls: "hidden lg:block" },
            ].map(({ w, cls }, idx) => (
              <div
                key={idx}
                className={`h-3 bg-neutral-200 rounded animate-pulse ${cls}`}
                style={{ width: `${w}px` }}
              />
            ))}
          </div>

          {/* Table rows */}
          <div className="divide-y divide-neutral-50">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                {/* Avatar + name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-neutral-100 rounded-full animate-pulse flex-shrink-0" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-28 bg-neutral-200 rounded animate-pulse" />
                    <div className="h-3 w-36 bg-neutral-100 rounded animate-pulse" />
                  </div>
                </div>
                {/* Phone */}
                <div className="h-4 w-24 bg-neutral-100 rounded animate-pulse" />
                {/* City */}
                <div className="hidden lg:block h-4 w-16 bg-neutral-100 rounded animate-pulse" />
                {/* Orders badge */}
                <div className="hidden sm:block h-6 w-8 bg-neutral-100 rounded-full animate-pulse mx-auto" />
                {/* Total */}
                <div className="hidden md:block h-4 w-20 bg-neutral-200 rounded animate-pulse" />
                {/* Last activity */}
                <div className="hidden lg:block h-6 w-24 bg-neutral-100 rounded-md animate-pulse ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
