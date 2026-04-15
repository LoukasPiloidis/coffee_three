"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { AccordionControlled } from "@/components/Accordion";
import { useRouter } from "@/i18n/navigation";
import { type CartLineOption, cartStore } from "@/lib/cart";
import {
  formatOptionLabel,
  formatPrice,
  type Locale,
  type MenuItem,
} from "@/lib/menu-types";

type Selections = Record<string, string[]>; // groupIndex → selected option indices as strings

export default function ItemForm({
  item,
  locale,
}: {
  item: MenuItem;
  locale: Locale;
}) {
  const t = useTranslations("item");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [comment, setComment] = useState("");
  const [selections, setSelections] = useState<Selections>(() => {
    const init: Selections = {};
    item.optionGroups.forEach((g, gi) => {
      if (g.defaultOptionKey) {
        const idx = g.options.findIndex(
          (o) => o.key === g.defaultOptionKey && o.available
        );
        if (idx >= 0) init[gi] = [String(idx)];
      }
    });
    return init;
  });
  const [error, setError] = useState<string | null>(null);
  const hasOptions = item.optionGroups.length > 0;
  const firstUnfilledRequiredIdx = item.optionGroups.findIndex(
    (g, gi) => g.required && !selections[gi]?.length
  );
  const firstRequiredIdx = item.optionGroups.findIndex((g) => g.required);
  const [openGroup, setOpenGroup] = useState<number | null>(
    hasOptions
      ? firstUnfilledRequiredIdx >= 0
        ? firstUnfilledRequiredIdx
        : firstRequiredIdx >= 0
          ? firstRequiredIdx
          : 0
      : null
  );

  const selectedSummary = (gi: number) => {
    const sel = selections[gi] ?? [];
    if (sel.length === 0) return null;
    const g = item.optionGroups[gi];
    return sel
      .map((oi) => {
        const o = g.options[Number(oi)];
        if (!o) return null;
        return formatOptionLabel(o.name[locale], o.priceCents, locale);
      })
      .filter(Boolean)
      .join(", ");
  };

  const toggle = (
    groupIdx: number,
    optIdx: string,
    mode: "single" | "multi"
  ) => {
    setSelections((prev) => {
      const cur = prev[groupIdx] ?? [];
      if (mode === "single") return { ...prev, [groupIdx]: [optIdx] };
      return {
        ...prev,
        [groupIdx]: cur.includes(optIdx)
          ? cur.filter((x) => x !== optIdx)
          : [...cur, optIdx],
      };
    });

    // Auto-advance: on single-select, skip optional groups, open next required unfilled
    if (mode === "single") {
      const nextIdx = item.optionGroups.findIndex(
        (g, i) =>
          i > groupIdx && g.required && (selections[i]?.length ?? 0) === 0
      );
      setOpenGroup(nextIdx >= 0 ? nextIdx : null);
    }
  };

  const handleAdd = () => {
    for (let i = 0; i < item.optionGroups.length; i++) {
      const g = item.optionGroups[i];
      if (g.required && !(selections[i]?.length > 0)) {
        setError(`${g.name[locale]}: ${t("required")}`);
        setOpenGroup(i);
        return;
      }
    }
    setError(null);
    const options: CartLineOption[] = [];
    item.optionGroups.forEach((g, gi) => {
      (selections[gi] ?? []).forEach((oi) => {
        const opt = g.options[Number(oi)];
        if (opt && opt.available) {
          options.push({
            groupKey: g.key,
            optionKey: opt.key,
            groupName: g.name,
            optionName: opt.name,
            priceCents: opt.priceCents,
          });
        }
      });
    });
    cartStore.addLine({
      slug: item.slug,
      title: item.title,
      unitPrice: item.price,
      quantity,
      options,
      comment,
    });
    router.push("/cart");
  };

  const accordionItems = item.optionGroups.map((g, gi) => {
    const hasAnyAvailable = g.options.some((o) => o.available);
    return {
      key: g.key,
      summary: selectedSummary(gi),
      title: (
        <span className="option-accordion__title">
          {g.name[locale]}
          {g.required && <span className="option-group__required">*</span>}
        </span>
      ),
      content: (
        <>
          <div className="option-list">
            {g.options.map((o, oi) => {
              const name = `group-${gi}`;
              const value = String(oi);
              const checked = selections[gi]?.includes(value) ?? false;
              const disabled = !o.available;
              return (
                <label
                  key={oi}
                  style={
                    disabled
                      ? { opacity: 0.45, textDecoration: "line-through" }
                      : undefined
                  }
                >
                  <input
                    type={g.selectionType === "single" ? "radio" : "checkbox"}
                    name={name}
                    value={value}
                    checked={checked && !disabled}
                    disabled={disabled}
                    onChange={() => toggle(gi, value, g.selectionType)}
                  />
                  {o.name[locale]}
                  {o.priceCents > 0 && (
                    <span className="option-price">
                      +{formatPrice(o.priceCents / 100, locale)}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
          {g.required && !hasAnyAvailable && (
            <div
              className="notice notice--error"
              style={{ marginTop: "0.5rem" }}
            >
              {t("allOptionsUnavailable")}
            </div>
          )}
        </>
      ),
    };
  });

  return (
    <div className="stack-md">
      {hasOptions && (
        <AccordionControlled
          items={accordionItems}
          openIndex={openGroup}
          onToggle={(i) =>
            setOpenGroup((prev) => {
              if (prev === i) {
                // Closing: if optional, advance to next required unfilled
                const g = item.optionGroups[i];
                if (!g.required) {
                  const nextIdx = item.optionGroups.findIndex(
                    (ng, ni) =>
                      ni > i &&
                      ng.required &&
                      (selections[ni]?.length ?? 0) === 0
                  );
                  return nextIdx >= 0 ? nextIdx : null;
                }
                return null;
              }
              return i;
            })
          }
        />
      )}

      <div className="field">
        <label>{t("comments")}</label>
        <textarea
          placeholder={t("commentsPlaceholder")}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      <div className="field">
        <label>{t("quantity")}</label>
        <div className="qty" style={{ alignSelf: "flex-start" }}>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <span className="qty__value">{quantity}</span>
          <button type="button" onClick={() => setQuantity((q) => q + 1)}>
            +
          </button>
        </div>
      </div>

      {error && <div className="notice notice--error">{error}</div>}

      <button className="btn btn--primary btn--block" onClick={handleAdd}>
        {tCommon("addToCart")}
      </button>
    </div>
  );
}
