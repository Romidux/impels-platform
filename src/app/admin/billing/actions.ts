"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const SetPlanSchema = z.object({
  storeId: z.string().uuid(),
  plan: z.enum(["free", "pro"]),
});

const SUPER_ADMIN_EMAILS: string[] = (process.env.SUPER_ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function assertSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado");

  const isSuperAdmin =
    user.user_metadata?.is_super_admin === true ||
    SUPER_ADMIN_EMAILS.includes((user.email || "").toLowerCase());

  if (!isSuperAdmin) throw new Error("Acceso denegado");

  return user;
}

export async function setStorePlan(storeId: string, plan: "free" | "pro") {
  const parsed = SetPlanSchema.safeParse({ storeId, plan });
  if (!parsed.success) {
    return { success: false, error: "Datos inválidos" };
  }

  try {
    await assertSuperAdmin();
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Acceso denegado" };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("stores")
    .update({ plan: parsed.data.plan })
    .eq("id", parsed.data.storeId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/billing");
  revalidatePath(`/admin/stores/${parsed.data.storeId}`);

  return { success: true };
}
