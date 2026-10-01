"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin Error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>

      <div className="text-center max-w-md">
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Error en el panel de administración
        </h2>
        <p className="text-slate-500 text-sm">
          Ocurrió un error inesperado. Podés intentar de nuevo o volver al resumen.
        </p>
        {error.digest && (
          <p className="text-xs text-slate-400 mt-2 font-mono">
            Ref: {error.digest}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Intentar de nuevo
        </button>
        <Link
          href="/admin"
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors"
        >
          <Home className="w-4 h-4" />
          Ir al resumen
        </Link>
      </div>
    </div>
  );
}
