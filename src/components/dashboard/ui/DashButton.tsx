"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface DashButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white transition-all duration-200 hover:bg-brand-700 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 shadow-[0_2px_8px_rgba(45,91,255,0.30)] hover:shadow-[0_4px_16px_rgba(45,91,255,0.40)]",
  secondary:
    "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 transition-all duration-200 active:scale-[0.98]",
  danger: "bg-red-600 text-white hover:bg-red-700 shadow-[0_2px_8px_rgba(220,38,38,0.25)] transition-all duration-200 active:scale-[0.98]",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all duration-200 active:scale-[0.98]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "text-xs px-3 py-1.5 rounded-lg gap-1.5",
  md: "text-sm px-5 h-11 rounded-2xl gap-2",
  lg: "text-sm px-6 py-3 rounded-2xl gap-2 font-bold",
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
        "inline-flex items-center justify-center font-semibold transition-all cursor-pointer disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
      ) : icon ? (
        <span className="w-4 h-4 flex-shrink-0 inline-flex items-center justify-center">
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  );
}
