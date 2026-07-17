import type { Metadata } from "next";
import Link from "next/link";
import { getProducts, getSettings } from "@/lib/db";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Obchod" };

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const settings = getSettings();
  const all = getProducts();
  const categories = [...new Set(all.map((p) => p.category))].sort();
  const products = category ? all.filter((p) => p.category === category) : all;

  return (
    <>
      <div className="page-head">
        <div className="container">
          <span className="kicker">Obchod</span>
          <h1>Kolekce</h1>
          <p>
            Vše vyrábíme u nás ve studiu v malých sériích. Objednávky potvrzujeme
            e-mailem a platí se při vyzvednutí nebo doručení.
          </p>
        </div>
      </div>
      <section className="section">
        <div className="container">
          <div className="section-head" style={{ flexWrap: "wrap" }}>
            <nav className="site-nav" style={{ flexWrap: "wrap" }}>
              <Link href="/shop" style={!category ? { background: "var(--ink)", color: "var(--bg)" } : undefined}>
                Vše
              </Link>
              {categories.map((c) => (
                <Link
                  key={c}
                  href={`/shop?category=${encodeURIComponent(c)}`}
                  style={category === c ? { background: "var(--ink)", color: "var(--bg)" } : undefined}
                >
                  {c}
                </Link>
              ))}
            </nav>
          </div>
          {products.length === 0 ? (
            <div className="empty">Zatím tu nic není — brzy se sem podívejte znovu.</div>
          ) : (
            <div className="grid cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} currency={settings.currency} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
