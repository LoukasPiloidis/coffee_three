import Link from "next/link";
import styles from "./StaffNav.module.css";

export type StaffPage = "orders" | "delivery" | "products" | "analytics";

const PAGES: { key: StaffPage; href: string; label: string }[] = [
  { key: "orders", href: "/staff", label: "Παραγγελίες" },
  { key: "delivery", href: "/staff/delivery", label: "Διανομές" },
  { key: "products", href: "/staff/products", label: "Προϊόντα" },
  { key: "analytics", href: "/staff/analytics", label: "Analytics" },
];

export function StaffNav({
  activePage,
  title,
  devBypass,
  signOutAction,
}: {
  activePage: StaffPage;
  title?: string;
  devBypass: boolean;
  signOutAction: () => Promise<void>;
}) {
  const current = PAGES.find((p) => p.key === activePage)!;
  const others = PAGES.filter((p) => p.key !== activePage);

  return (
    <div className={styles.nav}>
      <h1>
        {title ?? current.label}
        {devBypass && " (dev bypass)"}
      </h1>
      <div className={styles.links}>
        {others.map((p) => (
          <Link
            key={p.key}
            href={p.href}
            className="btn btn--ghost btn--small"
          >
            {p.label}
          </Link>
        ))}
        {!devBypass && (
          <form action={signOutAction}>
            <button className="btn btn--ghost btn--small">Αποσύνδεση</button>
          </form>
        )}
      </div>
    </div>
  );
}
