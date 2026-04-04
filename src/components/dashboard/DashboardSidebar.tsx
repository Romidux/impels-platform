"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Ticket,
  UserCog,
  CreditCard,
  Store as StoreIcon,
  ExternalLink,
  LayoutGrid,
} from "lucide-react";
import { cn, getStoreUrl } from "@/lib/utils";
import { Store } from "@/lib/types";

interface NavChild {
  label: string;
  href: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  children?: NavChild[];
  expandableKey?: "catalog" | "store";
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    items: [
      {
        label: "Inicio",
        href: "/dashboard",
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    label: "Catálogo",
    items: [
      {
        label: "Productos",
        href: "/dashboard/products",
        icon: Package,
        expandableKey: "catalog",
        children: [
          { label: "Categorias", href: "/dashboard/categories" },
          { label: "Inventario", href: "/dashboard/inventory" },
        ],
      },
    ],
  },
  {
    label: "Ventas",
    items: [
      { label: "Pedidos", href: "/dashboard/orders", icon: ShoppingCart },
      { label: "Clientes", href: "/dashboard/customers", icon: Users },
      { label: "Cupones", href: "/dashboard/coupons", icon: Ticket },
      { label: "Aplicaciones", href: "/dashboard/apps", icon: LayoutGrid },
    ],
  },
  {
    label: "Tienda",
    items: [
      {
        label: "Mi Tienda",
        href: "/dashboard/store",
        icon: StoreIcon,
        expandableKey: "store",
        children: [
          { label: "Identidad", href: "/dashboard/store/identity" },
          { label: "Apariencia", href: "/dashboard/store/appearance" },
          { label: "Inicio", href: "/dashboard/store/home" },
          { label: "Secciones", href: "/dashboard/store/sections" },
          { label: "Ventas y contacto", href: "/dashboard/store/sales" },
        ],
      },
    ],
  },
  {
    label: "Cuenta",
    items: [
      { label: "Equipo", href: "/dashboard/team", icon: UserCog },
      { label: "Plan", href: "/dashboard/plan", icon: CreditCard },
    ],
  },
];

export default function DashboardSidebar({ store }: { store: Store }) {
  const pathname = usePathname();
  const storeUrl = getStoreUrl(store.slug);
  const [expanded, setExpanded] = useState({
    catalog: false,
    store: false,
  });

  const isItemActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const isChildActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    setExpanded((current) => ({
      catalog:
        current.catalog ||
        pathname.startsWith("/dashboard/products") ||
        pathname.startsWith("/dashboard/categories") ||
        pathname.startsWith("/dashboard/inventory"),
      store: current.store || pathname.startsWith("/dashboard/store"),
    }));
  }, [pathname]);

  const toggleExpandable = (key?: "catalog" | "store") => {
    if (!key) return;
    setExpanded((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <aside className="fixed left-0 top-14 bottom-0 z-40 hidden w-64 flex-col border-r border-slate-200/80 bg-gradient-to-b from-white via-white to-slate-50/80 shadow-[10px_0_28px_rgba(15,23,42,0.04)] md:flex">
      <div className="px-4 pb-2 pt-5">
        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[12px] bg-brand-50 text-brand-600 shadow-sm">
              <StoreIcon className="h-5 w-5" />
            </div>
            <p className="truncate text-[16px] font-bold leading-tight tracking-tight text-slate-900">
              {store.name}
            </p>
          </div>
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            title="Ver tienda"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        {navGroups.map((group, groupIdx) => (
          <section key={groupIdx} className={cn("space-y-0.5", groupIdx > 0 && "mt-4")}>
            {group.label && (
              <p className="px-3 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const hasChildren = Boolean(item.children?.length);
                const itemActive = isItemActive(item);
                const childActive = item.children?.some((child) =>
                  isChildActive(child.href)
                );
                const active = itemActive || childActive;
                const isOpen = item.expandableKey
                  ? expanded[item.expandableKey]
                  : false;

                const ParentLink = (
                  <Link
                    href={item.href}
                    onClick={() => toggleExpandable(item.expandableKey)}
                    className={cn(
                      "relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-150",
                      active
                        ? "bg-brand-50 text-brand-700 border border-brand-100 font-medium before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[2px] before:rounded-full before:bg-brand-600"
                        : "font-medium text-gray-900 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <div className="flex h-5 w-5 items-center justify-center">
                      <item.icon
                        className={cn(
                          "h-4 w-4 flex-shrink-0",
                          active ? "text-brand-600" : "text-gray-400"
                        )}
                      />
                    </div>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );

                if (!hasChildren) {
                  return <div key={item.href}>{ParentLink}</div>;
                }

                return (
                  <div key={item.href} className="space-y-1">
                    {ParentLink}

                    {isOpen && (
                      <div className="ml-3 mt-1 flex flex-col gap-1 border-l border-gray-200/60 pl-3">
                        {item.children?.map((child) => {
                          const isActive = isChildActive(child.href);

                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={cn(
                                "relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition-all duration-150 hover:bg-gray-100 hover:text-gray-900",
                                isActive &&
                                  "bg-brand-50/80 font-medium text-brand-700 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[2px] before:rounded-full before:bg-brand-600"
                              )}
                            >
                              <span className="truncate">{child.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </nav>
    </aside>
  );
}
