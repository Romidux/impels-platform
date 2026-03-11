"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  Palette,
  Settings,
  Users,
  Zap,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { cn, getStoreUrl } from "@/lib/utils";
import { Store } from "@/lib/types";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Productos",
    href: "/dashboard/products",
    icon: Package,
  },
  {
    label: "Categorías",
    href: "/dashboard/categories",
    icon: Tags,
  },
  {
    label: "Pedidos",
    href: "/dashboard/orders",
    icon: ShoppingCart,
  },
  {
    label: "Apariencia",
    href: "/dashboard/appearance",
    icon: Palette,
  },
  {
    label: "Equipo",
    href: "/dashboard/team",
    icon: Users,
  },
  {
    label: "Configuración",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function DashboardSidebar({ store }: { store: Store }) {
  const pathname = usePathname();
  const storeUrl = getStoreUrl(store.slug);

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-100 flex flex-col z-40 shadow-sm hidden md:flex">
      {/* Logo area */}
      <div className="p-5 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg text-gray-900">
            Impels
          </span>
        </Link>

        {/* Store pill */}
        <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">
              {store.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-gray-900 truncate">
              {store.name}
            </p>
            <p className="text-xs text-gray-400 truncate">{store.slug}.impels.com</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                isActive
                  ? "gradient-brand text-white shadow-glow"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <item.icon
                className={cn(
                  "w-4 h-4 flex-shrink-0",
                  isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                )}
              />
              {item.label}
              {isActive && (
                <ChevronRight className="w-4 h-4 ml-auto text-white/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* View store link */}
      <div className="p-4 border-t border-gray-100">
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Ver mi tienda
        </a>

        {/* Plan badge */}
        <div className="mt-2 px-3 py-2 bg-gray-50 rounded-xl flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">Plan actual</span>
          <span
            className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-full",
              store.plan === "pro"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-200 text-gray-600"
            )}
          >
            {store.plan === "pro" ? "Pro ✨" : "Gratis"}
          </span>
        </div>
        {store.plan === "free" && (
          <Link
            href="/dashboard/settings"
            className="mt-2 flex items-center justify-center gap-1.5 gradient-brand text-white text-xs font-bold px-3 py-2 rounded-xl hover:shadow-glow transition-all w-full"
          >
            <Zap className="w-3 h-3" />
            Upgrade a Pro
          </Link>
        )}
      </div>
    </aside>
  );
}
