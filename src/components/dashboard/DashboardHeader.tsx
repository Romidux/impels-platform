"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Bell, LogOut, User, ChevronDown, Zap } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Store, AuthUser } from "@/lib/types";
import { getStoreUrl, cn } from "@/lib/utils";
import GlobalSearch from "@/components/dashboard/GlobalSearch";

export default function DashboardHeader({
  user,
  store,
}: {
  user: AuthUser;
  store: Store;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    router.push("/login");
    router.refresh();
  };

  return (
    /* Panel gris propio, hermano del sidebar y del contenido. No es `sticky`:
       en el shell nuevo el header no scrollea con la página, está fuera del
       área que scrollea. */
    <header className="flex shrink-0 items-center justify-between gap-4 rounded-2xl bg-neutral-50 px-4 py-3">
      {/* Left: Logo — solo en mobile, donde no hay sidebar que lo muestre */}
      <div className="flex min-w-0 items-center md:hidden">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600">
            <Zap className="h-4 w-4 text-white" />
          </div>
        </Link>
      </div>

      {/* Center: Search */}
      <div className="min-w-0 flex-1 md:max-w-sm">
        <GlobalSearch storeId={store.id} />
      </div>

      {/* Right: Actions */}
      <div className="flex shrink-0 items-center justify-end gap-2">
        {/* Notifications */}
        <button className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-500 transition-colors hover:text-neutral-900">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full border-2 border-white bg-brand-600"></span>
        </button>

        <div className="relative ml-1">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-white"
          >
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center">
              <span className="text-white text-xs font-semibold">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-medium text-neutral-600 truncate max-w-[120px]">
                {user.email}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-apple-md border border-neutral-200 z-20 overflow-hidden animate-scale-in">
                <div className="p-3 border-b border-neutral-100/60">
                  <p className="text-xs text-neutral-500 truncate">
                    {user.email}
                  </p>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/dashboard/store/identity");
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-xl transition-colors"
                  >
                    <User className="w-4 h-4 text-neutral-400" />
                    Mi perfil
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
