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
    "bg-green-800 text-white hover:bg-green-600 disabled:opacity-50 shadow-sm",
  secondary:
    "bg-white text-slate-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-slate-600 hover:bg-gray-100 hover:text-slate-900",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "text-xs px-3 py-1.5 rounded-lg gap-1.5",
  md: "text-sm px-4 py-2.5 rounded-xl gap-2",
  lg: "text-sm px-6 py-3 rounded-xl gap-2 font-bold",
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
