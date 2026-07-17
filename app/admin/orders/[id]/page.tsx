import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getOrder, getSettings } from "@/lib/db";
import { formatMoney, formatDate } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/labels";
import { updateOrderStatus } from "../../actions";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUSES: OrderStatus[] = ["new", "processing", "shipped", "completed", "cancelled"];

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const order = getOrder(id);
  if (!order) notFound();
  const settings = getSettings();

  return (
    <>
      <div className="admin-head">
        <h1>Objednávka {order.id.toUpperCase()}</h1>
        <Link href="/admin/orders" className="btn small ghost">← Zpět</Link>
      </div>

      <div className="admin-section">
        <form action={updateOrderStatus} className="row-actions">
          <input type="hidden" name="id" value={order.id} />
          <label htmlFor="status" style={{ fontFamily: "var(--font-mono)", fontSize: 12, textTransform: "uppercase" }}>
            Stav
          </label>
          <select id="status" name="status" defaultValue={order.status} className="status-select">
            {STATUSES.map((s) => (
              <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
            ))}
          </select>
          <button className="btn small" type="submit">Aktualizovat</button>
        </form>
      </div>

      <div className="admin-section">
        <h2>Položky</h2>
        <table className="table">
          <thead>
            <tr><th>Produkt</th><th className="num">Ks</th><th className="num">Cena</th><th className="num">Mezisoučet</th></tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.productId}>
                <td>{item.name}</td>
                <td className="num">{item.qty}</td>
                <td className="num">{formatMoney(item.priceCents, settings.currency)}</td>
                <td className="num">{formatMoney(item.priceCents * item.qty, settings.currency)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={3}><strong>Celkem</strong></td>
              <td className="num"><strong>{formatMoney(order.totalCents, settings.currency)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="admin-section">
        <h2>Zákazník</h2>
        <table className="table">
          <tbody>
            <tr><th>Jméno</th><td>{order.customer.name}</td></tr>
            <tr><th>E-mail</th><td><a href={`mailto:${order.customer.email}`}>{order.customer.email}</a></td></tr>
            <tr><th>Telefon</th><td>{order.customer.phone || "—"}</td></tr>
            <tr><th>Adresa</th><td style={{ whiteSpace: "pre-line" }}>{order.customer.address}</td></tr>
            <tr><th>Poznámky</th><td>{order.notes || "—"}</td></tr>
            <tr><th>Objednáno</th><td>{formatDate(order.createdAt)}</td></tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
