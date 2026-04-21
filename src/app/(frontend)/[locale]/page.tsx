import { getTranslations } from "next-intl/server";
import { PageShell } from "@/components/PageShell";
import { getMenu, getOffers } from "@/lib/menu";
import type { Locale } from "@/lib/menu-types";
import { MenuList } from "./MenuList";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc = locale as Locale;
  const t = await getTranslations("menu");
  const tOffers = await getTranslations("offers");
  const [categories, offers] = await Promise.all([getMenu(), getOffers()]);

  return (
    <PageShell title={t("title")} subtitle="Coffee that makes you sing">
      {categories.length === 0 && <p className="empty">{t("empty")}</p>}

      {categories.length > 0 && (
        <MenuList
          categories={categories}
          offers={offers}
          locale={loc}
          translations={{
            unavailable: t("unavailable"),
            search: t("search"),
            offersTitle: tOffers("title"),
          }}
        />
      )}
    </PageShell>
  );
}
