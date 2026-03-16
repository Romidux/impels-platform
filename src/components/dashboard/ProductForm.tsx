"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  X,
  Plus,
  Trash2,
  Package,
  DollarSign,
  Tag,
  Image,
  ChevronDown,
  Eye,
  EyeOff,
  AlertCircle,
  Save,
  ArrowLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { slugify } from "@/lib/utils";
import { Category, Product, ProductOptionType } from "@/lib/types";
import Link from "next/link";

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
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/products"
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900">
              {product ? "Editar producto" : "Nuevo producto"}
            </h1>
            <p className="text-gray-500 mt-0.5 text-sm">
              {product
                ? `Editando: ${product.name}`
                : "Completa la información del producto"}
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
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Basic info */}
          <div className="card-flat p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-500" />
              Información básica
            </h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nombre del producto *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Ej: Figura Naruto Uzumaki"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Slug (URL)
              </label>
              <div className="flex rounded-xl overflow-hidden border border-gray-200 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100 transition-all">
                <span className="bg-gray-50 text-gray-400 text-sm px-3 flex items-center border-r border-gray-200">
                  /p/
                </span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => handleChange("slug", e.target.value)}
                  className="flex-1 px-3 py-3 text-sm focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Descripción
              </label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Describe tu producto en detalle..."
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all resize-none"
              />
            </div>
          </div>

          {/* Images */}
          <div className="card-flat p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
              <Image className="w-5 h-5 text-blue-500" />
              Imágenes
            </h2>

            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {images.map((img, i) => (
                <div
                  key={i}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                    img.is_primary
                      ? "border-blue-500 shadow-glow"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setPrimary(i)}
                >
                  <img
                    src={img.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {img.is_primary && (
                    <div className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-xs text-center py-1 font-semibold">
                      Principal
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(i);
                    }}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 text-xs"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 flex flex-col items-center justify-center gap-2 transition-all group"
              >
                <Upload className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
                <span className="text-xs text-gray-400 group-hover:text-blue-500">
                  Agregar
                </span>
              </button>
            </div>
          </div>

          {/* Variants */}
          <div className="card-flat p-6 space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-blue-500" />
                  Variantes
                </h2>
                <button
                  onClick={addOptionType}
                  className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Agregar variante
                </button>
              </div>

              {/* Toggle Has Variants */}
              <label className="flex items-center gap-3 cursor-pointer mb-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div
                  onClick={() => handleChange("has_variants", !form.has_variants)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${
                    form.has_variants ? "bg-blue-500" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      form.has_variants ? "translate-x-5" : ""
                    }`}
                  />
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-900 block">
                    Este producto tiene múltiples opciones
                  </span>
                  <span className="text-xs text-gray-500">
                    Como diferentes tallas, colores o modelos. El stock se controlará por cada variante.
                  </span>
                </div>
              </label>
            </div>

            {form.has_variants && (
              <>
                <div className="pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900">Control de Stock y Precios</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleChange("manage_stock_by_variant", false)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        !form.manage_stock_by_variant 
                          ? "border-blue-500 bg-blue-50" 
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <span className="block text-sm font-bold">Stock General</span>
                      <span className="text-xs text-gray-500">Un solo stock para todo el producto</span>
                    </button>
                    <button
                      onClick={() => handleChange("manage_stock_by_variant", true)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        form.manage_stock_by_variant 
                          ? "border-blue-500 bg-blue-50" 
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <span className="block text-sm font-bold">Stock por Variante</span>
                      <span className="text-xs text-gray-500">Stock individual para cada combinación</span>
                    </button>
                  </div>
                </div>

                {optionTypes.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-sm">
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
                          className="text-xs border border-gray-200 px-3 py-1.5 rounded-full hover:border-blue-400 hover:text-blue-600 transition-colors"
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
                        className="border border-gray-200 rounded-xl p-4 space-y-3"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={ot.name}
                            onChange={(e) =>
                              updateOptionTypeName(i, e.target.value)
                            }
                            placeholder="Tipo de variante (ej: Color)"
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
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
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                          />
                          <button
                            onClick={() => addOptionValue(i)}
                            className="px-3 py-2 gradient-brand text-white rounded-lg text-sm"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="pt-4">
                        <button
                          onClick={generateCombinations}
                          className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                        >
                          {combinations.length > 0 ? "Actualizar combinaciones" : "Generar combinaciones"}
                        </button>
                    </div>

                    {combinations.length > 0 && (
                      <div className="mt-6 border border-gray-200 rounded-xl overflow-hidden overflow-x-auto no-scrollbar">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-4 py-3 text-left font-bold text-gray-600">Combinación</th>
                              <th className="px-4 py-3 text-left font-bold text-gray-600">Stock</th>
                              <th className="px-4 py-3 text-left font-bold text-gray-600">Precio (Opcional)</th>
                              <th className="px-4 py-3 text-left font-bold text-gray-600">SKU</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {combinations.map((c, idx) => (
                              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 font-medium text-gray-900">
                                  {c.values.join(" / ")}
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="number"
                                    value={c.stock}
                                    onChange={(e) => updateCombination(idx, "stock", e.target.value)}
                                    className="w-20 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-400 disabled:opacity-50"
                                    disabled={!form.manage_stock_by_variant}
                                  />
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-400">
                                  <input
                                    type="number"
                                    value={c.price}
                                    onChange={(e) => updateCombination(idx, "price", e.target.value)}
                                    placeholder={form.price}
                                    className="w-24 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-400"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="text"
                                    value={c.sku}
                                    onChange={(e) => updateCombination(idx, "sku", e.target.value)}
                                    placeholder="SKU-001"
                                    className="w-24 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-400"
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
          <div className="card-flat p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-gray-900">
              Etiquetas
            </h2>
            <div className="flex flex-wrap gap-2 min-h-[40px]">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1.5 bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-full"
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
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-all"
              />
              <button
                onClick={addTag}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-5">
          {/* Price */}
          <div className="card-flat p-5 space-y-4">
            <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              Precio
            </h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Precio ({currency})
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => handleChange("price", e.target.value)}
                placeholder="0"
                min="0"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Precio anterior (opcional)
              </label>
              <input
                type="number"
                value={form.compare_at_price}
                onChange={(e) =>
                  handleChange("compare_at_price", e.target.value)
                }
                placeholder="0"
                min="0"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-all"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => handleChange("show_price", !form.show_price)}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  form.show_price ? "bg-blue-500" : "bg-gray-300"
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    form.show_price ? "translate-x-5" : ""
                  }`}
                />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {form.show_price ? "Precio visible" : "Precio oculto (Consultar)"}
              </span>
            </label>
          </div>

          {/* Organization */}
          <div className="card-flat p-5 space-y-4">
            <h2 className="font-display text-lg font-bold text-gray-900">
              Organización
            </h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Categoría
              </label>
              <select
                value={form.category_id}
                onChange={(e) => handleChange("category_id", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-all bg-white"
              >
                <option value="">Sin categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status */}
          <div className="card-flat p-5 space-y-4">
            <h2 className="font-display text-lg font-bold text-gray-900">
              Estado
            </h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Visibilidad
              </label>
              <select
                value={form.visibility}
                onChange={(e) => handleChange("visibility", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-all bg-white"
              >
                <option value="visible">Visible</option>
                <option value="hidden">Oculto</option>
              </select>
            </div>

            {/* Detailed Inventory Tracking */}
            <div className="pt-2 border-t border-gray-100 mt-4 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => handleChange("track_inventory", !form.track_inventory)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${
                    form.track_inventory ? "bg-blue-500" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      form.track_inventory ? "translate-x-5" : ""
                    }`}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Controlar inventario EXACTO
                </span>
              </label>

              {form.track_inventory && (!form.has_variants || !form.manage_stock_by_variant) && (
                <div className="space-y-4 animate-fade-in pl-2 border-l-2 border-blue-100">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Unidades disponibles
                    </label>
                    <input
                      type="number"
                      value={form.stock_quantity}
                      onChange={(e) => handleChange("stock_quantity", e.target.value)}
                      placeholder="Ej: 15"
                      min="0"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400 transition-all bg-white"
                    />
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => handleChange("allow_backorder", !form.allow_backorder)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${
                        form.allow_backorder ? "bg-purple-500" : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          form.allow_backorder ? "translate-x-5" : ""
                        }`}
                      />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700 block">
                        Permitir ventas sin stock
                      </span>
                      <span className="text-xs text-gray-500">
                        Los clientes podrán comprar aunque el stock llegue a 0.
                      </span>
                    </div>
                  </label>
                </div>
              )}

              {form.has_variants && form.track_inventory && (
                <div className="animate-fade-in p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-sm">
                  <strong>Atención:</strong> Como este producto tiene variantes, la disponibilidad general se calculará basándose en el stock que tenga cada variante.
                </div>
              )}
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => handleChange("is_featured", !form.is_featured)}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  form.is_featured ? "bg-blue-500" : "bg-gray-300"
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    form.is_featured ? "translate-x-5" : ""
                  }`}
                />
              </div>
              <span className="text-sm font-medium text-gray-700">
                Destacado en tienda
              </span>
            </label>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 gradient-brand text-white font-bold py-3.5 rounded-xl hover:shadow-glow transition-all hover:scale-[1.02] disabled:opacity-50 disabled:scale-100"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saving ? "Guardando..." : "Guardar producto"}
          </button>
        </div>
      </div>
    </div>
  );
}
