"use server";

import { randomBytes } from "crypto";
import { and, desc, eq, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import type { CartLine } from "./cart";
import { isWithinDeliveryHours } from "./hours";
import { getItem, getSettings } from "./menu";

export type PlaceOrderInput = {
  lines: CartLine[];
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
        | "unavailable";
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
    unitPriceCents: number;
    quantity: number;
    options: CartLine["options"];
    comment: string;
  }[] = [];

  for (const line of input.lines) {
    const item = await getItem(line.slug);
    if (!item || !item.available) return { ok: false, error: "unavailable" };

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

    const unitPriceCents = Math.round(item.price * 100) + optionSurchargeCents;
    totalCents += unitPriceCents * line.quantity;
    resolved.push({
      slug: item.slug,
      title: item.title,
      unitPriceCents,
      quantity: line.quantity,
      options: snapshotOptions,
      comment: line.comment,
    });
  }

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
      tipCents,
      notes: input.notes,
    })
    .returning({ id: orders.id });

  await db.insert(orderItems).values(
    resolved.map((r) => ({
      orderId: order.id,
      menuSlug: r.slug,
      titleSnapshot: r.title,
      unitPriceCents: r.unitPriceCents,
      quantity: r.quantity,
      optionsJson: r.options,
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

export async function getRecentUserOrders(userId: string, limit = 5) {
  const recent = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
  return recent;
}
