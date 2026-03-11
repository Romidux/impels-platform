"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, UserPlus, Trash2, Shield, Crown, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Store, StoreMember, UserRole } from "@/lib/types";

const ROLE_CONFIG: Record<UserRole, { label: string; icon: React.ElementType; color: string }> = {
  owner: { label: "Propietario", icon: Crown, color: "text-yellow-600 bg-yellow-50" },
  admin: { label: "Admin", icon: Shield, color: "text-blue-600 bg-blue-50" },
  editor: { label: "Editor", icon: Pencil, color: "text-green-600 bg-green-50" },
};

export default function TeamManager({
  store,
  currentUserId,
  members,
}: {
  store: Store;
  currentUserId: string;
  members: StoreMember[];
}) {
  const router = useRouter();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("editor");
  const [inviting, setInviting] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);

  const isPro = store.plan === "pro";
  const MAX_FREE_MEMBERS = 1;

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Ingresa el email del colaborador");
      return;
    }
    if (!isPro && members.length >= MAX_FREE_MEMBERS) {
      toast.error("Necesitas el plan Pro para agregar miembros al equipo");
      return;
    }

    setInviting(true);
    const supabase = createClient();

    try {
      // Find user by email
      const { data: targetUser } = await supabase
        .from("auth.users")
        .select("id")
        .eq("email", inviteEmail)
        .single();

      // We can't directly query auth.users from client, so we do it via a different approach
      // In a real app, you'd have a server action or edge function for this
      // For MVP, we'll add them directly (they need to exist)
      toast.info(
        "Para agregar colaboradores, comparte el link de tu tienda con ellos para que creen una cuenta. La gestión de invitaciones por email llegará pronto."
      );
      setShowInviteForm(false);
    } catch {
      toast.error("Error al enviar invitación");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("¿Eliminar a este miembro del equipo?")) return;
    const supabase = createClient();
    try {
      await supabase.from("store_members").delete().eq("id", memberId);
      toast.success("Miembro eliminado");
      router.refresh();
    } catch {
      toast.error("Error al eliminar miembro");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">
            Equipo
          </h1>
          <p className="text-gray-500 mt-1">
            Gestiona los colaboradores de tu tienda
          </p>
        </div>
        {isPro && (
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="flex items-center gap-2 gradient-brand text-white font-semibold px-5 py-2.5 rounded-xl hover:shadow-glow transition-all hover:scale-105 text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Invitar colaborador
          </button>
        )}
      </div>

      {!isPro && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <p className="text-blue-800 font-semibold mb-2">
            🔒 Equipo — Función Pro
          </p>
          <p className="text-blue-600 text-sm">
            Con el plan Pro puedes agregar hasta 5 colaboradores a tu tienda con
            diferentes roles (Admin, Editor).
          </p>
        </div>
      )}

      {/* Invite form */}
      {showInviteForm && isPro && (
        <div className="card-flat p-5 space-y-4">
          <h3 className="font-bold text-gray-900">Invitar colaborador</h3>
          <div className="flex gap-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@ejemplo.com"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as UserRole)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white"
            >
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleInvite}
              disabled={inviting}
              className="flex-1 gradient-brand text-white font-semibold py-2.5 rounded-xl"
            >
              Enviar invitación
            </button>
            <button
              onClick={() => setShowInviteForm(false)}
              className="border border-gray-200 text-gray-600 font-semibold py-2.5 px-4 rounded-xl hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Members list */}
      <div className="card-flat overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">
            Miembros ({members.length + 1})
          </h3>
        </div>

        {/* Owner (always first) */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-50">
          <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-gray-900">Tú</p>
            <p className="text-xs text-gray-400">Propietario de la tienda</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full text-yellow-600 bg-yellow-50">
            <Crown className="w-3.5 h-3.5" />
            Propietario
          </span>
        </div>

        {/* Other members */}
        {members.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sin colaboradores todavía</p>
            <p className="text-sm mt-1">
              Agrega miembros para trabajar en equipo
            </p>
          </div>
        ) : (
          members.map((member) => {
            const roleConfig = ROLE_CONFIG[member.role];
            return (
              <div
                key={member.id}
                className="flex items-center gap-4 px-6 py-4 border-b border-gray-50 last:border-0"
              >
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-600 font-bold text-sm">
                    {member.user_id.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900">
                    {member.user_id}
                  </p>
                  <p className="text-xs text-gray-400">
                    Desde{" "}
                    {new Date(member.created_at).toLocaleDateString("es-PY")}
                  </p>
                </div>
                <span
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${roleConfig.color}`}
                >
                  <roleConfig.icon className="w-3.5 h-3.5" />
                  {roleConfig.label}
                </span>
                {member.user_id !== currentUserId && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Role descriptions */}
      <div className="card-flat p-5 space-y-3">
        <h3 className="font-bold text-gray-900 text-sm">Descripción de roles</h3>
        {Object.entries(ROLE_CONFIG).map(([role, config]) => (
          <div key={role} className="flex items-start gap-3">
            <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${config.color} flex-shrink-0`}>
              <config.icon className="w-3 h-3" />
              {config.label}
            </span>
            <p className="text-xs text-gray-500">
              {role === "owner"
                ? "Control total. Puede gestionar la suscripción, el equipo y todos los datos."
                : role === "admin"
                  ? "Puede gestionar productos, pedidos, apariencia y configuración."
                  : "Puede gestionar productos y ver pedidos solamente."}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
