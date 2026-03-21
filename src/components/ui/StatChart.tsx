import { cn } from "@/lib/utils";

interface DataPoint {
  label: string;
  value: number;
}

interface StatChartProps {
  data: DataPoint[];
  height?: number;
  className?: string;
  valueFormatter?: (value: number) => string;
}

export function StatChart({
  data,
  height = 200,
  className,
  valueFormatter = (v) => v.toString(),
}: StatChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-slate-400 bg-slate-50 rounded-xl border border-slate-100"
        style={{ height }}
      >
        Sin datos
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.value));

  return (
    <div className={cn("w-full flex flex-col justify-end", className)} style={{ height }}>
      <div className="flex-1 flex items-end gap-2 sm:gap-4 relative pt-6">
        {data.map((item, i) => {
          // ensure minimal height so zero-values are visible or at least taking up space
          const heightPercent = maxVal === 0 ? 0 : (item.value / maxVal) * 100;
          
          return (
            <div
              key={i}
              className="relative flex-1 flex flex-col items-center justify-end group h-full"
            >
              {/* Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-medium px-2 py-1 rounded shadow-lg whitespace-nowrap transition-opacity pointer-events-none z-10">
                {item.label}: {valueFormatter(item.value)}
              </div>
              
              {/* Bar */}
              <div
                className="w-full bg-indigo-100 hover:bg-indigo-200 transition-colors rounded-t-md relative overflow-hidden"
                style={{ height: `${Math.max(heightPercent, 2)}%` }}
              >
                <div 
                  className="absolute bottom-0 w-full bg-indigo-500 rounded-t-md transition-all duration-500"
                  style={{ height: "100%" }}
                />
              </div>

              {/* X-axis Label */}
              <div className="absolute -bottom-6 text-[10px] font-medium text-slate-400 truncate w-full text-center">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
      <div className="h-6" /> {/* Space for labels */}
    </div>
  );
}
