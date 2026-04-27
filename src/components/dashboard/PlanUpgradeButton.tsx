"use client";

import { useState } from "react";
import { Zap, Copy, Check, Building2, CreditCard, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DashModal } from "@/components/dashboard/ui/DashModal";
import { PRO_PLAN_PRICE_PYG } from "@/lib/plan";
import { toast } from "sonner";

interface PlanUpgradeButtonProps {
  storeName: string;
}

export function PlanUpgradeButton({ storeName }: PlanUpgradeButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const emailSubject = `PRO ${storeName}`;
  const priceFormatted = `Gs ${PRO_PLAN_PRICE_PYG.toLocaleString("es-PY")}`;

  const copySubject = async () => {
    await navigator.clipboard.writeText(emailSubject);
    setCopied(true);
    toast.success("Asunto copiado");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-5 w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
      >
        <Zap className="w-4 h-4" />
        Actualizar a Pro
      </button>

      <DashModal
        open={open}
        onClose={() => setOpen(false)}
        title="Actualizar al plan Pro"
        size="md"
        footer={
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cerrar
          </Button>
        }
      >
        <div className="space-y-5">
          {/* Precio */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 mb-1">
              Plan Pro
            </p>
            <p className="font-display text-3xl font-black text-slate-900">
              {priceFormatted}
            </p>
            <p className="text-sm text-slate-500 mt-1">por mes</p>
          </div>

          {/* Instrucciones */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">
              Realizá una transferencia bancaria con los siguientes datos:
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Banco
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    {process.env.NEXT_PUBLIC_BILLING_BANK ?? "— completar —"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <CreditCard className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Cuenta / CBU
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    {process.env.NEXT_PUBLIC_BILLING_ACCOUNT ?? "— completar —"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <CreditCard className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Titular
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    {process.env.NEXT_PUBLIC_BILLING_HOLDER ?? "— completar —"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Paso siguiente */}
          <div className="border border-dashed border-blue-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-slate-700">
                Una vez realizado el pago, enviá el comprobante a{" "}
                <span className="font-semibold text-slate-900">
                  {process.env.NEXT_PUBLIC_BILLING_EMAIL ?? "soporte@impels.com"}
                </span>{" "}
                con el siguiente asunto:
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 bg-slate-900 text-white rounded-xl px-4 py-3">
              <code className="text-sm font-mono">{emailSubject}</code>
              <button
                onClick={copySubject}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors flex-shrink-0"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Tu plan Pro se activará en un plazo de 24 horas hábiles tras la confirmación del pago.
            </p>
          </div>
        </div>
      </DashModal>
    </>
  );
}
