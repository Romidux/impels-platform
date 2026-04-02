"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tags,
  Warehouse,
  ShoppingCart,
  Users,
  Settings,
  Ticket,
  UserCog,
  CreditCard,
  ExternalLink,
  Zap,
  Store as StoreIcon,
} from "lucide-react";
import { cn, getStoreUrl } from "@/lib/utils";
import { Store } from "@/lib/types";

/* ─── Navigation Structure ─── */
interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "GENERAL",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    title: "CATÁLOGO",
    items: [
      { label: "Productos", href: "/dashboard/products", icon: Package },
      { label: "Categorías", href: "/dashboard/categories", icon: Tags },
      { label: "Inventario", href: "/dashboard/inventory", icon: Warehouse },
    ],
  },
  {
    title: "VENTAS",
    items: [
      { label: "Pedidos", href: "/dashboard/orders", icon: ShoppingCart },
      { label: "Cupones", href: "/dashboard/coupons", icon: Ticket },
      { label: "Clientes", href: "/dashboard/customers", icon: Users },
    ],
  },
  {
    title: "TIENDA",
    items: [
      { label: "Mi Tienda", href: "/dashboard/store", icon: StoreIcon },
    ],
  },
  {
    title: "SISTEMA",
    items: [
      { label: "Equipo", href: "/dashboard/team", icon: UserCog },
      { label: "Plan", href: "/dashboard/plan", icon: CreditCard },
    ],
  },
];

export default function DashboardSidebar({ store }: { store: Store }) {
  const pathname = usePathname();
  const storeUrl = getStoreUrl(store.slug);

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col z-40 hidden md:flex">
      {/* Logo area */}
      <div className="p-5 border-b border-slate-700/50">
        <Link href="/dashboard" className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/20">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-display font-bold text-base text-white">
              Impels
            </span>
            <span className="text-brand-400 font-display font-bold text-base ml-0.5">
              Commerce
            </span>
          </div>
        </Link>

        {/* Store pill — premium */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-brand-600/20">
            <span className="text-white font-bold text-sm">
              {store.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-white truncate">
              {store.name}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {storeUrl.replace(/^https?:\/\//, "")}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {navGroups.map((group, groupIdx) => (
          <div key={group.title}>
            {groupIdx > 0 && (
              <div className="border-t border-slate-800 mb-4" />
            )}
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 group",
                      isActive
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "w-4 h-4 flex-shrink-0",
                        isActive
                          ? "text-white"
                          : "text-slate-500 group-hover:text-slate-300"
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700/50 space-y-2">
        {/* CTA: Ver mi tienda — primary button */}
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full px-3 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-all duration-200 shadow-lg shadow-brand-600/25"
        >
          <ExternalLink className="w-4 h-4" />
          Ver mi tienda
        </a>

        {/* Plan badge */}
        <div className="px-3 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Plan</span>
          <span
            className={cn(
              "text-xs font-bold px-2.5 py-0.5 rounded-full",
              store.plan === "pro"
                ? "bg-brand-600/20 text-brand-300 border border-brand-500/30"
                : "bg-slate-700 text-slate-300"
            )}
          >
            {store.plan === "pro" ? "Pro ✨" : "Gratis"}
          </span>
        </div>
        {store.plan === "free" && (
          <Link
            href="/dashboard/plan"
            className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-brand-600 to-purple-600 text-white text-xs font-bold px-3 py-2.5 rounded-xl hover:opacity-90 transition-all duration-200 w-full shadow-lg shadow-brand-600/20"
          >
            <Zap className="w-3 h-3" />
            Upgrade a Pro
          </Link>
        )}
      </div>
    </aside>
  );
}
