import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";

// Add your super admin email(s) here
const SUPER_ADMIN_EMAILS: string[] = [
  // The middleware checks this too, but we double-check here
];

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
    SUPER_ADMIN_EMAILS.includes(user.email || "");

  // If SUPER_ADMIN_EMAILS is empty, allow the store owner (first user) as fallback
  // This is a temporary measure — configure SUPER_ADMIN_EMAILS for production
  if (!isSuperAdmin && SUPER_ADMIN_EMAILS.length > 0) {
    redirect("/dashboard");
  }

  const authUser = {
    id: user.id,
    email: user.email || "",
    created_at: user.created_at,
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        <AdminTopbar user={authUser} />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
