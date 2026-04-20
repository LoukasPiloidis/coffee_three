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
    listeners.forEach((listener) => listener());
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
  listeners.forEach((listener) => listener());
}

// Sync across tabs
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      snapshot = readCart();
      listeners.forEach((listener) => listener());
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
    // Remove any offer whose slot assignments for this line exceed the new qty
    const appliedOffers = snapshot.appliedOffers.filter((offer) => {
      const count = offer.slotAssignments.filter(
        (assignment) => assignment.lineId === lineId
      ).length;
      return count <= qty;
    });
    persist({
      ...snapshot,
      lines: snapshot.lines.map((line) =>
        line.lineId === lineId ? { ...line, quantity: qty } : line
      ),
      appliedOffers,
    });
  },
  removeLine(lineId: string) {
    // Also remove any offer that references this line
    const appliedOffers = snapshot.appliedOffers.filter(
      (offer) => !offer.slotAssignments.some((assignment) => assignment.lineId === lineId)
    );
    persist({
      lines: snapshot.lines.filter((line) => line.lineId !== lineId),
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
        (offer) => offer.offerSlug !== offerSlug
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
    (sum, opt) => sum + (opt.priceCents ?? 0),
    0
  );
  return (baseCents + optionsCents) * line.quantity;
}

export function cartTotalCents(cart: Cart): number {
  return cart.lines.reduce((sum, line) => sum + lineTotalCents(line), 0);
}

export function cartItemCount(cart: Cart): number {
  return cart.lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function lineDiscountCents(lineId: string, cart: Cart): number {
  let total = 0;
  for (const offer of cart.appliedOffers) {
    for (const assignment of offer.slotAssignments) {
      if (assignment.lineId === lineId) total += assignment.discountCents;
    }
  }
  return total;
}

export function offerForLine(
  lineId: string,
  cart: Cart
): AppliedOffer | null {
  return (
    cart.appliedOffers.find((offer) =>
      offer.slotAssignments.some((assignment) => assignment.lineId === lineId)
    ) ?? null
  );
}

export function totalOfferDiscountCents(cart: Cart): number {
  return cart.appliedOffers.reduce(
    (sum, offer) =>
      sum + offer.slotAssignments.reduce((acc, assignment) => acc + assignment.discountCents, 0),
    0
  );
}

export function cartTotalCentsWithOffers(cart: Cart): number {
  return cartTotalCents(cart) - totalOfferDiscountCents(cart);
}
