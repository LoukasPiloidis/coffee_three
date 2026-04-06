"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useParams } from "next/navigation";

export default function LocaleSwitcher({ currentLocale }: { currentLocale: string }) {
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
    <div className="locale-switcher" role="group" aria-label="Language">
      {routing.locales.map((loc) => (
        <a
          key={loc}
          href="#"
          className={loc === currentLocale ? "active" : ""}
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
