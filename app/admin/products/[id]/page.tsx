import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getProducts } from "@/lib/db";
import { saveProduct, deleteProduct } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const isNew = id === "new";
  const product = isNew ? undefined : getProducts().find((p) => p.id === id);
  if (!isNew && !product) notFound();

  return (
    <>
      <div className="admin-head">
        <h1>{isNew ? "Nový produkt" : `Úprava: ${product!.name}`}</h1>
        <Link href="/admin/products" className="btn small ghost">← Zpět</Link>
      </div>
      <form action={saveProduct} className="form" style={{ maxWidth: 720 }}>
        <input type="hidden" name="id" value={product?.id ?? ""} />
        <div className="field">
          <label htmlFor="name">Název *</label>
          <input id="name" name="name" required defaultValue={product?.name} maxLength={200} />
        </div>
        <div className="field">
          <label htmlFor="description">Popis</label>
          <textarea id="description" name="description" defaultValue={product?.description} maxLength={5000} />
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="price">Cena *</label>
            <input
              id="price" name="price" type="number" step="0.01" min="0" required
              defaultValue={product ? (product.priceCents / 100).toFixed(2) : ""}
            />
            <p className="hint">V měně obchodu, např. 890 nebo 890.50</p>
          </div>
          <div className="field">
            <label htmlFor="stock">Skladem (ks) *</label>
            <input id="stock" name="stock" type="number" min="0" step="1" required defaultValue={product?.stock ?? 0} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="category">Kategorie</label>
          <input id="category" name="category" defaultValue={product?.category} maxLength={100} placeholder="např. Keramika" />
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="image">URL obrázku</label>
            <input id="image" name="image" defaultValue={product?.image} maxLength={1000} placeholder="/uploads/… nebo https://…" />
          </div>
          <div className="field">
            <label htmlFor="imageFile">…nebo nahrajte obrázek</label>
            <input id="imageFile" name="imageFile" type="file" accept="image/*" />
            <p className="hint">Nahraný soubor nahradí pole s URL.</p>
          </div>
        </div>
        <div className="check">
          <input id="featured" name="featured" type="checkbox" defaultChecked={product?.featured} />
          <label htmlFor="featured">Zobrazit na úvodní stránce</label>
        </div>
        <div className="row-actions">
          <button className="btn accent" type="submit">
            {isNew ? "Vytvořit produkt" : "Uložit změny"}
          </button>
        </div>
      </form>
      {!isNew && (
        <form action={deleteProduct} style={{ marginTop: 32 }}>
          <input type="hidden" name="id" value={product!.id} />
          <button className="btn small danger" type="submit">Smazat tento produkt</button>
        </form>
      )}
    </>
  );
}
