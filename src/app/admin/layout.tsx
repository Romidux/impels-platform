import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";

// Super admin emails from env var (comma-separated)
const SUPER_ADMIN_EMAILS: string[] = (process.env.SUPER_ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check super admin access via user metadata or email
  const isSuperAdmin =
    user.user_metadata?.is_super_admin === true ||
    SUPER_ADMIN_EMAILS.includes((user.email || "").toLowerCase());

  if (!isSuperAdmin) {
    redirect("/dashboard");
  }

  const authUser = {
    id: user.id,
    email: user.email || "",
    created_at: user.created_at,
  };

  return (
    /* Mismo shell de tres paneles que /dashboard. El admin tenía su propia
       estructura (sidebar fijo oscuro + main con ml-64) y su propia paleta;
       eran dos productos distintos dentro de la misma app. */
    <div className="flex min-h-screen w-full bg-white md:h-screen md:overflow-hidden">
      <AdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-3">
        <AdminTopbar user={authUser} />

        <main className="flex min-h-0 flex-1 flex-col rounded-2xl bg-neutral-50 p-4 md:overflow-y-auto md:p-6">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
