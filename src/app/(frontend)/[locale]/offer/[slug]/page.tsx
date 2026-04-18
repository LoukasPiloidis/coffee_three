import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getItem, getOffer, type Locale, type MenuItem } from "@/lib/menu";
import OfferForm from "./OfferForm";

export default async function OfferPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const loc = locale as Locale;
  const offer = await getOffer(slug);
  if (!offer) notFound();

  const t = await getTranslations("common");

  // Resolve all unique eligible items across slots
  const uniqueSlugs = [
    ...new Set(offer.slots.flatMap((s) => s.eligibleItems)),
  ];
  const itemEntries = await Promise.all(uniqueSlugs.map((s) => getItem(s)));
  const itemMap: Record<string, MenuItem> = {};
  for (let i = 0; i < uniqueSlugs.length; i++) {
    const item = itemEntries[i];
    if (item && item.available) itemMap[uniqueSlugs[i]] = item;
  }

  return (
    <main className="page">
      <div className="container">
        <Link
          href="/"
          className="btn btn--ghost btn--small"
          style={{ marginBottom: "1rem" }}
        >
          ← {t("back")}
        </Link>

        <h1 style={{ marginBottom: "0.25rem" }}>{offer.title[loc]}</h1>

        {offer.description[loc] && (
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
            {offer.description[loc]}
          </p>
        )}

        <OfferForm offer={offer} items={itemMap} locale={loc} />
      </div>
    </main>
  );
}
