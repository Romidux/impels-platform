"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Storefront Error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-4 bg-white">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-gray-400" />
      </div>

      <div className="text-center max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          No pudimos cargar esta tienda
        </h2>
        <p className="text-gray-500 text-sm">
          Puede que la tienda no esté disponible en este momento. Intentá de nuevo en unos minutos.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Intentar de nuevo
        </button>
        <Link
          href="/"
          className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
