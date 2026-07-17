import type { Metadata } from "next";
import Link from "next/link";
import { getPosts } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Blog" };

export default function BlogPage() {
  const posts = getPosts()
    .filter((p) => p.published)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <div className="page-head">
        <div className="container">
          <span className="kicker">Blog</span>
          <h1>Zápisky ze studia</h1>
          <p>Postupy, materiály, nové kousky a občas nějaký ten názor.</p>
        </div>
      </div>
      <section className="section">
        <div className="container">
          {posts.length === 0 ? (
            <div className="empty">Zatím žádné články — brzy se sem podívejte znovu.</div>
          ) : (
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
          )}
        </div>
      </section>
    </>
  );
}
