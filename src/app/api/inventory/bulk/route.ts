import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verify store ownership
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!store) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    }

    const body = await request.json();
    const { action, productIds, value } = body as {
      action: "set" | "adjust" | "zero";
      productIds: string[];
      value?: number;
    };

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: "Se requieren IDs de productos" },
        { status: 400 }
      );
    }

    if (!["set", "adjust", "zero"].includes(action)) {
      return NextResponse.json(
        { error: "Acción inválida" },
        { status: 400 }
      );
    }

    // Verify all products belong to this store and have track_inventory enabled
    const { data: products, error: fetchError } = await supabase
      .from("products")
      .select("id, stock_quantity, has_variants, manage_stock_by_variant")
      .eq("store_id", store.id)
      .eq("track_inventory", true)
      .in("id", productIds);

    if (fetchError) {
      return NextResponse.json(
        { error: "Error al verificar productos" },
        { status: 500 }
      );
    }

    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron productos válidos" },
        { status: 404 }
      );
    }

    /* Los productos que manejan stock por variante no tienen un stock propio:
       el suyo es la suma de las variantes, y es lo que mira la tienda. Antes
       estas acciones les escribían `stock_quantity` igual — o sea, marcabas
       "sin stock" un producto, la fila se ponía en rojo y la tienda lo seguía
       vendiendo porque las variantes no se habían tocado.

       "Sin stock" sí tiene sentido para ellos (todo a cero, sin ambigüedad) y
       se aplica a cada variante. "Establecer" y "Ajustar" no: no hay forma de
       repartir un número entre variantes sin inventar. Esos se omiten y la
       respuesta dice cuántos, para poder avisarlo. */
    const porVariante = products.filter(
      (p) =>
        (p as { has_variants?: boolean }).has_variants &&
        (p as { manage_stock_by_variant?: boolean }).manage_stock_by_variant
    );
    const porVarianteIds = porVariante.map((p) => p.id);
    const simples = products.filter((p) => !porVarianteIds.includes(p.id));
    const simpleIds = simples.map((p) => p.id);

    let updatedCount = 0;
    let skippedCount = 0;

    if (action === "zero") {
      const todosIds = products.map((p) => p.id);
      const { error } = await supabase
        .from("products")
        .update({ stock_quantity: 0 })
        .in("id", todosIds);

      if (error) throw error;

      if (porVarianteIds.length > 0) {
        const { error: variantError } = await supabase
          .from("product_variant_combinations")
          .update({ stock: 0 })
          .in("product_id", porVarianteIds);

        if (variantError) throw variantError;
      }

      updatedCount = todosIds.length;
    } else if (action === "set" && typeof value === "number") {
      const newValue = Math.max(0, value);
      skippedCount = porVarianteIds.length;

      if (simpleIds.length > 0) {
        const { error } = await supabase
          .from("products")
          .update({ stock_quantity: newValue })
          .in("id", simpleIds);

        if (error) throw error;
      }

      updatedCount = simpleIds.length;
    } else if (action === "adjust" && typeof value === "number") {
      skippedCount = porVarianteIds.length;

      // Uno por uno: cada producto parte de su propio stock actual.
      for (const product of simples) {
        const newQty = Math.max(0, (product.stock_quantity || 0) + value);
        const { error } = await supabase
          .from("products")
          .update({ stock_quantity: newQty })
          .eq("id", product.id);

        if (error) throw error;
        updatedCount++;
      }
    } else {
      return NextResponse.json(
        { error: "Parámetros inválidos" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      updated: updatedCount,
      skipped: skippedCount,
    });
  } catch (error) {
    console.error("Bulk stock update error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
