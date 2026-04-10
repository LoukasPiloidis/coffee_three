"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "@/i18n/navigation";
import type { MenuCategory, Locale } from "@/lib/menu-types";
import { formatPrice } from "@/lib/menu-types";

export default function MenuList({
  categories,
  locale,
  translations,
}: {
  categories: MenuCategory[];
  locale: Locale;
  translations: { unavailable: string; search: string };
}) {
  const [query, setQuery] = useState("");
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
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

  // Track which category is in view
  useEffect(() => {
    const sections = Array.from(sectionRefs.current.values());
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSlug(entry.target.getAttribute("data-slug"));
          }
        }
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: 0 }
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [filtered]);

  const scrollTo = useCallback((slug: string) => {
    const el = sectionRefs.current.get(slug);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 120;
    window.scrollTo({ top: y, behavior: "smooth" });
  }, []);

  const setRef = useCallback((slug: string, el: HTMLElement | null) => {
    if (el) sectionRefs.current.set(slug, el);
    else sectionRefs.current.delete(slug);
  }, []);

  return (
    <>
      <div className="menu-nav">
        <input
          type="search"
          className="search-bar"
          placeholder={translations.search}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {!q && filtered.length > 1 && (
          <div className="menu-nav__pills">
            {filtered.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                className={`menu-nav__pill${
                  activeSlug === cat.slug ? " menu-nav__pill--active" : ""
                }`}
                onClick={() => scrollTo(cat.slug)}
              >
                {cat.title[locale]}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 && (
        <p className="empty">{translations.unavailable}</p>
      )}

      {filtered.map((cat) => (
        <section
          key={cat.slug}
          className="category"
          data-slug={cat.slug}
          ref={(el) => setRef(cat.slug, el)}
        >
          <h2 className="category__title">{cat.title[locale]}</h2>
          <div>
            {cat.items.map((item) => {
              const inner = (
                <>
                  <div className="item-row__main">
                    <div className="item-row__title">{item.title[locale]}</div>
                    {item.description[locale] && (
                      <div className="item-row__desc">
                        {item.description[locale]}
                      </div>
                    )}
                    {!item.available && (
                      <div className="item-row__unavailable">
                        {translations.unavailable}
                      </div>
                    )}
                  </div>
                  <div className="item-row__right">
                    <span className="item-row__price">
                      {formatPrice(item.price, locale)}
                    </span>
                    {item.available && (
                      <span className="item-row__add" aria-hidden="true">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </span>
                    )}
                  </div>
                </>
              );
              return item.available ? (
                <Link
                  key={item.slug}
                  href={`/item/${item.slug}`}
                  className="item-row"
                >
                  {inner}
                </Link>
              ) : (
                <div
                  key={item.slug}
                  className="item-row item-row--disabled"
                  aria-disabled="true"
                >
                  {inner}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
