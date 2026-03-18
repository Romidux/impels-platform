import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CreditCard, Zap, Check } from "lucide-react";
import { DashPageHeader } from "@/components/dashboard/ui/DashPageHeader";
import { DashCard } from "@/components/dashboard/ui/DashCard";

export default async function PlanPage() {
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

  const plans = [
    {
      name: "Gratis",
      slug: "free",
      price: "0",
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
      price: "Próximamente",
      features: [
        "Productos ilimitados",
        "Todos los templates",
        "Dominio personalizado",
        "Equipo ilimitado",
        "Soporte prioritario",
        "Analytics avanzados",
        "Clientes y CRM",
      ],
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <DashPageHeader
        title="Plan"
        subtitle="Gestiona tu suscripción"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
        {plans.map((plan) => {
          const isCurrent = store.plan === plan.slug;
          return (
            <div
              key={plan.slug}
              className={`dash-card p-6 relative ${
                isCurrent ? "border-green-300 border-2" : ""
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Plan actual
                </div>
              )}
              <div className="text-center mb-5">
                <h3 className="font-display text-xl font-bold text-slate-900">
                  {plan.name}
                </h3>
                <p className="text-2xl font-display font-black text-slate-900 mt-2">
                  {plan.price}
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
                <button
                  disabled
                  className="mt-5 w-full bg-green-800 text-white font-semibold py-2.5 rounded-xl opacity-60 cursor-not-allowed text-sm"
                >
                  Próximamente
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
