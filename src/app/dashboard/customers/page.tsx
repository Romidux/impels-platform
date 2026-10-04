import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Users, ShoppingCart, Clock, Plus, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";

const PAGE_SIZE = 20;

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

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
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

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const { data: dbCustomers, count: totalCount } = await supabase
    .from("customers")
    .select("*, orders(id, total, created_at)", { count: "exact" })
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const total = totalCount ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const currency = store.store_settings?.[0]?.currency || "Gs";

  const customers: EnhancedCustomer[] = (dbCustomers || []).map((customer) => {
    const orders = Array.isArray(customer.orders) ? customer.orders : [];
    const validOrders = orders.filter(
      (o: { id: string; total: number; created_at: string } | null) => o != null
    );

    const orderCount = validOrders.length;
    const totalSpent = validOrders.reduce(
      (sum: number, o: { total: number }) => sum + (o.total || 0),
      0
    );

    let lastOrderDate = null;
    if (validOrders.length > 0) {
      const sorted = [...validOrders].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
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
        subtitle={`${total} clientes registrados`}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary" size="md">
              <a href="/api/export?type=customers" download className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Exportar CSV
              </a>
            </Button>
            <Link href="/dashboard/customers/new">
              <Button icon={<Plus className="w-4 h-4" />}>
                Nuevo cliente
              </Button>
            </Link>
          </div>
        }
      />

      {total === 0 ? (
        <div className="dash-card p-12">
          <EmptyState
            icon={<Users className="w-10 h-10 text-neutral-300" />}
            heading="Aún no tienes clientes"
            description="Aquí aparecerán las personas que compren en tu tienda o que agregues manualmente."
            action={
              <Link href="/dashboard/customers/new">
                <Button icon={<Plus className="w-4 h-4" />}>
                  Agregar mi primer cliente
                </Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="dash-card overflow-hidden">
          <div className="p-4 border-b border-neutral-100 bg-neutral-50/30 flex items-center justify-between">
            <h3 className="text-sm font-medium text-neutral-700 px-1">
              Todos los clientes
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-100 border-b border-neutral-100">
                  <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">
                    Cliente
                  </th>
                  <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">
                    WhatsApp / Tel
                  </th>
                  <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">
                    Ciudad
                  </th>
                  <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3 text-center">
                    Pedidos
                  </th>
                  <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">
                    Inversión total
                  </th>
                  <th className="text-right text-xs font-medium text-neutral-500 px-6 py-3">
                    Última actividad
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-neutral-50/80 transition-colors group cursor-default"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center flex-shrink-0 group-hover:border-brand-200 group-hover:bg-brand-50 transition-colors">
                          <span className="text-sm font-semibold text-neutral-600 group-hover:text-brand-700">
                            {customer.full_name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-neutral-900 group-hover:text-brand-700 transition-colors">
                            {customer.full_name}
                          </p>
                          {customer.email && (
                            <p className="text-xs text-neutral-400 font-medium">
                              {customer.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-neutral-600 font-medium whitespace-nowrap">
                        {customer.phone_number}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-neutral-500">
                        {customer.city || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center">
                        <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-neutral-100 text-[11px] font-semibold text-neutral-600 border border-neutral-200/50">
                          {customer.orderCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-semibold text-neutral-900">
                        {formatCurrency(customer.totalSpent, currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {customer.lastOrderDate ? (
                        <div className="inline-flex items-center gap-1.5 text-xs text-neutral-400 font-medium bg-neutral-50 px-2 py-1 rounded-md border border-neutral-100 transition-colors group-hover:border-neutral-200">
                          <Clock className="w-3 h-3" />
                          {new Date(customer.lastOrderDate).toLocaleDateString(
                            "es-PY"
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 bg-neutral-50/30">
              <p className="text-sm text-neutral-500">
                Página {page} de {totalPages}
                <span className="text-neutral-400 ml-1">· {total} clientes</span>
              </p>
              <div className="flex items-center gap-2">
                {page > 1 ? (
                  <Link href={`/dashboard/customers?page=${page - 1}`}>
                    <Button variant="secondary" size="sm" className="flex items-center gap-1">
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Anterior
                    </Button>
                  </Link>
                ) : (
                  <Button variant="secondary" size="sm" disabled className="flex items-center gap-1">
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Anterior
                  </Button>
                )}
                {page < totalPages ? (
                  <Link href={`/dashboard/customers?page=${page + 1}`}>
                    <Button variant="secondary" size="sm" className="flex items-center gap-1">
                      Siguiente
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                ) : (
                  <Button variant="secondary" size="sm" disabled className="flex items-center gap-1">
                    Siguiente
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
