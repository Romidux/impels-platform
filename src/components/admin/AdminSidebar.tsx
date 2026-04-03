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
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900 flex flex-col z-40 hidden md:flex">
      <div className="p-5 border-b border-slate-700/50">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-display font-bold text-base text-white">
              Impels
            </span>
            <span className="text-indigo-400 font-display font-bold text-base ml-0.5">
              Admin
            </span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
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
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all group",
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm"
                    : item.disabled
                    ? "text-slate-500/80 bg-slate-900/40 cursor-not-allowed"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                );

                const content = (
                  <>
                    <item.icon
                      className={cn(
                        "w-4 h-4 flex-shrink-0",
                        isActive
                          ? "text-white"
                          : item.disabled
                          ? "text-slate-600"
                          : "text-slate-500 group-hover:text-slate-300"
                      )}
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.soon && !isActive && (
                      <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Proximamente
                      </span>
                    )}
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/50" />
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

      <div className="p-4 border-t border-slate-700/50">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Zap className="w-4 h-4" />
          Ir al Dashboard
        </Link>
        <div className="px-3 py-2 mt-1">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            Super Admin
          </span>
        </div>
      </div>
    </aside>
  );
}
