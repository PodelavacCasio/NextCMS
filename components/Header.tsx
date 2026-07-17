"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export function Header({ siteName }: { siteName: string }) {
  const { count } = useCart();
  const [first, ...rest] = siteName.split(" ");

  return (
    <header className="site-header">
      <div className="container">
        <Link href="/" className="logo">
          {first}
          {rest.length > 0 && <span> {rest.join(" ")}</span>}
        </Link>
        <nav className="site-nav">
          <Link href="/shop">Obchod</Link>
          <Link href="/booking">Rezervace</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/contact">Kontakt</Link>
          <Link href="/cart" className="cart-link">
            Košík{count > 0 && <span className="cart-count">{count}</span>}
          </Link>
        </nav>
      </div>
    </header>
  );
}
