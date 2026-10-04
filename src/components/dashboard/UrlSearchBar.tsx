"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { SearchInput } from "./SearchInput";

/**
 * Buscador para las pantallas que filtran en el servidor: escribe `?q=` en la
 * URL y deja que el server component vuelva a consultar.
 *
 * `extraParams` conserva los filtros que ya estaban puestos (estado, vista). El
 * número de página NO se conserva a propósito: una búsqueda nueva empieza en la
 * página 1, porque la página 3 del resultado anterior casi nunca existe en el
 * nuevo.
 */
export function UrlSearchBar({
  basePath,
  defaultValue,
  placeholder,
  extraParams,
  className,
}: {
  basePath: string;
  defaultValue?: string;
  placeholder: string;
  extraParams?: Record<string, string | undefined>;
  className?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue || "");
  const [isPending, startTransition] = useTransition();

  const push = (q: string) => {
    const sp = new URLSearchParams();
    for (const [key, val] of Object.entries(extraParams || {})) {
      if (val) sp.set(key, val);
    }
    if (q.trim()) sp.set("q", q.trim());
    const qs = sp.toString();
    startTransition(() => {
      router.push(`${basePath}${qs ? "?" + qs : ""}`);
    });
  };

  return (
    <SearchInput
      value={value}
      onChange={setValue}
      onSubmit={push}
      placeholder={placeholder}
      pending={isPending}
      className={className}
    />
  );
}
