import { NextResponse } from "next/server";
import { getBookedTimes, getSettings } from "@/lib/db";
import { buildSlots } from "@/lib/slots";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const date = new URL(req.url).searchParams.get("date") || "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Neplatné datum." }, { status: 400 });
  }

  const settings = getSettings();
  const [y, m, d] = date.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  if (!settings.openDays.includes(dow)) {
    return NextResponse.json({ slots: [], booked: [] });
  }

  const slots = buildSlots(settings.openHour, settings.closeHour, settings.slotMinutes);
  return NextResponse.json({ slots, booked: getBookedTimes(date) });
}
