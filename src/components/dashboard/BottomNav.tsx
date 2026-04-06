"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  MoreHorizontal,
  Users,
  CreditCard,
  Tags,
  Warehouse,
  UserCog,
  X,
  Store as StoreIcon,
  Ticket,
  LayoutGrid,
  Share2,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { cn, getStoreUrl } from "@/lib/utils";
import { useState } from "react";

const mainItems = [
  { label: "Inicio", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Productos", href: "/dashboard/products", icon: Package },
  { label: "Pedidos", href: "/dashboard/orders", icon: ShoppingCart },
  { label: "Mi Tienda", href: "/dashboard/store", icon: StoreIcon },
];

const moreItems = [
  { label: "Categorías", href: "/dashboard/categories", icon: Tags },
  { label: "Inventario", href: "/dashboard/inventory", icon: Warehouse },
  { label: "Clientes", href: "/dashboard/customers", icon: Users },
  { label: "Cupones", href: "/dashboard/coupons", icon: Ticket },
  { label: "Aplicaciones", href: "/dashboard/apps", icon: LayoutGrid },
  { label: "Equipo", href: "/dashboard/team", icon: UserCog },
  { label: "Plan", href: "/dashboard/plan", icon: CreditCard },
];

interface BottomNavProps {
  storeSlug?: string;
}

export default function BottomNav({ storeSlug }: BottomNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const isMoreActive = moreItems.some((item) => pathname.startsWith(item.href));

  const storeUrl = storeSlug ? getStoreUrl(storeSlug) : null;

  const handleShare = async () => {
    if (!storeUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Mi tienda", url: storeUrl });
      } catch {
        // user cancelled — no-op
      }
    } else {
      setShareOpen(true);
    }
  };

  const handleCopy = async () => {
    if (!storeUrl) return;
    await navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* More drawer */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg max-h-[70vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-display font-bold text-base text-slate-900">
                Más opciones
              </h3>
              <button
                onClick={() => setMoreOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Share tile at the top */}
            {storeUrl && (
              <div className="px-3 pt-3 pb-1">
                <button
                  onClick={() => { setMoreOpen(false); handleShare(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-brand-50 text-brand-700 rounded-xl font-semibold text-sm transition-colors hover:bg-brand-100"
                >
                  <Share2 className="w-5 h-5 flex-shrink-0" />
                  Compartir mi tienda
                </button>
              </div>
            )}

            <div className="p-3 grid grid-cols-3 gap-2">
              {moreItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 text-center",
                    isActive(item.href)
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-500 hover:bg-slate-50"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[11px] font-medium leading-tight">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Share sheet (fallback for non-native share) */}
      {shareOpen && storeUrl && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShareOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-display font-bold text-base text-slate-900">
                Compartir tienda
              </h3>
              <button
                onClick={() => setShareOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-4 space-y-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              {/* URL display */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <span className="text-sm text-slate-600 flex-1 truncate font-medium">
                  {storeUrl}
                </span>
              </div>
              {/* Actions */}
              <button
                onClick={handleCopy}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors",
                  copied
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-brand-600 text-white hover:bg-brand-700"
                )}
              >
                {copied ? (
                  <><Check className="w-4 h-4" /> ¡Copiado!</>
                ) : (
                  <><Copy className="w-4 h-4" /> Copiar link</>
                )}
              </button>
              <a
                href={storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShareOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir tienda
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16">
          {mainItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[60px] relative",
                  active ? "text-brand-600" : "text-slate-400"
                )}
              >
                <item.icon className={cn("w-5 h-5", active && "text-brand-600")} />
                <span className={cn("text-[10px] font-medium", active && "font-bold")}>
                  {item.label}
                </span>
                {active && (
                  <div className="absolute top-0 w-8 h-0.5 bg-brand-600 rounded-full" />
                )}
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[60px]",
              isMoreActive ? "text-brand-600" : "text-slate-400"
            )}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className={cn("text-[10px] font-medium", isMoreActive && "font-bold")}>
              Más
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
