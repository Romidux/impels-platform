import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Check, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PlanUpgradeButton } from "@/components/dashboard/PlanUpgradeButton";
import { PRO_PLAN_PRICE_PYG } from "@/lib/plan";

interface PlanPageProps {
  searchParams: Promise<{ reason?: string }>;
}

export default async function PlanPage({ searchParams }: PlanPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, plan")
    .eq("owner_id", user.id)
    .single();
  if (!store) redirect("/onboarding");

  const { reason } = await searchParams;
  const priceFormatted = `Gs ${PRO_PLAN_PRICE_PYG.toLocaleString("es-PY")}`;

  const plans = [
    {
      name: "Gratis",
      slug: "free",
      price: "Gs 0",
      features: [
        "Hasta 10 productos",
        "Template Minimal",
        "Pedidos por WhatsApp",
        "1 miembro del equipo",
        "Soporte por email",
      ],
    },
    {
      name: "Pro",
      slug: "pro",
      price: priceFormatted,
      priceSuffix: "/mes",
      features: [
        "Productos ilimitados",
        "Todos los templates",
        "Equipo ilimitado",
        "Soporte prioritario",
        "Analytics avanzados",
        "Clientes y CRM",
      ],
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Plan" subtitle="Gestiona tu suscripción" />

      {reason === "limit" && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 max-w-3xl">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Alcanzaste el límite de productos del plan Gratis
            </p>
            <p className="text-sm text-amber-700 mt-0.5">
              Actualizá a Pro para agregar productos ilimitados.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
        {plans.map((plan) => {
          const isCurrent = store.plan === plan.slug;
          return (
            <div
              key={plan.slug}
              className={`dash-card p-6 relative ${
                isCurrent ? "border-green-400 border-2" : ""
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Plan actual
                </div>
              )}
              <div className="text-center mb-5">
                <h3 className="font-display text-xl font-bold text-slate-900">
                  {plan.name}
                </h3>
                <p className="font-display text-2xl font-black text-slate-900 mt-2">
                  {plan.price}
                  {"priceSuffix" in plan && (
                    <span className="text-base font-semibold text-slate-500">
                      {plan.priceSuffix}
                    </span>
                  )}
                </p>
              </div>
              <ul className="space-y-2.5">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-sm text-slate-600"
                  >
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              {plan.slug === "pro" && !isCurrent && (
                <PlanUpgradeButton storeName={store.name} />
              )}
              {plan.slug === "pro" && isCurrent && (
                <div className="mt-5 w-full text-center text-sm font-semibold text-green-600 py-2.5">
                  ✓ Activo
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-400 max-w-3xl">
        El plan Pro se activa manualmente tras la confirmación del pago. Para
        consultas escribí a{" "}
        <span className="font-medium">
          {process.env.NEXT_PUBLIC_BILLING_EMAIL ?? "soporte@impels.com"}
        </span>
        .
      </p>
    </div>
  );
}
