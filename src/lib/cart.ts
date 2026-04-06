"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

export type CartLineOption = {
  groupName: { en: string; el: string };
  optionName: { en: string; el: string };
};

export type CartLine = {
  lineId: string; // unique per line (slug + options hash + timestamp)
  slug: string;
  title: { en: string; el: string };
  unitPrice: number;
  quantity: number;
  options: CartLineOption[];
  comment: string;
};

export type Cart = {
  lines: CartLine[];
};

const STORAGE_KEY = "coffee-three-cart-v1";

function readCart(): Cart {
  if (typeof window === "undefined") return { lines: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lines: [] };
    return JSON.parse(raw) as Cart;
  } catch {
    return { lines: [] };
  }
}

type Listener = () => void;
const listeners = new Set<Listener>();
let snapshot: Cart = typeof window === "undefined" ? { lines: [] } : readCart();
const serverSnapshot: Cart = { lines: [] };

function persist(next: Cart) {
  snapshot = next;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }
  listeners.forEach((l) => l());
}

// Sync across tabs
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      snapshot = readCart();
      listeners.forEach((l) => l());
    }
  });
}

export const cartStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): Cart {
    return snapshot;
  },
  getServerSnapshot(): Cart {
    return serverSnapshot;
  },
  addLine(line: Omit<CartLine, "lineId">) {
    const lineId = `${line.slug}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;
    persist({ lines: [...snapshot.lines, { ...line, lineId }] });
  },
  updateQty(lineId: string, qty: number) {
    if (qty <= 0) {
      persist({ lines: snapshot.lines.filter((l) => l.lineId !== lineId) });
      return;
    }
    persist({
      lines: snapshot.lines.map((l) =>
        l.lineId === lineId ? { ...l, quantity: qty } : l
      ),
    });
  },
  removeLine(lineId: string) {
    persist({ lines: snapshot.lines.filter((l) => l.lineId !== lineId) });
  },
  clear() {
    persist({ lines: [] });
  },
};

export function useCart(): Cart {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const cart = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot
  );
  // Avoid hydration mismatch — render empty on server & first client render
  return mounted ? cart : serverSnapshot;
}

export function cartTotalCents(cart: Cart): number {
  return cart.lines.reduce(
    (sum, l) => sum + Math.round(l.unitPrice * 100) * l.quantity,
    0
  );
}

export function cartItemCount(cart: Cart): number {
  return cart.lines.reduce((sum, l) => sum + l.quantity, 0);
}
