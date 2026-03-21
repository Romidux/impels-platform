import { cn } from "@/lib/utils";
import React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 transition-colors outline-none",
              "placeholder:text-slate-400",
              "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10",
              error && "border-red-300 focus:border-red-500 focus:ring-red-500/10",
              icon && "pl-10",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-xs text-slate-400">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
