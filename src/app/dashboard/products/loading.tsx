export default function ProductsLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-40 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-4 w-56 bg-gray-100 rounded-lg animate-pulse mt-2" />
        </div>
        <div className="h-10 w-40 bg-blue-200 rounded-xl animate-pulse" />
      </div>

      {/* Product grid */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex gap-3">
          <div className="h-10 flex-1 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-10 w-32 bg-gray-100 rounded-xl animate-pulse" />
        </div>
        <div className="divide-y divide-gray-50">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <div className="w-14 h-14 bg-gray-100 rounded-xl animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-3 w-24 bg-gray-100 rounded-lg animate-pulse" />
              </div>
              <div className="h-5 w-20 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
              <div className="flex gap-2">
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
