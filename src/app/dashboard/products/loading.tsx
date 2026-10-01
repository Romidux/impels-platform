const SKELETON_WIDTHS = ["w-[60%]", "w-[80%]", "w-[45%]", "w-[70%]", "w-[55%]", "w-[75%]"];
const CATEGORY_WIDTHS = ["w-[40%]", "w-[55%]", "w-[35%]", "w-[50%]", "w-[42%]", "w-[58%]"];

export default function ProductsLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="mt-2 sm:mt-4 mb-8">
        <div className="h-10 w-36 bg-slate-200 rounded-[8px] animate-pulse" />
        <div className="h-5 w-52 bg-slate-200 rounded-[8px] animate-pulse mt-3 opacity-60" />
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-[20px] p-4 flex gap-3">
        <div className="h-10 flex-1 bg-slate-50 rounded-lg animate-pulse" />
        <div className="h-10 w-28 bg-slate-50 rounded-lg animate-pulse" />
        <div className="h-10 w-24 bg-slate-50 rounded-lg animate-pulse" />
        <div className="h-10 w-20 bg-slate-50 rounded-lg animate-pulse" />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden">
        {/* Header row */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-6">
          <div className="w-12 h-3 bg-slate-200 rounded-[8px] animate-pulse" />
          <div className="flex-1 h-3 w-16 bg-slate-200 rounded-[8px] animate-pulse" />
          <div className="w-20 h-3 bg-slate-200 rounded-[8px] animate-pulse" />
          <div className="w-14 h-3 bg-slate-200 rounded-[8px] animate-pulse" />
        </div>
        {/* Body rows */}
        <div className="divide-y divide-slate-50">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-6 pl-6 pr-6 py-4">
              <div className="w-12 h-12 bg-slate-50 rounded-lg animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className={`h-4 ${SKELETON_WIDTHS[i]} bg-slate-200 rounded-[8px] animate-pulse`} />
                <div className={`h-3 ${CATEGORY_WIDTHS[i]} bg-slate-50 rounded-[8px] animate-pulse`} />
              </div>
              <div className="h-4 w-16 bg-slate-50 rounded-[8px] animate-pulse" />
              <div className="h-6 w-16 bg-slate-50 rounded-full animate-pulse" />
              <div className="flex gap-1.5">
                <div className="w-8 h-8 bg-slate-50 rounded-[8px] animate-pulse" />
                <div className="w-8 h-8 bg-slate-50 rounded-[8px] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
