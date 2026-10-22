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
  Zap,
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

/* Ya no recibe `user`: el bloque de perfil se mudó al DashboardHeader. */
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
    /* Panel gris en el flujo, no un `fixed` con borde derecho. Al salir de
       `fixed` desaparece el `md:ml-64` que compensaba su ancho en el layout:
       ahora el sidebar ocupa su lugar en el flex y el ancho lo define él.
       La separación con el contenido la da el gap del shell, no una línea. */
    <aside className="my-3 ml-3 hidden h-[calc(100vh-1.5rem)] w-[232px] shrink-0 flex-col overflow-hidden rounded-2xl bg-neutral-50 md:flex">
      {/* Logo */}
      <div className="px-6 pt-5 pb-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-display font-semibold text-base text-neutral-900">
              Impels
            </span>
            <span className="text-brand-600 font-display font-semibold text-base ml-0.5">
              Commerce
            </span>
          </div>
        </Link>
      </div>

      {/* Store section */}
      <div className="px-4 pb-3 border-b border-neutral-200/60">
        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white border border-neutral-200 text-neutral-500">
              <StoreIcon className="h-4 w-4" />
            </div>
            <p className="truncate text-sm font-medium leading-tight text-neutral-900">
              {store.name}
            </p>
          </div>
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl text-neutral-400 transition-colors hover:bg-white hover:text-neutral-900"
            title="Ver tienda"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        {navGroups.map((group, groupIdx) => (
          <section key={groupIdx} className={cn("space-y-0.5", groupIdx > 0 && "mt-3")}>
            {group.label && (
              /* El label del grupo ya separa visualmente por sí mismo: no
                 necesita padding propio arriba y abajo además del mt-3 de la
                 sección. Tres grupos con 24px entre cada uno dejaban la
                 navegación llena de huecos. */
              <p className="px-3 pb-0.5 text-2xs font-semibold uppercase tracking-[0.12em] text-neutral-400">
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
                      "relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150",
                      active
                        ? "font-bold text-neutral-900"
                        : "font-normal text-neutral-500 hover:bg-white hover:text-neutral-900"
                    )}
                  >
                    {/* El activo se marca con una barra, no con una píldora de
                        fondo: sobre un sidebar ya gris, un fondo verde claro casi
                        no se distingue, y la barra lee desde el rabillo del ojo. */}
                    {active && (
                      <span className="absolute top-1/2 -left-1 h-5 w-[3px] -translate-y-1/2 rounded-full bg-brand-600" />
                    )}
                    <div className="flex h-5 w-5 items-center justify-center">
                      <item.icon
                        className={cn(
                          "h-4 w-4 flex-shrink-0",
                          active ? "text-neutral-900" : "text-neutral-400"
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
                      <div className="ml-3 mt-1 flex flex-col gap-0.5 border-l border-neutral-200 pl-3">
                        {item.children?.map((child) => {
                          const isActive = isChildActive(child.href);

                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={cn(
                                "relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-neutral-500 transition-all duration-150 hover:bg-white hover:text-neutral-900",
                                isActive && "font-bold text-neutral-900"
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

      {/* El bloque de usuario (campana + avatar + email + logout) vivía acá
          abajo. Se fue al DashboardHeader, que ahora existe y trae exactamente
          lo mismo: tenerlo en los dos lugares mostraba el mismo avatar y el
          mismo "Cerrar sesión" dos veces en pantalla.

          Como efecto secundario, el sidebar dejó de desbordar: ese bloque era
          lo que empujaba la navegación más allá del alto disponible y le metía
          una barra de scroll propia. */}
    </aside>
  );
}
