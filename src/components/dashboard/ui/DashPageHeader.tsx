import { cn } from "@/lib/utils";

interface DashPageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode; // right-side action area
  className?: string;
}

export function DashPageHeader({
  title,
  subtitle,
  children,
  className,
}: DashPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4",
        className
      )}
    >
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}
