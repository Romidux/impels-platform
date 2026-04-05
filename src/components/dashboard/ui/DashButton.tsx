"use client";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "primarySolid" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface DashButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
  children: React.ReactNode;
}

/*
 * primary / primarySolid → bg-indigo-600 text-white (igual a "Crear Cupón")
 * secondary → bg-white border-slate-200
 * danger    → bg-red-50 text-red-600 border-red-200
 * ghost     → transparente, hover gris
 */
const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-indigo-600 text-white font-semibold shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
  primarySolid:
    "bg-indigo-600 text-white font-semibold shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
  secondary:
    "bg-white text-slate-600 font-semibold border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50",
  danger:
    "bg-red-50 text-red-600 font-semibold border border-red-200 hover:bg-red-100 hover:border-red-300 transition-colors disabled:opacity-50",
  ghost:
    "text-slate-500 font-medium hover:bg-slate-100 hover:text-slate-700 transition-colors disabled:opacity-50",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "text-xs px-3 py-1.5 rounded-lg gap-1.5",
  md: "text-sm px-5 py-2.5 rounded-lg gap-2",
  lg: "text-sm px-5 py-2.5 rounded-lg gap-2",
};

export function DashButton({
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  children,
  className,
  disabled,
  ...props
}: DashButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center cursor-pointer disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2Icon />
      ) : icon ? (
        <span className="w-4 h-4 flex-shrink-0 inline-flex items-center justify-center">
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  );
}

function Loader2Icon() {
  return (
    <svg
      className="w-4 h-4 animate-spin flex-shrink-0"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12" cy="12" r="10"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2.5"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
