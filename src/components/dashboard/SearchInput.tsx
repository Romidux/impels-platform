"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Input de búsqueda del dashboard. Es presentacional: no sabe si lo que filtra
 * vive en el servidor o en memoria, solo reporta el valor.
 *
 * Existe para que las cuatro pantallas con buscador (Pedidos, Clientes, Cupones
 * y Categorías) compartan una sola caja. Antes cada una lo dibujaba a mano y
 * ninguna coincidía con la altura de los campos del resto del dashboard.
 */
export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
  pending = false,
  onSubmit,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  /** Atenúa el campo mientras hay una navegación en curso. */
  pending?: boolean;
  /** Si se pasa, el campo se comporta como formulario y envía con Enter. */
  onSubmit?: (value: string) => void;
}) {
  const field = (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(
          "dash-input pl-9",
          value ? "pr-9" : "pr-3.5",
          pending && "opacity-70"
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            onSubmit?.("");
          }}
          aria-label="Limpiar búsqueda"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  if (!onSubmit) return field;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(value);
      }}
    >
      {field}
    </form>
  );
}
