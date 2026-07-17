import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getProducts, getPosts, getOrders, getBookings, getSettings } from "@/lib/db";
import { formatMoney, formatDay, formatTime } from "@/lib/format";
import { ORDER_STATUS_LABELS, BOOKING_STATUS_LABELS } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requireAdmin();
  const settings = getSettings();
  const products = getProducts();
  const posts = getPosts();
  const orders = getOrders();
  const bookings = getBookings();

  const openOrders = orders.filter((o) => o.status === "new" || o.status === "processing");
  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const recentOrders = orders.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const upcomingBookings = bookings
    .filter((b) => b.status !== "cancelled")
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    .slice(0, 5);

  return (
    <>
      <div className="admin-head">
        <h1>Přehled</h1>
      </div>
      <div className="stat-grid">
        <div className="stat">
          <span className="n">{openOrders.length}</span>
          <span className="l">Otevřené objednávky</span>
        </div>
        <div className="stat">
          <span className="n">{pendingBookings.length}</span>
          <span className="l">Čekající rezervace</span>
        </div>
        <div className="stat">
          <span className="n">{products.length}</span>
          <span className="l">Produkty</span>
        </div>
        <div className="stat">
          <span className="n">{posts.filter((p) => p.published).length}</span>
          <span className="l">Publikované články</span>
        </div>
      </div>

      <div className="admin-section">
        <h2>Poslední objednávky</h2>
        {recentOrders.length === 0 ? (
          <div className="empty">Zatím žádné objednávky.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Číslo</th><th>Zákazník</th><th>Stav</th><th className="num">Celkem</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/admin/orders/${o.id}`}>{o.id.toUpperCase()}</Link>
                  </td>
                  <td>{o.customer.name}</td>
                  <td><span className={`badge ${o.status === "new" ? "warn" : o.status === "cancelled" ? "bad" : "ok"}`}>{ORDER_STATUS_LABELS[o.status]}</span></td>
                  <td className="num">{formatMoney(o.totalCents, settings.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="admin-section">
        <h2>Nadcházející rezervace</h2>
        {upcomingBookings.length === 0 ? (
          <div className="empty">Zatím žádné rezervace.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Kdy</th><th>Služba</th><th>Klient</th><th>Stav</th>
              </tr>
            </thead>
            <tbody>
              {upcomingBookings.map((b) => (
                <tr key={b.id}>
                  <td>{formatDay(b.date)}, {formatTime(b.time)}</td>
                  <td>{b.serviceName}</td>
                  <td>{b.name}</td>
                  <td><span className={`badge ${b.status === "pending" ? "warn" : "ok"}`}>{BOOKING_STATUS_LABELS[b.status]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
