"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function CartPage() {
  const { items, setQty, remove } = useCart();
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  const rows = items
    .map((item) => {
      const product = products?.find((p) => p.id === item.productId);
      return product ? { product, qty: item.qty } : null;
    })
    .filter((r): r is { product: Product; qty: number } => r !== null);

  const total = rows.reduce((sum, r) => sum + r.product.priceCents * r.qty, 0);

  return (
    <>
      <div className="page-head">
        <div className="container">
          <span className="kicker">Košík</span>
          <h1>Váš košík</h1>
        </div>
      </div>
      <div className="container">
        {products === null ? (
          <div className="section">Načítání…</div>
        ) : rows.length === 0 ? (
          <div className="section">
            <div className="empty">
              <p>Váš košík je prázdný.</p>
              <Link href="/shop" className="btn">Prohlédnout obchod</Link>
            </div>
          </div>
        ) : (
          <div className="checkout-layout">
            <table className="table">
              <thead>
                <tr>
                  <th>Položka</th>
                  <th>Ks</th>
                  <th className="num">Cena</th>
                  <th className="num">Mezisoučet</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ product, qty }) => (
                  <tr key={product.id}>
                    <td>
                      <Link href={`/shop/${product.slug}`}>{product.name}</Link>
                    </td>
                    <td>
                      <div className="qty-controls">
                        <button onClick={() => setQty(product.id, qty - 1)} aria-label="Snížit množství">−</button>
                        <span>{qty}</span>
                        <button
                          onClick={() => setQty(product.id, Math.min(qty + 1, product.stock))}
                          aria-label="Zvýšit množství"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="num">{formatMoney(product.priceCents)}</td>
                    <td className="num">{formatMoney(product.priceCents * qty)}</td>
                    <td>
                      <button className="linklike" onClick={() => remove(product.id)}>
                        Odebrat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="cart-summary">
              <div className="row">
                <span>Položek</span>
                <span>{rows.reduce((n, r) => n + r.qty, 0)}</span>
              </div>
              <div className="row total">
                <span>Celkem</span>
                <span>{formatMoney(total)}</span>
              </div>
              <Link href="/checkout" className="btn accent" style={{ textAlign: "center" }}>
                Pokračovat k pokladně
              </Link>
              <Link href="/shop" style={{ fontSize: 14, textAlign: "center" }}>
                Pokračovat v nákupu
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
