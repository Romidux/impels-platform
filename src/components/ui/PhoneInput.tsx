"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const COUNTRIES = [
  { code: "PY", flag: "🇵🇾", prefix: "595", name: "Paraguay" },
  { code: "AR", flag: "🇦🇷", prefix: "54", name: "Argentina" },
  { code: "CO", flag: "🇨🇴", prefix: "57", name: "Colombia" },
  { code: "MX", flag: "🇲🇽", prefix: "52", name: "México" },
  { code: "BR", flag: "🇧🇷", prefix: "55", name: "Brasil" },
  { code: "CL", flag: "🇨🇱", prefix: "56", name: "Chile" },
  { code: "UY", flag: "🇺🇾", prefix: "598", name: "Uruguay" },
  { code: "EC", flag: "🇪🇨", prefix: "593", name: "Ecuador" },
  { code: "PE", flag: "🇵🇪", prefix: "51", name: "Perú" },
  { code: "BO", flag: "🇧🇴", prefix: "591", name: "Bolivia" },
  { code: "ES", flag: "🇪🇸", prefix: "34", name: "España" },
  { code: "US", flag: "🇺🇸", prefix: "1", name: "Estados Unidos" },
] as const;

function detectCountry(value: string) {
  if (!value) return COUNTRIES[0];
  // Match longest prefix first (e.g., "598" before "59")
  const sorted = [...COUNTRIES].sort((a, b) => b.prefix.length - a.prefix.length);
  return sorted.find((c) => value.startsWith(c.prefix)) || COUNTRIES[0];
}

function extractLocal(value: string, prefix: string) {
  if (value.startsWith(prefix)) return value.slice(prefix.length);
  return value;
}

interface PhoneInputProps {
  /** Full number without + sign, e.g. "595981234567" */
  value: string;
  /** Called with full number (prefix + local), no + sign */
  onChange: (fullNumber: string) => void;
  placeholder?: string;
  /** Classes applied to the outer container */
  className?: string;
  /** Classes applied to the text input element */
  inputClassName?: string;
  required?: boolean;
  /** Hint text below the input */
  hint?: string;
}

export function PhoneInput({
  value,
  onChange,
  placeholder = "981 234 567",
  className = "",
  inputClassName = "",
  required,
  hint,
}: PhoneInputProps) {
  const [country, setCountry] = useState(() => detectCountry(value || ""));
  const [local, setLocal] = useState(() => extractLocal(value || "", country.prefix));
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Sync external value changes (e.g. form reset)
  useEffect(() => {
    const detected = detectCountry(value || "");
    setCountry(detected);
    setLocal(extractLocal(value || "", detected.prefix));
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, "");
    setLocal(cleaned);
    onChange(country.prefix + cleaned);
  };

  const handleSelect = (c: (typeof COUNTRIES)[number]) => {
    setCountry(c);
    setOpen(false);
    onChange(c.prefix + local);
  };

  return (
    <div className={className} ref={ref}>
      <div className="relative flex items-stretch">
        {/* Country selector trigger */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 px-3 border border-r-0 border-gray-200 rounded-l-xl bg-gray-50 hover:bg-gray-100 transition-colors shrink-0"
        >
          <span className="text-base leading-none">{country.flag}</span>
          <span className="text-xs font-semibold text-gray-500">+{country.prefix}</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>

        {/* Phone number input */}
        <input
          type="tel"
          value={local}
          onChange={handleLocalChange}
          placeholder={placeholder}
          required={required}
          className={
            inputClassName ||
            "flex-1 w-full border border-gray-200 rounded-r-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
          }
        />

        {/* Dropdown */}
        {open && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto w-64 py-1">
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => handleSelect(c)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  c.code === country.code ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-700"
                }`}
              >
                <span className="text-base">{c.flag}</span>
                <span className="flex-1 text-left">{c.name}</span>
                <span className="text-xs text-gray-400 font-mono">+{c.prefix}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {hint && <p className="mt-1.5 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export { COUNTRIES };
