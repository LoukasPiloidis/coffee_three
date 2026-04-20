import "server-only";
import { createReader } from "@keystatic/core/reader";
import { createGitHubReader } from "@keystatic/core/reader/github";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { itemOverrides, optionOverrides } from "@/db/schema";
import keystaticConfig from "../../keystatic.config";
import {
  mapItem,
  optionMapKey,
  transformOffer,
  type RawItem,
  type RawOffer,
  type RawOptionGroup,
} from "./menu-transform";
import type { MenuCategory, MenuItem, Offer, ShopSettings } from "./menu-types";

export type {
  Locale,
  MenuCategory,
  MenuItem,
  MenuOption,
  MenuOptionGroup,
  Offer,
  OfferSlot,
  ShopSettings,
} from "./menu-types";
export { computeSlotDiscountCents, formatPrice } from "./menu-types";

export const KEYSTATIC_CACHE_TAG = "keystatic-menu";

const githubRepo = process.env.KEYSTATIC_GITHUB_REPO as
  | `${string}/${string}`
  | undefined;
const githubToken = process.env.KEYSTATIC_GITHUB_TOKEN;
const githubRef = process.env.KEYSTATIC_GITHUB_REF || "HEAD";

const reader = githubRepo
  ? createGitHubReader(keystaticConfig, {
      repo: githubRepo,
      ref: githubRef,
      token: githubToken,
    })
  : createReader(process.cwd(), keystaticConfig);

const useRemoteCache = Boolean(githubRepo);

type OverrideMaps = {
  items: Map<string, boolean>;
  options: Map<string, boolean>;
};

async function loadOverrides(): Promise<OverrideMaps> {
  const [itemRows, optionRows] = await Promise.all([
    db.select().from(itemOverrides),
    db.select().from(optionOverrides),
  ]);
  const items = new Map<string, boolean>();
  for (const r of itemRows) items.set(r.slug, r.available);
  const options = new Map<string, boolean>();
  for (const r of optionRows) {
    options.set(optionMapKey(r.itemSlug, r.groupKey, r.optionKey), r.available);
  }
  return { items, options };
}

async function loadOptionGroupsMap(): Promise<Map<string, RawOptionGroup>> {
  const entries = await reader.collections.optionGroups.all();
  const map = new Map<string, RawOptionGroup>();
  for (const g of entries) {
    map.set(g.slug, g.entry as RawOptionGroup);
  }
  return map;
}

async function readMenu(): Promise<MenuCategory[]> {
  const [categoryEntries, itemEntries, optionGroupsMap, overrides] =
    await Promise.all([
      reader.collections.categories.all(),
      reader.collections.items.all(),
      loadOptionGroupsMap(),
      loadOverrides(),
    ]);

  const items: MenuItem[] = itemEntries.map((e) =>
    mapItem(e.slug, e.entry as RawItem, overrides, optionGroupsMap)
  );

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

async function readItem(slug: string): Promise<MenuItem | null> {
  const [entry, optionGroupsMap, overrides] = await Promise.all([
    reader.collections.items.read(slug),
    loadOptionGroupsMap(),
    loadOverrides(),
  ]);
  if (!entry) return null;
  return mapItem(slug, entry as RawItem, overrides, optionGroupsMap);
}

async function readDeliveryGuys(): Promise<string[]> {
  const entries = await reader.collections.deliveryGuys.all();
  return entries.map((e) => e.slug);
}

async function readOffers(): Promise<Offer[]> {
  const entries = await reader.collections.offers.all();
  return entries
    .map((e) => transformOffer(e.slug, e.entry as RawOffer))
    .filter((o) => o.available)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

async function readOffer(slug: string): Promise<Offer | null> {
  const entry = await reader.collections.offers.read(slug);
  if (!entry) return null;
  const o = entry as RawOffer;
  if (!o.available) return null;
  return transformOffer(slug, o);
}

async function readSettings(): Promise<ShopSettings> {
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

export const getMenu: () => Promise<MenuCategory[]> = useRemoteCache
  ? unstable_cache(readMenu, ["keystatic-menu"], {
      tags: [KEYSTATIC_CACHE_TAG],
    })
  : readMenu;

export const getItem: (slug: string) => Promise<MenuItem | null> =
  useRemoteCache
    ? unstable_cache(readItem, ["keystatic-item"], {
        tags: [KEYSTATIC_CACHE_TAG],
      })
    : readItem;

export const getDeliveryGuys: () => Promise<string[]> = useRemoteCache
  ? unstable_cache(readDeliveryGuys, ["keystatic-delivery-guys"], {
      tags: [KEYSTATIC_CACHE_TAG],
    })
  : readDeliveryGuys;

export const getOffers: () => Promise<Offer[]> = useRemoteCache
  ? unstable_cache(readOffers, ["keystatic-offers"], {
      tags: [KEYSTATIC_CACHE_TAG],
    })
  : readOffers;

export const getOffer: (slug: string) => Promise<Offer | null> = useRemoteCache
  ? unstable_cache(readOffer, ["keystatic-offer"], {
      tags: [KEYSTATIC_CACHE_TAG],
    })
  : readOffer;

export const getSettings: () => Promise<ShopSettings> = useRemoteCache
  ? unstable_cache(readSettings, ["keystatic-settings"], {
      tags: [KEYSTATIC_CACHE_TAG],
    })
  : readSettings;
