"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  Zap,
  Bell,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";
import { cn, getStoreUrl } from "@/lib/utils";
import { Store, AuthUser } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

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

export default function DashboardSidebar({
  store,
  user,
}: {
  store: Store;
  user: AuthUser;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const storeUrl = getStoreUrl(store.slug);
  const [expanded, setExpanded] = useState({
    catalog: false,
    store: false,
  });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleExpandable = (key?: "catalog" | "store") => {
    if (!key) return;
    setExpanded((current) => ({ ...current, [key]: !current[key] }));
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-40 hidden w-64 flex-col bg-[#FAFAFA] border-r border-[#E5E5EA]/60 md:flex">
      {/* Logo */}
      <div className="px-6 pt-5 pb-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#0071E3] flex items-center justify-center shadow-[0_2px_8px_rgba(0,113,227,0.25)]">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-display font-semibold text-base text-[#1D1D1F]">
              Impels
            </span>
            <span className="text-[#0071E3] font-display font-semibold text-base ml-0.5">
              Commerce
            </span>
          </div>
        </Link>
      </div>

      {/* Store section */}
      <div className="px-4 pb-3 border-b border-[#E5E5EA]/60">
        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white border border-[#E5E5EA] text-[#6E6E73] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <StoreIcon className="h-4 w-4" />
            </div>
            <p className="truncate text-sm font-medium leading-tight text-[#1D1D1F]">
              {store.name}
            </p>
          </div>
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl text-[#86868B] transition-colors hover:bg-[#F0F0F2] hover:text-[#1D1D1F]"
            title="Ver tienda"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        {navGroups.map((group, groupIdx) => (
          <section key={groupIdx} className={cn("space-y-0.5", groupIdx > 0 && "mt-6")}>
            {group.label && (
              <p className="px-3 pb-1.5 pt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[#86868B]">
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
                      "relative flex items-center gap-2.5 px-3 py-2 text-sm transition-all duration-150 rounded-xl",
                      active
                        ? "bg-white text-[#1D1D1F] font-medium shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
                        : "font-normal text-[#6E6E73] hover:bg-[#F0F0F2] hover:text-[#1D1D1F]"
                    )}
                  >
                    <div className="flex h-5 w-5 items-center justify-center">
                      <item.icon
                        className={cn(
                          "h-4 w-4 flex-shrink-0",
                          active ? "text-[#1D1D1F]" : "text-[#86868B]"
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
                      <div className="ml-3 mt-1 flex flex-col gap-0.5 border-l border-[#E5E5EA] pl-3">
                        {item.children?.map((child) => {
                          const isActive = isChildActive(child.href);

                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={cn(
                                "relative flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm text-[#6E6E73] transition-all duration-150 hover:bg-[#F0F0F2] hover:text-[#1D1D1F]",
                                isActive &&
                                  "bg-white font-medium text-[#1D1D1F] shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
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

      {/* User section */}
      <div className="border-t border-[#E5E5EA]/60 px-3 py-3" ref={userMenuRef}>
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-[#F0F0F2] transition-colors"
          >
            {/* Notification bell */}
            <div className="relative flex-shrink-0">
              <Bell className="w-4 h-4 text-[#86868B]" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#0071E3] border-2 border-[#FAFAFA]" />
            </div>

            {/* Avatar */}
            <div className="w-7 h-7 rounded-full bg-[#0071E3] flex items-center justify-center flex-shrink-0 shadow-[0_1px_4px_rgba(0,113,227,0.25)]">
              <span className="text-white text-xs font-semibold">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Email */}
            <p className="text-xs font-normal text-[#6E6E73] truncate flex-1 text-left">
              {user.email}
            </p>

            <ChevronDown className={cn(
              "w-3.5 h-3.5 text-[#86868B] flex-shrink-0 transition-transform",
              userMenuOpen && "rotate-180"
            )} />
          </button>

          {/* User dropdown */}
          {userMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-white rounded-[14px] shadow-[0_8px_24px_rgba(0,0,0,0.10)] border border-[#E5E5EA] z-50 overflow-hidden">
              <div className="p-1.5">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    router.push("/dashboard/store/identity");
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] rounded-xl transition-colors"
                >
                  <User className="w-4 h-4 text-[#86868B]" />
                  Mi perfil
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-[#FF3B30] hover:bg-[#FFF2F2] rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
