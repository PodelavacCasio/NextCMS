import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatMoney } from "@/lib/format";

export function Media({ image, name }: { image: string; name: string }) {
  if (image) return <img src={image} alt={name} />;
  return (
    <div className="placeholder" aria-hidden="true">
      <span>{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}

export function ProductCard({ product, currency }: { product: Product; currency: string }) {
  return (
    <Link href={`/shop/${product.slug}`} className="card">
      <div className="card-media">
        <Media image={product.image} name={product.name} />
      </div>
      <div className="card-body">
        <span className="cat">{product.category}</span>
        <h3>{product.name}</h3>
        <span className="price">
          {formatMoney(product.priceCents, currency)}
          {product.stock === 0 && <span className="sold-out"> · Vyprodáno</span>}
        </span>
      </div>
    </Link>
  );
}
