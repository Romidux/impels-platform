"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Bell, LogOut, Search, ChevronRight, Store, User, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { AuthUser } from "@/lib/types";

/* ─── Breadcrumb label map ─── */
const ROUTE_LABELS: Record<string, string> = {
  "/admin": "Overview",
  "/admin/stores": "Tiendas",
  "/admin/billing": "Billing",
  "/admin/analytics": "Analytics",
  "/admin/system/audit": "Audit Log",
  "/admin/system/flags": "Feature Flags",
  "/admin/system/templates": "Templates",
  "/admin/system/announcements": "Anuncios",
  "/admin/settings": "Configuración",
};

export default function AdminTopbar({ user }: { user: AuthUser }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Close search when route changes
  useEffect(() => {
    setSearchOpen(false);
    setSearchQuery("");
  }, [pathname]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    router.push("/login");
    router.refresh();
  };

  // Build breadcrumbs
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: { label: string; href: string }[] = [];
  let currentPath = "";
  for (const seg of segments) {
    currentPath += `/${seg}`;
    const label = ROUTE_LABELS[currentPath];
    if (label) {
      breadcrumbs.push({ label, href: currentPath });
    }
  }

  // Check for store detail pages
  if (pathname.match(/^\/admin\/stores\/[^/]+$/)) {
    breadcrumbs.push({ label: "Detalle", href: pathname });
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
      {/* Left: breadcrumbs */}
      <div className="flex items-center gap-1.5 text-sm">
        {breadcrumbs.map((bc, i) => (
          <div key={bc.href} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
            {i === breadcrumbs.length - 1 ? (
              <span className="font-semibold text-slate-900">{bc.label}</span>
            ) : (
              <a
                href={bc.href}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                {bc.label}
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Search placeholder */}
        <button 
          onClick={() => setSearchOpen(true)}
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 transition-colors rounded-lg text-sm text-slate-400 border border-slate-100 w-64 text-left"
        >
          <Search className="w-4 h-4" />
          <span className="flex-1">Buscar...</span>
          <kbd className="text-[10px] bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-400 font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Search Modal */}
        {searchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
            <div 
              className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
              onClick={() => setSearchOpen(false)}
            />
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden border border-slate-100 animate-scale-in mx-4">
              <div className="flex items-center px-4 py-3 border-b border-slate-100 gap-3">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Buscar tiendas, usuarios, o ajustes..."
                  className="flex-1 bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <kbd className="hidden sm:inline-block text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-400 font-mono">
                  ESC
                </kbd>
              </div>

              <div className="p-2 max-h-[60vh] overflow-y-auto">
                <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Resultados sugeridos
                </div>
                
                <div className="mt-1 space-y-0.5">
                  <button 
                    onClick={() => router.push("/admin/stores")}
                    className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg group-hover:bg-indigo-100 transition-colors">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Explorar todas las tiendas</p>
                      <p className="text-xs text-slate-500">Módulo de gestión</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => router.push("/admin/settings")}
                    className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className="bg-slate-100 text-slate-600 p-1.5 rounded-lg group-hover:bg-slate-200 transition-colors">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Configuración global</p>
                      <p className="text-xs text-slate-500">Ajustes de la plataforma</p>
                    </div>
                  </button>
                  
                </div>
              </div>
              
              <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <kbd className="bg-white border shadow-sm rounded px-1.5 py-0.5">↑↓</kbd> para navegar
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="bg-white border shadow-sm rounded px-1.5 py-0.5">↵</kbd> para seleccionar
                </span>
              </div>
            </div>
          </div>
        )}

        <button className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors text-slate-400">
          <Bell className="w-4.5 h-4.5" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 hover:bg-gray-50 pl-2 pr-3 py-1.5 rounded-lg transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-slate-700 truncate max-w-[140px]">
                {user.email}
              </p>
            </div>
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
                  <p className="text-[10px] text-indigo-500 font-semibold mt-0.5">
                    Super Admin
                  </p>
                </div>
                <div className="p-1.5">
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
