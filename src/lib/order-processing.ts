import type { CartLine } from "./cart";
import { getItem, getOffer } from "./menu";
import { applySlotOverrides, computeSlotDiscountCents } from "./menu-types";
import type { PlaceOrderInput, PlaceOrderResult } from "./orders";

export type ResolvedLine = {
  slug: string;
  title: { en: string; el: string };
  basePriceCents: number;
  optionSurchargeCents: number;
  unitPriceCents: number;
  quantity: number;
  options: CartLine["options"];
  comment: string;
};

export type OfferSnapshot = {
  offerSlug: string;
  offerTitle: { en: string; el: string };
  slots: {
    menuSlug: string;
    slotLabel: { en: string; el: string };
    discountCents: number;
  }[];
};

export type ResolutionResult =
  | {
      ok: true;
      resolved: ResolvedLine[];
      totalCents: number;
      itemsByLineIdx: Map<number, Awaited<ReturnType<typeof getItem>>>;
    }
  | { ok: false; error: PlaceOrderResult & { ok: false } };

/**
 * Re-fetch each item from Keystatic to snapshot authoritative price/title.
 * Reject if any item is missing or unavailable.
 */
export async function resolveLines(
  lines: CartLine[]
): Promise<ResolutionResult> {
  let totalCents = 0;
  const resolved: ResolvedLine[] = [];
  const itemsByLineIdx = new Map<number, Awaited<ReturnType<typeof getItem>>>();

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const item = await getItem(line.slug);
    if (!item || !item.available)
      return { ok: false, error: { ok: false, error: "unavailable" } };
    itemsByLineIdx.set(li, item);

    let optionSurchargeCents = 0;
    const snapshotOptions: CartLine["options"] = [];
    for (const selected of line.options) {
      const group = item.optionGroups.find((g) => g.key === selected.groupKey);
      const option = group?.options.find((o) => o.key === selected.optionKey);
      if (!option || !option.available) {
        return { ok: false, error: { ok: false, error: "unavailable" } };
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

  return { ok: true, resolved, totalCents, itemsByLineIdx };
}

export type OfferProcessingResult =
  | {
      ok: true;
      lineDiscounts: Map<number, number>;
      offersJson: OfferSnapshot[];
      totalDiscountCents: number;
    }
  | { ok: false; error: PlaceOrderResult & { ok: false } };

/**
 * Validate and compute authoritative offer discounts server-side.
 */
export async function processOffers(
  input: PlaceOrderInput,
  resolved: ResolvedLine[],
  itemsByLineIdx: Map<number, Awaited<ReturnType<typeof getItem>>>
): Promise<OfferProcessingResult> {
  const lineDiscounts = new Map<number, number>();
  const offersJson: OfferSnapshot[] = [];

  if (!input.appliedOffers || input.appliedOffers.length === 0) {
    return { ok: true, lineDiscounts, offersJson, totalDiscountCents: 0 };
  }

  for (const ao of input.appliedOffers) {
    const offer = await getOffer(ao.offerSlug);
    if (!offer) return { ok: false, error: { ok: false, error: "offerUnavailable" } };

    const snapshotSlots: OfferSnapshot["slots"] = [];
    for (const assignment of ao.slotAssignments) {
      const slot = offer.slots[assignment.slotIndex];
      if (!slot) return { ok: false, error: { ok: false, error: "offerUnavailable" } };

      const lineIdx = input.lines.findIndex(
        (l) => l.lineId === assignment.lineId
      );
      if (lineIdx < 0) return { ok: false, error: { ok: false, error: "offerUnavailable" } };

      const r = resolved[lineIdx];
      if (!r) return { ok: false, error: { ok: false, error: "offerUnavailable" } };

      if (!slot.eligibleItems.includes(r.slug)) {
        return { ok: false, error: { ok: false, error: "offerUnavailable" } };
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
            return { ok: false, error: { ok: false, error: "unavailable" } };
          }
          correctedSurcharge += option.priceCents;
          correctedOptions.push({ ...selected, priceCents: option.priceCents });
        }
        r.optionSurchargeCents = correctedSurcharge;
        r.unitPriceCents = r.basePriceCents + correctedSurcharge;
        r.options = correctedOptions;
      }

      const discountCents = computeSlotDiscountCents(slot, r.unitPriceCents);
      lineDiscounts.set(lineIdx, discountCents);
      snapshotSlots.push({
        menuSlug: r.slug,
        slotLabel: slot.label,
        discountCents,
      });
    }
    offersJson.push({
      offerSlug: ao.offerSlug,
      offerTitle: offer.title,
      slots: snapshotSlots,
    });
  }

  let totalDiscountCents = 0;
  for (const d of lineDiscounts.values()) {
    totalDiscountCents += d;
  }

  return { ok: true, lineDiscounts, offersJson, totalDiscountCents };
}
