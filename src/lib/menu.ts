import "server-only";
import { createReader } from "@keystatic/core/reader";
import { createGitHubReader } from "@keystatic/core/reader/github";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { itemOverrides, optionOverrides } from "@/db/schema";
import keystaticConfig from "../../keystatic.config";
import type { MenuCategory, MenuItem, ShopSettings } from "./menu-types";

export type {
  Locale,
  MenuCategory,
  MenuItem,
  MenuOption,
  MenuOptionGroup,
  ShopSettings,
} from "./menu-types";
export { formatPrice } from "./menu-types";

/**
 * Tag used by `unstable_cache` to invalidate menu/settings reads when the
 * Keystatic Cloud webhook fires. See `src/app/api/keystatic-webhook/route.ts`.
 */
export const KEYSTATIC_CACHE_TAG = "keystatic-menu";

// In production we read content directly from GitHub via Keystatic's GitHub
// reader, so CMS edits appear without a redeploy. Locally we keep using the
// filesystem reader so edits are reflected immediately.
//
// Enabled when KEYSTATIC_GITHUB_REPO is set (format: "owner/repo"). A
// KEYSTATIC_GITHUB_TOKEN is required for private repos; public repos work
// without one but burn anonymous API quota fast.
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

// Load all availability overrides in one go. Rows only exist when staff
// have actively flipped something — absent row = fall back to Keystatic.
type OverrideMaps = {
  items: Map<string, boolean>;
  options: Map<string, boolean>; // key: `${slug}\x1f${groupKey}\x1f${optionKey}`
};

const OPTION_KEY_SEP = "\x1f";
const optionMapKey = (slug: string, groupKey: string, optionKey: string) =>
  `${slug}${OPTION_KEY_SEP}${groupKey}${OPTION_KEY_SEP}${optionKey}`;

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

type RawItem = {
  slug: string;
  title: { en: string; el: string };
  description: { en: string; el: string };
  category: string | null;
  price: number;
  image: string | null;
  available: boolean;
  displayOrder: number | null;
  // After the refactor, items store an array of slugs referencing the
  // optionGroups collection instead of inline objects.
  optionGroups: readonly (string | null)[];
};

type RawOptionGroup = {
  key: string;
  name: { en: string; el: string };
  selectionType: "single" | "multi";
  required: boolean;
  options: readonly {
    key: string;
    name: { en: string; el: string };
    available: boolean;
  }[];
};

function mapItem(
  slug: string,
  entry: RawItem,
  overrides: OverrideMaps,
  optionGroupsMap: Map<string, RawOptionGroup>
): MenuItem {
  const itemOverride = overrides.items.get(slug);

  // Resolve option group slugs to full objects, skipping nulls and
  // references to groups that no longer exist.
  const resolvedGroups = (entry.optionGroups ?? [])
    .map((ref) => (ref ? optionGroupsMap.get(ref) : undefined))
    .filter((g): g is RawOptionGroup => g != null);

  return {
    slug,
    title: entry.title,
    description: entry.description,
    category: entry.category ?? "",
    price: entry.price,
    image: entry.image,
    available: itemOverride ?? entry.available,
    displayOrder: entry.displayOrder ?? 0,
    optionGroups: resolvedGroups.map((g) => ({
      key: g.key,
      name: g.name,
      selectionType: g.selectionType,
      required: g.required,
      options: (g.options ?? []).map((o) => {
        const ovr = overrides.options.get(optionMapKey(slug, g.key, o.key));
        return {
          key: o.key,
          name: o.name,
          available: ovr ?? o.available,
        };
      }),
    })),
  };
}

async function readMenu(): Promise<MenuCategory[]> {
  const [categoryEntries, itemEntries, optionGroupEntries, overrides] =
    await Promise.all([
      reader.collections.categories.all(),
      reader.collections.items.all(),
      reader.collections.optionGroups.all(),
      loadOverrides(),
    ]);

  const optionGroupsMap = new Map<string, RawOptionGroup>();
  for (const g of optionGroupEntries) {
    optionGroupsMap.set(g.slug, g.entry as RawOptionGroup);
  }

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
  const [entry, optionGroupEntries, overrides] = await Promise.all([
    reader.collections.items.read(slug),
    reader.collections.optionGroups.all(),
    loadOverrides(),
  ]);
  if (!entry) return null;

  const optionGroupsMap = new Map<string, RawOptionGroup>();
  for (const g of optionGroupEntries) {
    optionGroupsMap.set(g.slug, g.entry as RawOptionGroup);
  }

  return mapItem(slug, entry as RawItem, overrides, optionGroupsMap);
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

// In GitHub mode, wrap reads in `unstable_cache` tagged `keystatic-menu` so
// the webhook can invalidate every cached read with a single `revalidateTag`
// call. In local fs mode we skip the cache wrapper — editing JSON on disk
// should be reflected on next request without restarting the dev server.
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

export const getSettings: () => Promise<ShopSettings> = useRemoteCache
  ? unstable_cache(readSettings, ["keystatic-settings"], {
      tags: [KEYSTATIC_CACHE_TAG],
    })
  : readSettings;
