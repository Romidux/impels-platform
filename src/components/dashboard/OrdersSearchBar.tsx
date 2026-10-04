"use client";

import { UrlSearchBar } from "./UrlSearchBar";

export function OrdersSearchBar({
  defaultValue,
  status,
  view,
}: {
  defaultValue?: string;
  status?: string;
  view?: string;
}) {
  return (
    <UrlSearchBar
      basePath="/dashboard/orders"
      defaultValue={defaultValue}
      placeholder="Buscar por cliente o ID de pedido..."
      extraParams={{ status, view: view !== "list" ? view : undefined }}
    />
  );
}
