import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/db";
import { DAY_ABBREV } from "@/lib/labels";
import { updateSettings } from "../actions";

export const dynamic = "force-dynamic";

// Zobrazit dny od pondělí (interně zůstává 0 = neděle)
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default async function AdminSettings({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireAdmin();
  const { saved } = await searchParams;
  const settings = getSettings();
  // Stávající služby plus dva prázdné řádky pro přidání nových
  const serviceRows = [...settings.services, null, null];

  return (
    <>
      <div className="admin-head">
        <h1>Nastavení webu</h1>
      </div>
      {saved && <div className="notice success" style={{ marginBottom: 24 }}>Nastavení uloženo.</div>}
      <form action={updateSettings} className="form" style={{ maxWidth: 800 }}>
        <h2 style={{ fontSize: 18 }}>Identita</h2>
        <div className="form-row">
          <div className="field">
            <label htmlFor="siteName">Název webu</label>
            <input id="siteName" name="siteName" defaultValue={settings.siteName} maxLength={100} />
          </div>
          <div className="field">
            <label htmlFor="tagline">Slogan</label>
            <input id="tagline" name="tagline" defaultValue={settings.tagline} maxLength={200} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="heroTitle">Titulek na úvodní stránce</label>
          <input id="heroTitle" name="heroTitle" defaultValue={settings.heroTitle} maxLength={300} />
        </div>
        <div className="field">
          <label htmlFor="heroText">Úvodní text</label>
          <textarea id="heroText" name="heroText" defaultValue={settings.heroText} maxLength={1000} style={{ minHeight: 80 }} />
        </div>
        <div className="field">
          <label htmlFor="aboutText">Text o studiu</label>
          <textarea id="aboutText" name="aboutText" defaultValue={settings.aboutText} maxLength={2000} style={{ minHeight: 80 }} />
        </div>

        <h2 style={{ fontSize: 18, marginTop: 16 }}>Kontakt a obchod</h2>
        <div className="form-row">
          <div className="field">
            <label htmlFor="contactEmail">Kontaktní e-mail</label>
            <input id="contactEmail" name="contactEmail" type="email" defaultValue={settings.contactEmail} maxLength={200} />
          </div>
          <div className="field">
            <label htmlFor="contactPhone">Telefon</label>
            <input id="contactPhone" name="contactPhone" defaultValue={settings.contactPhone} maxLength={50} />
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="address">Adresa</label>
            <input id="address" name="address" defaultValue={settings.address} maxLength={300} />
          </div>
          <div className="field">
            <label htmlFor="currency">Kód měny</label>
            <input id="currency" name="currency" defaultValue={settings.currency} maxLength={10} placeholder="CZK" />
          </div>
        </div>

        <h2 style={{ fontSize: 18, marginTop: 16 }}>Otevírací hodiny rezervací</h2>
        <div className="form-row">
          <div className="field">
            <label htmlFor="openHour">Otevíráme v (0–23)</label>
            <input id="openHour" name="openHour" type="number" min="0" max="23" defaultValue={settings.openHour} />
          </div>
          <div className="field">
            <label htmlFor="closeHour">Zavíráme v (1–24)</label>
            <input id="closeHour" name="closeHour" type="number" min="1" max="24" defaultValue={settings.closeHour} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="slotMinutes">Délka termínu (minuty)</label>
          <input id="slotMinutes" name="slotMinutes" type="number" min="10" step="5" defaultValue={settings.slotMinutes} />
        </div>
        <div className="field">
          <label>Otevřené dny</label>
          <div className="row-actions">
            {DAY_ORDER.map((d) => (
              <span key={d} className="check">
                <input id={`day${d}`} name={`day${d}`} type="checkbox" defaultChecked={settings.openDays.includes(d)} />
                <label htmlFor={`day${d}`}>{DAY_ABBREV[d]}</label>
              </span>
            ))}
          </div>
        </div>

        <h2 style={{ fontSize: 18, marginTop: 16 }}>Rezervovatelné služby</h2>
        <p className="hint">Službu odstraníte smazáním jejího názvu. Prázdné řádky se ignorují.</p>
        {serviceRows.map((svc, i) => (
          <div className="form-row" key={svc?.id ?? `new-${i}`} style={{ gridTemplateColumns: "2fr 1fr 1fr" }}>
            <div className="field">
              <label htmlFor={`svcName${i}`}>Název služby</label>
              <input type="hidden" name={`svcId${i}`} value={svc?.id ?? ""} />
              <input id={`svcName${i}`} name={`svcName${i}`} defaultValue={svc?.name ?? ""} maxLength={200} placeholder={svc ? "" : "Přidat službu…"} />
            </div>
            <div className="field">
              <label htmlFor={`svcDuration${i}`}>Minuty</label>
              <input id={`svcDuration${i}`} name={`svcDuration${i}`} type="number" min="5" step="5" defaultValue={svc?.durationMin ?? 60} />
            </div>
            <div className="field">
              <label htmlFor={`svcPrice${i}`}>Cena</label>
              <input id={`svcPrice${i}`} name={`svcPrice${i}`} type="number" min="0" step="0.01" defaultValue={svc ? (svc.priceCents / 100).toFixed(2) : "0.00"} />
            </div>
          </div>
        ))}

        <div className="row-actions" style={{ marginTop: 8 }}>
          <button className="btn accent" type="submit">Uložit nastavení</button>
        </div>
      </form>
    </>
  );
}
