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
        shipping_address
      `)
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });

    if (!orders) return new NextResponse("No orders found", { status: 404 });

    filename = `pedidos_${new Date().toISOString().split("T")[0]}.csv`;
    const headers = ["ID", "Fecha", "Cliente", "Teléfono", "Email", "Dirección", "Estado", "Total"];
    
    csvContent = [
      headers.join(","),
      ...orders.map(o => [
        o.id,
        new Date(o.created_at).toLocaleString('es-ES'),
        `"${o.customer_name || ''}"`,
        `"${o.customer_phone || ''}"`,
        `"${o.customer_email || ''}"`,
        `"${o.shipping_address || ''}"`,
        o.status,
        o.total
      ].join(","))
    ].join("\n");

  } else if (type === "customers") {
    // Export Customers
    // For MVP, we can just deduplicate unique customer emails/phones from the orders table
    // or if a customers table exists, read from it. We'll use orders data to group users as the "customers" list.
    const { data: customersRaw } = await supabase
      .from("orders")
      .select("customer_name, customer_email, customer_phone, total, created_at")
      .eq("store_id", store.id);

    if (!customersRaw) return new NextResponse("No customers found", { status: 404 });

    // Group by email/phone
    const customerMap = new Map();
    customersRaw.forEach(order => {
      const key = order.customer_email || order.customer_phone || order.customer_name;
      if (!key) return;
      
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          name: order.customer_name || "",
          email: order.customer_email || "",
          phone: order.customer_phone || "",
          ordersCount: 1,
          totalSpent: order.total || 0,
          firstOrder: order.created_at,
          lastOrder: order.created_at
        });
      } else {
        const c = customerMap.get(key);
        c.ordersCount += 1;
        c.totalSpent += (order.total || 0);
        if (new Date(order.created_at) > new Date(c.lastOrder)) c.lastOrder = order.created_at;
        if (new Date(order.created_at) < new Date(c.firstOrder)) c.firstOrder = order.created_at;
      }
    });

    const customers = Array.from(customerMap.values());
    filename = `clientes_${new Date().toISOString().split("T")[0]}.csv`;
    const headers = ["Nombre", "Email", "Teléfono", "Total Compras", "Total Gastado", "Primera Compra", "Última Compra"];
    
    csvContent = [
      headers.join(","),
      ...customers.map(c => [
        `"${c.name}"`,
        `"${c.email}"`,
        `"${c.phone}"`,
        c.ordersCount,
        c.totalSpent,
        new Date(c.firstOrder).toLocaleDateString('es-ES'),
        new Date(c.lastOrder).toLocaleDateString('es-ES')
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
