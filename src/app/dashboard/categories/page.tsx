import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CategoriesManager from "@/components/dashboard/CategoriesManager";
import { Category } from "@/lib/types";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: store } = await supabase
    .from("stores")
    .select("id, name")
    .eq("owner_id", user.id)
    .single();
  if (!store) redirect("/onboarding");

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("store_id", store.id)
      .order("sort_order"),
    supabase
      .from("products")
      .select("category_id")
      .eq("store_id", store.id),
  ]);

  // Build product count map
  const productCounts: Record<string, number> = {};
  products?.forEach((p) => {
    if (p.category_id) {
      productCounts[p.category_id] = (productCounts[p.category_id] || 0) + 1;
    }
  });

  return (
    <CategoriesManager
      storeId={store.id}
      categories={(categories || []) as Category[]}
      productCounts={productCounts}
    />
  );
}
