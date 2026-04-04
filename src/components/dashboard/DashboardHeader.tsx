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
    <header className="sticky top-0 z-50 h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between">
      {/* Left: Logo */}
      <div className="flex-1 flex items-center min-w-0">
        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/20">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div className="hidden lg:block">
            <span className="font-display font-bold text-base text-slate-900">
              Impels
            </span>
            <span className="text-brand-600 font-display font-bold text-base ml-0.5">
              Commerce
            </span>
          </div>
        </Link>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-xl px-4">
        <GlobalSearch storeId={store.id} />
      </div>

      {/* Right: Actions */}
      <div className="flex-1 flex items-center justify-end gap-2">
        {/* Notifications */}
        <button className="relative p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-500 border-2 border-white"></span>
        </button>

        <div className="relative ml-1">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 hover:bg-slate-100 px-2 py-1.5 rounded-lg transition-colors"
          >
            <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center border border-slate-200">
              <span className="text-white text-xs font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-medium text-slate-700 truncate max-w-[120px]">
                {user.email}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden animate-scale-in">
                <div className="p-3 border-b border-gray-100">
                  <p className="text-xs text-slate-500 truncate">
                    {user.email}
                  </p>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/dashboard/store/identity");
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-slate-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    Mi perfil
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
