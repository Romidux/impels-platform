import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";

interface DashKpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: {
    value: string;
    positive: boolean;
  };
  href?: string;
  className?: string;
}

export function DashKpiCard({
  icon,
  label,
  value,
  trend,
  href,
  className,
}: DashKpiCardProps) {
  const content = (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center group-hover:scale-105 transition-transform">
          {icon}
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
              trend.positive
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-600"
            )}
          >
            {trend.positive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {trend.value}
          </div>
        )}
      </div>
      <div className="font-display text-2xl font-black text-slate-900 mb-0.5">
        {value}
      </div>
      <div className="text-sm text-slate-500">{label}</div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn("dash-card-hover p-5 group block", className)}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={cn("dash-card p-5 group", className)}>{content}</div>
  );
}
