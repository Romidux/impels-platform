"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Plus,
  Trash2,
  Package,
  DollarSign,
  Tag,
  Image,
  Save,
  Hash,
  Star,
  Boxes,
  ChevronDown,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { slugify } from "@/lib/utils";
import { Category, Product } from "@/lib/types";
import Link from "next/link";
import CategorySelector from "./CategorySelector";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

interface ProductFormProps {
  storeId: string;
  storePlan: "free" | "pro";
  categories: Category[];
  currency: string;
  product?: Product;
}

interface OptionTypeLocal {
  id?: string;
  name: string;
  values: string[];
  newValue: string;
}

interface VariantCombinationLocal {
  id?: string;
  values: string[];
  price: string;
  stock: string;
  sku: string;
  is_active: boolean;
}

export default function ProductForm({
  storeId,
  storePlan,
  categories,
  currency,
  product,
}: ProductFormProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [form, setForm] = useState({
    name: product?.name || "",
    slug: product?.slug || "",
    description: product?.description || "",
    price: product?.price?.toString() || "",
    compare_at_price: product?.compare_at_price?.toString() || "",
    show_price: product?.show_price !== false,
    category_id: product?.category_id || "",
    visibility: product?.visibility || "visible",
    has_variants: product?.has_variants || false,
    stock_quantity: product?.stock_quantity?.toString() || "0",
    track_inventory: product?.track_inventory || false,
    manage_stock_by_variant: (product as any)?.manage_stock_by_variant || false,
    allow_backorder: product?.allow_backorder || false,
    stock_status: product?.stock_status || "available",
    is_featured: product?.is_featured || false,
    tags: product?.tags || [] as string[],
    newTag: "",
  });

  const [images, setImages] = useState<
    { id?: string; url: string; file?: File; is_primary: boolean }[]
  >(
    product?.images?.map((img) => ({
      id: img.id,
      url: img.url,
      is_primary: img.is_primary,
    })) || []
  );

  const [optionTypes, setOptionTypes] = useState<OptionTypeLocal[]>(
    product?.option_types?.map((ot) => ({
      id: ot.id,
      name: ot.name,
      values: ot.values?.map((v) => v.value) || [],
      newValue: "",
    })) || []
  );

  const [combinations, setCombinations] = useState<VariantCombinationLocal[]>(
    product?.variant_combinations?.map((vc) => {
      const values = vc.option_values.map((vid) => {
        for (const ot of product?.option_types || []) {
          const val = ot.values?.find((v) => v.id === vid);
          if (val) return val.value;
        }
        return "";
      }).filter(Boolean);

      return {
        id: vc.id,
        values,
        price: vc.price?.toString() || "",
        stock: vc.stock.toString(),
        sku: vc.sku || "",
        is_active: vc.is_active,
      };
    }) || []
  );

  const handleChange = (key: string, value: unknown) => {
    setForm((prev) => {
      const updated = { ...prev, [key]: value };
      if (key === "name" && !product) {
        (updated as typeof prev & { slug: string }).slug = slugify(value as string);
      }
      return updated;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      setImages((prev) => [
        ...prev,
        { url, file, is_primary: prev.length === 0 },
      ]);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = prev.filter((_, i) => i !== index);
      if (newImages.length > 0 && !newImages.some((img) => img.is_primary)) {
        newImages[0].is_primary = true;
      }
      return newImages;
    });
  };

  const setPrimary = (index: number) => {
    setImages((prev) =>
      prev.map((img, i) => ({ ...img, is_primary: i === index }))
    );
  };

  const addTag = () => {
    const tag = form.newTag.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tag], newTag: "" }));
    }
  };

  const removeTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const addOptionType = () => {
    setOptionTypes((prev) => [
      ...prev,
      { name: "", values: [], newValue: "" },
    ]);
  };

  const updateOptionTypeName = (index: number, name: string) => {
    setOptionTypes((prev) =>
      prev.map((ot, i) => (i === index ? { ...ot, name } : ot))
    );
  };

  const addOptionValue = (index: number) => {
    setOptionTypes((prev) =>
      prev.map((ot, i) => {
        if (i !== index) return ot;
        const val = ot.newValue.trim();
        if (val && !ot.values.includes(val)) {
          return { ...ot, values: [...ot.values, val], newValue: "" };
        }
        return ot;
      })
    );
  };

  const removeOptionValue = (typeIndex: number, val: string) => {
    setOptionTypes((prev) =>
      prev.map((ot, i) =>
        i === typeIndex
          ? { ...ot, values: ot.values.filter((v) => v !== val) }
          : ot
      )
    );
  };

  const removeOptionType = (index: number) => {
    setOptionTypes((prev) => prev.filter((_, i) => i !== index));
  };

  const getPresetValues = (optionName: string): string[] => {
    const lower = optionName.toLowerCase().trim();
    if (lower === "color") return ["Negro", "Blanco", "Rojo", "Azul", "Verde", "Gris", "Amarillo"];
    if (lower === "talla" || lower === "talle") return ["XS", "S", "M", "L", "XL", "XXL"];
    if (lower === "calzado" || lower === "talla de calzado") return ["36", "37", "38", "39", "40", "41", "42", "43"];
    if (lower === "material") return ["Algodón", "Poliéster", "Lino", "Cuero", "Seda"];
    return [];
  };

  const addPresetValue = (typeIndex: number, val: string) => {
    setOptionTypes((prev) =>
      prev.map((ot, i) => {
        if (i !== typeIndex || ot.values.includes(val)) return ot;
        return { ...ot, values: [...ot.values, val] };
      })
    );
  };

  const generateCombinations = () => {
    const activeOptions = optionTypes.filter(ot => ot.name && ot.values.length > 0);
    if (activeOptions.length === 0) {
      setCombinations([]);
      return;
    }

    let matrix: string[][] = [[]];
    for (const ot of activeOptions) {
      const nextMatrix: string[][] = [];
      for (const row of matrix) {
        for (const val of ot.values) {
          nextMatrix.push([...row, val]);
        }
      }
      matrix = nextMatrix;
    }

    const newCombinations: VariantCombinationLocal[] = matrix.map(row => {
      const existing = combinations.find(c =>
        c.values.length === row.length &&
        c.values.every((v, i) => v === row[i])
      );

      return existing || {
        values: row,
        price: form.price,
        stock: "0",
        sku: "",
        is_active: true,
      };
    });

    setCombinations(newCombinations);
    toast.success("Combinaciones actualizadas");
  };

  const updateCombination = (index: number, key: keyof VariantCombinationLocal, value: any) => {
    setCombinations(prev => prev.map((c, i) => i === index ? { ...c, [key]: value } : c));
  };

  const handleSave = async () => {
    if (!form.name) {
      toast.error("El nombre del producto es requerido");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    // Check plan limit for new products only
    if (!product && storePlan === "free") {
      const { count } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("store_id", storeId);
      if ((count ?? 0) >= 10) {
        toast.error("Alcanzaste el límite de 10 productos del plan Gratis.");
        router.push("/dashboard/plan?reason=limit");
        setSaving(false);
        return;
      }
    }

    try {
      const uploadedImages = await Promise.all(
        images.map(async (img, index) => {
          if (!img.file) return img;
          const ext = img.file.name.split(".").pop();
          const path = `${storeId}/${Date.now()}-${index}.${ext}`;
          const { error } = await supabase.storage
            .from("product-images")
            .upload(path, img.file, { upsert: true });
          if (error) throw error;
          const { data: { publicUrl } } = supabase.storage
            .from("product-images")
            .getPublicUrl(path);
          return { ...img, url: publicUrl, file: undefined };
        })
      );

      const productData = {
        store_id: storeId,
        name: form.name,
        slug: form.slug || slugify(form.name),
        description: form.description,
        price: parseFloat(form.price) || 0,
        compare_at_price: form.compare_at_price
          ? parseFloat(form.compare_at_price)
          : null,
        show_price: form.show_price,
        category_id: form.category_id || null,
        visibility: form.visibility,
        has_variants: form.has_variants,
        stock_quantity: parseInt(form.stock_quantity) || 0,
        track_inventory: form.track_inventory,
        manage_stock_by_variant: form.manage_stock_by_variant,
        allow_backorder: form.allow_backorder,
        stock_status: form.stock_status,
        is_featured: form.is_featured,
        tags: form.tags,
      };

      let productId = product?.id;

      if (product) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", product.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(productData)
          .select("id")
          .single();
        if (error) throw error;
        productId = data.id;
      }

      if (productId) {
        if (product) {
          await supabase
            .from("product_images")
            .delete()
            .eq("product_id", productId);
        }

        if (uploadedImages.length > 0) {
          await supabase.from("product_images").insert(
            uploadedImages.map((img, i) => ({
              product_id: productId,
              url: img.url,
              sort_order: i,
              is_primary: img.is_primary,
            }))
          );
        }

        if (form.has_variants) {
          if (product) {
            await supabase.from("product_option_types").delete().eq("product_id", productId);
            await supabase.from("product_variant_combinations").delete().eq("product_id", productId);
          }

          const valueMap: Record<string, Record<string, string>> = {};

          for (const ot of optionTypes) {
            if (!ot.name || ot.values.length === 0) continue;

            const { data: otData, error: otError } = await supabase
              .from("product_option_types")
              .insert({
                product_id: productId,
                store_id: storeId,
                name: ot.name,
                sort_order: optionTypes.indexOf(ot),
              })
              .select("id")
              .single();

            if (otError) throw otError;

            if (otData) {
              const { data: valData, error: valError } = await supabase
                .from("product_option_values")
                .insert(
                  ot.values.map((val, vi) => ({
                    option_type_id: otData.id,
                    value: val.trim(),
                    sort_order: vi,
                  }))
                )
                .select("id, value");

              if (valError) throw valError;

              valueMap[ot.name] = {};
              valData.forEach(v => {
                valueMap[ot.name][v.value] = v.id;
              });
            }
          }

          if (combinations.length > 0) {
            const combinationsToInsert = combinations.map(c => {
              const optionValueIds = c.values.map((valName, i) => {
                const otName = optionTypes.filter(ot => ot.name && ot.values.length > 0)[i].name;
                return valueMap[otName]?.[valName];
              }).filter(Boolean);

              return {
                product_id: productId,
                option_values: optionValueIds,
                price: parseFloat(c.price) || parseFloat(form.price) || 0,
                stock: parseInt(c.stock) || 0,
                sku: c.sku || null,
                is_active: c.is_active
              };
            });

            const { error: comboError } = await supabase
              .from("product_variant_combinations")
              .insert(combinationsToInsert);

            if (comboError) throw comboError;
          }
        }
      }

      toast.success(
        product ? "Producto actualizado ✓" : "Producto creado ✓"
      );
      startTransition(() => {
        router.push("/dashboard/products");
        router.refresh();
      });
    } catch (err: unknown) {
      const error = err as { message?: string };
      if (error?.message?.includes("duplicate")) {
        toast.error("Ya existe un producto con ese slug");
      } else {
        toast.error("Error al guardar el producto");
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Derived UI helpers ──────────────────────────────────────────────────────

  const stockQty = parseInt(form.stock_quantity) || 0;
  const stockBadge = !form.track_inventory
    ? null
    : stockQty === 0
    ? { label: "Sin stock", color: "bg-red-50 text-red-600 border-red-200" }
    : stockQty < 10
    ? { label: "Poco stock", color: "bg-amber-50 text-amber-600 border-amber-200" }
    : { label: "En stock", color: "bg-emerald-50 text-emerald-600 border-emerald-200" };

  const discountPct =
    form.compare_at_price && form.price &&
    parseFloat(form.compare_at_price) > parseFloat(form.price)
      ? Math.round(
          (1 - parseFloat(form.price) / parseFloat(form.compare_at_price)) * 100
        )
      : null;

  const primaryIdx = images.findIndex(img => img.is_primary);
  const primaryImage = images[primaryIdx !== -1 ? primaryIdx : 0];

  // ── Reusable toggle ─────────────────────────────────────────────────────────
  const Toggle = ({
    checked,
    onToggle,
  }: {
    checked: boolean;
    onToggle: () => void;
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
        checked ? "bg-blue-500" : "bg-slate-300"
      }`}
    >
      <div
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );

  return (
    <div className="animate-fade-in max-w-5xl mx-auto pb-24">
      <PageHeader
        backHref="/dashboard/products"
        title={product ? product.name || "Editar producto" : "Nuevo producto"}
        subtitle={product ? "Editando producto" : "Completa la información"}
        actions={
          <>
            <button
              type="button"
              onClick={() =>
                handleChange(
                  "visibility",
                  form.visibility === "visible" ? "hidden" : "visible"
                )
              }
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                form.visibility === "visible"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
              }`}
            >
              {form.visibility === "visible" ? (
                <Eye className="w-3 h-3" />
              ) : (
                <EyeOff className="w-3 h-3" />
              )}
              {form.visibility === "visible" ? "Visible" : "Oculto"}
            </button>
            <Button variant="secondary" asChild>
              <Link href="/dashboard/products">Cancelar</Link>
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={saving}
              icon={!saving ? <Save className="w-4 h-4" /> : undefined}
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── LEFT COLUMN ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* 1. Información básica */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7 space-y-6">
            <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-500" />
              Información básica
            </h2>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">
                Nombre del producto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Ej: Camiseta de Algodón Premium"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-700">
                  Descripción
                </label>
                <span className="text-xs text-slate-400 tabular-nums">
                  {form.description.length} / 1000
                </span>
              </div>
              <textarea
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value.slice(0, 1000))}
                placeholder="Describe los beneficios, materiales, medidas…"
                rows={4}
                maxLength={1000}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
              />
            </div>

            {/* Advanced: slug (collapsed) */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
                />
                Opciones SEO avanzadas
              </button>

              {showAdvanced && (
                <div className="mt-3 space-y-1.5 animate-fade-in">
                  <label className="block text-sm font-semibold text-slate-700">
                    URL amigable (Slug)
                  </label>
                  <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                    <span className="text-slate-400 text-sm px-4 flex items-center border-r border-slate-200 font-mono">
                      /p/
                    </span>
                    <input
                      type="text"
                      value={form.slug}
                      onChange={(e) => handleChange("slug", e.target.value)}
                      placeholder="camiseta-algodon"
                      className="flex-1 px-4 py-3 text-sm bg-transparent focus:outline-none"
                    />
                  </div>
                  {form.slug && (
                    <p className="text-xs text-slate-400 font-mono truncate">
                      tutienda.com/p/{form.slug}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* 2. Imágenes */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
                  <Image className="w-4 h-4 text-blue-500" />
                  Imágenes
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {images.length > 0
                    ? `${images.length} imagen${images.length !== 1 ? "es" : ""} · toca una para marcarla como principal`
                    : "Agrega fotos del producto"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar
              </button>
            </div>

            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {images.length === 0 ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full aspect-[16/7] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                  <Image className="w-6 h-6 opacity-60 group-hover:opacity-100" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold">Haz clic para agregar imágenes</p>
                  <p className="text-xs mt-0.5 opacity-70">PNG, JPG, WEBP hasta 10 MB</p>
                </div>
              </button>
            ) : (
              <div className="grid grid-cols-[1fr_auto] gap-3">
                {/* Main preview */}
                <div
                  className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 cursor-pointer group"
                  onClick={() => fileRef.current?.click()}
                >
                  {primaryImage && (
                    <img
                      src={primaryImage.url}
                      alt="Principal"
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  <span className="absolute top-3 left-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    Principal
                  </span>
                </div>

                {/* Thumbnails column */}
                <div className="flex flex-col gap-2 w-[72px]">
                  {images.map((img, i) => (
                    <div
                      key={i}
                      className={`w-[72px] h-[72px] shrink-0 rounded-xl overflow-hidden border-2 cursor-pointer transition-all relative group bg-slate-50 ${
                        img.is_primary
                          ? "border-blue-500 ring-2 ring-blue-500/20"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                      onClick={() => setPrimary(i)}
                    >
                      <img
                        src={img.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(i);
                        }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-white text-slate-700 hover:text-red-500 border border-slate-200 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-[72px] h-[72px] shrink-0 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-center transition-colors bg-white group"
                    aria-label="Agregar imagen"
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* 3. Variantes */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7 space-y-6">
            <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-500" />
              Variantes
            </h2>

            <label className="flex items-start gap-3 cursor-pointer bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
              <Toggle
                checked={form.has_variants}
                onToggle={() => handleChange("has_variants", !form.has_variants)}
              />
              <div>
                <span className="text-sm font-bold text-slate-900 block">
                  Este producto tiene múltiples opciones
                </span>
                <span className="text-xs text-slate-500">
                  Como diferentes tallas, colores o modelos
                </span>
              </div>
            </label>

            {form.has_variants && (
              <>
                {/* Stock mode */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Control de stock
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleChange("manage_stock_by_variant", false)}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                        !form.manage_stock_by_variant
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <span className="block text-sm font-bold text-slate-900">Stock general</span>
                      <span className="text-xs text-slate-500 leading-relaxed">Un solo stock para todo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange("manage_stock_by_variant", true)}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                        form.manage_stock_by_variant
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <span className="block text-sm font-bold text-slate-900">Stock por variante</span>
                      <span className="text-xs text-slate-500 leading-relaxed">Individual por combinación</span>
                    </button>
                  </div>
                </div>

                {/* Option types */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Atributos del producto
                  </p>

                  {optionTypes.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
                      <Tag className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                      <p className="text-sm font-semibold text-slate-600 mb-1">
                        Aún no hay atributos
                      </p>
                      <p className="text-xs text-slate-400 mb-5">
                        Agrega opciones como Color, Talla o Material
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {["Color", "Talla", "Material", "Tamaño (ml)"].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() =>
                              setOptionTypes((prev) => [
                                ...prev,
                                { name: preset, values: [], newValue: "" },
                              ])
                            }
                            className="text-xs font-medium border border-slate-200 bg-white px-3.5 py-1.5 rounded-full hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            + {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {optionTypes.map((ot, i) => (
                        <div
                          key={i}
                          className="border border-slate-200 rounded-xl overflow-hidden"
                        >
                          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
                            <span className="w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0">
                              {i + 1}
                            </span>
                            <input
                              type="text"
                              value={ot.name}
                              onChange={(e) => updateOptionTypeName(i, e.target.value)}
                              placeholder="Nombre del atributo (ej: Color)"
                              className="flex-1 bg-transparent text-sm font-semibold text-slate-900 focus:outline-none placeholder:font-normal placeholder:text-slate-400"
                            />
                            <button
                              type="button"
                              onClick={() => removeOptionType(i)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="px-4 py-4 space-y-3">
                            {ot.values.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {ot.values.map((val) => (
                                  <span
                                    key={val}
                                    className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full"
                                  >
                                    {val}
                                    <button
                                      type="button"
                                      onClick={() => removeOptionValue(i, val)}
                                      className="hover:text-red-500 transition-colors"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}

                            {getPresetValues(ot.name).length > 0 && (
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs text-slate-400">Sugerencias:</span>
                                {getPresetValues(ot.name)
                                  .filter((v) => !ot.values.includes(v))
                                  .map((v) => (
                                    <button
                                      key={v}
                                      type="button"
                                      onClick={() => addPresetValue(i, v)}
                                      className="text-xs px-2.5 py-1 rounded-full border border-slate-200 bg-white hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                    >
                                      + {v}
                                    </button>
                                  ))}
                              </div>
                            )}

                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={ot.newValue}
                                onChange={(e) =>
                                  setOptionTypes((prev) =>
                                    prev.map((o, j) =>
                                      j === i ? { ...o, newValue: e.target.value } : o
                                    )
                                  )
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    addOptionValue(i);
                                  }
                                }}
                                placeholder="Escribe un valor y presiona Enter…"
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                              />
                              <button
                                type="button"
                                onClick={() => addOptionValue(i)}
                                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={addOptionType}
                    className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm font-medium text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar atributo
                  </button>
                </div>

                {optionTypes.some((ot) => ot.name && ot.values.length > 0) && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={generateCombinations}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Boxes className="w-4 h-4" />
                      {combinations.length > 0 ? "Actualizar combinaciones" : "Generar combinaciones"}
                    </button>
                    {combinations.length === 0 && (
                      <p className="text-xs text-slate-400 text-center mt-2">
                        Genera las combinaciones una vez hayas cargado todos los valores
                      </p>
                    )}
                  </div>
                )}

                {combinations.length > 0 && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto no-scrollbar">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        {combinations.length} combinación{combinations.length !== 1 ? "es" : ""}
                      </span>
                      {!form.manage_stock_by_variant && (
                        <span className="text-xs text-slate-400">
                          Activa el stock por variante para editar unidades
                        </span>
                      )}
                    </div>
                    <table className="w-full text-sm">
                      <thead className="border-b border-slate-200">
                        <tr className="bg-white">
                          <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Combinación</th>
                          <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Stock</th>
                          <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Precio</th>
                          <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">SKU</th>
                          <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Activo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {combinations.map((c, idx) => (
                          <tr
                            key={idx}
                            className={`hover:bg-slate-50 transition-colors ${!c.is_active ? "opacity-50" : ""}`}
                          >
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {c.values.map((v) => (
                                  <span
                                    key={v}
                                    className="inline-block bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-md font-medium"
                                  >
                                    {v}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={c.stock}
                                onChange={(e) => updateCombination(idx, "stock", e.target.value)}
                                className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                disabled={!form.manage_stock_by_variant}
                                min="0"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden bg-slate-50 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all w-28">
                                <span className="text-slate-400 text-xs px-2 border-r border-slate-200 py-1.5 font-mono">
                                  {currency}
                                </span>
                                <input
                                  type="number"
                                  value={c.price}
                                  onChange={(e) => updateCombination(idx, "price", e.target.value)}
                                  placeholder={form.price || "0"}
                                  className="flex-1 px-2 py-1.5 text-sm bg-transparent focus:outline-none min-w-0"
                                  min="0"
                                />
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={c.sku}
                                onChange={(e) => updateCombination(idx, "sku", e.target.value)}
                                placeholder="SKU-001"
                                className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Toggle
                                checked={c.is_active}
                                onToggle={() => updateCombination(idx, "is_active", !c.is_active)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        {/* ── RIGHT COLUMN ─────────────────────────────────────────────────── */}
        <div className="space-y-5 lg:sticky lg:top-8 h-fit">

          {/* A. Precio */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-500" />
              Precio
            </h2>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">
                Precio de venta
              </label>
              <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                <span className="text-slate-500 text-sm px-3 flex items-center border-r border-slate-200 font-mono bg-slate-100/50">
                  {currency}
                </span>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  placeholder="0"
                  min="0"
                  className="flex-1 px-3 py-2.5 text-sm bg-transparent focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-700">
                  Precio anterior
                  <span className="text-slate-400 font-normal ml-1">(opcional)</span>
                </label>
                {discountPct && (
                  <span className="text-xs font-bold bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">
                    -{discountPct}%
                  </span>
                )}
              </div>
              <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                <span className="text-slate-500 text-sm px-3 flex items-center border-r border-slate-200 font-mono bg-slate-100/50">
                  {currency}
                </span>
                <input
                  type="number"
                  value={form.compare_at_price}
                  onChange={(e) => handleChange("compare_at_price", e.target.value)}
                  placeholder="0"
                  min="0"
                  className="flex-1 px-3 py-2.5 text-sm bg-transparent focus:outline-none"
                />
              </div>
              <p className="text-xs text-slate-400">
                Se mostrará tachado para indicar descuento
              </p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer pt-1">
              <Toggle
                checked={form.show_price}
                onToggle={() => handleChange("show_price", !form.show_price)}
              />
              <span className="text-sm font-medium text-slate-700">
                {form.show_price ? "Precio visible" : "Precio oculto (Consultar)"}
              </span>
            </label>
          </section>

          {/* B. Inventario */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-slate-900">
                Inventario
              </h2>
              {stockBadge && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${stockBadge.color}`}>
                  {stockBadge.label}
                </span>
              )}
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <Toggle
                checked={form.track_inventory}
                onToggle={() => handleChange("track_inventory", !form.track_inventory)}
              />
              <div>
                <span className="text-sm font-semibold text-slate-700 block">
                  Controlar inventario exacto
                </span>
                <span className="text-xs text-slate-500">
                  Lleva la cuenta de unidades disponibles
                </span>
              </div>
            </label>

            {form.track_inventory && (!form.has_variants || !form.manage_stock_by_variant) && (
              <div className="space-y-4 animate-fade-in pl-4 border-l-2 border-blue-100">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Unidades disponibles
                  </label>
                  <input
                    type="number"
                    value={form.stock_quantity}
                    onChange={(e) => handleChange("stock_quantity", e.target.value)}
                    placeholder="Ej: 15"
                    min="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <Toggle
                    checked={form.allow_backorder}
                    onToggle={() => handleChange("allow_backorder", !form.allow_backorder)}
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-700 block">
                      Permitir ventas sin stock
                    </span>
                    <span className="text-xs text-slate-500">
                      Los clientes podrán comprar aunque llegue a 0
                    </span>
                  </div>
                </label>
              </div>
            )}

            {form.has_variants && form.track_inventory && (
              <div className="animate-fade-in p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs flex gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  Con variantes activas, la disponibilidad se calcula por el stock de cada combinación.
                </span>
              </div>
            )}
          </section>

          {/* C. Organización */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-blue-500" />
              Organización
            </h2>

            <CategorySelector
              storeId={storeId}
              categories={categories}
              value={form.category_id}
              onChange={(val) => handleChange("category_id", val)}
            />

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                  Etiquetas
                </label>
              </div>

              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {form.tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-red-500 transition-colors ml-0.5"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.newTag}
                  onChange={(e) => handleChange("newTag", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Agregar etiqueta…"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm hover:bg-slate-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>

          {/* D. Visibilidad */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="font-display text-base font-bold text-slate-900">
              Visibilidad
            </h2>

            {/* Pill toggle: Visible / Oculto */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => handleChange("visibility", "visible")}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  form.visibility === "visible"
                    ? "bg-white shadow-sm text-emerald-700"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${form.visibility === "visible" ? "text-emerald-500" : "text-slate-300"}`} />
                Activo
              </button>
              <button
                type="button"
                onClick={() => handleChange("visibility", "hidden")}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  form.visibility === "hidden"
                    ? "bg-white shadow-sm text-slate-700"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <EyeOff className={`w-3.5 h-3.5 ${form.visibility === "hidden" ? "text-slate-500" : "text-slate-300"}`} />
                Oculto
              </button>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <Toggle
                checked={form.is_featured}
                onToggle={() => handleChange("is_featured", !form.is_featured)}
              />
              <div>
                <span className="text-sm font-semibold text-slate-700 block">
                  Destacado en tienda
                </span>
                <span className="text-xs text-slate-500">
                  Aparece en la sección de productos destacados
                </span>
              </div>
            </label>
          </section>
        </div>
      </div>
    </div>
  );
}
