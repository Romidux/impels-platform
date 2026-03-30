import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Users, ShoppingCart, Clock, Plus, Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { DashEmptyState } from "@/components/dashboard/ui/DashEmptyState";
import { DashBadge } from "@/components/dashboard/ui/DashBadge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface EnhancedCustomer {
  id: string;
  store_id: string;
  full_name: string;
  phone_number: string;
  email: string | null;
  city: string | null;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string | null;
}

export default async function CustomersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: store } = await supabase
    .from("stores")
    .select("id, store_settings(*)")
    .eq("owner_id", user.id)
    .single();
  if (!store) redirect("/onboarding");

  // Consultar clientes reales y sus pedidos relacionados a través del foreign key
  const { data: dbCustomers } = await supabase
    .from("customers")
    .select("*, orders(id, total, created_at)")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  const currency = store.store_settings?.[0]?.currency || "Gs";

  const customers: EnhancedCustomer[] = (dbCustomers || []).map((customer) => {
    const orders = Array.isArray(customer.orders) ? customer.orders : [];
    const validOrders = orders.filter((o: { id: string; total: number; created_at: string } | null) => o != null);
    
    const orderCount = validOrders.length;
    const totalSpent = validOrders.reduce((sum: number, o: { total: number }) => sum + (o.total || 0), 0);
    
    let lastOrderDate = null;
    if (validOrders.length > 0) {
      // Ordenamos para agarrar la más reciente
      const sorted = [...validOrders].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      lastOrderDate = sorted[0].created_at;
    }

    return {
      id: customer.id,
      store_id: customer.store_id,
      full_name: customer.full_name,
      phone_number: customer.phone_number,
      email: customer.email,
      city: customer.city,
      orderCount,
      totalSpent,
      lastOrderDate,
    };
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Clientes"
        subtitle={`${customers.length} clientes registrados`}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary" icon={<Download className="w-4 h-4" />}>
              <a href="/api/export?type=customers" download>
                Exportar CSV
              </a>
            </Button>
            <Button asChild icon={<Plus className="w-4 h-4" />}>
              <Link href="/dashboard/customers/new">Nuevo cliente</Link>
            </Button>
          </div>
        }
      />

      {customers.length === 0 ? (
        <div className="dash-card">
          <DashEmptyState
            icon={<Users className="w-7 h-7 text-green-600" />}
            title="Sin clientes todavía"
            description="Agrega clientes manualmente o pídeles que compren en tu tienda para que se registren aquí."
            action={
              <Link href="/dashboard/customers/new">
                <Button>
                  <Plus className="w-4 h-4" />
                  Crear tu primer cliente
                </Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="dash-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                    Cliente
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                    Teléfono
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                    Ciudad
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                    Pedidos
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                    Total gastado
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                    Último pedido
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-green-700">
                            {customer.full_name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-slate-900">
                            {customer.full_name}
                          </p>
                          {customer.email && (
                            <p className="text-xs text-slate-400">
                              {customer.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-slate-600">
                        {customer.phone_number}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-slate-600">
                        {customer.city || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <DashBadge variant="info">
                        <ShoppingCart className="w-3 h-3" />
                        {customer.orderCount}
                      </DashBadge>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-semibold text-slate-900">
                        {formatCurrency(customer.totalSpent, currency)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {customer.lastOrderDate ? (
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />
                          {new Date(customer.lastOrderDate).toLocaleDateString("es-PY")}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
