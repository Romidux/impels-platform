export default function AppearanceLoading() {
  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <div className="h-8 w-36 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-4 w-56 bg-gray-100 rounded-lg animate-pulse mt-2" />
      </div>

      {[1, 2].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4"
        >
          <div className="h-6 w-32 bg-gray-200 rounded-lg animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
