import { cn } from "@/lib/utils";
import Link from "next/link";

interface DashEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
}

export function DashEmptyState({
  icon,
  title,
  description,
  action,
  className,
}: DashEmptyStateProps) {
  return (
    <div className={cn("p-16 text-center", className)}>
      <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="font-display text-lg font-bold text-slate-900 mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto">
        {description}
      </p>
      {action &&
        (action.href ? (
          <Link
            href={action.href}
            className="dash-btn-primary inline-flex items-center gap-2"
          >
            {action.icon}
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="dash-btn-primary inline-flex items-center gap-2"
          >
            {action.icon}
            {action.label}
          </button>
        ))}
    </div>
  );
}
