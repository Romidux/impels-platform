import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductForm from "@/components/dashboard/ProductForm";
import { Category, Product } from "@/lib/types";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const { data: store } = await supabase
    .from("stores")
    .select("id, plan, store_settings(*)")
    .eq("owner_id", user.id)
    .single();
  if (!store) redirect("/onboarding");

  const { data: product } = await supabase
    .from("products")
    .select(
      "*, images:product_images(*), option_types:product_option_types(*, values:product_option_values(*))"
    )
    .eq("id", id)
    .eq("store_id", store.id)
    .single();

  if (!product) notFound();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id, sort_order, is_active, store_id, created_at")
    .eq("store_id", store.id)
    .order("name");

  const currency = (store.store_settings as { currency?: string }[])?.[0]?.currency || "Gs";
  const plan = store.plan as "free" | "pro";

  return (
    <ProductForm
      storeId={store.id}
      storePlan={plan}
      categories={(categories || []) as Category[]}
      currency={currency}
      product={product as unknown as Product}
    />
  );
}
