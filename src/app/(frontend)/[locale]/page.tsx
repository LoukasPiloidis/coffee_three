import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getMenu, formatPrice, type Locale } from "@/lib/menu";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc = locale as Locale;
  const t = await getTranslations("menu");
  const categories = await getMenu();

  return (
    <main className="page">
      <div className="container">
        <h1 className="page__title">{t("title")}</h1>
        <p className="page__subtitle">Coffee that makes you sing</p>

        {categories.length === 0 && <p className="empty">{t("empty")}</p>}

        {categories.map((cat) => (
          <section key={cat.slug} className="category">
            <h2 className="category__title">{cat.title[loc]}</h2>
            <div>
              {cat.items.map((item) => {
                const inner = (
                  <>
                    <div className="item-row__main">
                      <div className="item-row__title">{item.title[loc]}</div>
                      {item.description[loc] && (
                        <div className="item-row__desc">
                          {item.description[loc]}
                        </div>
                      )}
                      {!item.available && (
                        <div className="item-row__unavailable">
                          {t("unavailable")}
                        </div>
                      )}
                    </div>
                    <div className="item-row__right">
                      <span className="item-row__price">
                        {formatPrice(item.price, loc)}
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
      </div>
    </main>
  );
}
