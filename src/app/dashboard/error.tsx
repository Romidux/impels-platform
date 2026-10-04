"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service in production
    console.error("[Dashboard Error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>

      <div className="text-center max-w-md">
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">
          Algo salió mal
        </h2>
        <p className="text-neutral-500 text-sm">
          Ocurrió un error inesperado. Podés intentar de nuevo o volver al inicio.
        </p>
        {error.digest && (
          <p className="text-xs text-neutral-400 mt-2 font-mono">
            Ref: {error.digest}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Intentar de nuevo
        </button>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2.5 bg-neutral-100 text-neutral-700 text-sm font-medium rounded-xl hover:bg-neutral-200 transition-colors"
        >
          <Home className="w-4 h-4" />
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
