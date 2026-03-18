"use client";

import { cn } from "@/lib/utils";

interface DashToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function DashToggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: DashToggleProps) {
  return (
    <label
      className={cn(
        "flex items-center justify-between gap-3 cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {(label || description) && (
        <div className="flex-1 min-w-0">
          {label && (
            <span className="text-sm font-medium text-slate-700">{label}</span>
          )}
          {description && (
            <p className="text-xs text-slate-400 mt-0.5">{description}</p>
          )}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0",
          checked ? "bg-green-600" : "bg-gray-300"
        )}
      >
        <span
          className={cn(
            "inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5.5" : "translate-x-0.5"
          )}
          style={{
            width: "18px",
            height: "18px",
            transform: checked ? "translateX(22px)" : "translateX(3px)",
          }}
        />
      </button>
    </label>
  );
}
