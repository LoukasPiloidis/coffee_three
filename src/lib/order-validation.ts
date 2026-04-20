import { isWithinDeliveryHours } from "./hours";
import type { ShopSettings } from "./menu-types";
import type { PlaceOrderInput } from "./orders";

export type ValidationError =
  | "closed"
  | "minOrder"
  | "outOfArea"
  | "contactRequired"
  | "phoneRequired"
  | "empty";

export function validateOrderInput(
  input: PlaceOrderInput,
  settings: ShopSettings
): ValidationError | null {
  if (input.lines.length === 0) return "empty";

  const isDelivery = input.orderType === "delivery";

  if (isDelivery) {
    if (!input.contact.phone || !input.contact.phone.trim()) {
      return "phoneRequired";
    }
  }

  if (isDelivery) {
    if (!input.contact.userId && !input.contact.email && !input.contact.phone) {
      return "contactRequired";
    }
  } else {
    if (!input.contact.name.trim()) {
      return "contactRequired";
    }
  }

  if (!isWithinDeliveryHours(settings)) {
    return "closed";
  }

  if (isDelivery) {
    const postcode = input.delivery!.postcode.trim();
    if (
      settings.allowedPostcodes.length > 0 &&
      !settings.allowedPostcodes.includes(postcode)
    ) {
      return "outOfArea";
    }
  }

  return null;
}

export function validateMinOrder(
  isDelivery: boolean,
  totalCents: number,
  settings: ShopSettings
): boolean {
  return !(isDelivery && totalCents < settings.minOrderCents);
}
