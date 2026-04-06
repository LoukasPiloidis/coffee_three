"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { cartStore, type CartLineOption } from "@/lib/cart";
import type { MenuItem, Locale } from "@/lib/menu-types";

type Selections = Record<string, string[]>; // groupIndex → selected option indices as strings

export default function ItemForm({ item, locale }: { item: MenuItem; locale: Locale }) {
  const t = useTranslations("item");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [comment, setComment] = useState("");
  const [selections, setSelections] = useState<Selections>({});
  const [error, setError] = useState<string | null>(null);

  const toggle = (groupIdx: number, optIdx: string, mode: "single" | "multi") => {
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
  };

  const handleAdd = () => {
    // Validate required groups
    for (let i = 0; i < item.optionGroups.length; i++) {
      const g = item.optionGroups[i];
      if (g.required && !(selections[i]?.length > 0)) {
        setError(`${g.name[locale]}: ${t("required")}`);
        return;
      }
    }
    setError(null);
    const options: CartLineOption[] = [];
    item.optionGroups.forEach((g, gi) => {
      (selections[gi] ?? []).forEach((oi) => {
        const opt = g.options[Number(oi)];
        if (opt) options.push({ groupName: g.name, optionName: opt.name });
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

  return (
    <div className="stack-md">
      {item.optionGroups.map((g, gi) => (
        <div key={gi} className="option-group">
          <div className="option-group__label">
            {g.name[locale]}
            {g.required && <span className="option-group__required">*</span>}
          </div>
          <div className="option-list">
            {g.options.map((o, oi) => {
              const name = `group-${gi}`;
              const value = String(oi);
              const checked = selections[gi]?.includes(value) ?? false;
              return (
                <label key={oi}>
                  <input
                    type={g.selectionType === "single" ? "radio" : "checkbox"}
                    name={name}
                    value={value}
                    checked={checked}
                    onChange={() => toggle(gi, value, g.selectionType)}
                  />
                  {o.name[locale]}
                </label>
              );
            })}
          </div>
        </div>
      ))}

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
          <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
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
