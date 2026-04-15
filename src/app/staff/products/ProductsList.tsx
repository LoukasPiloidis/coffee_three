"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import ScrollPills from "@/components/ScrollPills";
import type { MenuCategory } from "@/lib/menu-types";
import {
  setItemAvailabilityAction,
  setOptionAvailabilityAction,
} from "./actions";

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
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 15,
          background: "var(--bg)",
          paddingBlock: "0.75rem",
        }}
      >
        <input
          type="search"
          className="search-bar"
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
          <h2 style={{ marginBottom: "0.5rem" }}>{cat.title.el}</h2>
          {cat.items.length === 0 && (
            <p style={{ color: "var(--text-muted)" }}>Κανένα προϊόν.</p>
          )}
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {cat.items.map((item) => {
              const isExpanded = expanded.has(item.slug);
              const hasOptions = item.optionGroups.length > 0;
              const itemSaving = saving === `item:${item.slug}`;
              const anyOptionDisabled = item.optionGroups.some((g) =>
                g.options.some((o) => !o.available)
              );
              return (
                <li
                  key={item.slug}
                  style={{
                    border: "1px solid var(--color-cream-300)",
                    borderRadius: "var(--radius-md)",
                    padding: "0.75rem 1rem",
                    background: "var(--color-cream-50)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "1rem",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{item.title.el}</div>
                      {anyOptionDisabled && (
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--text-muted)",
                          }}
                        >
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
                    <label
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                      }}
                    >
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
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          …
                        </span>
                      )}
                    </label>
                  </div>

                  {isExpanded && hasOptions && (
                    <div
                      style={{
                        marginTop: "0.75rem",
                        paddingTop: "0.75rem",
                        borderTop: "1px solid var(--color-cream-300)",
                      }}
                    >
                      {item.optionGroups.map((g) => (
                        <div key={g.key} style={{ marginBottom: "0.75rem" }}>
                          <div
                            style={{
                              fontSize: "0.85rem",
                              fontWeight: 600,
                              color: "var(--text-muted)",
                              marginBottom: "0.25rem",
                            }}
                          >
                            {g.name.el}
                            {g.required && " *"}
                          </div>
                          <ul
                            style={{
                              listStyle: "none",
                              padding: 0,
                              margin: 0,
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.25rem",
                            }}
                          >
                            {g.options.map((o) => {
                              const id = `opt:${item.slug}:${g.key}:${o.key}`;
                              return (
                                <li
                                  key={o.key}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "0.25rem 0.5rem",
                                  }}
                                >
                                  <span
                                    style={{
                                      opacity: o.available ? 1 : 0.5,
                                      textDecoration: o.available
                                        ? "none"
                                        : "line-through",
                                    }}
                                  >
                                    {o.name.el}
                                  </span>
                                  <label
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "0.4rem",
                                    }}
                                  >
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
                                      <span
                                        style={{
                                          fontSize: "0.75rem",
                                          color: "var(--text-muted)",
                                        }}
                                      >
                                        …
                                      </span>
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
