import type { MenuItem, Offer } from "./menu-types";

type OverrideMaps = {
  items: Map<string, boolean>;
  options: Map<string, boolean>;
};

const OPTION_KEY_SEP = "\x1f";
export const optionMapKey = (slug: string, groupKey: string, optionKey: string) =>
  `${slug}${OPTION_KEY_SEP}${groupKey}${OPTION_KEY_SEP}${optionKey}`;

export type RawItem = {
  slug: string;
  title: { en: string; el: string };
  description: { en: string; el: string };
  category: string | null;
  price: number;
  image: string | null;
  available: boolean;
  displayOrder: number | null;
  optionGroups: readonly (string | null)[];
};

export type RawOptionGroup = {
  key: string;
  name: { en: string; el: string };
  selectionType: "single" | "multi";
  required: boolean;
  defaultOptionKey: string | null;
  options: readonly {
    key: string;
    name: { en: string; el: string };
    priceCents: number | null;
    available: boolean;
  }[];
};

export type RawOffer = {
  slug: string;
  available: boolean;
  title: { en: string; el: string };
  description: { en: string; el: string };
  displayOrder: number | null;
  slots: readonly {
    label: { en: string; el: string };
    eligibleItems: readonly (string | null)[];
    discountType: "none" | "percentage" | "fixed_cents";
    discountValue: number | null;
    optionGroupOverrides?: readonly {
      optionGroup: string | null;
      excludePrice: boolean;
      allowedOptionKeys: readonly string[];
    }[];
  }[];
};

export function mapItem(
  slug: string,
  entry: RawItem,
  overrides: OverrideMaps,
  optionGroupsMap: Map<string, RawOptionGroup>
): MenuItem {
  const itemOverride = overrides.items.get(slug);

  const resolvedGroups = (entry.optionGroups ?? [])
    .map((ref) => (ref ? optionGroupsMap.get(ref) : undefined))
    .filter((group): group is RawOptionGroup => group != null);

  return {
    slug,
    title: entry.title,
    description: entry.description,
    category: entry.category ?? "",
    price: entry.price,
    image: entry.image,
    available: itemOverride ?? entry.available,
    displayOrder: entry.displayOrder ?? 0,
    optionGroups: resolvedGroups.map((group) => ({
      key: group.key,
      name: group.name,
      selectionType: group.selectionType,
      required: group.required,
      defaultOptionKey: group.defaultOptionKey ?? null,
      options: (group.options ?? []).map((opt) => {
        const ovr = overrides.options.get(optionMapKey(slug, group.key, opt.key));
        return {
          key: opt.key,
          name: opt.name,
          priceCents: opt.priceCents ?? 0,
          available: ovr ?? opt.available,
        };
      }),
    })),
  };
}

export function transformOffer(slug: string, raw: RawOffer): Offer {
  return {
    slug,
    title: raw.title,
    description: raw.description,
    available: raw.available,
    displayOrder: raw.displayOrder ?? 0,
    slots: (raw.slots ?? []).map((slot) => ({
      label: slot.label,
      eligibleItems: (slot.eligibleItems ?? []).filter(
        (item): item is string => item != null
      ),
      discountType: slot.discountType,
      discountValue: slot.discountValue ?? 0,
      optionGroupOverrides: (slot.optionGroupOverrides ?? [])
        .filter((og) => og.optionGroup != null)
        .map((og) => ({
          optionGroup: og.optionGroup!,
          excludePrice: og.excludePrice,
          allowedOptionKeys: [...(og.allowedOptionKeys ?? [])],
        })),
    })),
  };
}
