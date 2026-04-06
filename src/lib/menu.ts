import "server-only";
import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "../../keystatic.config";
import type {
  MenuCategory,
  MenuItem,
  ShopSettings,
} from "./menu-types";

export type {
  Locale,
  MenuCategory,
  MenuItem,
  MenuOption,
  MenuOptionGroup,
  ShopSettings,
} from "./menu-types";
export { formatPrice } from "./menu-types";

const reader = createReader(process.cwd(), keystaticConfig);

export async function getMenu(): Promise<MenuCategory[]> {
  const [categoryEntries, itemEntries] = await Promise.all([
    reader.collections.categories.all(),
    reader.collections.items.all(),
  ]);

  const items: MenuItem[] = itemEntries.map((e) => ({
    slug: e.slug,
    title: e.entry.title,
    description: e.entry.description,
    category: e.entry.category ?? "",
    price: e.entry.price,
    image: e.entry.image,
    available: e.entry.available,
    displayOrder: e.entry.displayOrder ?? 0,
    optionGroups: (e.entry.optionGroups ?? []).map((g) => ({
      name: g.name,
      selectionType: g.selectionType,
      required: g.required,
      options: (g.options ?? []).map((o) => ({ name: o.name })),
    })),
  }));

  const categories: MenuCategory[] = categoryEntries
    .map((c) => ({
      slug: c.slug,
      title: c.entry.title,
      order: c.entry.order ?? 0,
      items: items
        .filter((i) => i.category === c.slug)
        .sort((a, b) => a.displayOrder - b.displayOrder),
    }))
    .sort((a, b) => a.order - b.order);

  return categories;
}

export async function getItem(slug: string): Promise<MenuItem | null> {
  const entry = await reader.collections.items.read(slug);
  if (!entry) return null;
  return {
    slug,
    title: entry.title,
    description: entry.description,
    category: entry.category ?? "",
    price: entry.price,
    image: entry.image,
    available: entry.available,
    displayOrder: entry.displayOrder ?? 0,
    optionGroups: (entry.optionGroups ?? []).map((g) => ({
      name: g.name,
      selectionType: g.selectionType,
      required: g.required,
      options: (g.options ?? []).map((o) => ({ name: o.name })),
    })),
  };
}

export async function getSettings(): Promise<ShopSettings> {
  const s = await reader.singletons.settings.read();
  return {
    minOrderCents: s?.minOrderCents ?? 0,
    allowedPostcodes: (s?.allowedPostcodes ?? []) as string[],
    deliveryHours: {
      mon: s?.deliveryHours?.mon ?? "",
      tue: s?.deliveryHours?.tue ?? "",
      wed: s?.deliveryHours?.wed ?? "",
      thu: s?.deliveryHours?.thu ?? "",
      fri: s?.deliveryHours?.fri ?? "",
      sat: s?.deliveryHours?.sat ?? "",
      sun: s?.deliveryHours?.sun ?? "",
    },
  };
}
