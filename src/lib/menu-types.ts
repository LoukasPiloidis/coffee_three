export type Locale = "en" | "el";

export type MenuOption = {
  key: string;
  name: { en: string; el: string };
  priceCents: number;
  available: boolean;
};

export type MenuOptionGroup = {
  key: string;
  name: { en: string; el: string };
  selectionType: "single" | "multi";
  required: boolean;
  defaultOptionKey: string | null;
  options: MenuOption[];
};

export type MenuItem = {
  slug: string;
  title: { en: string; el: string };
  description: { en: string; el: string };
  category: string;
  price: number;
  image: string | null;
  available: boolean;
  displayOrder: number;
  optionGroups: MenuOptionGroup[];
};

export type MenuCategory = {
  slug: string;
  title: { en: string; el: string };
  order: number;
  items: MenuItem[];
};

export type ShopSettings = {
  minOrderCents: number;
  allowedPostcodes: string[];
  deliveryHours: {
    mon: string;
    tue: string;
    wed: string;
    thu: string;
    fri: string;
    sat: string;
    sun: string;
  };
};

export type SlotOptionGroupOverride = {
  optionGroup: string;
  excludePrice: boolean;
  allowedOptionKeys: string[];
};

export type OfferSlot = {
  label: { en: string; el: string };
  eligibleItems: string[];
  discountType: "none" | "percentage" | "fixed_cents";
  discountValue: number;
  optionGroupOverrides: SlotOptionGroupOverride[];
};

export type Offer = {
  slug: string;
  title: { en: string; el: string };
  description: { en: string; el: string };
  available: boolean;
  displayOrder: number;
  slots: OfferSlot[];
};

/** Compute the discount in cents for a single slot given the item's full price. */
export function computeSlotDiscountCents(
  slot: OfferSlot,
  itemPriceCents: number
): number {
  if (slot.discountType === "none") return 0;
  if (slot.discountType === "percentage")
    return Math.round((itemPriceCents * slot.discountValue) / 100);
  if (slot.discountType === "fixed_cents")
    return Math.min(slot.discountValue, itemPriceCents);
  return 0;
}

export function formatPrice(price: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "el" ? "el-GR" : "en-US", {
    style: "currency",
    currency: "EUR",
  }).format(price);
}

/** Format an option label, appending "(+€0.30)" when priceCents > 0. */
export function formatOptionLabel(
  name: string,
  priceCents: number | undefined,
  locale: Locale
): string {
  if (!priceCents) return name;
  return `${name} + ${formatPrice(priceCents / 100, locale)}`;
}

/**
 * Apply slot-level option group overrides to an item's option groups.
 * Groups not mentioned in overrides pass through unchanged.
 */
export function applySlotOverrides(
  groups: MenuOptionGroup[],
  overrides: SlotOptionGroupOverride[]
): MenuOptionGroup[] {
  if (overrides.length === 0) return groups;

  const overrideMap = new Map(overrides.map((o) => [o.optionGroup, o]));

  return groups.map((g) => {
    const override = overrideMap.get(g.key);
    if (!override) return g;

    let options = g.options;

    if (override.allowedOptionKeys.length > 0) {
      options = options.filter((o) =>
        override.allowedOptionKeys.includes(o.key)
      );
    }

    if (override.excludePrice) {
      options = options.map((o) => ({ ...o, priceCents: 0 }));
    }

    return { ...g, options };
  });
}
