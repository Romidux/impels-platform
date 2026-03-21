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
  Palette,
  Home,
  Layers,
  Globe,
  Settings,
  UserCog,
  CreditCard,
  ExternalLink,
  ChevronRight,
  Zap,
  Store as StoreIcon, // Use alias to avoid type collision
  Puzzle,
  HelpCircle,
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
      { label: "Aplicaciones", href: "/dashboard/apps", icon: Puzzle },
      { label: "Soporte", href: "/dashboard/support", icon: HelpCircle },
    ],
  },
];

export default function DashboardSidebar({ store }: { store: Store }) {
  const pathname = usePathname();
  const storeUrl = getStoreUrl(store.slug);

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200/80 flex flex-col z-40 hidden md:flex">
      {/* Logo area */}
      <div className="p-5 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shadow-sm">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg text-slate-900">
            Impels
          </span>
        </Link>

        {/* Store pill */}
        <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg gradient-brand flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">
              {store.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-slate-900 truncate">
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
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
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
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all group",
                      isActive
                        ? "bg-brand-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "w-4 h-4 flex-shrink-0",
                        isActive
                          ? "text-white"
                          : "text-slate-400 group-hover:text-slate-600"
                      )}
                    />
                    {item.label}
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/50" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 space-y-2">
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Ver mi tienda
        </a>

        {/* Plan badge */}
        <div className="px-3 py-2 bg-slate-50 rounded-lg flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Plan</span>
          <span
            className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-full",
              store.plan === "pro"
                ? "bg-brand-100 text-brand-700"
                : "bg-gray-200 text-gray-600"
            )}
          >
            {store.plan === "pro" ? "Pro ✨" : "Gratis"}
          </span>
        </div>
        {store.plan === "free" && (
          <Link
            href="/dashboard/plan"
            className="flex items-center justify-center gap-1.5 gradient-brand text-white text-xs font-bold px-3 py-2 rounded-lg hover:opacity-90 transition-all w-full"
          >
            <Zap className="w-3 h-3" />
            Upgrade a Pro
          </Link>
        )}
      </div>
    </aside>
  );
}
