"use client";

import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import styles from "./SiteHeader.module.css";

export function LocaleSwitcher({
  currentLocale,
}: {
  currentLocale: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const switchTo = (locale: string) => {
    // Preserve dynamic params on the current pathname
    router.replace(
      // @ts-expect-error — next-intl types don't model arbitrary dynamic paths
      { pathname, params },
      { locale }
    );
  };

  return (
    <div className={styles['locale-switcher']} role="group" aria-label="Language">
      {routing.locales.map((loc) => (
        <a
          key={loc}
          href="#"
          className={loc === currentLocale ? styles['locale-switcher__active'] : ""}
          onClick={(e) => {
            e.preventDefault();
            switchTo(loc);
          }}
        >
          {loc.toUpperCase()}
        </a>
      ))}
    </div>
  );
}
