"use server";

import { auth } from "@/auth";
import { placeOrder, type PlaceOrderInput, type PlaceOrderResult } from "@/lib/orders";

export async function submitOrderAction(
  input: PlaceOrderInput
): Promise<PlaceOrderResult> {
  const session = await auth();
  if (session?.user?.id) {
    input.contact.userId = session.user.id;
    if (session.user.email) input.contact.email = session.user.email;
    if (session.user.name) input.contact.name = session.user.name;
  } else {
    input.contact.userId = null;
  }
  return placeOrder(input);
}
