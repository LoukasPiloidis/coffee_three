"use client";

import type { Cart } from "./cart";
import { lineTotalCents } from "./cart";
import type { Offer } from "./menu-types";
import { computeSlotDiscountCents } from "./menu-types";

export type OfferSuggestion = {
  offer: Offer;
  suggestedAssignments: {
    slotIndex: number;
    lineId: string;
    discountCents: number;
  }[];
  totalSavingsCents: number;
};

/**
 * Detect which available offers can be fulfilled by the current cart lines.
 * Each offer is checked independently. Lines already assigned to an applied
 * offer are excluded. Returns suggestions sorted by savings (highest first).
 */
export function detectApplicableOffers(
  cart: Cart,
  offers: Offer[]
): OfferSuggestion[] {
  // Count how many units of each line are already locked to applied offers
  const lockedLineCounts = new Map<string, number>();
  for (const applied of cart.appliedOffers) {
    for (const assignment of applied.slotAssignments) {
      lockedLineCounts.set(
        assignment.lineId,
        (lockedLineCounts.get(assignment.lineId) ?? 0) + 1
      );
    }
  }

  // Also skip offers already applied
  const appliedSlugs = new Set(cart.appliedOffers.map((offer) => offer.offerSlug));

  const suggestions: OfferSuggestion[] = [];

  for (const offer of offers) {
    if (appliedSlugs.has(offer.slug)) continue;
    if (offer.slots.length === 0) continue;

    // Try to greedily assign cart lines to slots.
    // For each slot, find the first available line whose slug is eligible.
    // A line with quantity N can fill up to N slots (minus already-locked units).
    const lineUseCounts = new Map<string, number>(lockedLineCounts);
    const assignments: OfferSuggestion["suggestedAssignments"] = [];
    let allSlotsFilled = true;

    for (let si = 0; si < offer.slots.length; si++) {
      const slot = offer.slots[si];
      const eligibleSet = new Set(slot.eligibleItems);

      const candidate = cart.lines.find((line) => {
        if (!eligibleSet.has(line.slug)) return false;
        const used = lineUseCounts.get(line.lineId) ?? 0;
        return used < line.quantity;
      });

      if (!candidate) {
        allSlotsFilled = false;
        break;
      }

      lineUseCounts.set(
        candidate.lineId,
        (lineUseCounts.get(candidate.lineId) ?? 0) + 1
      );
      const itemPriceCents = Math.round(
        lineTotalCents(candidate) / candidate.quantity
      );
      const discountCents = computeSlotDiscountCents(slot, itemPriceCents);
      assignments.push({
        slotIndex: si,
        lineId: candidate.lineId,
        discountCents,
      });
    }

    if (allSlotsFilled) {
      const totalSavingsCents = assignments.reduce(
        (sum, assignment) => sum + assignment.discountCents,
        0
      );
      if (totalSavingsCents > 0) {
        suggestions.push({
          offer,
          suggestedAssignments: assignments,
          totalSavingsCents,
        });
      }
    }
  }

  // Sort by savings descending
  suggestions.sort((a, b) => b.totalSavingsCents - a.totalSavingsCents);
  return suggestions;
}
