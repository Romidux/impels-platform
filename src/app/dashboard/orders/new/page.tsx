import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ManualOrderForm from "@/components/dashboard/ManualOrderForm";
import { Product } from "@/lib/types";

export default async function NewOrderPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, store_settings(*)")
    .eq("owner_id", user.id)
    .single();

  if (!store) redirect("/onboarding");

  // Fetch all active products with variants
  const { data: products } = await supabase
    .from("products")
    .select(
      `
      id, name, stock_quantity, track_inventory, price, compare_at_price, has_variants,
      images:product_images(id, url, is_primary),
      variant_combinations:product_variant_combinations(*)
    `
    )
    .eq("store_id", store.id)
    .eq("visibility", "visible")
    .order("name");

  const formattedProducts = (products || []).map((p: any) => ({
    ...p,
    images: p.images || [],
    variant_combinations: p.variant_combinations || [],
  }));

  const settings = Array.isArray(store.store_settings)
    ? store.store_settings[0]
    : store.store_settings;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <ManualOrderForm
        storeId={store.id}
        currency={settings?.currency || "Gs"}
        availableProducts={formattedProducts as Product[]}
      />
    </div>
  );
}
