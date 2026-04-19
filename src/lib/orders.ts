"use server";

import { randomBytes } from "crypto";
import { and, desc, eq, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import type { AppliedOffer, CartLine } from "./cart";
import { isWithinDeliveryHours } from "./hours";
import { getItem, getOffer, getSettings } from "./menu";
import { applySlotOverrides, computeSlotDiscountCents } from "./menu-types";

export type PlaceOrderInput = {
  lines: CartLine[];
  appliedOffers?: AppliedOffer[];
  contact: {
    userId?: string | null;
    name: string;
    email: string | null;
    phone: string | null;
  };
  delivery: {
    street: string;
    city: string;
    postcode: string;
    notes: string | null;
  };
  paymentMethod: "cash" | "card";
  tipCents?: number;
  notes: string | null;
};

export type PlaceOrderResult =
  | { ok: true; token: string }
  | {
      ok: false;
      error:
        | "closed"
        | "minOrder"
        | "outOfArea"
        | "contactRequired"
        | "phoneRequired"
        | "empty"
        | "unavailable"
        | "offerUnavailable";
    };

export async function placeOrder(
  input: PlaceOrderInput
): Promise<PlaceOrderResult> {
  if (input.lines.length === 0) return { ok: false, error: "empty" };
  if (!input.contact.phone || !input.contact.phone.trim()) {
    return { ok: false, error: "phoneRequired" };
  }
  if (!input.contact.userId && !input.contact.email && !input.contact.phone) {
    return { ok: false, error: "contactRequired" };
  }

  const settings = await getSettings();

  if (!isWithinDeliveryHours(settings)) {
    return { ok: false, error: "closed" };
  }

  const postcode = input.delivery.postcode.trim();
  if (
    settings.allowedPostcodes.length > 0 &&
    !settings.allowedPostcodes.includes(postcode)
  ) {
    return { ok: false, error: "outOfArea" };
  }

  // Re-fetch each item from Keystatic to snapshot authoritative price/title.
  // Reject if any item is missing or unavailable.
  let totalCents = 0;
  const resolved: {
    slug: string;
    title: { en: string; el: string };
    basePriceCents: number;
    optionSurchargeCents: number;
    unitPriceCents: number;
    quantity: number;
    options: CartLine["options"];
    comment: string;
  }[] = [];
  // Keep item references for offer override validation
  const itemsByLineIdx = new Map<number, Awaited<ReturnType<typeof getItem>>>();

  for (let li = 0; li < input.lines.length; li++) {
    const line = input.lines[li];
    const item = await getItem(line.slug);
    if (!item || !item.available) return { ok: false, error: "unavailable" };
    itemsByLineIdx.set(li, item);

    // Re-validate every selected option and compute authoritative prices.
    // Staff can toggle options off between "add to cart" and checkout, so
    // we must not trust the client-side cart snapshot.
    let optionSurchargeCents = 0;
    const snapshotOptions: CartLine["options"] = [];
    for (const selected of line.options) {
      const group = item.optionGroups.find((g) => g.key === selected.groupKey);
      const option = group?.options.find((o) => o.key === selected.optionKey);
      if (!option || !option.available) {
        return { ok: false, error: "unavailable" };
      }
      optionSurchargeCents += option.priceCents;
      snapshotOptions.push({
        ...selected,
        priceCents: option.priceCents,
      });
    }

    const basePriceCents = Math.round(item.price * 100);
    const unitPriceCents = basePriceCents + optionSurchargeCents;
    totalCents += unitPriceCents * line.quantity;
    resolved.push({
      slug: item.slug,
      title: item.title,
      basePriceCents,
      optionSurchargeCents,
      unitPriceCents,
      quantity: line.quantity,
      options: snapshotOptions,
      comment: line.comment,
    });
  }

  // Validate and compute authoritative offer discounts server-side.
  // Build a map of lineIndex → discountCents and an offersJson snapshot.
  const lineDiscounts = new Map<number, number>();
  type OfferSnapshot = {
    offerSlug: string;
    offerTitle: { en: string; el: string };
    slots: {
      menuSlug: string;
      slotLabel: { en: string; el: string };
      discountCents: number;
    }[];
  };
  const offersJsonData: OfferSnapshot[] = [];

  if (input.appliedOffers && input.appliedOffers.length > 0) {
    for (const ao of input.appliedOffers) {
      const offer = await getOffer(ao.offerSlug);
      if (!offer) return { ok: false, error: "offerUnavailable" };

      const snapshotSlots: OfferSnapshot["slots"] = [];
      for (const assignment of ao.slotAssignments) {
        const slot = offer.slots[assignment.slotIndex];
        if (!slot) return { ok: false, error: "offerUnavailable" };

        // Find the matching line by lineId
        const lineIdx = input.lines.findIndex(
          (l) => l.lineId === assignment.lineId
        );
        if (lineIdx < 0) return { ok: false, error: "offerUnavailable" };

        const r = resolved[lineIdx];
        if (!r) return { ok: false, error: "offerUnavailable" };

        // Verify eligibility
        if (!slot.eligibleItems.includes(r.slug)) {
          return { ok: false, error: "offerUnavailable" };
        }

        // Apply option group overrides (e.g. excludePrice) for this slot
        if (slot.optionGroupOverrides.length > 0) {
          const item = itemsByLineIdx.get(lineIdx)!;
          const overriddenGroups = applySlotOverrides(
            item.optionGroups,
            slot.optionGroupOverrides
          );
          let correctedSurcharge = 0;
          const correctedOptions: CartLine["options"] = [];
          for (const selected of input.lines[lineIdx].options) {
            const group = overriddenGroups.find(
              (g) => g.key === selected.groupKey
            );
            const option = group?.options.find(
              (o) => o.key === selected.optionKey
            );
            if (!option || !option.available) {
              return { ok: false, error: "unavailable" };
            }
            correctedSurcharge += option.priceCents;
            correctedOptions.push({ ...selected, priceCents: option.priceCents });
          }
          const oldUnit = r.unitPriceCents;
          r.optionSurchargeCents = correctedSurcharge;
          r.unitPriceCents = r.basePriceCents + correctedSurcharge;
          r.options = correctedOptions;
          totalCents += (r.unitPriceCents - oldUnit) * r.quantity;
        }

        // Compute authoritative discount from server-side item price
        const discountCents = computeSlotDiscountCents(
          slot,
          r.unitPriceCents
        );
        lineDiscounts.set(lineIdx, discountCents);
        snapshotSlots.push({
          menuSlug: r.slug,
          slotLabel: slot.label,
          discountCents,
        });
      }
      offersJsonData.push({
        offerSlug: ao.offerSlug,
        offerTitle: offer.title,
        slots: snapshotSlots,
      });
    }
  }

  // Subtract offer discounts from total
  let totalDiscountCents = 0;
  for (const d of lineDiscounts.values()) {
    totalDiscountCents += d;
  }
  totalCents -= totalDiscountCents;

  if (totalCents < settings.minOrderCents) {
    return { ok: false, error: "minOrder" };
  }

  const tipCents =
    input.tipCents && Number.isFinite(input.tipCents) && input.tipCents > 0
      ? Math.round(input.tipCents)
      : 0;
  const grandTotalCents = totalCents + tipCents;

  const token = randomBytes(16).toString("base64url");

  const [order] = await db
    .insert(orders)
    .values({
      publicToken: token,
      userId: input.contact.userId ?? null,
      guestName: input.contact.name,
      guestEmail: input.contact.email,
      guestPhone: input.contact.phone,
      deliveryStreet: input.delivery.street,
      deliveryCity: input.delivery.city,
      deliveryPostcode: postcode,
      deliveryNotes: input.delivery.notes,
      type: "delivery",
      paymentMethod: input.paymentMethod,
      status: "received",
      totalCents: grandTotalCents,
      offersJson: offersJsonData,
      tipCents,
      notes: input.notes,
    })
    .returning({ id: orders.id });

  await db.insert(orderItems).values(
    resolved.map((r, idx) => ({
      orderId: order.id,
      menuSlug: r.slug,
      titleSnapshot: r.title,
      unitPriceCents: r.unitPriceCents,
      quantity: r.quantity,
      optionsJson: r.options,
      discountCents: lineDiscounts.get(idx) ?? 0,
      comment: r.comment || null,
    }))
  );

  return { ok: true, token };
}

// Orders auto-complete one hour after they are placed. Both the staff list
// endpoint and the public order status endpoint call this before reading,
// so it runs lazily without a cron job. Cancelled orders are untouched.
export async function autoCompleteStaleOrders() {
  await db
    .update(orders)
    .set({ status: "completed", updatedAt: new Date() })
    .where(
      and(
        inArray(orders.status, ["received", "preparing", "on_its_way"]),
        lt(orders.createdAt, sql`now() - interval '1 hour'`)
      )
    );
}

export async function getOrderByToken(token: string) {
  await autoCompleteStaleOrders();
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.publicToken, token))
    .limit(1);
  if (!order) return null;
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));
  return { order, items };
}

export async function getActiveStaffOrders() {
  return db
    .select()
    .from(orders)
    .where(
      and(
        // Exclude terminal statuses
        // We can't negate enum easily in Drizzle short form; use sql template:
        // but for simplicity, fetch all non-completed/cancelled client-side.
        eq(orders.type, "delivery")
      )
    )
    .orderBy(desc(orders.createdAt))
    .limit(100);
}

export async function updateOrderStatus(
  orderId: string,
  status: "received" | "preparing" | "on_its_way" | "completed" | "cancelled"
) {
  await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, orderId));
}

export async function assignDeliveryGuy(
  orderId: string,
  deliveryGuy: string | null
) {
  await db
    .update(orders)
    .set({ deliveryGuy, updatedAt: new Date() })
    .where(eq(orders.id, orderId));
}

export async function getOrdersByDeliveryGuyAndDate(
  deliveryGuy: string,
  date: string // YYYY-MM-DD
) {
  const startOfDay = new Date(`${date}T00:00:00`);
  const endOfDay = new Date(`${date}T23:59:59.999`);

  return db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.deliveryGuy, deliveryGuy),
        sql`${orders.createdAt} >= ${startOfDay}`,
        sql`${orders.createdAt} <= ${endOfDay}`
      )
    )
    .orderBy(desc(orders.createdAt));
}

export async function getRecentUserOrders(userId: string, limit = 5) {
  const recent = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
  return recent;
}
