"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ItemOptionSelector } from "@/components/ItemOptionSelector";
import { QuantityStepper } from "@/components/QuantityStepper";
import { useRouter } from "@/i18n/navigation";
import { cartStore } from "@/lib/cart";
import type { Locale, MenuItem } from "@/lib/menu-types";

export function ItemForm({
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

  return (
    <ItemOptionSelector
      item={item}
      locale={locale}
      submitLabel={tCommon("addToCart")}
      onComplete={({ options, comment }) => {
        cartStore.addLine({
          slug: item.slug,
          title: item.title,
          unitPrice: item.price,
          quantity,
          options,
          comment,
        });
        router.push("/cart");
      }}
    >
      <div className="field">
        <label>{t("quantity")}</label>
        <QuantityStepper value={quantity} onChange={setQuantity} />
      </div>
    </ItemOptionSelector>
  );
}
