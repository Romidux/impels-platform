import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Users, ShoppingCart, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DashPageHeader } from "@/components/dashboard/ui/DashPageHeader";
import { DashEmptyState } from "@/components/dashboard/ui/DashEmptyState";
import { DashBadge } from "@/components/dashboard/ui/DashBadge";

interface CustomerAggregate {
  name: string;
  phone: string;
  email: string | null;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
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

  const { data: orders } = await supabase
    .from("orders")
    .select("customer_name, customer_phone, customer_email, total, created_at")
    .eq("store_id", store.id)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });

  const currency = store.store_settings?.[0]?.currency || "Gs";

  // Aggregate customers by phone (unique identifier)
  const customerMap = new Map<string, CustomerAggregate>();
  orders?.forEach((order) => {
    const key = order.customer_phone;
    const existing = customerMap.get(key);
    if (existing) {
      existing.orderCount++;
      existing.totalSpent += order.total || 0;
      // Keep the most recent name/email
    } else {
      customerMap.set(key, {
        name: order.customer_name,
        phone: order.customer_phone,
        email: order.customer_email || null,
        orderCount: 1,
        totalSpent: order.total || 0,
        lastOrderDate: order.created_at,
      });
    }
  });

  const customers = Array.from(customerMap.values()).sort(
    (a, b) => b.totalSpent - a.totalSpent
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <DashPageHeader
        title="Clientes"
        subtitle={`${customers.length} clientes únicos`}
      />

      {customers.length === 0 ? (
        <div className="dash-card">
          <DashEmptyState
            icon={<Users className="w-7 h-7 text-green-600" />}
            title="Sin clientes todavía"
            description="Los datos de tus compradores se agregarán automáticamente aquí cuando recibas pedidos"
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
                  <tr key={customer.phone} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-green-700">
                            {customer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-slate-900">
                            {customer.name}
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
                        {customer.phone}
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
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        {new Date(customer.lastOrderDate).toLocaleDateString("es-PY")}
                      </div>
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
