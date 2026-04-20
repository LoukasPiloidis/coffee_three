"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./ScrollPills.module.css";

export interface ScrollPillItem {
  slug: string;
  label: string;
}

/**
 * Horizontal pill bar that scrolls the matching `data-slug` section into view
 * and highlights the currently visible section via IntersectionObserver.
 *
 * The parent must render `<section data-slug="...">` elements that correspond
 * to the `items` slugs.
 */
export default function ScrollPills({
  items,
  scrollOffset = 170,
  observerRootMargin = "-120px 0px -60% 0px",
}: {
  items: ScrollPillItem[];
  /** Pixels above the section top to stop at (accounts for sticky headers). */
  scrollOffset?: number;
  /** IntersectionObserver rootMargin for active-pill tracking. */
  observerRootMargin?: string;
}) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const slugSet = useRef(new Set(items.map((i) => i.slug)));

  // Keep slug set in sync
  useEffect(() => {
    slugSet.current = new Set(items.map((i) => i.slug));
  }, [items]);

  // Observe sections
  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("section[data-slug]")
    ).filter((el) => slugSet.current.has(el.dataset.slug!));
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSlug(entry.target.getAttribute("data-slug"));
          }
        }
      },
      { rootMargin: observerRootMargin, threshold: 0 }
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items, observerRootMargin]);

  const scrollTo = useCallback(
    (slug: string) => {
      const el = document.querySelector<HTMLElement>(
        `section[data-slug="${slug}"]`
      );
      if (!el) return;
      const y = el.getBoundingClientRect().top + window.scrollY - scrollOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    },
    [scrollOffset]
  );

  if (items.length <= 1) return null;

  return (
    <div className={styles['menu-nav__pills']}>
      {items.map((item) => (
        <button
          key={item.slug}
          type="button"
          className={`${styles['menu-nav__pill']}${
            activeSlug === item.slug ? ` ${styles['menu-nav__pill--active']}` : ""
          }`}
          onClick={() => scrollTo(item.slug)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
