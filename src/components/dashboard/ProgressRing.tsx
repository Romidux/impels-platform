import { cn } from "@/lib/utils";

interface ProgressRingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  className?: string;
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
          className="text-slate-100"
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
          className={normalizedProgress === 100 ? "text-green-500" : "text-brand-500"}
          r={radius}
          cx={size / 2}
          cy={size / 2}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-slate-700">
          {Math.round(normalizedProgress)}%
        </span>
      </div>
    </div>
  );
}
