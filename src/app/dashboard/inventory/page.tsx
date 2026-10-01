import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Warehouse,
  AlertTriangle,
  Package,
  TrendingDown,
  DollarSign,
  Boxes,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import InventoryFilters from "@/components/dashboard/InventoryFilters";
import InventoryTable from "@/components/dashboard/InventoryTable";
import type { InventoryProduct, VariantForInventory } from "@/components/dashboard/InventoryTable";
import { formatCurrency } from "@/lib/utils";

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

  const { data: store } = await supabase
    .from("stores")
    .select("id, store_settings(currency)")
    .eq("owner_id", user.id)
    .single();
  if (!store) redirect("/onboarding");

  const currency = (store as any).store_settings?.[0]?.currency || "Gs";

  const params = await searchParams;
  const { search, category, status } = params;
  const sort = params.sort || "";
  const page = parseInt(params.page || "1");
  const pageSize = 20;

  // Build sort configuration
  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    stock_desc: { column: "stock_quantity", ascending: false },
    name_asc: { column: "name", ascending: true },
    name_desc: { column: "name", ascending: false },
  };
  const isValueSort = sort === "value_desc" || sort === "value_asc";

  // Fetch all tracked products (we need all for KPI calculations)
  const { data: allTrackedProducts } = await supabase
    .from("products")
    .select(
      "id, name, slug, stock_quantity, stock_status, track_inventory, has_variants, manage_stock_by_variant, price, category_id, images:product_images(id, url, is_primary), category:categories(id, name), variant_combinations:product_variant_combinations(id, option_values, stock, sku, is_active), option_types:product_option_types(id, name, values:product_option_values(id, value))"
    )
    .eq("store_id", store.id)
    .eq("track_inventory", true)
    .order("stock_quantity", { ascending: true });

  const allProducts = allTrackedProducts || [];

  // ── KPI calculations (always from full dataset) ──
  const totalUnits = allProducts.reduce((sum, p) => sum + (p.stock_quantity || 0), 0);
  const lowStockProducts = allProducts.filter(
    (p) => p.stock_quantity > 0 && p.stock_quantity <= 5
  );
  const outOfStockProducts = allProducts.filter((p) => p.stock_quantity <= 0);
  const inventoryValue = allProducts.reduce(
    (sum, p) => sum + (p.stock_quantity || 0) * (p.price || 0),
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

  if (status === "ok") {
    filteredProducts = filteredProducts.filter((p) => p.stock_quantity > 5);
  } else if (status === "low") {
    filteredProducts = filteredProducts.filter(
      (p) => p.stock_quantity > 0 && p.stock_quantity <= 5
    );
  } else if (status === "out") {
    filteredProducts = filteredProducts.filter((p) => p.stock_quantity <= 0);
  }

  // ── Apply sort ──
  if (isValueSort) {
    filteredProducts.sort((a, b) => {
      const valA = (a.stock_quantity || 0) * (a.price || 0);
      const valB = (b.stock_quantity || 0) * (b.price || 0);
      return sort === "value_desc" ? valB - valA : valA - valB;
    });
  } else if (sort && sortMap[sort]) {
    const { column, ascending } = sortMap[sort];
    filteredProducts.sort((a: any, b: any) => {
      const valA = a[column];
      const valB = b[column];
      if (typeof valA === "string") {
        return ascending
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      return ascending ? valA - valB : valB - valA;
    });
  }

  // ── Pagination ──
  const totalCount = filteredProducts.length;
  const totalPages = Math.ceil(totalCount / pageSize);
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

  // ── Stock bar helper ──
  const maxStock = Math.max(...allProducts.map((p) => p.stock_quantity || 0), 1);

  // ── Serialize products for the client component ──
  const serializedProducts: InventoryProduct[] = paginatedProducts.map((p) => {
    const images = p.images as { id: string; url: string; is_primary: boolean }[] | null;
    const primaryImage = images?.find((img) => img.is_primary);
    const cat = p.category;
    const categoryObj = Array.isArray(cat) ? cat[0] : cat;

    // Build variant labels by resolving option_value IDs to display strings
    const optionTypes = (p as any).option_types as { id: string; name: string; values: { id: string; value: string }[] }[] | null;
    const variantCombinations = (p as any).variant_combinations as { id: string; option_values: string[]; stock: number; sku: string; is_active: boolean }[] | null;

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
      stock_quantity: p.stock_quantity || 0,
      has_variants: p.has_variants || false,
      manage_stock_by_variant: (p as any).manage_stock_by_variant || false,
      price: p.price || 0,
      categoryName: (categoryObj as { name: string } | null)?.name || "",
      imageUrl: primaryImage?.url || null,
      variants,
    };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Inventario"
        subtitle={`${allProducts.length} productos con seguimiento de stock`}
      />

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<Boxes className="w-5 h-5 text-brand-600" />}
          iconClassName="bg-brand-50"
          label="Unidades totales"
          value={totalUnits.toLocaleString("es-PY")}
        />
        <KpiCard
          icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
          iconClassName="bg-amber-50"
          label="Stock bajo"
          value={lowStockProducts.length}
          href={buildUrl({ status: "low", page: "1" })}
          badge={
            lowStockProducts.length > 0 ? (
              <Badge variant="warning" size="sm">
                ≤ 5 uds
              </Badge>
            ) : undefined
          }
        />
        <KpiCard
          icon={<TrendingDown className="w-5 h-5 text-red-500" />}
          iconClassName="bg-red-50"
          label="Sin stock"
          value={outOfStockProducts.length}
          href={buildUrl({ status: "out", page: "1" })}
          badge={
            outOfStockProducts.length >= 3 ? (
              <Badge variant="error" size="sm">
                Urgente
              </Badge>
            ) : undefined
          }
        />
        <KpiCard
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          iconClassName="bg-emerald-50"
          label="Valor del inventario"
          value={formatCurrency(inventoryValue, currency)}
        />
      </div>

      {/* ── Filters ── */}
      <InventoryFilters
        categories={categories || []}
        currentSearch={search || ""}
        currentCategory={category || ""}
        currentStatus={status || ""}
        currentSort={sort || ""}
        products={allProducts.map((p) => {
          const cat = p.category;
          const categoryObj = Array.isArray(cat) ? cat[0] : cat;
          return {
            name: p.name,
            price: p.price || 0,
            stock_quantity: p.stock_quantity || 0,
            category: (categoryObj as { name: string } | undefined) || null,
          };
        })}
        currency={currency}
      />

      {/* ── Inventory Table ── */}
      {allProducts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <EmptyState
            icon={<Warehouse className="w-8 h-8 text-brand-600" />}
            heading="Sin seguimiento de inventario"
            description="Activa el seguimiento de stock en tus productos para verlos aquí. Puedes hacerlo desde la edición de cada producto."
          />
        </div>
      ) : paginatedProducts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <EmptyState
            icon={<Package className="w-8 h-8 text-slate-400" />}
            heading="Sin resultados"
            description="No se encontraron productos con los filtros seleccionados"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <InventoryTable
            products={serializedProducts}
            maxStock={maxStock}
            currency={currency}
          />

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="bg-white border border-slate-200 rounded-[16px] px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-sm text-slate-500 gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <span>
                Página {page} de {totalPages} ({totalCount} productos)
              </span>
              <div className="flex items-center gap-2">
                {page > 1 && (
                  <Link
                    href={buildUrl({ page: String(page - 1) })}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    ← Anterior
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={buildUrl({ page: String(page + 1) })}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-900 hover:bg-slate-50 transition-colors"
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
