import Link from "next/link";
import type { Settings } from "@/lib/types";

export function Footer({ settings }: { settings: Settings }) {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-logo">{settings.siteName}</div>
            <p>{settings.tagline}</p>
          </div>
          <div>
            <h4>Prozkoumat</h4>
            <ul>
              <li><Link href="/shop">Obchod</Link></li>
              <li><Link href="/booking">Rezervovat termín</Link></li>
              <li><Link href="/blog">Blog</Link></li>
              <li><Link href="/contact">Kontakt</Link></li>
            </ul>
          </div>
          <div>
            <h4>Navštivte nás</h4>
            <ul>
              <li>{settings.address}</li>
              <li><a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a></li>
              <li>{settings.contactPhone}</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {settings.siteName}. Všechna práva vyhrazena.</span>
          <Link href="/admin">Správa webu</Link>
        </div>
      </div>
    </footer>
  );
}
