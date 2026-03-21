import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { HelpCircle, Clock, CheckCircle } from "lucide-react";
import { revalidatePath } from "next/cache";
import Link from "next/link";

export default async function SupportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!store) redirect("/onboarding");

  // Fetch Tickets
  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  // Creation Action
  async function createTicket(formData: FormData) {
    "use server";
    const supabaseServer = await createClient();
    const subject = formData.get("subject")?.toString().trim();
    const message = formData.get("message")?.toString().trim();

    if (!subject || !message) return;

    await supabaseServer.from("support_tickets").insert({
      store_id: store!.id,
      subject,
      message,
      status: "open",
    });

    revalidatePath("/dashboard/support");
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader
        title="Soporte y Ayuda"
        subtitle="¿Tienes un problema con tu tienda? Abre un ticket de soporte y te ayudaremos."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm p-6">
            <h3 className="font-bold text-slate-900 text-lg mb-1">Nuevo Ticket</h3>
            <p className="text-sm text-slate-500 mb-5">Describe tu problema detalladamente.</p>
            
            <form action={createTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Asunto</label>
                <input
                  name="subject"
                  required
                  placeholder="Ej. Mi pasarela de pagos no funciona"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mensaje</label>
                <textarea
                  name="message"
                  required
                  rows={4}
                  placeholder="Explica qué estaba pasando cuando ocurrió el error..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none"
                ></textarea>
              </div>

              <Button type="submit" className="w-full justify-center">
                Enviar Solicitud
              </Button>
            </form>
          </div>
        </div>

        {/* Tickets List Column */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-900 text-lg px-1">Historial de Tickets</h3>
          
          {!tickets || tickets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <EmptyState 
                icon={<HelpCircle className="w-8 h-8" />}
                heading="Sin tickets recientes"
                description="Tus solicitudes de soporte resueltas o pendientes aparecerán aquí."
              />
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm p-5 flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-900">{ticket.subject}</h4>
                      {ticket.status === 'open' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100">Abierto</span>
                      ) : ticket.status === 'in_progress' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100">En Proceso</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-600 border border-green-100">Resuelto</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">{ticket.message}</p>
                    
                    {ticket.admin_notes && (
                      <div className="mt-4 p-3 bg-brand-50 rounded-lg border border-brand-100">
                        <p className="text-xs font-bold text-brand-800 mb-1">Respuesta del Soporte:</p>
                        <p className="text-sm text-brand-900">{ticket.admin_notes}</p>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 whitespace-nowrap flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(ticket.created_at).toLocaleDateString('es-ES')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
