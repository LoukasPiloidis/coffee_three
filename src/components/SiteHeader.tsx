import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/session";
import LocaleSwitcher from "./LocaleSwitcher";
import CartLink from "./CartLink";
import styles from "./SiteHeader.module.css";

export default async function SiteHeader({ locale }: { locale: string }) {
  const t = await getTranslations("common");
  const session = await getSession();
  const isSignedIn = !!session?.user?.id;
  const userHref = isSignedIn ? "/profile" : "/signin";
  const userLabel = isSignedIn ? t("profile") : t("signIn");

  return (
    <header className={styles['site-header']}>
      <div className={styles['site-header__inner']}>
        <Link href="/" className={styles['site-header__brand']} aria-label="Coffee Three">
          <Image
            src="/logo.jpeg"
            alt="Coffee Three"
            width={36}
            height={36}
            priority
          />
        </Link>
        <nav className={styles['site-header__nav']}>
          <LocaleSwitcher currentLocale={locale} />
          <CartLink />
          <Link
            href={userHref}
            className={`${styles['site-header__icon-btn']}${
              isSignedIn ? ` ${styles['site-header__icon-btn--active']}` : ""
            }`}
            aria-label={userLabel}
            title={userLabel}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
            </svg>
          </Link>
        </nav>
      </div>
    </header>
  );
}
