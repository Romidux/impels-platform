import { cn } from "@/lib/utils";

/* Piezas compartidas para los estados de carga del dashboard.
 *
 * Las seis pantallas que ya tenían loading.tsx lo tenían escrito a mano, y
 * habían derivado entre sí: distintos radios, distintas alturas de título y
 * una que mostraba seis columnas donde la tabla real mostraba dos.
 *
 * Con piezas compartidas, cada loading.tsx nuevo son diez líneas y todos
 * cambian a la vez.
 *
 * Importante: SkeletonPageHeader copia el layout responsive del PageHeader
 * real (flex-col en mobile, fila desde sm). Si no, el esqueleto desborda a lo
 * ancho en un teléfono y la página entera scrollea de costado mientras carga.
 */

export function SkeletonBar({
  className,
  tono = "fuerte",
}: {
  className?: string;
  tono?: "fuerte" | "suave";
}) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg",
        tono === "fuerte" ? "bg-neutral-200" : "bg-neutral-100",
        className
      )}
    />
  );
}

export function SkeletonPageHeader({ conAccion = true }: { conAccion?: boolean }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <SkeletonBar className="h-7 w-40" />
        <SkeletonBar className="h-4 w-56" tono="suave" />
      </div>
      {conAccion && <SkeletonBar className="h-10 w-36 rounded-full" />}
    </div>
  );
}

export function SkeletonCard({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("dash-card p-6", className)}>{children}</div>;
}

export function SkeletonKpiRow({ cantidad = 4 }: { cantidad?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: cantidad }).map((_, i) => (
        <SkeletonCard key={i} className="space-y-3">
          <SkeletonBar className="h-10 w-10 rounded-xl" tono="suave" />
          <SkeletonBar className="h-7 w-24" />
          <SkeletonBar className="h-3 w-20" tono="suave" />
        </SkeletonCard>
      ))}
    </div>
  );
}

export function SkeletonToolbar() {
  return (
    <div className="dash-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <SkeletonBar className="h-10 flex-1 rounded-full" tono="suave" />
      {/* Anchos como clases literales: Tailwind no genera CSS para clases
          armadas con plantillas (`w-${n}`), porque no las ve al compilar. */}
      <div className="flex gap-2">
        <SkeletonBar className="h-10 w-28 rounded-full" tono="suave" />
        <SkeletonBar className="h-10 w-24 rounded-full" tono="suave" />
        <SkeletonBar className="h-10 w-24 rounded-full" tono="suave" />
      </div>
    </div>
  );
}

/* Las columnas se ocultan en los mismos breakpoints que las tablas reales:
   si el esqueleto muestra seis y la tabla dos, el salto se ve al cargar. */
const OCULTAR_COLUMNA = ["", "", "hidden sm:block", "hidden md:block", "hidden lg:block", "hidden lg:block"];

export function SkeletonTable({
  filas = 6,
  columnas = 4,
  conAvatar = false,
}: {
  filas?: number;
  columnas?: number;
  conAvatar?: boolean;
}) {
  return (
    <div className="dash-card overflow-hidden">
      <div className="flex items-center gap-6 border-b border-neutral-100 bg-neutral-50 px-6 py-3">
        {Array.from({ length: columnas }).map((_, i) => (
          <SkeletonBar
            key={i}
            className={cn("h-3 w-20 flex-1", OCULTAR_COLUMNA[i])}
            tono="suave"
          />
        ))}
      </div>
      <div className="divide-y divide-neutral-50">
        {Array.from({ length: filas }).map((_, f) => (
          <div key={f} className="flex items-center gap-6 px-6 py-3">
            {conAvatar && (
              <SkeletonBar className="h-10 w-10 shrink-0 rounded-full" tono="suave" />
            )}
            {Array.from({ length: columnas }).map((_, c) => (
              <SkeletonBar
                key={c}
                className={cn("h-4 flex-1", c === 0 ? "w-40" : "w-24", OCULTAR_COLUMNA[c])}
                tono={c === 0 ? "fuerte" : "suave"}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonForm({ campos = 4 }: { campos?: number }) {
  return (
    <SkeletonCard className="space-y-5">
      <SkeletonBar className="h-5 w-40" />
      {Array.from({ length: campos }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <SkeletonBar className="h-3.5 w-28" tono="suave" />
          <SkeletonBar className="h-10 w-full rounded-lg" tono="suave" />
        </div>
      ))}
    </SkeletonCard>
  );
}

export function SkeletonCardGrid({ cantidad = 6 }: { cantidad?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: cantidad }).map((_, i) => (
        <SkeletonCard key={i} className="space-y-3">
          <SkeletonBar className="h-10 w-10 rounded-xl" tono="suave" />
          <SkeletonBar className="h-5 w-32" />
          <SkeletonBar className="h-3 w-full" tono="suave" />
          <SkeletonBar className="h-3 w-3/4" tono="suave" />
        </SkeletonCard>
      ))}
    </div>
  );
}
