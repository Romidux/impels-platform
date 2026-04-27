"use client";

import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useState, useTransition } from "react";

export function OrdersSearchBar({
  defaultValue,
  status,
  view,
}: {
  defaultValue?: string;
  status?: string;
  view?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue || "");
  const [isPending, startTransition] = useTransition();

  const push = (q: string) => {
    const sp = new URLSearchParams();
    if (status) sp.set("status", status);
    if (view && view !== "list") sp.set("view", view);
    if (q.trim()) sp.set("q", q.trim());
    const qs = sp.toString();
    startTransition(() => {
      router.push(`/dashboard/orders${qs ? "?" + qs : ""}`);
    });
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); push(value); }} className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar por cliente o ID de pedido..."
        className={`w-full pl-9 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-all ${value ? "pr-9" : "pr-4"} ${isPending ? "opacity-70" : ""}`}
      />
      {value && (
        <button
          type="button"
          onClick={() => { setValue(""); push(""); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </form>
  );
}
