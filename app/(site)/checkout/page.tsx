"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function CheckoutPage() {
  const { items, clear } = useCart();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const data = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
          customer: {
            name: data.get("name"),
            email: data.get("email"),
            phone: data.get("phone"),
            address: data.get("address"),
          },
          notes: data.get("notes"),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Něco se pokazilo. Zkuste to prosím znovu.");
      } else {
        setOrderId(json.id);
        clear();
      }
    } catch {
      setError("Chyba sítě. Zkuste to prosím znovu.");
    } finally {
      setSubmitting(false);
    }
  }

  if (orderId) {
    return (
      <div className="container">
        <div className="confirm-box">
          <span className="kicker">Objednávka přijata</span>
          <h1>Děkujeme!</h1>
          <p>
            Vaše objednávka byla odeslána. Brzy se vám ozveme e-mailem, potvrdíme
            podrobnosti a domluvíme platbu při vyzvednutí nebo doručení.
          </p>
          <div className="ref">Číslo objednávky: {orderId.toUpperCase()}</div>
          <Link href="/shop" className="btn">Zpět do obchodu</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-head">
        <div className="container">
          <span className="kicker">Pokladna</span>
          <h1>Už jen krok</h1>
          <p>
            Online platbu nevybíráme — objednávku odešlete a zaplatíte při
            vyzvednutí nebo doručení.
          </p>
        </div>
      </div>
      <div className="container">
        {products !== null && rows.length === 0 ? (
          <div className="section">
            <div className="empty">
              <p>Váš košík je prázdný.</p>
              <Link href="/shop" className="btn">Prohlédnout obchod</Link>
            </div>
          </div>
        ) : (
          <div className="checkout-layout">
            <form className="form" onSubmit={handleSubmit}>
              {error && <div className="notice error">{error}</div>}
              <div className="form-row">
                <div className="field">
                  <label htmlFor="name">Celé jméno *</label>
                  <input id="name" name="name" required maxLength={200} />
                </div>
                <div className="field">
                  <label htmlFor="email">E-mail *</label>
                  <input id="email" name="email" type="email" required maxLength={200} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="phone">Telefon</label>
                <input id="phone" name="phone" maxLength={50} />
              </div>
              <div className="field">
                <label htmlFor="address">Adresa doručení / vyzvednutí *</label>
                <textarea id="address" name="address" required maxLength={500} />
              </div>
              <div className="field">
                <label htmlFor="notes">Poznámky k objednávce</label>
                <textarea id="notes" name="notes" maxLength={1000} placeholder="Máme o něčem vědět?" />
              </div>
              <button className="btn accent" type="submit" disabled={submitting || rows.length === 0}>
                {submitting ? "Odesílám objednávku…" : "Odeslat objednávku"}
              </button>
            </form>
            <div className="cart-summary">
              {rows.map(({ product, qty }) => (
                <div className="row" key={product.id}>
                  <span>
                    {product.name} × {qty}
                  </span>
                  <span>{formatMoney(product.priceCents * qty)}</span>
                </div>
              ))}
              <div className="row total">
                <span>Celkem</span>
                <span>{formatMoney(total)}</span>
              </div>
              <Link href="/cart" style={{ fontSize: 14 }}>← Upravit košík</Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
