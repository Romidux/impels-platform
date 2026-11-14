import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Warehouse,
  Package,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import InventoryFilters from "@/components/dashboard/InventoryFilters";
import InventoryTable from "@/components/dashboard/InventoryTable";
import LowStockThresholdSetting from "@/components/dashboard/LowStockThresholdSetting";
import type { InventoryProduct, VariantForInventory } from "@/components/dashboard/InventoryTable";
import { cn, formatCurrency } from "@/lib/utils";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    category?: string;
    status?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  /* `store_settings(*)` y no una lista de columnas: `low_stock_threshold` la
     agrega la migración 017 y pedirla por nombre rompería la pantalla entera
     en una base donde todavía no se aplicó. Así, mientras no exista, el umbral
     simplemente cae en 5, que es lo que estaba escrito a mano antes. */
  const { data: store } = await supabase
    .from("stores")
    .select("id, store_settings(*)")
    .eq("owner_id", user.id)
    .single();
  if (!store) redirect("/onboarding");

  const settings = (
    store as {
      store_settings?:
        | { currency?: string; low_stock_threshold?: number | null }[]
        | null;
    }
  ).store_settings?.[0];

  const currency = settings?.currency || "Gs";
  const lowStockThreshold = settings?.low_stock_threshold ?? 5;

  const params = await searchParams;
  const { search, category, status } = params;
  const sort = params.sort || "";
  // `?page=abc` daba NaN, y con NaN el slice devolvía una lista vacía: la
  // pantalla decía "Sin resultados" en vez de mostrar la primera página.
  const pageParam = parseInt(params.page || "1", 10);
  const requestedPage =
    Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSize = 20;

  const isValueSort = sort === "value_desc" || sort === "value_asc";

  /* Todos los productos, no solo los que llevan cuenta de stock.

     La consulta filtraba por `track_inventory = true`, y como el formulario
     crea cada producto con ese interruptor APAGADO, el catálogo entero quedaba
     fuera de esta pantalla hasta que alguien lo prendía producto por producto.
     Peor: desde acá "no aparece" era indistinguible de "no existe".

     Los que no llevan cuenta entran igual, con su propio estado. No suman
     unidades ni valor ni cuentan como bajos o agotados: en este código
     `track_inventory = false` significa stock infinito (ver `checkIsOutOfStock`
     en lib/utils), no cero. */
  const { data: todosLosProductos } = await supabase
    .from("products")
    .select(
      "id, name, slug, stock_quantity, stock_status, track_inventory, has_variants, manage_stock_by_variant, price, category_id, images:product_images(id, url, is_primary), category:categories(id, name), variant_combinations:product_variant_combinations(id, option_values, stock, sku, is_active), option_types:product_option_types(id, name, values:product_option_values(id, value))"
    )
    .eq("store_id", store.id)
    .order("stock_quantity", { ascending: true });

  /* Stock real de un producto.

     Si maneja stock por variante, el stock es la SUMA de sus variantes: es lo
     que mira la tienda para decidir si está agotado (`checkIsOutOfStock` en
     lib/utils). Esta pantalla leía `products.stock_quantity` para todos, un
     campo que en esos productos no es el total de nada y que nada mantenía al
     día — así que los KPIs, el estado, la barra, el valor y los filtros podían
     decir "sin stock" de algo que la tienda estaba vendiendo, o al revés. */
  const stockDe = (p: {
    stock_quantity?: number | null;
    has_variants?: boolean | null;
    manage_stock_by_variant?: boolean | null;
    variant_combinations?: { stock?: number | null }[] | null;
  }) => {
    if (p.has_variants && p.manage_stock_by_variant) {
      return (p.variant_combinations || []).reduce(
        (total, v) => total + (v.stock || 0),
        0
      );
    }
    return p.stock_quantity || 0;
  };

  const allProducts = (todosLosProductos || []).map((p) => ({
    ...p,
    stock: stockDe(p),
    tracked: p.track_inventory === true,
  }));

  // ── KPI calculations ──
  // Solo los que llevan cuenta. Un producto sin seguimiento no tiene 0
  // unidades: no tiene unidades, y sumarlo como cero mentiría en los cuatro
  // números de la franja.
  const trackedProducts = allProducts.filter((p) => p.tracked);
  const untrackedCount = allProducts.length - trackedProducts.length;

  const totalUnits = trackedProducts.reduce((sum, p) => sum + p.stock, 0);
  const lowStockProducts = trackedProducts.filter(
    (p) => p.stock > 0 && p.stock <= lowStockThreshold
  );
  const outOfStockProducts = trackedProducts.filter((p) => p.stock <= 0);
  const inventoryValue = trackedProducts.reduce(
    (sum, p) => sum + p.stock * (p.price || 0),
    0
  );

  // ── Apply filters ──
  let filteredProducts = [...allProducts];

  if (search) {
    const s = search.toLowerCase();
    filteredProducts = filteredProducts.filter((p) =>
      p.name.toLowerCase().includes(s)
    );
  }

  if (category) {
    filteredProducts = filteredProducts.filter((p) => p.category_id === category);
  }

  // Los tres estados de stock solo tienen sentido sobre los que llevan cuenta.
  if (status === "ok") {
    filteredProducts = filteredProducts.filter(
      (p) => p.tracked && p.stock > lowStockThreshold
    );
  } else if (status === "low") {
    filteredProducts = filteredProducts.filter(
      (p) => p.tracked && p.stock > 0 && p.stock <= lowStockThreshold
    );
  } else if (status === "out") {
    filteredProducts = filteredProducts.filter((p) => p.tracked && p.stock <= 0);
  } else if (status === "untracked") {
    filteredProducts = filteredProducts.filter((p) => !p.tracked);
  }

  // ── Apply sort ──
  if (isValueSort) {
    filteredProducts.sort((a, b) => {
      const valA = a.stock * (a.price || 0);
      const valB = b.stock * (b.price || 0);
      return sort === "value_desc" ? valB - valA : valA - valB;
    });
  } else if (sort === "name_asc" || sort === "name_desc") {
    filteredProducts.sort((a, b) =>
      sort === "name_asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );
  } else if (sort === "stock_desc") {
    filteredProducts.sort((a, b) => b.stock - a.stock);
  } else {
    /* Sin orden elegido, primero lo que está por agotarse. La consulta ya pide
       `order("stock_quantity")`, pero ese campo no sirve para los productos que
       manejan stock por variante.

       Los que no llevan cuenta van al final: no están por agotarse, no tienen
       stock, y arriba le robarían el lugar a lo que sí hay que reponer. */
    filteredProducts.sort((a, b) => {
      if (a.tracked !== b.tracked) return a.tracked ? -1 : 1;
      if (!a.tracked) return a.name.localeCompare(b.name);
      return a.stock - b.stock;
    });
  }

  // ── Pagination ──
  const totalCount = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  // Pedir una página que no existe muestra la última, no una lista vacía.
  const page = Math.min(requestedPage, totalPages);
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // ── Build URL helper ──
  const buildUrl = (newParams: Record<string, string>) => {
    const merged = {
      search: search || "",
      category: category || "",
      status: status || "",
      sort: sort || "",
      page: "1",
      ...newParams,
    };
    const qs = Object.entries(merged)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("&");
    return `/dashboard/inventory${qs ? `?${qs}` : ""}`;
  };

  // ── Fetch categories for filter dropdown ──
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("store_id", store.id)
    .order("name");


  // ── Serialize products for the client component ──
  const serializedProducts: InventoryProduct[] = paginatedProducts.map((p) => {
    const images = p.images as { id: string; url: string; is_primary: boolean }[] | null;
    const primaryImage = images?.find((img) => img.is_primary);
    const cat = p.category;
    const categoryObj = Array.isArray(cat) ? cat[0] : cat;

    // Build variant labels by resolving option_value IDs to display strings
    const fila = p as {
      option_types?:
        | { id: string; name: string; values: { id: string; value: string }[] }[]
        | null;
      variant_combinations?:
        | {
            id: string;
            option_values: string[];
            stock: number;
            sku: string;
            is_active: boolean;
          }[]
        | null;
      manage_stock_by_variant?: boolean | null;
    };
    const optionTypes = fila.option_types ?? null;
    const variantCombinations = fila.variant_combinations ?? null;

    const variants: VariantForInventory[] = (variantCombinations || []).map((vc) => {
      // Resolve option_value IDs to labels
      const labels = vc.option_values.map((vid) => {
        for (const ot of optionTypes || []) {
          const val = ot.values?.find((v) => v.id === vid);
          if (val) return val.value;
        }
        return vid; // fallback to ID if not found (might already be a string value)
      });

      return {
        id: vc.id,
        label: labels.join(" / "),
        stock: vc.stock || 0,
        sku: vc.sku || "",
        is_active: vc.is_active,
      };
    });

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      // `stock` es el stock real (suma de variantes cuando corresponde);
      // `stock_quantity` queda solo para el editor en línea, que escribe ese
      // campo y únicamente se muestra en productos sin stock por variante.
      stock: p.stock,
      stock_quantity: p.stock_quantity || 0,
      tracked: p.tracked,
      has_variants: p.has_variants || false,
      manage_stock_by_variant: fila.manage_stock_by_variant || false,
      price: p.price || 0,
      categoryName: (categoryObj as { name: string } | null)?.name || "",
      imageUrl: primaryImage?.url || null,
      variants,
    };
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Inventario"
        subtitle={
          untrackedCount > 0
            ? `${allProducts.length} productos · ${trackedProducts.length} con seguimiento de stock`
            : `${allProducts.length} productos con seguimiento de stock`
        }
        actions={
          allProducts.length > 0 ? (
            <LowStockThresholdSetting
              storeId={store.id}
              value={lowStockThreshold}
            />
          ) : undefined
        }
      />

      {/* ── Resumen ────────────────────────────────────────────────────────
          Eran cuatro tarjetas de KPI que ocupaban 177px de un panel de 473:
          con ellas, la fila del encabezado de la tabla terminaba a 434px y no
          entraba ni un producto en pantalla sin scrollear. Dos de las cuatro
          (stock bajo y sin stock) además repetían lo que ya dice el badge de
          cada fila y lo que hace el filtro Estado.

          Quedan los cuatro números en una franja de una línea. Los dos que
          llevan a algún lado —los que piden acción— son links; los otros dos
          son referencia y no lo son. El color aparece solo si el número es
          distinto de cero: en una tienda sana la franja es gris. */}
      <div className="dash-card flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3.5 text-sm">
        <span className="text-neutral-500">
          <span className="font-semibold text-neutral-900 tabular-nums">
            {totalUnits.toLocaleString("es-PY")}
          </span>{" "}
          unidades
        </span>

        <span className="text-neutral-500">
          <span className="font-semibold text-neutral-900 tabular-nums">
            {formatCurrency(inventoryValue, currency)}
          </span>{" "}
          en stock
        </span>

        <Link
          href={buildUrl({ status: "low", page: "1" })}
          className={cn(
            "transition-colors hover:underline underline-offset-2",
            lowStockProducts.length > 0
              ? "text-amber-700 hover:text-amber-800"
              : "text-neutral-500 hover:text-neutral-900"
          )}
        >
          <span className="font-semibold tabular-nums">
            {lowStockProducts.length}
          </span>{" "}
          con stock bajo{" "}
          <span className="text-2xs text-neutral-400">
            (≤ {lowStockThreshold})
          </span>
        </Link>

        <Link
          href={buildUrl({ status: "out", page: "1" })}
          className={cn(
            "transition-colors hover:underline underline-offset-2",
            outOfStockProducts.length > 0
              ? "text-red-700 hover:text-red-800"
              : "text-neutral-500 hover:text-neutral-900"
          )}
        >
          <span className="font-semibold tabular-nums">
            {outOfStockProducts.length}
          </span>{" "}
          agotados
        </Link>
      </div>

      {/* ── Filters ── */}
      <InventoryFilters
        categories={categories || []}
        currentSearch={search || ""}
        currentCategory={category || ""}
        currentStatus={status || ""}
        currentSort={sort || ""}
        /* Exporta lo que estás mirando, no el catálogo entero: el botón vive
           al lado de los filtros, así que exportaba todo mientras la pantalla
           mostraba un recorte. Son todas las filas que pasan el filtro, no solo
           las 20 de la página. */
        products={filteredProducts.map((p) => {
          const cat = p.category;
          const categoryObj = Array.isArray(cat) ? cat[0] : cat;
          return {
            name: p.name,
            price: p.price || 0,
            // El CSV exporta el stock real, no el campo suelto.
            stock_quantity: p.stock,
            tracked: p.tracked,
            category: (categoryObj as { name: string } | undefined) || null,
          };
        })}
      />

      {/* ── Inventory Table ── */}
      {allProducts.length === 0 ? (
        <div className="dash-card">
          <EmptyState
            icon={<Warehouse className="w-8 h-8 text-brand-600" />}
            heading="Todavía no hay productos"
            description="Cuando cargues productos en tu catálogo van a aparecer acá, lleven o no cuenta de stock."
          />
        </div>
      ) : paginatedProducts.length === 0 ? (
        <div className="dash-card">
          <EmptyState
            icon={<Package className="w-8 h-8 text-neutral-400" />}
            heading="Sin resultados"
            description="No se encontraron productos con los filtros seleccionados"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <InventoryTable
            products={serializedProducts}

            currency={currency}
            lowStockThreshold={lowStockThreshold}
          />

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="dash-card px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-sm text-neutral-500 gap-3">
              <span>
                Página {page} de {totalPages} ({totalCount} productos)
              </span>
              <div className="flex items-center gap-2">
                {page > 1 && (
                  <Link
                    href={buildUrl({ page: String(page - 1) })}
                    className="px-4 py-2 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-900 hover:bg-neutral-50 transition-colors"
                  >
                    ← Anterior
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={buildUrl({ page: String(page + 1) })}
                    className="px-4 py-2 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-900 hover:bg-neutral-50 transition-colors"
                  >
                    Siguiente →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

