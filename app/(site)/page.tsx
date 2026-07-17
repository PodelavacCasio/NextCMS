import Link from "next/link";
import { getProducts, getPosts, getSettings } from "@/lib/db";
import { ProductCard } from "@/components/ProductCard";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const settings = getSettings();
  const featured = getProducts().filter((p) => p.featured).slice(0, 3);
  const posts = getPosts()
    .filter((p) => p.published)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);

  return (
    <>
      <section className="hero">
        <div className="container">
          <span className="kicker">{settings.tagline}</span>
          <h1>{settings.heroTitle}</h1>
          <p>{settings.heroText}</p>
          <div className="hero-actions">
            <Link href="/shop" className="btn accent">Prohlédnout kolekci</Link>
            <Link href="/booking" className="btn ghost">Rezervovat termín</Link>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <h2>Vybrané kousky</h2>
              <Link href="/shop">Zobrazit vše →</Link>
            </div>
            <div className="grid cols-3">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} currency={settings.currency} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Z blogu</h2>
            <Link href="/blog">Všechny články →</Link>
          </div>
          <div className="post-list">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="post-row">
                <span className="date">{formatDate(post.createdAt)}</span>
                <span>
                  <h3>{post.title}</h3>
                  <p>{post.excerpt}</p>
                </span>
                <span className="arrow">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Navštivte studio</h2>
          </div>
          <div className="two-col" style={{ padding: 0 }}>
            <p style={{ color: "var(--muted)", fontSize: 17 }}>{settings.aboutText}</p>
            <div>
              <p style={{ marginBottom: 20, color: "var(--muted)" }}>
                Rezervujte si prohlídku, lekci nebo konzultaci zakázkové výroby
                přímo v kalendáři — vyberte si den a čas, který vám vyhovuje.
              </p>
              <Link href="/booking" className="btn">Zobrazit dostupné termíny</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
