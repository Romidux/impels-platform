"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Coupon } from "@/lib/types";
import { Plus, Ticket, Pencil, Power, Percent, DollarSign, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";

interface CouponsManagerProps {
  storeId: string;
  initialCoupons: Coupon[];
}

export default function CouponsManager({
  storeId,
  initialCoupons,
}: CouponsManagerProps) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [form, setForm] = useState({
    code: "",
    type: "percentage",
    value: 10,
    min_purchase: 0,
    max_uses: "",
  });

  const handleOpenModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setForm({
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        min_purchase: coupon.min_purchase || 0,
        max_uses: coupon.max_uses ? coupon.max_uses.toString() : "",
      });
    } else {
      setEditingCoupon(null);
      setForm({
        code: "",
        type: "percentage",
        value: 10,
        min_purchase: 0,
        max_uses: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code) return toast.error("El código es obligatorio");
    if (form.value <= 0) return toast.error("El valor debe ser mayor a cero");

    setIsSaving(true);
    const supabase = createClient();

    const maxUsesInt = form.max_uses ? parseInt(form.max_uses, 10) : null;
    const cleanCode = form.code.trim().toUpperCase();

    try {
      if (editingCoupon) {
        const { data, error } = await supabase
          .from("coupons")
          .update({
            code: cleanCode,
            type: form.type,
            value: form.value,
            min_purchase: form.min_purchase || null,
            max_uses: maxUsesInt || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingCoupon.id)
          .select()
          .single();

        if (error) throw error;
        setCoupons((prev) =>
          prev.map((c) => (c.id === editingCoupon.id ? (data as Coupon) : c))
        );
        toast.success("Cupón actualizado");
      } else {
        const { data, error } = await supabase
          .from("coupons")
          .insert({
            store_id: storeId,
            code: cleanCode,
            type: form.type,
            value: form.value,
            min_purchase: form.min_purchase || null,
            max_uses: maxUsesInt || null,
          })
          .select()
          .single();

        if (error) {
          if (error.code === "23505") throw new Error("Ya existe un cupón con ese código");
          throw error;
        }

        setCoupons([data as Coupon, ...coupons]);
        toast.success("Cupón creado");
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Error al guardar el cupón");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (coupon: Coupon) => {
    const supabase = createClient();
    const newStatus = !coupon.is_active;

    const previousCoupons = [...coupons];
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, is_active: newStatus } : c))
    );

    try {
      const { error } = await supabase
        .from("coupons")
        .update({ is_active: newStatus, updated_at: new Date().toISOString() })
        .eq("id", coupon.id);
      if (error) throw error;
      toast.success(newStatus ? "Cupón activado" : "Cupón desactivado");
    } catch (err: any) {
      setCoupons(previousCoupons);
      toast.error("Error al cambiar estado");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Ticket className="w-6 h-6 text-indigo-600" />
            Cupones de Descuento
          </h1>
          <p className="text-slate-500 mt-1">
            Gestiona descuentos, códigos promocionales y límites de uso.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Crear Cupón
        </button>
      </div>

      {/* Grid */}
      {coupons.length === 0 ? (
        <div className="bg-white border text-center py-20 rounded-2xl shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No hay cupones</h3>
          <p className="text-slate-500 mt-1 max-w-sm mx-auto mb-6">
            Crea códigos de descuento para compartir en tus redes sociales y aumentar tus ventas.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="text-indigo-600 font-semibold hover:text-indigo-700"
          >
            Crear mi primer cupón &rarr;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className={`bg-white rounded-2xl border transition-all ${
                coupon.is_active ? "border-slate-200 shadow-sm" : "border-slate-200/50 opacity-60"
              } p-6 flex flex-col`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg text-slate-900 font-black tracking-wider text-lg border border-slate-200">
                  {coupon.code}
                </div>
                <button
                  onClick={() => toggleStatus(coupon)}
                  className={`p-2 rounded-full transition-colors ${
                    coupon.is_active ? "text-green-600 bg-green-50 hover:bg-green-100" : "text-slate-400 bg-slate-100 hover:bg-slate-200"
                  }`}
                  title={coupon.is_active ? "Desactivar" : "Activar"}
                >
                  <Power className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2 text-3xl font-display font-medium text-slate-900">
                  {coupon.type === "percentage" ? (
                    <span className="text-indigo-600">-{coupon.value}%</span>
                  ) : (
                    <span className="text-emerald-600">-{formatCurrency(coupon.value).replace(" Gs", "")}</span>
                  )}
                  {coupon.type === "fixed" && <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">Gs</span>}
                </div>

                <div className="space-y-1.5 mt-4">
                  {coupon.min_purchase && coupon.min_purchase > 0 ? (
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      Mín. compra: <span className="font-semibold text-slate-700">{formatCurrency(coupon.min_purchase)}</span>
                    </p>
                  ) : null}
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    Usos globales: <span className="font-semibold text-slate-700">{coupon.current_uses} {coupon.max_uses ? `/ ${coupon.max_uses}` : "(Ilimitado)"}</span>
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 mt-6 pt-4 flex gap-2">
                <button
                  onClick={() => handleOpenModal(coupon)}
                  className="flex-1 text-slate-600 hover:text-indigo-600 text-sm font-semibold flex items-center justify-center gap-2 py-2 bg-slate-50 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal CRUD */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-[110] w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-white p-6 sm:p-8 rounded-3xl shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
            <Dialog.Title className="text-xl font-bold text-slate-900 mb-2">
              {editingCoupon ? "Editar Código" : "Nuevo Cupón"}
            </Dialog.Title>
            <Dialog.Description className="text-slate-500 text-sm mb-6">
              Define las reglas de tu descuento para compartirlo con clientes.
            </Dialog.Description>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5 block">
                  Código *
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 uppercase font-bold focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="INVIERNO20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5 block">
                    Tipo
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value, value: e.target.value === 'percentage' ? 10 : 50000 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Monto Fijo (Gs)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5 block">
                    Valor *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      {form.type === "percentage" ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={form.value}
                      onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5 block">
                  CANTIDAD MÁXIMA DE USOS GLOBALES (Opcional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.max_uses}
                  onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                  placeholder="Ej. Los primeros 100 usuarios"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5 block">
                  Mínimo de Compra en Carrito Gs (Opcional)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.min_purchase || ""}
                  onChange={(e) => setForm({ ...form, min_purchase: Number(e.target.value) })}
                  placeholder="Ej. 150000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="pt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Guardar Cupón
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
