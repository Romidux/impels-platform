import { cn } from "@/lib/utils";

interface DashEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
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
    <div className={cn("p-16 text-center flex flex-col items-center justify-center", className)}>
      <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-display text-lg font-bold text-slate-900 mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-slate-400 mb-6 max-w-sm">
        {description}
      </p>
      {action && (
        <div className="flex justify-center mt-2">
          {action}
        </div>
      )}
    </div>
  );
}
