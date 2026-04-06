export default function CategoriesLoading() {
  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-4 w-48 bg-gray-100 rounded-lg animate-pulse" />
        </div>
        <div className="h-9 w-36 bg-gray-200 rounded-xl animate-pulse" />
      </div>

      {/* Category list card */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-28 bg-gray-100 rounded-xl animate-pulse" />
        </div>

        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 px-6 py-4">
              {/* Drag handle */}
              <div className="w-4 h-4 bg-gray-100 rounded animate-pulse flex-shrink-0" />
              {/* Icon */}
              <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse flex-shrink-0" />
              {/* Name */}
              <div className="flex-1 space-y-1">
                <div
                  className="h-4 bg-gray-200 rounded animate-pulse"
                  style={{ width: `${80 + (i % 3) * 30}px` }}
                />
              </div>
              {/* Product count badge */}
              <div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" />
              {/* Actions */}
              <div className="flex gap-1">
                <div className="w-7 h-7 bg-gray-100 rounded-lg animate-pulse" />
                <div className="w-7 h-7 bg-gray-100 rounded-lg animate-pulse" />
                <div className="w-7 h-7 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
