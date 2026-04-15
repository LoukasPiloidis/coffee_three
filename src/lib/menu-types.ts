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
  return `${name} (+${formatPrice(priceCents / 100, locale)})`;
}
