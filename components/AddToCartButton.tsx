"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";

export function AddToCartButton({ productId, inStock }: { productId: string; inStock: boolean }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  if (!inStock) {
    return (
      <button className="btn" disabled>
        Vyprodáno
      </button>
    );
  }

  return (
    <button
      className={added ? "btn accent" : "btn"}
      onClick={() => {
        add(productId);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
      }}
    >
      {added ? "Přidáno ✓" : "Přidat do košíku"}
    </button>
  );
}
