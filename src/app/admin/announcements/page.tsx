import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Plus, Megaphone, Edit3, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function AdminAnnouncementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Check if super admin
  const isSuperAdmin = user.user_metadata?.is_super_admin === true;
  const adminEmails = (process.env.SUPER_ADMIN_EMAILS || "").split(",");
  if (!isSuperAdmin && !adminEmails.includes(user.email || "")) {
    redirect("/dashboard");
  }

  // Fetch announcements (safe fallback if table doesn't exist yet)
  const { data: announcements, error } = await supabase
    .from("platform_announcements")
    .select("*")
    .order("created_at", { ascending: false });

  // If table missing, we just mock it for the UI to render while user runs SQL
  const safeAnnouncements = error ? [] : announcements;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader
        title="Anuncios de Plataforma"
        subtitle="Publica comunicados, novedades o alertas para todos los comercios."
        actions={
          <Button icon={<Plus className="w-4 h-4" />}>
            Nuevo Anuncio
          </Button>
        }
      />

      {!safeAnnouncements || safeAnnouncements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10">
          <EmptyState
            icon={<Megaphone className="w-8 h-8" />}
            heading="Sin anuncios publicados"
            description="Crea tu primer comunicado para informar a los comercios sobre nuevas funciones."
            action={
              <Button variant="secondary" icon={<Plus className="w-4 h-4" />}>
                Crear Anuncio
              </Button>
            }
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-3 px-5 text-sm font-semibold text-slate-600">Título</th>
                <th className="py-3 px-5 text-sm font-semibold text-slate-600">Tipo</th>
                <th className="py-3 px-5 text-sm font-semibold text-slate-600">Estado</th>
                <th className="py-3 px-5 text-sm font-semibold text-slate-600">Fecha</th>
                <th className="py-3 px-5 text-sm font-semibold text-slate-600 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {safeAnnouncements.map((ann) => (
                <tr key={ann.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-3 px-5">
                    <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {ann.title}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {ann.content}
                    </p>
                  </td>
                  <td className="py-3 px-5 text-sm">
                    <Badge variant={ann.type === "warning" ? "suspended" : ann.type === "success" ? "success" : "brand"}>
                      {ann.type === "warning" ? "Alerta" : ann.type === "success" ? "Novedad" : "Info"}
                    </Badge>
                  </td>
                  <td className="py-3 px-5 text-sm">
                    <Badge variant={ann.is_published ? "success" : "neutral"} dot>
                      {ann.is_published ? "Publicado" : "Borrador"}
                    </Badge>
                  </td>
                  <td className="py-3 px-5 text-sm text-slate-500">
                    {new Date(ann.created_at).toLocaleDateString("es-ES")}
                  </td>
                  <td className="py-3 px-5 text-right space-x-2">
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-indigo-600 h-8 w-8 p-0">
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-600 h-8 w-8 p-0">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
