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
      .select("id, stock_quantity")
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

    const validIds = products.map((p) => p.id);
    let updatedCount = 0;

    if (action === "zero") {
      // Set all selected to 0
      const { error } = await supabase
        .from("products")
        .update({ stock_quantity: 0 })
        .in("id", validIds);

      if (error) throw error;
      updatedCount = validIds.length;
    } else if (action === "set" && typeof value === "number") {
      // Set all selected to a specific value
      const newValue = Math.max(0, value);
      const { error } = await supabase
        .from("products")
        .update({ stock_quantity: newValue })
        .in("id", validIds);

      if (error) throw error;
      updatedCount = validIds.length;
    } else if (action === "adjust" && typeof value === "number") {
      // Adjust each product's stock by the given delta
      // We need to update each individually to respect current values
      for (const product of products) {
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
    });
  } catch (error) {
    console.error("Bulk stock update error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
