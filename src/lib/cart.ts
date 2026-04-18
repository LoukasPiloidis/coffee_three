"use client";

import { useSyncExternalStore } from "react";

export type CartLineOption = {
  groupKey: string;
  optionKey: string;
  groupName: { en: string; el: string };
  optionName: { en: string; el: string };
  priceCents: number;
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

export type AppliedOffer = {
  offerSlug: string;
  offerTitle: { en: string; el: string };
  slotAssignments: {
    slotIndex: number;
    lineId: string;
    discountCents: number;
  }[];
};

export type Cart = {
  lines: CartLine[];
  appliedOffers: AppliedOffer[];
};

// v4: Added appliedOffers for offer tracking.
// v3 carts are silently discarded.
const STORAGE_KEY = "coffee-three-cart-v4";

function readCart(): Cart {
  if (typeof window === "undefined") return { lines: [], appliedOffers: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lines: [], appliedOffers: [] };
    return JSON.parse(raw) as Cart;
  } catch {
    return { lines: [], appliedOffers: [] };
  }
}

type Listener = () => void;
const listeners = new Set<Listener>();
// Start empty on both server and client so the first client render matches
// SSR. Actual localStorage data is pulled in via `hydrate()` the first time
// a component subscribes (i.e. after mount), which then notifies listeners
// to re-render with the real cart.
let snapshot: Cart = { lines: [], appliedOffers: [] };
const serverSnapshot: Cart = { lines: [], appliedOffers: [] };
let hydrated = false;

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const fromStorage = readCart();
  if (fromStorage.lines.length > 0) {
    snapshot = fromStorage;
    listeners.forEach((l) => l());
  }
}

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
    hydrate();
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
    persist({
      ...snapshot,
      lines: [...snapshot.lines, { ...line, lineId }],
    });
  },
  updateQty(lineId: string, qty: number) {
    if (qty <= 0) {
      this.removeLine(lineId);
      return;
    }
    persist({
      ...snapshot,
      lines: snapshot.lines.map((l) =>
        l.lineId === lineId ? { ...l, quantity: qty } : l
      ),
    });
  },
  removeLine(lineId: string) {
    // Also remove any offer that references this line
    const appliedOffers = snapshot.appliedOffers.filter(
      (o) => !o.slotAssignments.some((a) => a.lineId === lineId)
    );
    persist({
      lines: snapshot.lines.filter((l) => l.lineId !== lineId),
      appliedOffers,
    });
  },
  clear() {
    persist({ lines: [], appliedOffers: [] });
  },
  addOfferLines(
    lines: Omit<CartLine, "lineId">[],
    offer: {
      offerSlug: string;
      offerTitle: { en: string; el: string };
      slotDiscounts: { slotIndex: number; discountCents: number }[];
    }
  ) {
    const newLines: CartLine[] = lines.map((line) => ({
      ...line,
      lineId: `${line.slug}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}`,
    }));
    const slotAssignments = offer.slotDiscounts.map((sd, i) => ({
      slotIndex: sd.slotIndex,
      lineId: newLines[i].lineId,
      discountCents: sd.discountCents,
    }));
    persist({
      lines: [...snapshot.lines, ...newLines],
      appliedOffers: [
        ...snapshot.appliedOffers,
        {
          offerSlug: offer.offerSlug,
          offerTitle: offer.offerTitle,
          slotAssignments,
        },
      ],
    });
  },
  applyOffer(offer: AppliedOffer) {
    persist({
      ...snapshot,
      appliedOffers: [...snapshot.appliedOffers, offer],
    });
  },
  removeOffer(offerSlug: string) {
    persist({
      ...snapshot,
      appliedOffers: snapshot.appliedOffers.filter(
        (o) => o.offerSlug !== offerSlug
      ),
    });
  },
};

export function useCart(): Cart {
  return useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot
  );
}

export function lineTotalCents(line: CartLine): number {
  const baseCents = Math.round(line.unitPrice * 100);
  const optionsCents = line.options.reduce(
    (s, o) => s + (o.priceCents ?? 0),
    0
  );
  return (baseCents + optionsCents) * line.quantity;
}

export function cartTotalCents(cart: Cart): number {
  return cart.lines.reduce((sum, l) => sum + lineTotalCents(l), 0);
}

export function cartItemCount(cart: Cart): number {
  return cart.lines.reduce((sum, l) => sum + l.quantity, 0);
}

export function lineDiscountCents(lineId: string, cart: Cart): number {
  for (const o of cart.appliedOffers) {
    const slot = o.slotAssignments.find((a) => a.lineId === lineId);
    if (slot) return slot.discountCents;
  }
  return 0;
}

export function offerForLine(
  lineId: string,
  cart: Cart
): AppliedOffer | null {
  return (
    cart.appliedOffers.find((o) =>
      o.slotAssignments.some((a) => a.lineId === lineId)
    ) ?? null
  );
}

export function totalOfferDiscountCents(cart: Cart): number {
  return cart.appliedOffers.reduce(
    (sum, o) =>
      sum + o.slotAssignments.reduce((s, a) => s + a.discountCents, 0),
    0
  );
}

export function cartTotalCentsWithOffers(cart: Cart): number {
  return cartTotalCents(cart) - totalOfferDiscountCents(cart);
}
