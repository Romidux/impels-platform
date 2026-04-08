"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Visibility = "visible" | "hidden";

const OPTIONS: { value: Visibility; label: string }[] = [
  { value: "visible", label: "Visible" },
  { value: "hidden", label: "Oculto" },
];

export default function VisibilityDropdown({
  productId,
  currentVisibility,
}: {
  productId: string;
  currentVisibility: Visibility;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<Visibility>(currentVisibility);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = async (newValue: Visibility) => {
    if (newValue === value) { setOpen(false); return; }
    setLoading(true);
    setOpen(false);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("products")
        .update({ visibility: newValue })
        .eq("id", productId);
      if (error) throw error;
      setValue(newValue);
      router.refresh();
    } catch {
      toast.error("Error al actualizar visibilidad");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={ref}
      className="relative inline-block"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => !loading && setOpen(!open)}
        disabled={loading}
        className={cn(
          "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer",
          value === "visible"
            ? "bg-green-50 text-green-700 hover:bg-green-100"
            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
        )}
      >
        {value === "visible" ? "Visible" : "Oculto"}
        <ChevronDown
          className={cn("w-3 h-3 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-white rounded-lg border border-slate-200 shadow-lg z-50 min-w-[120px] py-1">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleChange(opt.value)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {opt.label}
              {opt.value === value && (
                <Check className="w-3.5 h-3.5 text-green-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
