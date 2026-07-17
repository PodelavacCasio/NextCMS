import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getPosts } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminPosts() {
  await requireAdmin();
  const posts = getPosts().slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <div className="admin-head">
        <h1>Články</h1>
        <Link href="/admin/posts/new" className="btn small accent">+ Nový článek</Link>
      </div>
      {posts.length === 0 ? (
        <div className="empty">
          <p>Zatím žádné články.</p>
          <Link href="/admin/posts/new" className="btn">Napsat první článek</Link>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Titulek</th><th>Autor</th><th>Datum</th><th>Stav</th><th />
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id}>
                <td><Link href={`/admin/posts/${p.id}`}>{p.title}</Link></td>
                <td>{p.author}</td>
                <td>{formatDate(p.createdAt)}</td>
                <td>
                  <span className={`badge ${p.published ? "ok" : "muted"}`}>
                    {p.published ? "publikováno" : "koncept"}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    <Link href={`/admin/posts/${p.id}`} className="btn small ghost">Upravit</Link>
                    {p.published && (
                      <Link href={`/blog/${p.slug}`} target="_blank" className="btn small ghost">Zobrazit</Link>
                    )}
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
