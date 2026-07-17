import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getPosts } from "@/lib/db";
import { savePost, deletePost } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const isNew = id === "new";
  const post = isNew ? undefined : getPosts().find((p) => p.id === id);
  if (!isNew && !post) notFound();

  return (
    <>
      <div className="admin-head">
        <h1>{isNew ? "Nový článek" : `Úprava: ${post!.title}`}</h1>
        <Link href="/admin/posts" className="btn small ghost">← Zpět</Link>
      </div>
      <form action={savePost} className="form" style={{ maxWidth: 800 }}>
        <input type="hidden" name="id" value={post?.id ?? ""} />
        <div className="field">
          <label htmlFor="title">Titulek *</label>
          <input id="title" name="title" required defaultValue={post?.title} maxLength={300} />
        </div>
        <div className="field">
          <label htmlFor="excerpt">Perex</label>
          <textarea id="excerpt" name="excerpt" defaultValue={post?.excerpt} maxLength={500} style={{ minHeight: 70 }} />
          <p className="hint">Krátké shrnutí zobrazené v seznamu článků.</p>
        </div>
        <div className="field">
          <label htmlFor="content">Obsah *</label>
          <textarea
            id="content" name="content" required defaultValue={post?.content}
            style={{ minHeight: 340, fontFamily: "var(--font-mono)", fontSize: 14 }}
          />
          <p className="hint">
            Formátování: prázdný řádek mezi odstavci · ## Nadpis · ### Podnadpis ·
            **tučně** · *kurzíva* · `kód` · - položka seznamu · &gt; citace ·
            [text odkazu](https://…) · ![popisek](url-obrázku)
          </p>
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="author">Autor</label>
            <input id="author" name="author" defaultValue={post?.author} maxLength={100} />
          </div>
          <div className="field">
            <label htmlFor="coverImage">URL úvodního obrázku</label>
            <input id="coverImage" name="coverImage" defaultValue={post?.coverImage} maxLength={1000} placeholder="/uploads/… nebo https://…" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="coverImageFile">…nebo nahrajte úvodní obrázek</label>
          <input id="coverImageFile" name="coverImageFile" type="file" accept="image/*" />
        </div>
        <div className="check">
          <input id="published" name="published" type="checkbox" defaultChecked={post?.published ?? true} />
          <label htmlFor="published">Publikováno (odškrtněte pro uložení jako koncept)</label>
        </div>
        <div className="row-actions">
          <button className="btn accent" type="submit">
            {isNew ? "Vytvořit článek" : "Uložit změny"}
          </button>
        </div>
      </form>
      {!isNew && (
        <form action={deletePost} style={{ marginTop: 32 }}>
          <input type="hidden" name="id" value={post!.id} />
          <button className="btn small danger" type="submit">Smazat tento článek</button>
        </form>
      )}
    </>
  );
}
