"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import ScrollPills from "@/components/ScrollPills";
import type { MenuCategory } from "@/lib/menu-types";
import {
  setItemAvailabilityAction,
  setOptionAvailabilityAction,
} from "./actions";
import { CategorySection } from "./CategorySection";
import styles from "./Products.module.css";

export default function ProductsList({
  categories,
}: {
  categories: MenuCategory[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const toggleExpanded = (slug: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const toggleItem = (slug: string, next: boolean) => {
    setSaving(`item:${slug}`);
    startTransition(async () => {
      await setItemAvailabilityAction(slug, next);
      router.refresh();
      setSaving(null);
    });
  };

  const toggleOption = (
    itemSlug: string,
    groupKey: string,
    optionKey: string,
    next: boolean
  ) => {
    const id = `opt:${itemSlug}:${groupKey}:${optionKey}`;
    setSaving(id);
    startTransition(async () => {
      await setOptionAvailabilityAction(itemSlug, groupKey, optionKey, next);
      router.refresh();
      setSaving(null);
    });
  };

  const q = query.toLowerCase().trim();
  const filtered = q
    ? categories
        .map((cat) => ({
          ...cat,
          items: cat.items.filter(
            (item) =>
              item.title.en.toLowerCase().includes(q) ||
              item.title.el.toLowerCase().includes(q)
          ),
        }))
        .filter((cat) => cat.items.length > 0)
    : categories;

  return (
    <div className="stack-md">
      <div className={styles['search-wrapper']}>
        <input
          type="search"
          className={styles['search-bar']}
          placeholder="Αναζήτηση προϊόντων…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {!q && (
          <ScrollPills
            items={filtered.map((cat) => ({
              slug: cat.slug,
              label: cat.title.el,
            }))}
            scrollOffset={100}
            observerRootMargin="-80px 0px -60% 0px"
          />
        )}
      </div>
      {filtered.map((cat) => (
        <CategorySection
          key={cat.slug}
          category={cat}
          expanded={expanded}
          saving={saving}
          isPending={isPending}
          onToggleExpanded={toggleExpanded}
          onToggleItem={toggleItem}
          onToggleOption={toggleOption}
        />
      ))}
    </div>
  );
}
