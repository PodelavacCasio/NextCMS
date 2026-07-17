import { NextResponse } from "next/server";
import { addBooking, getSettings, newId } from "@/lib/db";
import { buildSlots } from "@/lib/slots";
import { todayYMD } from "@/lib/format";
import type { Booking } from "@/lib/types";

export const dynamic = "force-dynamic";

interface BookingRequest {
  serviceId: string;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
}

export async function POST(req: Request) {
  let body: BookingRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatný požadavek." }, { status: 400 });
  }

  const settings = getSettings();
  const service = settings.services.find((s) => s.id === body.serviceId);
  if (!service) {
    return NextResponse.json({ error: "Vyberte prosím službu." }, { status: 400 });
  }
  if (!body.name?.trim() || !body.email?.trim()) {
    return NextResponse.json({ error: "Jméno a e-mail jsou povinné." }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date || "")) {
    return NextResponse.json({ error: "Vyberte prosím datum." }, { status: 400 });
  }
  if (body.date < todayYMD()) {
    return NextResponse.json({ error: "Toto datum už je v minulosti." }, { status: 400 });
  }

  const [y, m, d] = body.date.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  if (!settings.openDays.includes(dow)) {
    return NextResponse.json({ error: "V tento den máme zavřeno." }, { status: 400 });
  }

  const validSlots = buildSlots(settings.openHour, settings.closeHour, settings.slotMinutes);
  if (!validSlots.includes(body.time)) {
    return NextResponse.json({ error: "Vyberte prosím čas." }, { status: 400 });
  }

  const booking: Booking = {
    id: newId(),
    serviceId: service.id,
    serviceName: service.name,
    date: body.date,
    time: body.time,
    name: body.name.trim().slice(0, 200),
    email: body.email.trim().slice(0, 200),
    phone: (body.phone || "").trim().slice(0, 50),
    notes: (body.notes || "").trim().slice(0, 1000),
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  // A unique index on (date, time) for non-cancelled bookings makes this
  // atomic — two simultaneous requests can never both succeed.
  if (!addBooking(booking)) {
    return NextResponse.json(
      { error: "Tento termín byl bohužel právě obsazen. Vyberte prosím jiný." },
      { status: 409 }
    );
  }

  return NextResponse.json({ id: booking.id });
}
