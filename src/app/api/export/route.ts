import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Get user's store
  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!store) {
    return new NextResponse("Store not found", { status: 404 });
  }

  let csvContent = "";
  let filename = "";

  if (type === "orders") {
    // Export Orders
    const { data: orders } = await supabase
      .from("orders")
      .select(`
        id, 
        created_at, 
        total, 
        status, 
        customer_name, 
        customer_phone, 
        customer_email, 
        customer_address,
        customer_notes
      `)
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });

    if (!orders) return new NextResponse("No orders found", { status: 404 });

    filename = `pedidos_${new Date().toISOString().split("T")[0]}.csv`;
    const headers = ["ID", "Fecha", "Cliente", "Teléfono", "Email", "Dirección", "Notas", "Estado", "Total"];
    
    const STATUS_LABELS: Record<string, string> = {
      new: "Nuevo",
      confirmed: "Confirmado",
      processing: "En proceso",
      delivered: "Entregado",
      cancelled: "Cancelado",
    };
    
    csvContent = [
      headers.join(","),
      ...orders.map(o => [
        o.id,
        new Date(o.created_at).toLocaleString('es-ES'),
        `"${(o.customer_name || '').replace(/"/g, '""')}"`,
        `"${(o.customer_phone || '').replace(/"/g, '""')}"`,
        `"${(o.customer_email || '').replace(/"/g, '""')}"`,
        `"${(o.customer_address || '').replace(/"/g, '""')}"`,
        `"${(o.customer_notes || '').replace(/"/g, '""')}"`,
        STATUS_LABELS[o.status] || o.status,
        o.total
      ].join(","))
    ].join("\n");

  } else if (type === "customers") {
    // Export from real customers table
    const { data: customers } = await supabase
      .from("customers")
      .select("full_name, email, phone_number, city, address, created_at")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });

    if (!customers || customers.length === 0) return new NextResponse("No customers found", { status: 404 });

    filename = `clientes_${new Date().toISOString().split("T")[0]}.csv`;
    const headers = ["Nombre", "Email", "Teléfono", "Ciudad", "Dirección", "Fecha registro"];
    
    csvContent = [
      headers.join(","),
      ...customers.map(c => [
        `"${(c.full_name || '').replace(/"/g, '""')}"`,
        `"${(c.email || '').replace(/"/g, '""')}"`,
        `"${(c.phone_number || '').replace(/"/g, '""')}"`,
        `"${(c.city || '').replace(/"/g, '""')}"`,
        `"${(c.address || '').replace(/"/g, '""')}"`,
        new Date(c.created_at).toLocaleDateString('es-ES')
      ].join(","))
    ].join("\n");

  } else {
    return new NextResponse("Invalid export type", { status: 400 });
  }

  // Ensure utf-8 bom for excel
  const bom = "\uFEFF";
  return new NextResponse(bom + csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
