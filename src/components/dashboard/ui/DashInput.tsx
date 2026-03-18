import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface DashInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: LucideIcon;
}

export function DashInput({
  label,
  hint,
  error,
  icon: Icon,
  className,
  id,
  ...props
}: DashInputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-slate-700"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        )}
        <input
          id={inputId}
          className={cn(
            "dash-input",
            Icon && "pl-10",
            error && "border-red-300 focus:border-red-400 focus:ring-red-100",
            className
          )}
          {...props}
        />
      </div>
      {hint && !error && (
        <p className="text-xs text-slate-400">{hint}</p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface DashTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function DashTextarea({
  label,
  hint,
  error,
  className,
  id,
  ...props
}: DashTextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-slate-700"
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          "dash-input resize-none",
          error && "border-red-300 focus:border-red-400 focus:ring-red-100",
          className
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface DashSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  options: { value: string; label: string }[];
}

export function DashSelect({
  label,
  hint,
  options,
  className,
  id,
  ...props
}: DashSelectProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-slate-700"
        >
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={cn("dash-input bg-white", className)}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
