"use client";

import { useState } from "react";
import { UserCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

export function ImpersonateButton({
  storeId,
  storeName,
  ownerEmail,
}: {
  storeId: string;
  storeName: string;
  ownerEmail: string;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleImpersonate = async () => {
    if (
      !confirm(
        `¿Confirmas que deseas ingresar como administrador de la tienda "${storeName}" (${ownerEmail})?\n\nEsta acción quedará registrada en el Audit Log.`
      )
    ) {
      return;
    }

    setIsLoading(true);

    try {
      // Simulate server action latency
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // In a real implementation:
      // 1. Call a server action that updates the Auth token or sets an impersonation cookie
      // 2. Redirect to `/dashboard`
      
      toast.success(`Ingresando a la tienda ${storeName}...`);
      
      // Placeholder redirect
      window.location.href = "/dashboard";
      
    } catch (error) {
      toast.error("Error al intentar ingresar a la tienda");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="secondary"
      onClick={handleImpersonate}
      disabled={isLoading}
      icon={<UserCircle className="w-4 h-4" />}
    >
      Ingresar a dashboard
    </Button>
  );
}
