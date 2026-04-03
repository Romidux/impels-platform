"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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
  Palette,
  Home,
  Layers,
  Phone,
  Link as LinkIcon,
  Sparkles,
} from "lucide-react";
import { cn, getStoreUrl } from "@/lib/utils";
import { Store } from "@/lib/types";

interface NavChild {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
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
      {
        label: "Mi Tienda",
        href: "/dashboard/store",
        icon: StoreIcon,
        children: [
          {
            label: "Identidad",
            href: "/dashboard/store?tab=identity",
            icon: StoreIcon,
          },
          {
            label: "Apariencia",
            href: "/dashboard/store?tab=appearance",
            icon: Palette,
          },
          {
            label: "Inicio",
            href: "/dashboard/store?tab=homepage",
            icon: Home,
          },
          {
            label: "Secciones",
            href: "/dashboard/store?tab=sections",
            icon: Layers,
          },
          {
            label: "Ventas y contacto",
            href: "/dashboard/store?tab=commerce",
            icon: Phone,
          },
          {
            label: "Footer y redes",
            href: "/dashboard/store?tab=footer",
            icon: LinkIcon,
          },
          {
            label: "Edición por capas",
            href: "/dashboard/store",
            icon: Sparkles,
          },
        ],
      },
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
  const searchParams = useSearchParams();
  const storeUrl = getStoreUrl(store.slug);
  const [productsOpen, setProductsOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);

  const isItemActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const isChildActive = (href: string) => {
    const [path, query] = href.split("?");
    if (!query) return pathname === path;
    
    const params = new URLSearchParams(query);
    const tab = params.get("tab");
    return pathname === path && searchParams.get("tab") === tab;
  };

  const isExpanded = (item: NavItem) => {
    if (item.label === "Productos") return productsOpen;
    if (item.label === "Mi Tienda") return storeOpen;
    return false;
  };

  const toggleItem = (item: NavItem) => {
    if (item.label === "Productos") setProductsOpen(!productsOpen);
    if (item.label === "Mi Tienda") setStoreOpen(!storeOpen);
  };

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
                  const expanded = isExpanded(item);

                  if (hasChildren) {
                    return (
                      <div
                        key={item.href}
                        className={cn(
                          "group rounded-xl transition-all duration-150",
                          isActive || hasActiveChild
                            ? "bg-slate-100/50"
                            : "hover:bg-white/50"
                        )}
                      >
                        <div className="flex items-center">
                          <Link
                            href={item.href}
                            onClick={() => toggleItem(item)}
                            className={cn(
                              "flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2 text-[14px] transition-all duration-150",
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
                        </div>

                        {expanded && (
                          <div className="space-y-1 pb-2">
                            {item.children?.map((child) => {
                              const childActive = isChildActive(child.href);

                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  className={cn(
                                    "flex items-center gap-3 rounded-xl py-1.5 pl-8 pr-3 text-[13px] transition-all duration-150",
                                    childActive
                                      ? "text-slate-900 font-semibold"
                                      : "text-slate-500 hover:text-slate-700 hover:bg-white/60"
                                  )}
                                >
                                  {child.icon && (
                                    <child.icon className="h-4 w-4 flex-shrink-0" />
                                  )}
                                  <span className="truncate">{child.label}</span>
                                </Link>
                              );
                            })}
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
