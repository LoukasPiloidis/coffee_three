import { randomBytes } from "crypto";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import type { CartLine } from "./cart";
import { getSettings } from "./menu";
import { processOffers, resolveLines } from "./order-processing";
import { validateMinOrder, validateOrderInput } from "./order-validation";

// Re-export queries so existing import sites continue to work.
export {
  autoCompleteStaleOrders,
  getOrderByToken,
  getActiveStaffOrders,
  updateOrderStatus,
  assignDeliveryGuy,
  getOrdersByDeliveryGuyAndDate,
  getRecentUserOrders,
} from "./order-queries";

export type PlaceOrderInput = {
  lines: CartLine[];
  appliedOffers?: {
    offerSlug: string;
    offerTitle: { en: string; el: string };
    slotAssignments: {
      slotIndex: number;
      lineId: string;
    }[];
  }[];
  orderType: "delivery" | "takeaway";
  contact: {
    userId?: string | null;
    name: string;
    email: string | null;
    phone: string | null;
  };
  delivery?: {
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
  const settings = await getSettings();

  const validationError = validateOrderInput(input, settings);
  if (validationError) return { ok: false, error: validationError };

  const isDelivery = input.orderType === "delivery";

  // Resolve lines: re-fetch from Keystatic, validate options, compute prices
  const resolution = await resolveLines(input.lines);
  if (!resolution.ok) return resolution.error;

  const { resolved, itemsByLineIdx } = resolution;
  let totalCents = resolution.totalCents;

  // Process offers: validate, compute discounts, apply overrides
  const offerResult = await processOffers(input, resolved, itemsByLineIdx);
  if (!offerResult.ok) return offerResult.error;

  // Recompute total after offer overrides may have changed unitPriceCents
  totalCents = 0;
  for (const r of resolved) {
    totalCents += r.unitPriceCents * r.quantity;
  }
  totalCents -= offerResult.totalDiscountCents;

  if (!validateMinOrder(isDelivery, totalCents, settings)) {
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
      deliveryStreet: isDelivery ? input.delivery!.street : null,
      deliveryCity: isDelivery ? input.delivery!.city : null,
      deliveryPostcode: isDelivery ? input.delivery!.postcode.trim() : null,
      deliveryNotes: isDelivery ? input.delivery!.notes : null,
      type: input.orderType,
      paymentMethod: input.paymentMethod,
      status: "received",
      totalCents: grandTotalCents,
      offersJson: offerResult.offersJson,
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
      discountCents: offerResult.lineDiscounts.get(idx) ?? 0,
      comment: r.comment || null,
    }))
  );

  return { ok: true, token };
}
