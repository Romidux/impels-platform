"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2, Search, User, MapPin, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { DashPageHeader } from "@/components/dashboard/ui/DashPageHeader";
import { DashCard } from "@/components/dashboard/ui/DashCard";
import { PhoneInput } from "@/components/ui/PhoneInput";

interface ManualOrderFormProps {
  storeId: string;
  currency: string;
  availableProducts: any[];
}

interface SelectedItem {
  id: string; // unique ID for the cart item (product.id + variant.id)
  product_id: string;
  product_name: string;
  product_image?: string;
  variant_combination_id?: string;
  variant_label?: string;
  price: number;
  quantity: number;
  stock: number;
  track_inventory: boolean;
  has_variants: boolean;
}

export default function ManualOrderForm({
  storeId,
  currency,
  availableProducts,
}: ManualOrderFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  // Selected items in cart
  const [items, setItems] = useState<SelectedItem[]>([]);

  // Product Selection Modal/Dropdown state
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<any | null>(null);

  // Customer Form
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    phone_country_code: "+595",
    phone_full: "595",
    email: "",
    city: "",
    neighborhood: "",
    address: "",
    notes: "",
  });

  // Calculate Subtotal / Total
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = subtotal; // Assuming no delivery cost configured yet in Phase 2 manual orders

  // --- Handlers ---

  const handleUpdateCustomer = (field: string, value: string) => {
    setCustomer((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdateItemQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const newQuantity = item.quantity + delta;
        
        // Prevent going over stock if tracked
        if (item.track_inventory && newQuantity > item.stock) {
          toast.error("Stock insuficiente");
          return item;
        }

        // Must be at least 1
        return { ...item, quantity: Math.max(1, newQuantity) };
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddProduct = (product: any, variant: any = null) => {
    if (product.has_variants && !variant) {
      // Must select variant
      setSelectedProductForVariant(product);
      return;
    }

    const price = variant?.price ?? product.price;
    const stock = variant?.stock ?? product.stock_quantity;
    
    // Create unique ID for the item cart row
    const cartItemId = variant ? `${product.id}-${variant.id}` : product.id;

    // Check if already in cart
    const existing = items.find((i) => i.id === cartItemId);
    if (existing) {
      handleUpdateItemQuantity(cartItemId, 1);
      setSelectedProductForVariant(null);
      return;
    }

    // Check stock
    if (product.track_inventory && stock <= 0) {
      toast.error("Producto sin stock");
      return;
    }

    // Find primary image
    const primaryImage = product.images?.find((img: any) => img.is_primary)?.url || product.images?.[0]?.url;

    // Build variant label (e.g. "Rojo / XL") from option combo if we had the option_values array, but variant.id might suffice.
    // For manual orders, let's just use the option_values array if populated.
    let variantLabel = undefined;
    if (variant && Array.isArray(variant.option_values)) {
      variantLabel = variant.option_values.join(" / ");
    }

    setItems((prev) => [
      ...prev,
      {
        id: cartItemId,
        product_id: product.id,
        product_name: product.name,
        product_image: primaryImage,
        variant_combination_id: variant?.id,
        variant_label: variantLabel,
        price,
        quantity: 1,
        stock,
        track_inventory: product.track_inventory,
        has_variants: product.has_variants,
      },
    ]);
    setSelectedProductForVariant(null);
    setShowProductSelector(false);
  };

  const handleSaveOrder = async () => {
    if (!customer.name.trim() || !customer.phone.trim()) {
      toast.error("El nombre y teléfono del cliente son obligatorios");
      return;
    }
    if (items.length === 0) {
      toast.error("Debes agregar al menos un producto al pedido");
      return;
    }

    setSaving(true);
    try {
      // Call standard RPC
      const { data: orderId, error } = await supabase.rpc(
        "create_order_and_deduct_stock",
        {
          p_store_id: storeId,
          p_customer_name: customer.name,
          p_customer_phone: customer.phone,
          p_phone_country_code: customer.phone_country_code,
          p_customer_email: customer.email,
          p_customer_address: customer.address,
          p_customer_notes: customer.notes,
          p_items: items.map((item) => ({
            product_id: item.product_id,
            product_name: item.product_name,
            product_image: item.product_image,
            variant_combination_id: item.variant_combination_id || null,
            variant_label: item.variant_label || null,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity,
          })),
          p_subtotal: subtotal,
          p_total: total,
        }
      );

      if (error) throw error;

      toast.success("Pedido creado correctamente");
      startTransition(() => {
        router.push(`/dashboard/orders/${orderId}`);
        router.refresh();
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al crear el pedido");
      setSaving(false);
    }
  };

  // --- Render helpers ---

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return availableProducts.slice(0, 10);
    const query = searchQuery.toLowerCase();
    return availableProducts.filter((p) => p.name.toLowerCase().includes(query)).slice(0, 20);
  }, [availableProducts, searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex items-center justify-between gap-4">
        <DashPageHeader
          title="Nuevo pedido"
          subtitle="Registrar un pedido manualmente"
          backHref="/dashboard/orders"
        />
        <button
          onClick={handleSaveOrder}
          disabled={saving || items.length === 0 || !customer.name}
          className="flex items-center gap-2 gradient-brand text-white font-semibold px-6 py-2.5 rounded-xl hover:shadow-glow transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Creando..." : "Crear pedido"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Items */}
        <div className="lg:col-span-2 space-y-6">
          <DashCard className="p-0 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Productos del pedido</h2>
              {!showProductSelector && (
                <button
                  onClick={() => setShowProductSelector(true)}
                  className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </button>
              )}
            </div>

            {/* In-line Product Selector */}
            {showProductSelector && (
              <div className="p-5 bg-slate-50 border-b border-gray-100 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar producto..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-white"
                  />
                </div>

                {selectedProductForVariant ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        Selecciona variante de {selectedProductForVariant.name}
                      </span>
                      <button
                        onClick={() => setSelectedProductForVariant(null)}
                        className="text-xs text-brand-600 font-semibold"
                      >
                        Volver
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
                      {selectedProductForVariant.variant_combinations.map((variant: any) => {
                        const vStock = variant.stock;
                        const vOut = selectedProductForVariant.track_inventory && vStock <= 0;
                        return (
                          <button
                            key={variant.id}
                            disabled={vOut}
                            onClick={() => handleAddProduct(selectedProductForVariant, variant)}
                            className={`flex flex-col text-left p-3 rounded-lg border transition-all ${
                              vOut ? "opacity-50 border-gray-100 bg-gray-50" : "bg-white border-gray-200 hover:border-brand-300 hover:shadow-sm"
                            }`}
                          >
                            <span className="text-sm font-semibold text-gray-900">
                              {variant.option_values.join(" / ")}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-bold text-gray-700">
                                {formatCurrency(variant.price ?? selectedProductForVariant.price, currency)}
                              </span>
                              {selectedProductForVariant.track_inventory && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${vOut ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                                  Stock: {vStock}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-xl bg-white divide-y divide-gray-50">
                    {filteredProducts.length === 0 ? (
                      <p className="p-4 text-sm text-center text-gray-500">No se encontraron productos.</p>
                    ) : (
                      filteredProducts.map((product) => {
                        const out = product.track_inventory && product.stock_quantity <= 0 && !product.has_variants;
                        return (
                          <button
                            key={product.id}
                            disabled={out}
                            onClick={() => handleAddProduct(product)}
                            className="w-full text-left p-3 flex items-center justify-between hover:bg-slate-50 transition-colors disabled:opacity-50 group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                {product.images[0]?.url && (
                                  <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{product.name}</p>
                                <span className="text-xs font-bold text-gray-500">
                                  {product.has_variants ? "Múltiples variantes" : formatCurrency(product.price, currency)}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              {product.track_inventory && !product.has_variants && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${out ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                                  Stock: {product.stock_quantity}
                                </span>
                              )}
                              <Plus className="w-4 h-4 text-gray-400 group-hover:text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
                
                <div className="flex justify-end pt-2">
                  <button onClick={() => setShowProductSelector(false)} className="text-xs font-medium text-gray-500 hover:text-gray-700">
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Cart Items */}
            {items.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/50">
                <p className="text-sm text-gray-500 mb-4">No hay productos en el pedido</p>
                {!showProductSelector && (
                  <button
                    onClick={() => setShowProductSelector(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-dashed border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:text-brand-600 hover:border-brand-300 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Buscar productos
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {items.map((item) => (
                  <div key={item.id} className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                      {item.product_image && <img src={item.product_image} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{item.product_name}</p>
                      {item.variant_label && (
                        <p className="text-xs font-medium text-gray-500">{item.variant_label}</p>
                      )}
                      <p className="text-xs text-brand-600 font-bold mt-0.5">
                        {formatCurrency(item.price, currency)} c/u
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-gray-200 rounded-lg bg-white h-8 overflow-hidden">
                        <button
                          onClick={() => handleUpdateItemQuantity(item.id, -1)}
                          className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-gray-900 text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateItemQuantity(item.id, 1)}
                          className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
                          disabled={item.track_inventory && item.quantity >= item.stock}
                        >
                          +
                        </button>
                      </div>
                      <div className="w-24 text-right">
                        <p className="text-sm font-bold text-gray-900">
                          {formatCurrency(item.price * item.quantity, currency)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Totals */}
            {items.length > 0 && (
              <div className="p-5 border-t border-gray-100 bg-gray-50 space-y-2">
                <div className="flex justify-between items-center text-sm font-medium text-gray-500">
                  <span>Subtotal ({items.length} productos)</span>
                  <span>{formatCurrency(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-black text-gray-900 pt-2 border-t border-gray-200/60">
                  <span>Total</span>
                  <span>{formatCurrency(total, currency)}</span>
                </div>
              </div>
            )}
          </DashCard>
        </div>

        {/* Right Column: Customer Details */}
        <div className="space-y-6">
          <DashCard className="p-5 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-brand-600" />
              Datos del cliente
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={customer.name}
                  onChange={(e) => handleUpdateCustomer("name", e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full dash-input py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">WhatsApp *</label>
                <PhoneInput
                  value={customer.phone_full}
                  onChange={(val) => handleUpdateCustomer("phone_full", val)}
                  placeholder="981 234 567"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Dirección (Opcional)</label>
                <textarea
                  value={customer.address}
                  onChange={(e) => handleUpdateCustomer("address", e.target.value)}
                  placeholder="Ciudad, Barrio, Calle..."
                  rows={2}
                  className="w-full dash-input py-2 text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notas internas (Opcional)</label>
                <textarea
                  value={customer.notes}
                  onChange={(e) => handleUpdateCustomer("notes", e.target.value)}
                  placeholder="Indicaciones especiales..."
                  rows={2}
                  className="w-full dash-input py-2 text-sm resize-none bg-amber-50/30 focus:bg-amber-50/50"
                />
              </div>
            </div>
          </DashCard>
        </div>
      </div>
    </div>
  );
}
