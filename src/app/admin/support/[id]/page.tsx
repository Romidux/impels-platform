import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { ArrowLeft, User, Mail, Store, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { revalidatePath } from "next/cache";

export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

  // Retrieve ticket with nested store/owner info
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select(`
      *,
      stores (
        name,
        slug,
        owner_id
      )
    `)
    .eq("id", id)
    .single();

  if (!ticket) {
    notFound();
  }

  // Get owner email
  const { data: owner } = await supabase.auth.admin.getUserById(ticket.stores.owner_id).catch(() => ({ data: null }));

  async function resolveTicket(formData: FormData) {
    "use server";
    const supabaseServer = await createClient();
    const adminNotes = formData.get("adminNotes")?.toString().trim() || null;
    const action = formData.get("action")?.toString(); // 'resolve' or 'update'

    await supabaseServer
      .from("support_tickets")
      .update({
        admin_notes: adminNotes,
        status: action === 'resolve' ? 'resolved' : 'in_progress',
        updated_at: new Date().toISOString()
      })
      .eq("id", ticket.id);

    revalidatePath(`/admin/support/${ticket.id}`);
    revalidatePath(`/admin/support`);
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10 max-w-4xl">
      <div className="flex items-center gap-4 mb-2">
        <Link 
          href="/admin/support"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <PageHeader
          title={`Ticket: ${ticket.subject}`}
          subtitle={`Abierto el ${new Date(ticket.created_at).toLocaleString('es-ES')}`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Conversation Thread */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                <Store className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{ticket.stores.name}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {new Date(ticket.created_at).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>
            <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">
              {ticket.message}
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl border border-indigo-100 overflow-hidden shadow-sm p-6">
            <h3 className="font-bold text-slate-900 text-lg mb-4">Acciones de Resolución</h3>
            
            <form action={resolveTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nota para el Comerciante (Opcional)</label>
                <textarea
                  name="adminNotes"
                  rows={4}
                  defaultValue={ticket.admin_notes || ""}
                  placeholder="Escribe la solución oficial aquí. El comerciante verá esto en su panel."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                ></textarea>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  type="submit" 
                  name="action" 
                  value="update" 
                  variant="secondary" 
                  className="flex-1 justify-center"
                  disabled={ticket.status === 'resolved'}
                >
                  Dejar en Proceso
                </Button>
                <Button 
                  type="submit" 
                  name="action" 
                  value="resolve" 
                  className="flex-1 justify-center bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 border-transparent text-white"
                  icon={<CheckCircle className="w-4 h-4" />}
                >
                  {ticket.status === 'resolved' ? 'Actualizar Resolución' : 'Marcar como Resuelto'}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Estado Actual</h4>
            <div className="mb-6">
              {ticket.status === 'open' ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-semibold bg-amber-50 text-amber-700 border border-amber-200 w-full justify-center">Pendiente / Abierto</span>
              ) : ticket.status === 'in_progress' ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200 w-full justify-center">En Proceso</span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-semibold bg-green-50 text-green-700 border border-green-200 w-full justify-center">Resuelto</span>
              )}
            </div>

            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Datos del Cliente</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex flex-col gap-1">
                <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5"><Store className="w-3.5 h-3.5" /> Tienda</span>
                <Link href={`/${ticket.stores.slug}`} target="_blank" className="text-indigo-600 hover:underline font-semibold">
                  {ticket.stores.name}
                </Link>
              </li>
              {owner?.user?.email && (
                <li className="flex flex-col gap-1">
                  <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Correo Dueño</span>
                  <a href={`mailto:${owner.user.email}`} className="text-slate-900 truncate">
                    {owner.user.email}
                  </a>
                </li>
              )}
            </ul>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <Button asChild variant="secondary" className="w-full justify-center">
                <Link href={`/admin/stores/${ticket.stores.owner_id}`}>
                  Ver Perfil de Tienda
                </Link>
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
