import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Users, ShoppingCart, Clock, Plus, Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DashPageHeader } from "@/components/dashboard/ui/DashPageHeader";
import { DashButton } from "@/components/dashboard/ui/DashButton";
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
      <DashPageHeader
        title="Clientes"
        subtitle={`${customers.length} clientes registrados`}
      >
        <div className="flex items-center gap-2">
          <Button asChild variant="secondary" size="md">
            <a href="/api/export?type=customers" download className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Exportar CSV
            </a>
          </Button>
          <Link href="/dashboard/customers/new">
            <DashButton>
              <Plus className="w-4 h-4" />
              Nuevo cliente
            </DashButton>
          </Link>
        </div>
      </DashPageHeader>

      {customers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12">
          <DashEmptyState
            icon={<Users className="w-10 h-10 text-slate-300" />}
            title="Aún no tienes clientes"
            description="Aquí aparecerán las personas que compren en tu tienda o que agregues manualmente."
            action={
              <Link href="/dashboard/customers/new">
                <DashButton className="bg-slate-900 hover:bg-slate-800 text-white border-none shadow-md">
                  <Plus className="w-4 h-4" />
                  Agregar mi primer cliente
                </DashButton>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700 px-1">
              Todos los clientes
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-tight px-6 py-3">
                    Cliente
                  </th>
                  <th className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-tight px-4 py-3">
                    WhatsApp / Tel
                  </th>
                  <th className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-tight px-4 py-3">
                    Ciudad
                  </th>
                  <th className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-tight px-4 py-3 text-center">
                    Pedidos
                  </th>
                  <th className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-tight px-4 py-3">
                    Inversión Total
                  </th>
                  <th className="text-right text-[11px] font-bold text-slate-400 uppercase tracking-tight px-6 py-3">
                    Última Actividad
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors group cursor-default">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 group-hover:border-brand-200 group-hover:bg-brand-50 transition-colors">
                          <span className="text-sm font-bold text-slate-600 group-hover:text-brand-700">
                            {customer.full_name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900 group-hover:text-brand-700 transition-colors">
                            {customer.full_name}
                          </p>
                          {customer.email && (
                            <p className="text-xs text-slate-400 font-medium">
                              {customer.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-slate-600 font-medium whitespace-nowrap">
                        {customer.phone_number}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-slate-500">
                        {customer.city || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center">
                        <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-slate-100 text-[11px] font-bold text-slate-600 border border-slate-200/50">
                          {customer.orderCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-bold text-slate-900">
                        {formatCurrency(customer.totalSpent, currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {customer.lastOrderDate ? (
                        <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded-md border border-slate-100 transition-colors group-hover:border-slate-200">
                          <Clock className="w-3 h-3" />
                          {new Date(customer.lastOrderDate).toLocaleDateString("es-PY")}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">-</span>
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
