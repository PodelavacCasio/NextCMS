import type { Metadata } from "next";
import { getSettings } from "@/lib/db";
import { BookingWidget } from "@/components/BookingWidget";
import { DAY_NAMES } from "@/lib/labels";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Rezervace" };

export default function BookingPage() {
  const settings = getSettings();
  // Seřadit od pondělí, jak jdou dny v týdnu za sebou
  const openDayNames = settings.openDays
    .slice()
    .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
    .map((d) => DAY_NAMES[d])
    .join(", ");

  return (
    <>
      <div className="page-head">
        <div className="container">
          <span className="kicker">Rezervace</span>
          <h1>Rezervujte si čas ve studiu</h1>
          <p>
            Otevřeno máme: {openDayNames}. Vyberte službu a volný termín —
            rezervaci vám potvrdíme e-mailem.
          </p>
        </div>
      </div>
      <div className="container">
        <BookingWidget
          services={settings.services}
          openDays={settings.openDays}
          currency={settings.currency}
        />
      </div>
    </>
  );
}
