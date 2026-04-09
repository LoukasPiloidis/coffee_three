"use server";

import { getSession } from "@/lib/session";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { placeOrder, type PlaceOrderInput, type PlaceOrderResult } from "@/lib/orders";

export async function submitOrderAction(
  input: PlaceOrderInput,
  saveAddress = false
): Promise<PlaceOrderResult> {
  const session = await getSession();
  input.contact.userId = session?.user.id ?? null;
  

  const result = await placeOrder(input);

  if (result.ok && saveAddress && session?.user?.id) {
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
