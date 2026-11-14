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

    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!store) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    }

    const body = await request.json();
    const { variantId, stock } = body as {
      variantId: string;
      stock: number;
    };

    if (!variantId || typeof stock !== "number") {
      return NextResponse.json(
        { error: "Parámetros inválidos" },
        { status: 400 }
      );
    }

    const newStock = Math.max(0, stock);

    // Verify the variant belongs to a product in this store
    const { data: variant, error: fetchError } = await supabase
      .from("product_variant_combinations")
      .select("id, product_id, products!inner(store_id)")
      .eq("id", variantId)
      .single();

    if (fetchError || !variant) {
      return NextResponse.json(
        { error: "Variante no encontrada" },
        { status: 404 }
      );
    }

    if ((variant as any).products?.store_id !== store.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    const { error: updateError } = await supabase
      .from("product_variant_combinations")
      .update({ stock: newStock })
      .eq("id", variantId);

    if (updateError) throw updateError;

    /* Dejar `products.stock_quantity` al día con la suma de las variantes.
       La tienda no lo usa para estos productos — `checkIsOutOfStock` suma las
       variantes — pero el inventario lo mostraba como "total" y se quedaba
       congelado en un valor viejo apenas se editaba una variante. */
    const productId = (variant as { product_id: string }).product_id;
    const { data: hermanas } = await supabase
      .from("product_variant_combinations")
      .select("stock")
      .eq("product_id", productId);

    const total = (hermanas || []).reduce(
      (suma, v) => suma + ((v as { stock: number | null }).stock || 0),
      0
    );

    const { error: totalError } = await supabase
      .from("products")
      .update({ stock_quantity: total })
      .eq("id", productId);

    if (totalError) throw totalError;

    return NextResponse.json({ success: true, stock: newStock, total });
  } catch (error) {
    console.error("Variant stock update error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
