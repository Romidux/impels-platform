"use client";

import { useState } from "react";
import { Package, MessageSquare, Paintbrush, Rocket, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ProgressRing } from "./ProgressRing";

interface SetupWizardProps {
  hasProducts: boolean;
  hasWhatsApp: boolean;
  hasTemplate: boolean;
  onComplete?: () => void;
}

export function SetupWizard({
  hasProducts,
  hasWhatsApp,
  hasTemplate,
  onComplete,
}: SetupWizardProps) {
  // If all done, we don't need the wizard
  const isComplete = hasProducts && hasWhatsApp && hasTemplate;
  const progressCount = [hasProducts, hasWhatsApp, hasTemplate].filter(Boolean).length;
  const progressPercent = Math.round((progressCount / 3) * 100);

  const steps = [
    {
      id: "products",
      title: "Agrega tu primer producto",
      description: "Sube fotos y detalla lo que vendes. No te preocupes, puedes editarlo después.",
      isDone: hasProducts,
      icon: <Package className="w-5 h-5" />,
      actionText: "Ir a Productos",
      actionLink: "/dashboard/products/new",
    },
    {
      id: "whatsapp",
      title: "Conecta tu WhatsApp",
      description: "Es crucial. Tus clientes enviarán sus pedidos directamente a tu celular.",
      isDone: hasWhatsApp,
      icon: <MessageSquare className="w-5 h-5" />,
      actionText: "Configurar WhatsApp",
      actionLink: "/dashboard/store",
    },
    {
      id: "template",
      title: "Elige tu diseño",
      description: "Personaliza los colores y el estilo de tu tienda para que coincida con tu marca.",
      isDone: hasTemplate,
      icon: <Paintbrush className="w-5 h-5" />,
      actionText: "Elegir Tema",
      actionLink: "/dashboard/store#theme",
    },
  ];

  if (isComplete) {
    if (onComplete) onComplete();
    return null;
  }

  // Find first uncompleted step
  const activeStepIdx = steps.findIndex((s) => !s.isDone);

  return (
    <div className="bg-white border border-white/80 rounded-3xl shadow-apple-sm overflow-hidden mb-8 relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-slate-100/60">
        <div
          className="h-full bg-brand-600 transition-all duration-1000"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-8">
        {/* Left side: Progress intro */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-4">
            <ProgressRing progress={progressPercent} size={56} />
            <div>
              <h2 className="font-display text-xl font-bold text-slate-800 tracking-tight">
                Tu tienda está {progressPercent}% lista
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Completa estos pasos básicos para empezar a vender.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {steps.map((step, idx) => (
              <div 
                key={step.id} 
                className={`flex gap-4 p-4 rounded-xl border transition-all duration-200 ${
                  step.isDone 
                    ? "border-green-100 bg-green-50/50" 
                    : idx === activeStepIdx 
                    ? "border-brand-200 bg-brand-50/30 shadow-sm ring-1 ring-brand-100" 
                    : "border-slate-100 opacity-60 grayscale"
                }`}
              >
                <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                  step.isDone 
                    ? "bg-green-500 text-white" 
                    : idx === activeStepIdx 
                    ? "bg-brand-100 text-brand-600" 
                    : "bg-slate-100 text-slate-400"
                }`}>
                  {step.isDone ? <Check className="w-4 h-4" /> : step.icon}
                </div>
                
                <div className="flex-1">
                  <h3 className={`font-semibold text-sm ${step.isDone ? "text-green-900" : "text-slate-900"}`}>
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 mb-3">
                    {step.description}
                  </p>
                  
                  {idx === activeStepIdx && (
                    <Button asChild size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                      <Link href={step.actionLink}>
                        {step.actionText}
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side: Illustration (Motivational) */}
        <div className="hidden lg:flex flex-col justify-center items-center w-64 bg-brand-50 rounded-2xl p-6 text-center border border-dashed border-brand-200">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-4">
            <Rocket className="w-8 h-8 text-brand-500" />
          </div>
          <h4 className="font-bold text-slate-900 mb-2">Ya casi publicas</h4>
          <p className="text-xs text-slate-500">
            Una tienda con productos claros y un método de contacto rápido vende un 300% más rápido.
          </p>
        </div>
      </div>
    </div>
  );
}
