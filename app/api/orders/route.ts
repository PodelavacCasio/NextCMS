import { NextResponse } from "next/server";
import { createOrder } from "@/lib/db";

export const dynamic = "force-dynamic";

interface OrderRequest {
  items: { productId: string; qty: number }[];
  customer: { name: string; email: string; phone: string; address: string };
  notes: string;
}

export async function POST(req: Request) {
  let body: OrderRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatný požadavek." }, { status: 400 });
  }

  const { items, customer, notes } = body;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Váš košík je prázdný." }, { status: 400 });
  }
  if (!customer?.name?.trim() || !customer?.email?.trim() || !customer?.address?.trim()) {
    return NextResponse.json(
      { error: "Jméno, e-mail a adresa jsou povinné." },
      { status: 400 }
    );
  }

  // Prices are looked up and stock is decremented inside one DB transaction —
  // totals from the client are never trusted and overselling can't happen.
  const result = createOrder(
    items,
    {
      name: customer.name.trim().slice(0, 200),
      email: customer.email.trim().slice(0, 200),
      phone: (customer.phone || "").trim().slice(0, 50),
      address: customer.address.trim().slice(0, 500),
    },
    (notes || "").trim().slice(0, 1000)
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ id: result.order.id });
}
