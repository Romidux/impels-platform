/* El esqueleto dibuja la pantalla que realmente viene: antes mostraba un
   encabezado de tarjeta con título y botón que no existe, un drag handle para
   reordenar que la pantalla no tiene, y se olvidaba del buscador. Al cargar,
   todo eso se reacomodaba de golpe. */
export default function CategoriesLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 bg-neutral-200 rounded-xl animate-pulse" />
          <div className="h-4 w-48 bg-neutral-100 rounded-lg animate-pulse" />
        </div>
        <div className="h-9 w-36 bg-neutral-200 rounded-xl animate-pulse" />
      </div>

      {/* Buscador */}
      <div className="h-10 w-full max-w-xs bg-neutral-100 rounded-xl animate-pulse" />

      {/* Category list card */}
      <div className="dash-card overflow-hidden">
        {/* Encabezado de la tabla */}
        <div className="h-[53px] bg-neutral-50 border-b border-neutral-200" />

        <div className="divide-y divide-neutral-50">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_90px_auto] lg:grid-cols-[1fr_100px_130px_148px] items-center"
            >
              {/* Nombre */}
              <div className="flex items-center gap-3 py-4 pr-3 sm:pr-4 pl-4 sm:pl-6">
                {/* Chevron */}
                <div className="w-5 h-[18px] flex-shrink-0" />
                {/* Icono */}
                <div className="w-9 h-9 bg-neutral-100 rounded-lg animate-pulse flex-shrink-0" />
                <div
                  className="h-4 bg-neutral-200 rounded animate-pulse"
                  style={{ width: `${80 + (i % 3) * 30}px` }}
                />
              </div>
              {/* Productos */}
              <div className="hidden sm:block px-4 lg:px-6 py-4">
                <div className="h-4 w-6 bg-neutral-100 rounded animate-pulse" />
              </div>
              {/* Visibilidad */}
              <div className="hidden lg:block px-6 py-4">
                <div className="h-6 w-16 bg-neutral-100 rounded-full animate-pulse" />
              </div>
              {/* Acciones */}
              <div className="pr-4 sm:pr-6 py-4 flex justify-end gap-1">
                <div className="w-8 h-8 bg-neutral-100 rounded-lg animate-pulse" />
                <div className="w-8 h-8 bg-neutral-100 rounded-lg animate-pulse" />
                <div className="w-8 h-8 bg-neutral-100 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
