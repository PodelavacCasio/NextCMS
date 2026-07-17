import { notFound } from "next/navigation";
import Link from "next/link";
import { getProduct, getSettings } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { AddToCartButton } from "@/components/AddToCartButton";
import { Media } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  const settings = getSettings();

  return (
    <div className="container">
      <div className="product-layout">
        <div className="product-media">
          <Media image={product.image} name={product.name} />
        </div>
        <div className="product-info">
          <span className="kicker">
            <Link href={`/shop?category=${encodeURIComponent(product.category)}`} style={{ color: "inherit", textDecoration: "none" }}>
              {product.category}
            </Link>
          </span>
          <h1>{product.name}</h1>
          <div className="price">{formatMoney(product.priceCents, settings.currency)}</div>
          <p className="desc">{product.description}</p>
          <AddToCartButton productId={product.id} inStock={product.stock > 0} />
          <p className="stock-note">
            {product.stock > 0
              ? product.stock <= 5
                ? `Skladem už jen ${product.stock} ks.`
                : "Skladem — odešleme nebo připravíme k vyzvednutí do týdne."
              : "Momentálně vyprodáno. Nové série oznamujeme na blogu."}
          </p>
        </div>
      </div>
    </div>
  );
}
