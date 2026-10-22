import { cn } from "@/lib/utils";

interface ProgressRingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  className?: string;
  /** Etiqueta bajo el porcentaje. Solo se dibuja en la variante semicircular. */
  caption?: string;
}

/* Gauge semicircular: medio donut de 180°, el tramo restante con rayado en vez
   de gris plano. Vive acá y no en un componente nuevo porque comparte toda la
   lógica de normalizado con el anillo; lo único distinto es el arco.

   El anillo completo (ProgressRing) sigue existiendo sin cambios de API para no
   romper el uso que ya tiene. */
export function ProgressGauge({
  progress,
  size = 220,
  strokeWidth = 26,
  className,
  caption,
}: ProgressRingProps) {
  const pct = Math.min(100, Math.max(0, progress)) / 100;

  const cx = 110;
  const cy = 110;
  const r = (size - strokeWidth) / 2 > 86 ? 86 : (size - strokeWidth) / 2;
  const len = Math.PI * r;
  const arc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  return (
    <div className={cn("flex w-full justify-center", className)}>
      <svg viewBox="0 0 220 128" className="w-full max-w-[210px]">
        <defs>
          <pattern
            id="gauge-hatch"
            width="7"
            height="7"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="7" height="7" fill="#fbfbfb" />
            <line x1="0" y1="0" x2="0" y2="7" stroke="#e4e5e4" strokeWidth="2.5" />
          </pattern>
        </defs>

        {/* Tramo pendiente */}
        <path
          d={arc}
          fill="none"
          stroke="url(#gauge-hatch)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Tramo completado */}
        <path
          d={arc}
          fill="none"
          stroke="var(--color-brand-600)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${len * pct} ${len}`}
          style={{ transition: "stroke-dasharray 0.5s ease-in-out" }}
        />

        <text
          x={cx}
          y="94"
          textAnchor="middle"
          className="fill-neutral-900 text-[27px] font-extrabold"
        >
          {Math.round(pct * 100)}%
        </text>
        {caption && (
          <text
            x={cx}
            y="110"
            textAnchor="middle"
            className="fill-neutral-500 text-[9px] font-medium"
          >
            {caption}
          </text>
        )}
      </svg>
    </div>
  );
}

export function ProgressRing({
  progress,
  size = 64,
  strokeWidth = 6,
  className,
}: ProgressRingProps) {
  const normalizedProgress = Math.min(100, Math.max(0, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (normalizedProgress / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        height={size}
        width={size}
        className="transform -rotate-90"
      >
        {/* Background ring */}
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          className="text-neutral-100"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress ring */}
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference + " " + circumference}
          style={{ strokeDashoffset, transition: "stroke-dashoffset 0.5s ease-in-out" }}
          className={normalizedProgress === 100 ? "text-brand-600" : "text-brand-500"}
          r={radius}
          cx={size / 2}
          cy={size / 2}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold text-neutral-700">
          {Math.round(normalizedProgress)}%
        </span>
      </div>
    </div>
  );
}
