import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatChart } from "@/components/ui/StatChart";
import { CreditCard, DollarSign, TrendingUp, Users, Settings2 } from "lucide-react";
import Link from "next/link";
import { SetPlanButton } from "./SetPlanButton";
import { PRO_PLAN_PRICE_PYG } from "@/lib/plan";

export default async function AdminBillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: stores } = await supabase
    .from("stores")
    .select("id, name, slug, plan, is_active, created_at")
    .order("created_at", { ascending: false });

  const activeStores = stores?.filter((s) => s.is_active) || [];
  const proStores = activeStores.filter((s) => s.plan === "pro");
  const freeStores = activeStores.filter((s) => s.plan === "free");

  const mrr = proStores.length * PRO_PLAN_PRICE_PYG;

  const formatCurrency = (value: number) =>
    `₲ ${value.toLocaleString("es-PY")}`;

  const chartData = [
    { label: "Ene", value: mrr * 0.5 },
    { label: "Feb", value: mrr * 0.7 },
    { label: "Mar", value: mrr * 0.85 },
    { label: "Abr", value: mrr * 0.9 },
    { label: "May", value: mrr },
    { label: "Jun", value: mrr * 1.1 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Facturación y Planes"
        subtitle="Resumen de ingresos recurrentes (MRR) de la plataforma"
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<DollarSign className="w-5 h-5 text-indigo-600" />}
          label="MRR Estimado"
          value={formatCurrency(mrr)}
          trend={{ value: "+12.5% vs mes anterior", positive: true }}
        />
        <KpiCard
          icon={<CreditCard className="w-5 h-5 text-indigo-600" />}
          label="Suscripciones Pro"
          value={proStores.length}
        />
        <KpiCard
          icon={<Users className="w-5 h-5 text-indigo-600" />}
          label="Cuentas Free"
          value={freeStores.length}
        />
        <KpiCard
          icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
          label="ARPU"
          value={
            activeStores.length > 0
              ? formatCurrency(Math.round(mrr / activeStores.length))
              : "₲ 0"
          }
        />
      </div>

      {/* Chart + last Pro */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card
            header={{
              title: "Crecimiento del MRR",
              icon: <TrendingUp className="w-5 h-5 text-indigo-600" />,
            }}
          >
            <div className="pt-4">
              <StatChart
                data={chartData}
                height={280}
                valueFormatter={formatCurrency}
              />
            </div>
          </Card>
        </div>

        <div>
          <Card
            padding={false}
            header={{
              title: "Últimas suscripciones Pro",
              icon: <CreditCard className="w-5 h-5 text-indigo-600" />,
            }}
          >
            {proStores.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No hay suscripciones Pro
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {proStores.slice(0, 7).map((store) => (
                  <Link
                    key={store.id}
                    href={`/admin/stores/${store.id}`}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {store.name}
                      </p>
                      <p className="text-xs text-slate-500">{store.slug}</p>
                    </div>
                    <Badge variant="brand" size="sm">
                      Pro
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Gestión de planes */}
      <Card
        header={{
          title: "Gestión de planes",
          icon: <Settings2 className="w-5 h-5 text-indigo-600" />,
        }}
        padding={false}
      >
        {!stores || stores.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No hay tiendas registradas
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Tienda
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Estado
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Plan
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stores.map((store) => (
                  <tr key={store.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/stores/${store.id}`}
                        className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                      >
                        {store.name}
                      </Link>
                      <p className="text-xs text-slate-400 mt-0.5">{store.slug}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={store.is_active ? "success" : "neutral"}
                        size="sm"
                        dot
                      >
                        {store.is_active ? "Activa" : "Inactiva"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={store.plan === "pro" ? "brand" : "neutral"}
                        size="sm"
                      >
                        {store.plan === "pro" ? "Pro" : "Free"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <SetPlanButton
                        storeId={store.id}
                        currentPlan={store.plan as "free" | "pro"}
                        storeName={store.name}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
