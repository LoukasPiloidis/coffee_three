"use server";

import { db } from "@/db";
import { addresses } from "@/db/schema";
import {
  type PlaceOrderInput,
  type PlaceOrderResult,
  placeOrder,
} from "@/lib/orders";
import { getSession } from "@/lib/session";

export async function submitOrderAction(
  input: PlaceOrderInput,
  saveAddress = false
): Promise<PlaceOrderResult> {
  const session = await getSession();
  input.contact.userId = session?.user.id ?? null;

  const result = await placeOrder(input);

  if (
    result.ok &&
    saveAddress &&
    session?.user?.id &&
    input.orderType === "delivery" &&
    input.delivery
  ) {
    await db.insert(addresses).values({
      userId: session.user.id,
      label: null,
      street: input.delivery.street,
      city: input.delivery.city,
      postcode: input.delivery.postcode,
      notes: input.delivery.notes,
    });
  }

  return result;
}
