import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatChart } from "@/components/ui/StatChart";
import { CreditCard, DollarSign, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

export default async function AdminBillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch store data
  const { data: stores } = await supabase
    .from("stores")
    .select("id, name, slug, plan, is_active, created_at")
    .order("created_at", { ascending: false });

  const activeStores = stores?.filter((s) => s.is_active) || [];
  const proStores = activeStores.filter((s) => s.plan === "pro");
  const freeStores = activeStores.filter((s) => s.plan === "free");

  // Hardcoded prices for now (in PYG for example)
  const PRO_PLAN_PRICE = 99000;
  const mrr = proStores.length * PRO_PLAN_PRICE;

  const formatCurrency = (value: number) => {
    return `₲ ${value.toLocaleString("es-PY")}`;
  };

  // Dummy chart data for MRR growth
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
          value={activeStores.length > 0 ? formatCurrency(Math.round(mrr / activeStores.length)) : "₲ 0"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card header={{ title: "Crecimiento del MRR", icon: <TrendingUp className="w-5 h-5 text-indigo-600" /> }}>
            <div className="pt-4">
              <StatChart data={chartData} height={280} valueFormatter={formatCurrency} />
            </div>
          </Card>
        </div>

        <div>
          <Card
            padding={false}
            header={{ title: "Últimas suscripciones Pro", icon: <CreditCard className="w-5 h-5 text-indigo-600" /> }}
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
                      <p className="text-sm font-semibold text-slate-900">{store.name}</p>
                      <p className="text-xs text-slate-500">{store.slug}</p>
                    </div>
                    <Badge variant="brand" size="sm">Pro</Badge>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
