import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { HelpCircle, Clock, ChevronRight, Store } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";

export default async function AdminSupportPage() {
  const supabase = await createClient();

  // Fetch all tickets with store info
  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("*, stores(name, slug)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader
        title="Bandeja de Soporte"
        subtitle={`Administra las solicitudes de ayuda de tus comerciantes. Total: ${tickets?.length || 0}`}
      />

      {!tickets || tickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <EmptyState
            icon={<HelpCircle className="w-8 h-8" />}
            heading="Bandeja limpia"
            description="No hay tickets de soporte pendientes por el momento."
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                <tr>
                  <th className="px-5 py-4">Ticket</th>
                  <th className="px-5 py-4">Tienda</th>
                  <th className="px-5 py-4">Estado</th>
                  <th className="px-5 py-4">Fecha</th>
                  <th className="px-5 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900 mb-0.5">{ticket.subject}</div>
                      <div className="text-slate-500 text-xs line-clamp-1 max-w-sm">{ticket.message}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-brand-600" />
                        <span className="font-medium text-slate-700">{ticket.stores?.name || 'Desconocida'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {ticket.status === 'open' ? (
                        <Badge variant="warning">Abierto</Badge>
                      ) : ticket.status === 'in_progress' ? (
                        <Badge variant="info">En proceso</Badge>
                      ) : (
                        <Badge variant="success">Resuelto</Badge>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {new Date(ticket.created_at).toLocaleString('es-ES')}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link 
                        href={`/admin/support/${ticket.id}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-brand-600 hover:border-brand-200 hover:bg-brand-50 transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
