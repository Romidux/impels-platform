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
        className="flex items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-sm text-neutral-400"
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
              className="group relative flex h-full flex-1 flex-col items-center justify-end"
            >
              {/* Tooltip */}
              <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 rounded-md bg-white px-2 py-1 text-2xs font-bold whitespace-nowrap text-neutral-900 opacity-0 shadow-[0_2px_8px_rgba(20,23,24,0.14)] transition-opacity group-hover:opacity-100">
                {item.label}: {valueFormatter(item.value)}
              </div>

              {/* Barra. Píldora completa, no rounded-t: con el radio solo arriba
                  la barra se lee como una columna pegada a un eje; con los dos
                  extremos redondeados se lee como una marca, que es lo que hace
                  que el gráfico no parezca el de una planilla.

                  Las barras sin dato llevan el rayado diagonal en vez de un gris
                  plano: un gris plano es un valor bajo, el rayado es "sin dato". */}
              <div
                className={cn(
                  "w-full max-w-[36px] rounded-full transition-colors",
                  item.value === 0
                    ? "hatch"
                    : "bg-brand-600 group-hover:bg-brand-700"
                )}
                style={{ height: `${Math.max(heightPercent, 2)}%` }}
              />

              {/* X-axis Label */}
              <div className="absolute -bottom-6 w-full truncate text-center text-2xs font-semibold text-neutral-500">
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
