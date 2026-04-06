import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getItem, formatPrice, type Locale } from "@/lib/menu";
import ItemForm from "./ItemForm";

export default async function ItemPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const loc = locale as Locale;
  const item = await getItem(slug);
  if (!item || !item.available) notFound();

  const t = await getTranslations("common");

  return (
    <main className="page">
      <div className="container">
        <Link href="/" className="btn btn--ghost btn--small" style={{ marginBottom: "1rem" }}>
          ← {t("back")}
        </Link>
        
        {item.image && (
          <div style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: "1rem" }}>
            <Image
              src={item.image}
              alt={item.title[loc]}
              width={800}
              height={480}
              style={{ width: "100%", height: "auto", objectFit: "cover" }}
            />
          </div>
        )}

        <h1 style={{ marginBottom: "0.25rem" }}>{item.title[loc]}</h1>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--color-green-800)",
            fontWeight: 600,
            marginBottom: "0.75rem",
          }}
        >
          {formatPrice(item.price, loc)}
        </div>

        {item.description[loc] && (
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
            {item.description[loc]}
          </p>
        )}

        <ItemForm item={item} locale={loc} />
      </div>
    </main>
  );
}
