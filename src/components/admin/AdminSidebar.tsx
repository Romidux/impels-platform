"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  CreditCard,
  LifeBuoy,
  BarChart3,
  ScrollText,
  Flag,
  Layout,
  Megaphone,
  Settings,
  ChevronRight,
  Zap,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  exact?: boolean;
  disabled?: boolean;
  soon?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "PRINCIPAL",
    items: [
      {
        label: "Resumen",
        href: "/admin",
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    title: "GESTION",
    items: [
      { label: "Tiendas", href: "/admin/stores", icon: Store },
      { label: "Facturacion", href: "/admin/billing", icon: CreditCard },
      { label: "Soporte", href: "/admin/support", icon: LifeBuoy },
      { label: "Analytics", icon: BarChart3, disabled: true, soon: true },
    ],
  },
  {
    title: "SISTEMA",
    items: [
      { label: "Audit Log", icon: ScrollText, disabled: true, soon: true },
      { label: "Feature Flags", icon: Flag, disabled: true, soon: true },
      { label: "Templates", icon: Layout, disabled: true, soon: true },
      { label: "Anuncios", href: "/admin/announcements", icon: Megaphone },
    ],
  },
  {
    title: "CONFIG",
    items: [
      { label: "Configuracion", icon: Settings, disabled: true, soon: true },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="my-3 ml-3 hidden h-[calc(100vh-1.5rem)] w-[232px] shrink-0 flex-col overflow-hidden rounded-2xl bg-neutral-50 md:flex">
      <div className="px-5 pb-3 pt-5">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-display font-bold text-base text-neutral-900">
              Impels
            </span>
            <span className="text-brand-600 font-display font-bold text-base ml-0.5">
              Admin
            </span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 pb-0.5 text-2xs font-semibold uppercase tracking-[0.12em] text-neutral-400">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = item.href
                  ? item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href)
                  : false;

                const itemClasses = cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all",
                  isActive
                    ? "font-bold text-neutral-900"
                    : item.disabled
                    ? "text-neutral-300 cursor-not-allowed"
                    : "text-neutral-500 hover:bg-white hover:text-neutral-900"
                );

                const content = (
                  <>
                    {/* Misma marca de activo que el sidebar del dashboard: el
                        admin dejó de ser un producto aparte. */}
                    {isActive && (
                      <span className="absolute top-1/2 -left-1 h-5 w-[3px] -translate-y-1/2 rounded-full bg-brand-600" />
                    )}
                    <item.icon
                      className={cn(
                        "w-4 h-4 flex-shrink-0",
                        isActive
                          ? "text-neutral-900"
                          : item.disabled
                          ? "text-neutral-300"
                          : "text-neutral-400 group-hover:text-neutral-900"
                      )}
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.soon && !isActive && (
                      <span className="rounded-md border border-neutral-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                        Proximamente
                      </span>
                    )}
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 ml-auto text-neutral-400" />
                    )}
                  </>
                );

                return item.href && !item.disabled ? (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={itemClasses}
                  >
                    {content}
                  </Link>
                ) : (
                  <div
                    key={item.label}
                    className={itemClasses}
                    aria-disabled="true"
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-neutral-200 p-3">
        <Link
          href="/dashboard"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-500 transition-colors hover:bg-white hover:text-neutral-900"
        >
          <Zap className="w-4 h-4" />
          Ir al Dashboard
        </Link>
        <div className="px-3 py-2 mt-1">
          <span className="text-2xs font-semibold uppercase tracking-[0.12em] text-neutral-400">
            Super Admin
          </span>
        </div>
      </div>
    </aside>
  );
}
