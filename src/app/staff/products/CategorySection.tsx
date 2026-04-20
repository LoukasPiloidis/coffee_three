import type { MenuCategory } from "@/lib/menu-types";
import { ProductOptionGroups } from "./ProductOptionGroups";
import styles from "./Products.module.css";

export function CategorySection({
  category,
  expanded,
  saving,
  isPending,
  onToggleExpanded,
  onToggleItem,
  onToggleOption,
}: {
  category: MenuCategory;
  expanded: Set<string>;
  saving: string | null;
  isPending: boolean;
  onToggleExpanded: (slug: string) => void;
  onToggleItem: (slug: string, next: boolean) => void;
  onToggleOption: (
    itemSlug: string,
    groupKey: string,
    optionKey: string,
    next: boolean
  ) => void;
}) {
  return (
    <section data-slug={category.slug}>
      <h2 className={styles['section-title']}>{category.title.el}</h2>
      {category.items.length === 0 && (
        <p className={styles['no-items']}>Κανένα προϊόν.</p>
      )}
      <ul className={styles['item-list']}>
        {category.items.map((item) => {
          const isExpanded = expanded.has(item.slug);
          const hasOptions = item.optionGroups.length > 0;
          const itemSaving = saving === `item:${item.slug}`;
          const anyOptionDisabled = item.optionGroups.some((group) =>
            group.options.some((option) => !option.available)
          );
          return (
            <li key={item.slug} className={styles['item-card']}>
              <div className={styles['item-header']}>
                <div style={{ flex: 1 }}>
                  <div className={styles['item-name']}>{item.title.el}</div>
                  {anyOptionDisabled && (
                    <div className={styles['item-disabled-hint']}>
                      Κάποιες επιλογές απενεργοποιημένες
                    </div>
                  )}
                </div>
                {hasOptions && (
                  <button
                    type="button"
                    className="btn btn--ghost btn--small"
                    onClick={() => onToggleExpanded(item.slug)}
                  >
                    {isExpanded ? "Απόκρυψη επιλογών" : "Επιλογές"}
                  </button>
                )}
                <label className={styles['item-availability']}>
                  <input
                    type="checkbox"
                    checked={item.available}
                    disabled={isPending}
                    onChange={(e) =>
                      onToggleItem(item.slug, e.target.checked)
                    }
                  />
                  <span>
                    {item.available ? "Διαθέσιμο" : "Μη διαθέσιμο"}
                  </span>
                  {itemSaving && (
                    <span className={styles['saving-indicator']}>…</span>
                  )}
                </label>
              </div>

              {isExpanded && hasOptions && (
                <ProductOptionGroups
                  item={item}
                  saving={saving}
                  isPending={isPending}
                  onToggleOption={onToggleOption}
                />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
