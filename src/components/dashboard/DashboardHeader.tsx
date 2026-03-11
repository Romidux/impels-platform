"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, LogOut, User, ChevronDown, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Store, AuthUser } from "@/lib/types";
import { getStoreUrl } from "@/lib/utils";

export default function DashboardHeader({
  user,
  store,
}: {
  user: AuthUser;
  store: Store;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
      {/* Left: breadcrumb area */}
      <div className="flex items-center gap-2">
        <a
          href={getStoreUrl(store.slug)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors group"
        >
          <span className="font-medium">{store.slug}.impels.com</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      </div>

      {/* Right: user menu */}
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-xl hover:bg-gray-50 transition-colors text-gray-500">
          <Bell className="w-5 h-5" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 hover:bg-gray-50 pl-2 pr-3 py-1.5 rounded-xl transition-colors"
          >
            <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                {user.email}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-card-hover border border-gray-100 z-20 overflow-hidden animate-scale-in">
                <div className="p-3 border-b border-gray-100">
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/dashboard/settings");
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <User className="w-4 h-4 text-gray-400" />
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
