import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/db";
import { DAY_NAMES } from "@/lib/labels";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Kontakt" };

export default function ContactPage() {
  const settings = getSettings();
  const days = settings.openDays
    .slice()
    .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
    .map((d) => DAY_NAMES[d]);

  return (
    <>
      <div className="page-head">
        <div className="container">
          <span className="kicker">Kontakt</span>
          <h1>Ozvěte se nám</h1>
        </div>
      </div>
      <div className="container">
        <div className="two-col">
          <div>
            <h2 style={{ marginBottom: 16, fontSize: 24 }}>O studiu</h2>
            <p style={{ color: "var(--muted)", marginBottom: 24 }}>{settings.aboutText}</p>
            <Link href="/booking" className="btn">Rezervovat návštěvu</Link>
          </div>
          <div>
            <table className="table">
              <tbody>
                <tr>
                  <th>E-mail</th>
                  <td>
                    <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
                  </td>
                </tr>
                <tr>
                  <th>Telefon</th>
                  <td>{settings.contactPhone}</td>
                </tr>
                <tr>
                  <th>Adresa</th>
                  <td>{settings.address}</td>
                </tr>
                <tr>
                  <th>Otevřeno</th>
                  <td>
                    {days.join(", ")}
                    <br />
                    {settings.openHour}:00 – {settings.closeHour}:00
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
