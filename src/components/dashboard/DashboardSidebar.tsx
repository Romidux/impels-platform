"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Ticket,
  UserCog,
  CreditCard,
  Store as StoreIcon,
  ChevronDown,
  ChevronRight,
  ExternalLink,
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
        label: "Inicio",
        href: "/dashboard",
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    title: "CATALOGO",
    items: [
      {
        label: "Productos",
        href: "/dashboard/products",
        icon: Package,
        children: [
          { label: "Categorias", href: "/dashboard/categories" },
          { label: "Inventario", href: "/dashboard/inventory" },
        ],
      },
    ],
  },
  {
    title: "VENTAS",
    items: [
      { label: "Pedidos", href: "/dashboard/orders", icon: ShoppingCart },
      { label: "Clientes", href: "/dashboard/customers", icon: Users },
      { label: "Cupones", href: "/dashboard/coupons", icon: Ticket },
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
  const [catalogOpen, setCatalogOpen] = useState(false);

  const isItemActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const isChildActive = (href: string) => pathname.startsWith(href);

  return (
    <aside className="fixed left-0 top-14 bottom-0 z-40 hidden w-64 flex-col border-r border-slate-200/80 bg-gradient-to-b from-white via-white to-slate-50/80 shadow-[10px_0_28px_rgba(15,23,42,0.04)] md:flex">
      <div className="px-4 py-4 pt-5 pb-2">
        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-slate-950 text-white shadow-sm flex-shrink-0">
              <StoreIcon className="h-5 w-5" />
            </div>
            <p className="truncate font-bold text-[16px] text-slate-900 leading-tight tracking-tight">
              {store.name}
            </p>
          </div>
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors flex-shrink-0"
            title="Ver tienda"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {navGroups.map((group) => {
          const groupActive = group.items.some(
            (item) =>
              isItemActive(item) ||
              item.children?.some((child) => isChildActive(child.href))
          );

          return (
            <div key={group.title} className="space-y-1">
              {group.items.map((item) => {
                  const hasChildren = Boolean(item.children?.length);
                  const isActive = isItemActive(item);
                  const hasActiveChild = item.children?.some((child) =>
                    isChildActive(child.href)
                  );
                  const isExpanded = hasChildren && catalogOpen;

                  if (hasChildren) {
                    return (
                      <div
                        key={item.href}
                        className={cn(
                          "group rounded-xl transition-all duration-150",
                          isActive || hasActiveChild
                            ? "bg-slate-100"
                            : "hover:bg-slate-50"
                        )}
                      >
                        <div className="flex items-center gap-2 px-1 py-0.5">
                          <Link
                            href={item.href}
                            className={cn(
                              "flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2 text-[14px] transition-all duration-150",
                              isActive || hasActiveChild
                                ? "text-slate-900 font-semibold"
                                : "text-slate-500 hover:text-slate-700"
                            )}
                          >
                            <div className="flex h-5 w-5 items-center justify-center">
                              <item.icon className="h-5 w-5" />
                            </div>
                            <span className="truncate">{item.label}</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => setCatalogOpen((current) => !current)}
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                              isActive || hasActiveChild
                                ? "text-slate-900 hover:bg-slate-200"
                                : "text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                            )}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="px-4 pb-2 pl-[3.35rem]">
                            <div className="space-y-1">
                              {item.children?.map((child) => {
                                const childActive = isChildActive(child.href);

                                return (
                                  <Link
                                    key={child.href}
                                    href={child.href}
                                    className={cn(
                                      "group flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200",
                                      childActive
                                        ? "bg-brand-50/80 text-brand-700"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "h-1.5 w-1.5 rounded-full transition-colors",
                                        childActive
                                          ? "bg-brand-600"
                                          : "bg-slate-300 group-hover:bg-slate-500"
                                      )}
                                    />
                                    <span>{child.label}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] transition-all duration-150",
                        isActive
                          ? "bg-slate-100 text-slate-900 font-semibold"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                      )}
                    >
                      <div className="flex h-5 w-5 items-center justify-center">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
            </div>
          );
        })}
      </nav>

    </aside>
  );
}
