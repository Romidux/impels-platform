export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <div className="h-8 w-44 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-4 w-64 bg-gray-100 rounded-lg animate-pulse mt-2" />
      </div>

      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4"
        >
          <div className="h-6 w-36 bg-gray-200 rounded-lg animate-pulse" />
          <div className="space-y-3">
            <div className="h-4 w-20 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-10 w-full bg-gray-100 rounded-xl animate-pulse" />
          </div>
          <div className="space-y-3">
            <div className="h-4 w-28 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-10 w-full bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
