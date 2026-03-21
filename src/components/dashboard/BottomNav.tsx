"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  MoreHorizontal,
  Users,
  CreditCard,
  Tags,
  Warehouse,
  UserCog,
  X,
  Store as StoreIcon,
  Puzzle,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const mainItems = [
  { label: "Inicio", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Productos", href: "/dashboard/products", icon: Package },
  { label: "Pedidos", href: "/dashboard/orders", icon: ShoppingCart },
  { label: "Mi Tienda", href: "/dashboard/store", icon: StoreIcon },
];

const moreItems = [
  { label: "Categorías", href: "/dashboard/categories", icon: Tags },
  { label: "Inventario", href: "/dashboard/inventory", icon: Warehouse },
  { label: "Clientes", href: "/dashboard/customers", icon: Users },
  { label: "Equipo", href: "/dashboard/team", icon: UserCog },
  { label: "Plan", href: "/dashboard/plan", icon: CreditCard },
  { label: "Aplicaciones", href: "/dashboard/apps", icon: Puzzle },
  { label: "Soporte", href: "/dashboard/support", icon: HelpCircle },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  // Check if any "more" item is active
  const isMoreActive = moreItems.some((item) =>
    pathname.startsWith(item.href)
  );

  return (
    <>
      {/* More drawer overlay */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg max-h-[70vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-display font-bold text-base text-slate-900">
                Más opciones
              </h3>
              <button
                onClick={() => setMoreOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-3 grid grid-cols-3 gap-2">
              {moreItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 text-center",
                    isActive(item.href)
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-500 hover:bg-slate-50"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[11px] font-medium leading-tight">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16">
          {mainItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[60px] relative",
                  active
                    ? "text-brand-600"
                    : "text-slate-400"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5",
                    active && "text-brand-600"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    active && "font-bold"
                  )}
                >
                  {item.label}
                </span>
                {active && (
                  <div className="absolute top-0 w-8 h-0.5 bg-brand-600 rounded-full" />
                )}
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[60px]",
              isMoreActive ? "text-brand-600" : "text-slate-400"
            )}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span
              className={cn(
                "text-[10px] font-medium",
                isMoreActive && "font-bold"
              )}
            >
              Más
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
