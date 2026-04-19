import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  backHref?: string;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  backHref,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mt-2 sm:mt-4 mb-8", className)}>
      <div className="flex items-center gap-3">
        {backHref && (
          <Link
            href={backHref}
            className="p-2 -ml-2 rounded-xl hover:bg-[#F0F0F2] text-[#86868B] hover:text-[#1D1D1F] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        )}
        <div>
          <h1 className="text-4xl font-semibold text-[#1D1D1F] tracking-tight leading-none">
            {title}
          </h1>
          {subtitle && (
            <p className="text-base text-[#6E6E73] mt-2 font-normal">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
      )}
    </div>
  );
}
