import "server-only";
import { createReader } from "@keystatic/core/reader";
import { createGitHubReader } from "@keystatic/core/reader/github";
import { unstable_cache } from "next/cache";
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

async function readMenu(): Promise<MenuCategory[]> {
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

async function readItem(slug: string): Promise<MenuItem | null> {
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
