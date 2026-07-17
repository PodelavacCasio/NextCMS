import { requireAdmin } from "@/lib/auth";
import { getBookings } from "@/lib/db";
import { formatDay, formatTime } from "@/lib/format";
import { BOOKING_STATUS_LABELS } from "@/lib/labels";
import { updateBookingStatus } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminBookings() {
  await requireAdmin();
  const bookings = getBookings()
    .slice()
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));

  return (
    <>
      <div className="admin-head">
        <h1>Rezervace</h1>
      </div>
      {bookings.length === 0 ? (
        <div className="empty">Zatím žádné rezervace. Objeví se tady, jakmile si klienti zarezervují termín.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Kdy</th><th>Služba</th><th>Klient</th><th>Kontakt</th><th>Poznámky</th><th>Stav</th><th />
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td style={{ whiteSpace: "nowrap" }}>
                  {formatDay(b.date)}
                  <br />
                  <strong>{formatTime(b.time)}</strong>
                </td>
                <td>{b.serviceName}</td>
                <td>{b.name}</td>
                <td>
                  <a href={`mailto:${b.email}`}>{b.email}</a>
                  {b.phone && <><br />{b.phone}</>}
                </td>
                <td style={{ maxWidth: 200 }}>{b.notes || "—"}</td>
                <td>
                  <span className={`badge ${b.status === "pending" ? "warn" : b.status === "cancelled" ? "bad" : "ok"}`}>
                    {BOOKING_STATUS_LABELS[b.status]}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    {b.status !== "confirmed" && (
                      <form action={updateBookingStatus} className="inline-form">
                        <input type="hidden" name="id" value={b.id} />
                        <input type="hidden" name="status" value="confirmed" />
                        <button className="btn small ghost" type="submit">Potvrdit</button>
                      </form>
                    )}
                    {b.status !== "cancelled" && (
                      <form action={updateBookingStatus} className="inline-form">
                        <input type="hidden" name="id" value={b.id} />
                        <input type="hidden" name="status" value="cancelled" />
                        <button className="btn small danger" type="submit">Zrušit</button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
