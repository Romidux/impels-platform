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
    "bg-blue-600 text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:scale-100",
  secondary:
    "bg-white text-slate-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 active:scale-[0.98]",
  danger: "bg-red-600 text-white hover:bg-red-700 transition-all duration-200 active:scale-[0.98]",
  ghost: "text-slate-600 hover:bg-gray-100 hover:text-slate-900 transition-all duration-200 active:scale-[0.98]",
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
