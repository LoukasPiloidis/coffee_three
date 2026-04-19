"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { AccordionControlled } from "@/components/Accordion";
import type { CartLineOption } from "@/lib/cart";
import {
  formatOptionLabel,
  type Locale,
  type MenuItem,
} from "@/lib/menu-types";

type Selections = Record<string, string[]>;

export type ItemSelectionResult = {
  options: CartLineOption[];
  comment: string;
};

/**
 * Reusable option-selection UI for a menu item.
 * Renders option-group accordions + a comment field.
 * Calls `onComplete` when the user confirms valid selections.
 */
export default function ItemOptionSelector({
  item,
  locale,
  submitLabel,
  onComplete,
  children,
}: {
  item: MenuItem;
  locale: Locale;
  submitLabel: string;
  onComplete: (result: ItemSelectionResult) => void;
  children?: React.ReactNode;
}) {
  const t = useTranslations("item");
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

    if (mode === "single") {
      const nextIdx = item.optionGroups.findIndex(
        (g, i) =>
          i > groupIdx && g.required && (selections[i]?.length ?? 0) === 0
      );
      setOpenGroup(nextIdx >= 0 ? nextIdx : null);
    }
  };

  const validate = (): CartLineOption[] | null => {
    for (let i = 0; i < item.optionGroups.length; i++) {
      const g = item.optionGroups[i];
      if (g.required && !(selections[i]?.length > 0)) {
        setError(`${g.name[locale]}: ${t("required")}`);
        setOpenGroup(i);
        return null;
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
    return options;
  };

  const handleSubmit = () => {
    const options = validate();
    if (!options) return;
    onComplete({ options, comment });
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
                      {formatOptionLabel("", o.priceCents, locale)}
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

      {children}

      {error && <div className="notice notice--error">{error}</div>}

      <button className="btn btn--primary btn--block" onClick={handleSubmit}>
        {submitLabel}
      </button>
    </div>
  );
}
