export default function TeamLoading() {
  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-28 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-4 w-48 bg-gray-100 rounded-lg animate-pulse mt-2" />
        </div>
        <div className="h-10 w-40 bg-blue-200 rounded-xl animate-pulse" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-6 py-4 border-b border-gray-50 last:border-0"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-36 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-3 w-24 bg-gray-100 rounded-lg animate-pulse" />
            </div>
            <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
