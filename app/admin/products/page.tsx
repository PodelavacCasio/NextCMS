import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getProducts, getSettings } from "@/lib/db";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminProducts() {
  await requireAdmin();
  const settings = getSettings();
  const products = getProducts().slice().sort((a, b) => a.name.localeCompare(b.name, "cs"));

  return (
    <>
      <div className="admin-head">
        <h1>Produkty</h1>
        <Link href="/admin/products/new" className="btn small accent">+ Nový produkt</Link>
      </div>
      {products.length === 0 ? (
        <div className="empty">
          <p>Zatím žádné produkty.</p>
          <Link href="/admin/products/new" className="btn">Přidat první produkt</Link>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Název</th><th>Kategorie</th><th className="num">Cena</th><th className="num">Skladem</th><th>Štítky</th><th />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td><Link href={`/admin/products/${p.id}`}>{p.name}</Link></td>
                <td>{p.category}</td>
                <td className="num">{formatMoney(p.priceCents, settings.currency)}</td>
                <td className="num">{p.stock === 0 ? <span className="badge bad">0</span> : p.stock}</td>
                <td>{p.featured && <span className="badge ok">na úvodní straně</span>}</td>
                <td>
                  <div className="row-actions">
                    <Link href={`/admin/products/${p.id}`} className="btn small ghost">Upravit</Link>
                    <Link href={`/shop/${p.slug}`} target="_blank" className="btn small ghost">Zobrazit</Link>
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
