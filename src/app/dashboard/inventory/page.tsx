import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Warehouse, AlertTriangle, Package, Edit } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import InlineStockEditor from "@/components/dashboard/InlineStockEditor";

export default async function InventoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .single();
  if (!store) redirect("/onboarding");

  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, stock_quantity, stock_status, track_inventory, has_variants, manage_stock_by_variant, images:product_images(id, url, is_primary)")
    .eq("store_id", store.id)
    .order("stock_quantity", { ascending: true });

  const trackedProducts = products?.filter((p) => p.track_inventory) || [];
  const lowStock = trackedProducts.filter((p) => p.stock_quantity <= 5 && p.stock_quantity > 0);
  const outOfStock = trackedProducts.filter((p) => p.stock_quantity <= 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Inventario"
        subtitle={`${trackedProducts.length} productos con seguimiento de stock`}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-display font-black text-slate-900">
                {trackedProducts.length}
              </p>
              <p className="text-xs text-slate-500">Con seguimiento</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-display font-black text-slate-900">
                {lowStock.length}
              </p>
              <p className="text-xs text-slate-500">Stock bajo (≤5)</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <Warehouse className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-display font-black text-slate-900">
                {outOfStock.length}
              </p>
              <p className="text-xs text-slate-500">Sin stock</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Inventory table */}
      {trackedProducts.length === 0 ? (
        <div className="dash-card">
          <EmptyState
            icon={<Warehouse className="w-7 h-7 text-green-600" />}
            heading="Sin seguimiento de inventario"
            description="Activa el seguimiento de stock en tus productos para verlos aquí"
          />
        </div>
      ) : (
        <div className="dash-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                    Producto
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                    Stock
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                    Estado
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {trackedProducts.map((product) => {
                  const primaryImage = (product.images as { id: string; url: string; is_primary: boolean }[])?.find(
                    (img) => img.is_primary
                  );
                  const isLow = product.stock_quantity <= 5 && product.stock_quantity > 0;
                  const isOut = product.stock_quantity <= 0;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                            {primaryImage ? (
                              <img
                                src={primaryImage.url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-4 h-4 text-slate-300" />
                              </div>
                            )}
                          </div>
                          <span className="font-medium text-sm text-slate-900">
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <InlineStockEditor
                          productId={product.id}
                          currentStock={product.stock_quantity}
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge
                          variant={isOut ? "error" : isLow ? "warning" : "success"}
                          dot
                        >
                          {isOut ? "Sin stock" : isLow ? "Stock bajo" : "OK"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/dashboard/products/${product.id}`}
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors inline-flex"
                          title="Editar producto"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
