import { notFound } from "next/navigation";
import Link from "next/link";
import { getPost } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { Markdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post || !post.published) notFound();

  return (
    <article className="article">
      <div className="article-head">
        <span className="kicker">Blog</span>
        <h1>{post.title}</h1>
        <div className="meta">
          {formatDate(post.createdAt)} · {post.author}
        </div>
      </div>
      {post.coverImage && (
        <img
          src={post.coverImage}
          alt=""
          style={{ border: "1px solid var(--line-strong)", marginBottom: 32 }}
        />
      )}
      <Markdown content={post.content} />
      <p style={{ marginTop: 48 }}>
        <Link href="/blog">← Všechny články</Link>
      </p>
    </article>
  );
}
