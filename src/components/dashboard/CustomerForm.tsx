"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, User, MapPin, FileText, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";

interface CustomerFormProps {
  storeId: string;
}

export default function CustomerForm({ storeId }: CustomerFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    full_name: "",
    doc_type: "ci",
    doc_number: "",
    doc_verifier: "",
    phone_country_code: "+595",
    phone_number: "",
    email: "",
    city: "",
    neighborhood: "",
    address: "",
    notes: "",
  });

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!form.full_name.trim() || !form.phone_number.trim()) {
      toast.error("Nombre y teléfono son obligatorios");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.from("customers").insert({
        store_id: storeId,
        full_name: form.full_name,
        doc_type: form.doc_type,
        doc_number: form.doc_number,
        doc_verifier: form.doc_verifier,
        phone_country_code: form.phone_country_code,
        phone_number: form.phone_number,
        email: form.email,
        city: form.city,
        neighborhood: form.neighborhood,
        address: form.address,
        notes: form.notes,
      });

      if (error) throw error;

      toast.success("Cliente creado exitosamente ✓");
      startTransition(() => {
        router.push("/dashboard/customers");
        router.refresh();
      });
    } catch (err: unknown) {
      toast.error("Error al guardar el cliente. Asegúrate de haber corrido la migración SQL.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/customers"
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900">
              Nuevo cliente
            </h1>
            <p className="text-gray-500 mt-0.5 text-sm">
              Registra un cliente manualmente
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 gradient-brand text-white font-semibold px-6 py-2.5 rounded-xl hover:shadow-glow transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Guardando..." : "Guardar cliente"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos Personales */}
          <div className="card-flat p-6 space-y-5">
            <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              Datos personales
            </h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nombre y apellido *
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
                placeholder="Ej: Juan Pérez"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Documento
                </label>
                <select
                  value={form.doc_type}
                  onChange={(e) => handleChange("doc_type", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all bg-white"
                >
                  <option value="ci">Cédula. Identidad (CI)</option>
                  <option value="ruc">RUC</option>
                  <option value="passport">Pasaporte</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              <div className="sm:col-span-2 flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Número
                  </label>
                  <input
                    type="text"
                    value={form.doc_number}
                    onChange={(e) => handleChange("doc_number", e.target.value)}
                    placeholder="Ej: 1234567"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
                  />
                </div>
                {form.doc_type === "ruc" && (
                  <div className="w-20">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      DV
                    </label>
                    <input
                      type="text"
                      value={form.doc_verifier}
                      onChange={(e) => handleChange("doc_verifier", e.target.value)}
                      placeholder="0"
                      maxLength={1}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-center focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Teléfono *
                </label>
                <div className="flex flex-row gap-2">
                  <select
                    value={form.phone_country_code}
                    onChange={(e) => handleChange("phone_country_code", e.target.value)}
                    className="w-[100px] border border-gray-200 rounded-xl px-2 py-3 text-xs sm:text-sm focus:outline-none focus:border-blue-400 bg-white"
                  >
                    <option value="+595">+595 (PY)</option>
                    <option value="+54">+54 (AR)</option>
                    <option value="+55">+55 (BR)</option>
                    <option value="+56">+56 (CL)</option>
                    <option value="+57">+57 (CO)</option>
                    <option value="+52">+52 (MX)</option>
                    <option value="+1">+1 (US)</option>
                  </select>
                  <input
                    type="tel"
                    value={form.phone_number}
                    onChange={(e) => handleChange("phone_number", e.target.value)}
                    placeholder="Ej: 0981 123 456"
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="juan@ejemplo.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div className="card-flat p-6 space-y-5">
            <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" />
              Dirección
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Ciudad
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="Ej: Asunción"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Barrio
                </label>
                <input
                  type="text"
                  value={form.neighborhood}
                  onChange={(e) => handleChange("neighborhood", e.target.value)}
                  placeholder="Ej: Villa Morra"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Dirección exacta
              </label>
              <textarea
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Ej: Av. Mariscal López 1234 casi San Martín"
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Sidebar info / Extra */}
        <div className="space-y-6">
          <div className="card-flat p-6 space-y-5">
            <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Extra
            </h2>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Observaciones (opcional)
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Notas internas sobre este cliente..."
                rows={5}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all resize-none bg-gray-50/50"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
