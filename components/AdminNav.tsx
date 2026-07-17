"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Přehled" },
  { href: "/admin/products", label: "Produkty" },
  { href: "/admin/posts", label: "Články" },
  { href: "/admin/orders", label: "Objednávky" },
  { href: "/admin/bookings", label: "Rezervace" },
  { href: "/admin/settings", label: "Nastavení" },
];

export function AdminNav({
  siteName,
  logoutAction,
}: {
  siteName: string;
  logoutAction: () => Promise<void>;
}) {
  const pathname = usePathname();

  return (
    <aside className="admin-nav">
      <Link href="/admin" className="brand">
        {siteName} <span>CMS</span>
      </Link>
      {LINKS.map((link) => {
        const active =
          link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        return (
          <Link key={link.href} href={link.href} className={active ? "active" : ""}>
            {link.label}
          </Link>
        );
      })}
      <Link href="/" target="_blank">Zobrazit web ↗</Link>
      <form action={logoutAction}>
        <button className="btn ghost small" type="submit">Odhlásit se</button>
      </form>
    </aside>
  );
}
