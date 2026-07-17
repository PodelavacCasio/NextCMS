"use client";

import { useEffect, useMemo, useState } from "react";
import type { Service } from "@/lib/types";
import { formatMoney, formatDay, formatTime, todayYMD } from "@/lib/format";

const MONTHS = [
  "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
  "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec",
];
// Kalendář začíná pondělkem, jak je v Česku zvykem.
const DOW = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

function ymd(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function BookingWidget({
  services,
  openDays,
  currency,
}: {
  services: Service[];
  openDays: number[];
  currency: string;
}) {
  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [slots, setSlots] = useState<string[]>([]);
  const [booked, setBooked] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState<{ id: string; date: string; time: string } | null>(null);

  const todayStr = todayYMD();

  useEffect(() => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    setSelectedTime("");
    fetch(`/api/slots?date=${selectedDate}`)
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots ?? []);
        setBooked(data.booked ?? []);
      })
      .catch(() => {
        setSlots([]);
        setBooked([]);
      })
      .finally(() => setLoadingSlots(false));
  }, [selectedDate]);

  const calendarCells = useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    // getDay() vrací 0=neděle; posun tak, aby týden začínal pondělkem
    const leading = (first.getDay() + 6) % 7;
    const cells: (number | null)[] = Array(leading).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [view]);

  const atCurrentMonth =
    view.year === today.getFullYear() && view.month === today.getMonth();

  function moveMonth(delta: number) {
    setView((v) => {
      const m = v.month + delta;
      return { year: v.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const data = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          date: selectedDate,
          time: selectedTime,
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          notes: data.get("notes"),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Něco se pokazilo. Zkuste to prosím znovu.");
        if (res.status === 409) {
          // Termín byl mezitím obsazen — obnovit dostupnost.
          const refreshed = await fetch(`/api/slots?date=${selectedDate}`).then((r) => r.json());
          setBooked(refreshed.booked ?? []);
          setSelectedTime("");
        }
      } else {
        setConfirmed({ id: json.id, date: selectedDate, time: selectedTime });
      }
    } catch {
      setError("Chyba sítě. Zkuste to prosím znovu.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed) {
    const service = services.find((s) => s.id === serviceId);
    return (
      <div className="confirm-box" style={{ margin: "48px auto" }}>
        <span className="kicker">Rezervace odeslána</span>
        <h1>Brzy na viděnou!</h1>
        <p>
          Vaše žádost o službu <strong>{service?.name}</strong> dne{" "}
          <strong>{formatDay(confirmed.date)}</strong> v{" "}
          <strong>{formatTime(confirmed.time)}</strong> byla přijata. Potvrzení
          vám pošleme e-mailem.
        </p>
        <div className="ref">Číslo rezervace: {confirmed.id.toUpperCase()}</div>
        <a href="/booking" className="btn">Vytvořit další rezervaci</a>
      </div>
    );
  }

  const service = services.find((s) => s.id === serviceId);

  return (
    <div className="booking-layout">
      <div>
        <div className="booking-panel" style={{ marginBottom: 24 }}>
          <h2>1 — Vyberte službu</h2>
          <div className="service-list">
            {services.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`service-option${s.id === serviceId ? " selected" : ""}`}
                onClick={() => setServiceId(s.id)}
              >
                <span>
                  <strong>{s.name}</strong>
                  <br />
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>{s.durationMin} minut</span>
                </span>
                <span className="svc-price">{formatMoney(s.priceCents, currency)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="calendar">
          <div className="calendar-head">
            <button type="button" onClick={() => moveMonth(-1)} disabled={atCurrentMonth} aria-label="Předchozí měsíc">
              ←
            </button>
            <strong>
              {MONTHS[view.month]} {view.year}
            </strong>
            <button type="button" onClick={() => moveMonth(1)} aria-label="Další měsíc">
              →
            </button>
          </div>
          <div className="calendar-grid">
            {DOW.map((d) => (
              <span key={d} className="dow">{d}</span>
            ))}
            {calendarCells.map((day, i) => {
              if (day === null) return <span key={`x-${i}`} />;
              const dateStr = ymd(view.year, view.month, day);
              const dow = new Date(view.year, view.month, day).getDay();
              const disabled = dateStr < todayStr || !openDays.includes(dow);
              return (
                <button
                  key={dateStr}
                  type="button"
                  className={`day${dateStr === selectedDate ? " selected" : ""}${dateStr === todayStr ? " today" : ""}`}
                  disabled={disabled}
                  onClick={() => setSelectedDate(dateStr)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="booking-panel">
        <h2>2 — Vyberte čas</h2>
        {!selectedDate ? (
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Vyberte dostupný den v kalendáři.</p>
        ) : loadingSlots ? (
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Ověřuji dostupnost…</p>
        ) : slots.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Na den {formatDay(selectedDate)} nejsou žádné termíny.</p>
        ) : (
          <>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>{formatDay(selectedDate)}</p>
            <div className="slot-grid">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className={`slot${slot === selectedTime ? " selected" : ""}`}
                  disabled={booked.includes(slot)}
                  onClick={() => setSelectedTime(slot)}
                >
                  {formatTime(slot)}
                </button>
              ))}
            </div>
          </>
        )}

        <h2 style={{ marginTop: 32 }}>3 — Vaše údaje</h2>
        <form className="form" onSubmit={handleSubmit}>
          {error && <div className="notice error">{error}</div>}
          <div className="form-row">
            <div className="field">
              <label htmlFor="b-name">Jméno *</label>
              <input id="b-name" name="name" required maxLength={200} />
            </div>
            <div className="field">
              <label htmlFor="b-email">E-mail *</label>
              <input id="b-email" name="email" type="email" required maxLength={200} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="b-phone">Telefon</label>
            <input id="b-phone" name="phone" maxLength={50} />
          </div>
          <div className="field">
            <label htmlFor="b-notes">Poznámky</label>
            <textarea id="b-notes" name="notes" maxLength={1000} placeholder="Máme něco připravit?" />
          </div>
          <button className="btn accent" type="submit" disabled={!selectedDate || !selectedTime || submitting}>
            {submitting
              ? "Odesílám…"
              : selectedDate && selectedTime
                ? `Rezervovat ${formatTime(selectedTime)} — ${formatDay(selectedDate)}`
                : "Nejdřív vyberte datum a čas"}
          </button>
          {service && service.priceCents > 0 && (
            <p className="hint">
              {service.name} stojí {formatMoney(service.priceCents, currency)}, platí se ve studiu.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
