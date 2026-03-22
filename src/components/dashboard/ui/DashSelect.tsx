"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown, Check, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export interface DashSelectOption {
  value: string;
  label: string;
}

interface DashSelectProps {
  label?: string;
  placeholder?: string;
  options: DashSelectOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
  emptyStateMessage?: string;
  icon?: ReactNode;
  actionElement?: ReactNode; // Elemento pegajoso al final (ej: "Añadir nuevo")
}

export default function DashSelect({
  label,
  placeholder = "Seleccionar opción",
  options,
  value,
  onChange,
  disabled = false,
  loading = false,
  emptyStateMessage = "No hay opciones disponibles",
  icon,
  actionElement,
}: DashSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar al clickear afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={`space-y-1.5 w-full relative ${isOpen ? "z-50" : "z-10"}`} ref={containerRef}>
      {label && (
        <label className="block text-[13px] font-bold text-slate-700">
          {label}
        </label>
      )}

      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-[#f4f4f4] border border-transparent rounded-2xl px-4 py-3.5 text-[14px] font-semibold text-left transition-all group ${
          disabled || loading
            ? "opacity-60 cursor-not-allowed"
            : "hover:bg-[#eeeeee] focus:bg-white focus:border-[#d9d9d9] focus:ring-4 focus:ring-slate-100 cursor-pointer"
        } ${isOpen ? "bg-white border-[#d9d9d9] ring-4 ring-slate-100" : ""}`}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="text-slate-500">{icon}</span>}
          {loading ? (
            <span className="text-slate-400 font-medium">Cargando...</span>
          ) : selectedOption ? (
            <span className="text-slate-900">{selectedOption.label}</span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </div>

        <div className="shrink-0 ml-2">
          {loading ? (
            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
          ) : (
            <div
              className={`w-6 h-6 bg-slate-800/5 rounded-full flex items-center justify-center transition-transform duration-200 ${
                isOpen ? "rotate-180 bg-slate-800/10 text-slate-900" : "text-slate-500"
              }`}
            >
              <ChevronDown className="w-3.5 h-3.5" strokeWidth={3} />
            </div>
          )}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 w-full mt-2 bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden"
          >
            <div className="max-h-[240px] overflow-y-auto overscroll-contain no-scrollbar p-2 space-y-1">
              {options.length > 0 ? (
                options.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-colors ${
                        isSelected
                          ? "bg-slate-50 text-brand-600"
                          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      {opt.label}
                      {isSelected && <Check className="w-4 h-4 text-brand-500" strokeWidth={3} />}
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-6 text-center text-sm text-slate-400 font-medium">
                  {emptyStateMessage}
                </div>
              )}
            </div>

            {actionElement && (
              <div 
                className="p-2 border-t border-slate-100 bg-slate-50/50"
                onClick={() => setIsOpen(false)} // cerramos al clickear el action
              >
                {actionElement}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
