import { cn } from "@/lib/utils";
import React from "react";

interface EmptyStateProps {
  icon: React.ReactNode;
  heading: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
  illustrationMode?: boolean;
}

export function EmptyState({
  icon,
  heading,
  description,
  action,
  className,
  illustrationMode = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 sm:p-12 animate-fade-in",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center mb-5",
          illustrationMode
            ? "w-32 h-32 opacity-90 transition-transform hover:scale-105 duration-300"
            : "w-14 h-14 rounded-2xl bg-slate-50 text-slate-400"
        )}
      >
        {icon}
      </div>
      <h3 className="font-display text-lg font-bold text-slate-900 mb-2">
        {heading}
      </h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
