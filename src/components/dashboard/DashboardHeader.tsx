"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Bell, LogOut, User, ChevronDown, ExternalLink, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Store, AuthUser } from "@/lib/types";
import { getStoreUrl } from "@/lib/utils";

/* ─── Breadcrumb label map ─── */
const ROUTE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/products": "Productos",
  "/dashboard/products/new": "Nuevo producto",
  "/dashboard/categories": "Categorías",
  "/dashboard/inventory": "Inventario",
  "/dashboard/orders": "Pedidos",
  "/dashboard/customers": "Clientes",
  "/dashboard/store": "Mi Tienda",
  "/dashboard/team": "Equipo",
  "/dashboard/plan": "Plan",
};

export default function DashboardHeader({
  user,
  store,
}: {
  user: AuthUser;
  store: Store;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    router.push("/login");
    router.refresh();
  };

  // Build breadcrumbs
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: { label: string; href: string }[] = [];
  let currentPath = "";
  for (const seg of segments) {
    currentPath += `/${seg}`;
    const label = ROUTE_LABELS[currentPath];
    if (label) {
      breadcrumbs.push({ label, href: currentPath });
    }
  }

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
      {/* Left: breadcrumbs */}
      <div className="flex items-center gap-1.5 text-sm">
        {breadcrumbs.map((bc, i) => (
          <div key={bc.href} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
            {i === breadcrumbs.length - 1 ? (
              <span className="font-semibold text-slate-900">{bc.label}</span>
            ) : (
              <a
                href={bc.href}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                {bc.label}
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Right: user menu */}
      <div className="flex items-center gap-3">
        <a
          href={getStoreUrl(store.slug)}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-brand-600 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>{getStoreUrl(store.slug).replace(/^https?:\/\//, "")}</span>
        </a>

        <button className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors text-slate-400">
          <Bell className="w-4.5 h-4.5" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 hover:bg-gray-50 pl-2 pr-3 py-1.5 rounded-lg transition-colors"
          >
            <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-slate-700 truncate max-w-[140px]">
                {user.email}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden animate-scale-in">
                <div className="p-3 border-b border-gray-100">
                  <p className="text-xs text-slate-500 truncate">
                    {user.email}
                  </p>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/dashboard/store");
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-slate-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    Mi perfil
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
