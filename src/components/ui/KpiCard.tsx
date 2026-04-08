import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: {
    value: string;
    positive: boolean;
  };
  href?: string;
  className?: string;
  iconClassName?: string;
}

export function KpiCard({
  icon,
  label,
  value,
  trend,
  href,
  className,
  iconClassName = "bg-brand-50",
}: KpiCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center transition-transform", iconClassName)}>
          {icon}
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full max-w-[150px] truncate",
              trend.positive
                ? "bg-green-50 text-green-700"
                : "bg-amber-50 text-amber-700"
            )}
          >
            {trend.positive ? (
              <TrendingUp className="w-3 h-3 shrink-0" />
            ) : (
              <TrendingDown className="w-3 h-3 shrink-0" />
            )}
            <span className="truncate">{trend.value}</span>
          </div>
        )}
      </div>
      <div className="font-display text-4xl font-bold text-slate-900 mb-1 tracking-tight">
        {value}
      </div>
      <div className="text-sm font-medium text-slate-400">{label}</div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn("dash-card-hover p-6 group block", className)}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={cn("dash-card p-6 group", className)}>{content}</div>
  );
}
