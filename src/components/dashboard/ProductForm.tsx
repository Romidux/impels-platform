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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { slugify } from "@/lib/utils";
import { Category, Product } from "@/lib/types";
import Link from "next/link";
import CategorySelector from "./CategorySelector";
import DashSelect from "./ui/DashSelect";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

interface ProductFormProps {
  storeId: string;
  storePlan: "free" | "pro";
  categories: Category[];
  currency: string;
  product?: Product; // if editing
}

interface OptionTypeLocal {
  id?: string;
  name: string;
  values: string[];
  newValue: string;
}

interface VariantCombinationLocal {
  id?: string;
  values: string[]; // array of option value names (e.g. ["Red", "XL"])
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
      // Map option_value IDs back to names
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
      // Preserve existing combination data if possible
      const existing = combinations.find(c =>
        c.values.length === row.length &&
        c.values.every((v, i) => v === row[i])
      );

      return existing || {
        values: row,
        price: form.price, // default to base price
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

    try {
      // Upload new images to Supabase Storage
      const uploadedImages = await Promise.all(
        images.map(async (img, index) => {
          if (!img.file) return img; // already uploaded
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

      // Save images
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

        // Save options and variants
        if (form.has_variants) {
          // Delete old options and combinations if editing
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

          // Insert combinations
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

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-24">
      <PageHeader
        backHref="/dashboard/products"
        title={product ? "Editar producto" : "Nuevo producto"}
        subtitle={
          product
            ? `Editando: ${product.name}`
            : "Completa la información del producto"
        }
        actions={
          <>
            <Button
              variant="secondary"
              asChild
            >
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
        {/* Main column */}
        <div className="lg:col-span-2 space-y-8">


          {/* Basic info */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7 space-y-6">
            <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-500" />
              Información general
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
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-700">
                  Descripción detallada
                </label>
                <span className="text-xs text-slate-400 tabular-nums">
                  {form.description.length} / 1000
                </span>
              </div>
              <textarea
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value.slice(0, 1000))}
                placeholder="Describe los beneficios, material, medidas..."
                rows={5}
                maxLength={1000}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
              />
            </div>
          </div>

          {/* Variants */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7 space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-blue-500" />
                  Variantes
                </h2>
                {form.has_variants && (
                  <button
                    onClick={addOptionType}
                    className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar variante
                  </button>
                )}
              </div>

              {/* Toggle Has Variants */}
              <label className="flex items-center gap-3 cursor-pointer bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div
                  onClick={() => handleChange("has_variants", !form.has_variants)}
                  className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${form.has_variants ? "bg-blue-500" : "bg-slate-300"
                    }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.has_variants ? "translate-x-5" : ""
                      }`}
                  />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 block">
                    Este producto tiene múltiples opciones
                  </span>
                  <span className="text-xs text-slate-500">
                    Como diferentes tallas, colores o modelos. El stock se controlará por cada variante.
                  </span>
                </div>
              </label>
            </div>

            {form.has_variants && (
              <>
                <div className="pt-2 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Control de stock y precios</h3>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleChange("manage_stock_by_variant", false)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${!form.manage_stock_by_variant
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300"
                        }`}
                    >
                      <span className="block text-sm font-bold text-slate-900">Stock general</span>
                      <span className="text-xs text-slate-500">Un solo stock para todo el producto</span>
                    </button>
                    <button
                      onClick={() => handleChange("manage_stock_by_variant", true)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${form.manage_stock_by_variant
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300"
                        }`}
                    >
                      <span className="block text-sm font-bold text-slate-900">Stock por variante</span>
                      <span className="text-xs text-slate-500">Stock individual para cada combinación</span>
                    </button>
                  </div>
                </div>

                {optionTypes.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-sm">
                    <p>Sin variantes cargadas. Agrega Color, Talla, etc.</p>
                    <div className="flex flex-wrap gap-2 justify-center mt-3">
                      {["Color", "Talla", "Tamaño (ml)"].map((preset) => (
                        <button
                          key={preset}
                          onClick={() =>
                            setOptionTypes((prev) => [
                              ...prev,
                              { name: preset, values: [], newValue: "" },
                            ])
                          }
                          className="text-xs border border-slate-200 px-3 py-1.5 rounded-full hover:border-blue-400 hover:text-blue-600 transition-colors"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {optionTypes.map((ot, i) => (
                      <div
                        key={i}
                        className="border border-slate-200 rounded-xl p-4 space-y-3"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={ot.name}
                            onChange={(e) =>
                              updateOptionTypeName(i, e.target.value)
                            }
                            placeholder="Tipo de variante (ej: Color)"
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                          />
                          <button
                            onClick={() => removeOptionType(i)}
                            className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {ot.values.map((val) => (
                            <span
                              key={val}
                              className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full"
                            >
                              {val}
                              <button
                                onClick={() => removeOptionValue(i, val)}
                                className="hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
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
                            placeholder="Agregar valor..."
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                          />
                          <button
                            onClick={() => addOptionValue(i)}
                            className="px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="pt-2">
                      <button
                        onClick={generateCombinations}
                        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                      >
                        {combinations.length > 0 ? "Actualizar combinaciones" : "Generar combinaciones"}
                      </button>
                    </div>

                    {combinations.length > 0 && (
                      <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden overflow-x-auto no-scrollbar">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="px-4 py-3 text-left font-bold text-slate-600">Combinación</th>
                              <th className="px-4 py-3 text-left font-bold text-slate-600">Stock</th>
                              <th className="px-4 py-3 text-left font-bold text-slate-600">Precio (opcional)</th>
                              <th className="px-4 py-3 text-left font-bold text-slate-600">SKU</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {combinations.map((c, idx) => (
                              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 font-medium text-slate-900">
                                  {c.values.join(" / ")}
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="number"
                                    value={c.stock}
                                    onChange={(e) => updateCombination(idx, "stock", e.target.value)}
                                    className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-50"
                                    disabled={!form.manage_stock_by_variant}
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="number"
                                    value={c.price}
                                    onChange={(e) => updateCombination(idx, "price", e.target.value)}
                                    placeholder={form.price}
                                    className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="text"
                                    value={c.sku}
                                    onChange={(e) => updateCombination(idx, "sku", e.target.value)}
                                    placeholder="SKU-001"
                                    className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Tags */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7 space-y-6">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                <Hash className="w-5 h-5 text-blue-500" />
                Etiquetas
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Palabras clave que ayudan a encontrar el producto
              </p>
            </div>
            {form.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1.5 bg-slate-100 text-slate-700 text-sm px-3 py-1.5 rounded-full"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">
                Aún no hay etiquetas. Agrega alguna abajo.
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
                placeholder="Agregar etiqueta y presionar Enter"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
              <button
                onClick={addTag}
                className="px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm hover:bg-slate-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-6 lg:sticky lg:top-8 h-fit">
          {/* Images */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                <Image className="w-5 h-5 text-blue-500" />
                Imágenes
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Toca una miniatura para marcarla como principal
              </p>
            </div>

            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* Main Preview */}
            <div
              className="w-full aspect-[4/3] sm:aspect-square bg-slate-50 flex items-center justify-center rounded-xl overflow-hidden relative cursor-pointer group border border-slate-200 hover:border-blue-400 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {images.length > 0 && images[images.findIndex(img => img.is_primary) !== -1 ? images.findIndex(img => img.is_primary) : 0] ? (
                <>
                  <img
                    src={images[images.findIndex(img => img.is_primary) !== -1 ? images.findIndex(img => img.is_primary) : 0].url}
                    alt="Principal"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 left-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    Principal
                  </span>
                </>
              ) : (
                <div className="flex flex-col items-center text-slate-400 gap-2">
                  <Image className="w-10 h-10 opacity-50" />
                  <span className="text-sm font-medium">Haz clic para agregar</span>
                </div>
              )}
            </div>

            {/* Thumbnails Row */}
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar px-1 items-center">
              {images.map((img, i) => (
                <div
                  key={i}
                  className={`w-[72px] h-[72px] shrink-0 rounded-xl overflow-hidden border-2 cursor-pointer transition-all relative group bg-slate-50 ${img.is_primary ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-200 hover:border-slate-300"
                    }`}
                  onClick={() => setPrimary(i)}
                >
                  <img
                    src={img.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {img.is_primary && (
                    <span className="absolute bottom-1 left-1 right-1 bg-blue-500 text-white text-[10px] font-bold text-center py-0.5 rounded-md">
                      Principal
                    </span>
                  )}
                  <button
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
                onClick={() => fileRef.current?.click()}
                className="w-[72px] h-[72px] shrink-0 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 focus:outline-none flex flex-col items-center justify-center transition-colors bg-white group"
                aria-label="Agregar imagen"
              >
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>
          </div>

          {/* Category */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
              <Boxes className="w-5 h-5 text-blue-500" />
              Categoría
            </h2>

            <CategorySelector
              storeId={storeId}
              categories={categories}
              value={form.category_id}
              onChange={(val) => handleChange("category_id", val)}
            />
          </div>

          {/* Price */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-500" />
              Precio
            </h2>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
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

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Precio anterior <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                <span className="text-slate-500 text-sm px-3 flex items-center border-r border-slate-200 font-mono bg-slate-100/50">
                  {currency}
                </span>
                <input
                  type="number"
                  value={form.compare_at_price}
                  onChange={(e) =>
                    handleChange("compare_at_price", e.target.value)
                  }
                  placeholder="0"
                  min="0"
                  className="flex-1 px-3 py-2.5 text-sm bg-transparent focus:outline-none"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Se mostrará tachado para indicar descuento
              </p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer pt-1">
              <div
                onClick={() => handleChange("show_price", !form.show_price)}
                className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${form.show_price ? "bg-blue-500" : "bg-slate-300"
                  }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.show_price ? "translate-x-5" : ""
                    }`}
                />
              </div>
              <span className="text-sm font-medium text-slate-700">
                {form.show_price ? "Precio visible" : "Precio oculto (Consultar)"}
              </span>
            </label>
          </div>



          {/* Visibility */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Visibilidad
            </h2>

            <DashSelect
              label="Estado en la tienda"
              value={form.visibility}
              onChange={(val) => handleChange("visibility", val)}
              options={[
                { value: "visible", label: "Visible" },
                { value: "hidden", label: "Oculto" },
              ]}
            />

            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => handleChange("is_featured", !form.is_featured)}
                className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${form.is_featured ? "bg-blue-500" : "bg-slate-300"
                  }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_featured ? "translate-x-5" : ""
                    }`}
                />
              </div>
              <span className="text-sm font-medium text-slate-700">
                Destacado en tienda
              </span>
            </label>
          </div>

          {/* Inventory */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Inventario
            </h2>

            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => handleChange("track_inventory", !form.track_inventory)}
                className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${form.track_inventory ? "bg-blue-500" : "bg-slate-300"
                  }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.track_inventory ? "translate-x-5" : ""
                    }`}
                />
              </div>
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

                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => handleChange("allow_backorder", !form.allow_backorder)}
                    className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${form.allow_backorder ? "bg-blue-500" : "bg-slate-300"
                      }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.allow_backorder ? "translate-x-5" : ""
                        }`}
                    />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-700 block">
                      Permitir ventas sin stock
                    </span>
                    <span className="text-xs text-slate-500">
                      Los clientes podrán comprar aunque el stock llegue a 0
                    </span>
                  </div>
                </label>
              </div>
            )}

            {form.has_variants && form.track_inventory && (
              <div className="animate-fade-in p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs">
                <strong>Atención:</strong> como este producto tiene variantes, la disponibilidad general se calculará según el stock de cada variante.
              </div>
            )}
          </div>

          {/* Save button */}
          <Button
            onClick={handleSave}
            loading={saving}
            icon={!saving ? <Save className="w-4 h-4" /> : undefined}
            size="lg"
            className="w-full"
          >
            {saving ? "Guardando..." : "Guardar producto"}
          </Button>
        </div>
      </div>
    </div>
  );
}
