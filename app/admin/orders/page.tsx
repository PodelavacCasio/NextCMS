import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getOrders, getSettings } from "@/lib/db";
import { formatMoney, formatDate } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/labels";

export const dynamic = "force-dynamic";

function statusClass(status: string) {
  if (status === "new") return "warn";
  if (status === "cancelled") return "bad";
  if (status === "completed") return "ok";
  return "muted";
}

export default async function AdminOrders() {
  await requireAdmin();
  const settings = getSettings();
  const orders = getOrders().slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <div className="admin-head">
        <h1>Objednávky</h1>
      </div>
      {orders.length === 0 ? (
        <div className="empty">Zatím žádné objednávky. Objeví se tady, jakmile zákazníci dokončí nákup.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Číslo</th><th>Datum</th><th>Zákazník</th><th>Položek</th><th className="num">Celkem</th><th>Stav</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><Link href={`/admin/orders/${o.id}`}>{o.id.toUpperCase()}</Link></td>
                <td>{formatDate(o.createdAt)}</td>
                <td>{o.customer.name}</td>
                <td>{o.items.reduce((n, i) => n + i.qty, 0)}</td>
                <td className="num">{formatMoney(o.totalCents, settings.currency)}</td>
                <td><span className={`badge ${statusClass(o.status)}`}>{ORDER_STATUS_LABELS[o.status]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
