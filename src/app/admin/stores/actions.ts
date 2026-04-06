"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const ToggleStoreSchema = z.object({
  storeId: z.string().uuid(),
  isActive: z.boolean(),
  reason: z.string().max(500).optional(),
});

const DeleteStoreSchema = z.object({
  storeId: z.string().uuid(),
  confirmName: z.string().min(1).max(100),
});

// ── Helpers ──────────────────────────────────────────────────────

const SUPER_ADMIN_EMAILS: string[] = (process.env.SUPER_ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function assertSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado");
  }

  const isSuperAdmin =
    user.user_metadata?.is_super_admin === true ||
    SUPER_ADMIN_EMAILS.includes((user.email || "").toLowerCase());

  if (!isSuperAdmin) {
    throw new Error("Acceso denegado: no eres super admin");
  }

  return { supabase, user };
}

// ── Toggle Store Active ──────────────────────────────────────────

export async function toggleStoreActive(
  storeId: string,
  isActive: boolean,
  reason?: string
) {
  const parsed = ToggleStoreSchema.safeParse({ storeId, isActive, reason });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { storeId: validStoreId, isActive: validIsActive, reason: validReason } = parsed.data;

  // Verify caller is super admin
  try {
    await assertSuperAdmin();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Acceso denegado";
    return { success: false, error: message };
  }

  // Use admin client to bypass RLS — we need to update any store, not just our own
  const adminClient = createAdminClient();

  const updatePayload: Record<string, unknown> = { is_active: validIsActive };

  if (!validIsActive) {
    // Suspending: save reason and timestamp
    updatePayload.disabled_reason = validReason?.trim() || null;
    updatePayload.disabled_at = new Date().toISOString();
  } else {
    // Reactivating: clear suspension fields
    updatePayload.disabled_reason = null;
    updatePayload.disabled_at = null;
  }

  const { error } = await adminClient
    .from("stores")
    .update(updatePayload)
    .eq("id", validStoreId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/stores");
  revalidatePath(`/admin/stores/${validStoreId}`);
  revalidatePath("/admin");

  return { success: true };
}

// ── Delete Store Complete ────────────────────────────────────────

export async function deleteStoreComplete(storeId: string, confirmName: string) {
  const parsedDelete = DeleteStoreSchema.safeParse({ storeId, confirmName });
  if (!parsedDelete.success) {
    return { success: false, error: parsedDelete.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { storeId: validStoreId2, confirmName: validConfirmName } = parsedDelete.data;

  // 1. Strict super admin validation — no fallback
  let supabase;
  let user;
  try {
    const result = await assertSuperAdmin();
    supabase = result.supabase;
    user = result.user;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error de autenticación";
    return { success: false, error: message };
  }

  // Use admin client to bypass RLS for all subsequent operations
  const adminClient = createAdminClient();

  // 2. Verify store exists and name matches confirmation
  const { data: store, error: storeError } = await adminClient
    .from("stores")
    .select("id, name, slug")
    .eq("id", validStoreId2)
    .single();

  if (storeError || !store) {
    return { success: false, error: "Tienda no encontrada" };
  }

  if (store.name.trim().toLowerCase() !== validConfirmName.trim().toLowerCase()) {
    return { success: false, error: "El nombre de confirmación no coincide" };
  }

  // 3. Storage cleanup — collect all file URLs before cascade deletes them from DB
  const storageErrors: string[] = [];

  try {
    // 3a. Product images (stored in bucket: product-images/{storeId}/...)
    const { data: productImages } = await adminClient
      .from("product_images")
      .select("url")
      .in(
        "product_id",
        (
          await adminClient
            .from("products")
            .select("id")
            .eq("store_id", validStoreId2)
        ).data?.map((p) => p.id) || []
      );

    // 3b. Store branding images (logo, banner, etc.)
    const { data: branding } = await adminClient
      .from("store_branding")
      .select("logo_url, favicon_url, hero_banner_url, promo_banner_url")
      .eq("store_id", storeId)
      .single();

    // 3c. Store logo from stores table
    const storeLogoUrl = (
      await adminClient.from("stores").select("logo_url").eq("id", validStoreId2).single()
    ).data?.logo_url;

    // Collect all URLs
    const allUrls: string[] = [];

    if (productImages) {
      allUrls.push(...productImages.map((img) => img.url).filter(Boolean));
    }

    if (branding) {
      const brandingUrls = [
        branding.logo_url,
        branding.favicon_url,
        branding.hero_banner_url,
        branding.promo_banner_url,
      ].filter(Boolean) as string[];
      allUrls.push(...brandingUrls);
    }

    if (storeLogoUrl) {
      allUrls.push(storeLogoUrl);
    }

    // Extract storage paths from public URLs
    // Supabase public URL format: https://{ref}.supabase.co/storage/v1/object/public/{bucket}/{path}
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const storagePaths: { bucket: string; path: string }[] = [];

    for (const url of allUrls) {
      if (url.includes(supabaseUrl) && url.includes("/storage/v1/object/public/")) {
        const afterPublic = url.split("/storage/v1/object/public/")[1];
        if (afterPublic) {
          const slashIndex = afterPublic.indexOf("/");
          if (slashIndex > 0) {
            storagePaths.push({
              bucket: afterPublic.substring(0, slashIndex),
              path: afterPublic.substring(slashIndex + 1),
            });
          }
        }
      }
    }

    // Also try to list the entire store folder in product-images bucket
    const { data: folderFiles } = await adminClient.storage
      .from("product-images")
      .list(validStoreId2, { limit: 1000 });

    if (folderFiles && folderFiles.length > 0) {
      const folderPaths = folderFiles
        .filter((f) => f.name) // skip folders
        .map((f) => `${validStoreId2}/${f.name}`);

      // Add any files found via folder listing that aren't already in the list
      const existingPaths = new Set(
        storagePaths.filter((p) => p.bucket === "product-images").map((p) => p.path)
      );
      for (const fp of folderPaths) {
        if (!existingPaths.has(fp)) {
          storagePaths.push({ bucket: "product-images", path: fp });
        }
      }
    }

    // Group by bucket and delete
    const bucketGroups: Record<string, string[]> = {};
    for (const sp of storagePaths) {
      if (!bucketGroups[sp.bucket]) bucketGroups[sp.bucket] = [];
      bucketGroups[sp.bucket].push(sp.path);
    }

    for (const [bucket, paths] of Object.entries(bucketGroups)) {
      // Delete in batches of 100
      for (let i = 0; i < paths.length; i += 100) {
        const batch = paths.slice(i, i + 100);
        const { error: removeError } = await adminClient.storage
          .from(bucket)
          .remove(batch);

        if (removeError) {
          storageErrors.push(
            `Error borrando ${batch.length} archivos de "${bucket}": ${removeError.message}`
          );
        }
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    storageErrors.push(`Error general de storage cleanup: ${message}`);
    // CONTINUE — storage cleanup failure does NOT block DB delete
  }

  // 5. Log the action in admin_actions_log BEFORE deleting the store
  await adminClient.from("admin_actions_log").insert({
    action: "DELETE_STORE",
    store_id: validStoreId2, // Insert with real FK. Postgres ON DELETE SET NULL will handle it when the store is deleted.
    performed_by: user.id,
    metadata: {
      store_id_deleted: validStoreId2, // Keep for audit
      store_name: store.name,
      storage_cleanup_errors: storageErrors.length > 0 ? storageErrors : null,
      deleted_at: new Date().toISOString()
    }
  });

  // 6. Delete the store from DB (CASCADE handles all child tables, and SET NULL handles the log)
  const { error: deleteError } = await adminClient
    .from("stores")
    .delete()
    .eq("id", validStoreId2);

  if (deleteError) {
    return {
      success: false,
      error: `Error eliminando tienda: ${deleteError.message}`,
      storageErrors: storageErrors.length > 0 ? storageErrors : undefined,
    };
  }

  // 7. Revalidate paths
  revalidatePath("/admin/stores");
  revalidatePath("/admin");

  return {
    success: true,
    storageErrors: storageErrors.length > 0 ? storageErrors : undefined,
  };
}
