"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import ScrollPills from "@/components/ScrollPills";
import type { MenuCategory } from "@/lib/menu-types";
import {
  setItemAvailabilityAction,
  setOptionAvailabilityAction,
} from "./actions";
import styles from "./Products.module.css";

export default function ProductsList({
  categories,
}: {
  categories: MenuCategory[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // Track which row is currently saving so we can show feedback.
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
        <section key={cat.slug} data-slug={cat.slug}>
          <h2 className={styles['section-title']}>{cat.title.el}</h2>
          {cat.items.length === 0 && (
            <p className={styles['no-items']}>Κανένα προϊόν.</p>
          )}
          <ul className={styles['item-list']}>
            {cat.items.map((item) => {
              const isExpanded = expanded.has(item.slug);
              const hasOptions = item.optionGroups.length > 0;
              const itemSaving = saving === `item:${item.slug}`;
              const anyOptionDisabled = item.optionGroups.some((g) =>
                g.options.some((o) => !o.available)
              );
              return (
                <li key={item.slug} className={styles['item-card']}>
                  <div className={styles['item-header']}>
                    <div style={{ flex: 1 }}>
                      <div className={styles['item-name']}>{item.title.el}</div>
                      {anyOptionDisabled && (
                        <div className={styles['item-disabled-hint']}>
                          Κάποιες επιλογές απενεργοποιημένες
                        </div>
                      )}
                    </div>
                    {hasOptions && (
                      <button
                        type="button"
                        className="btn btn--ghost btn--small"
                        onClick={() => toggleExpanded(item.slug)}
                      >
                        {isExpanded ? "Απόκρυψη επιλογών" : "Επιλογές"}
                      </button>
                    )}
                    <label className={styles['item-availability']}>
                      <input
                        type="checkbox"
                        checked={item.available}
                        disabled={isPending}
                        onChange={(e) =>
                          toggleItem(item.slug, e.target.checked)
                        }
                      />
                      <span>
                        {item.available ? "Διαθέσιμο" : "Μη διαθέσιμο"}
                      </span>
                      {itemSaving && (
                        <span className={styles['saving-indicator']}>…</span>
                      )}
                    </label>
                  </div>

                  {isExpanded && hasOptions && (
                    <div className={styles['options-panel']}>
                      {item.optionGroups.map((g) => (
                        <div key={g.key} style={{ marginBottom: "0.75rem" }}>
                          <div className={styles['option-group-title']}>
                            {g.name.el}
                            {g.required && " *"}
                          </div>
                          <ul className={styles['option-list']}>
                            {g.options.map((o) => {
                              const id = `opt:${item.slug}:${g.key}:${o.key}`;
                              return (
                                <li key={o.key} className={styles['option-row']}>
                                  <span className={!o.available ? styles['option-name--unavailable'] : undefined}>
                                    {o.name.el}
                                  </span>
                                  <label className={styles['item-availability']}>
                                    <input
                                      type="checkbox"
                                      checked={o.available}
                                      disabled={isPending}
                                      onChange={(e) =>
                                        toggleOption(
                                          item.slug,
                                          g.key,
                                          o.key,
                                          e.target.checked
                                        )
                                      }
                                    />
                                    {saving === id && (
                                      <span className={styles['saving-indicator']}>…</span>
                                    )}
                                  </label>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
