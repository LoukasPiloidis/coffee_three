import type { MenuCategory } from "@/lib/menu-types";
import styles from "./Products.module.css";

type ItemType = MenuCategory["items"][number];

export function ProductOptionGroups({
  item,
  saving,
  isPending,
  onToggleOption,
}: {
  item: ItemType;
  saving: string | null;
  isPending: boolean;
  onToggleOption: (
    itemSlug: string,
    groupKey: string,
    optionKey: string,
    next: boolean
  ) => void;
}) {
  return (
    <div className={styles['options-panel']}>
      {item.optionGroups.map((group) => (
        <div key={group.key} style={{ marginBottom: "0.75rem" }}>
          <div className={styles['option-group-title']}>
            {group.name.el}
            {group.required && " *"}
          </div>
          <ul className={styles['option-list']}>
            {group.options.map((option) => {
              const id = `opt:${item.slug}:${group.key}:${option.key}`;
              return (
                <li key={option.key} className={styles['option-row']}>
                  <span className={!option.available ? styles['option-name--unavailable'] : undefined}>
                    {option.name.el}
                  </span>
                  <label className={styles['item-availability']}>
                    <input
                      type="checkbox"
                      checked={option.available}
                      disabled={isPending}
                      onChange={(e) =>
                        onToggleOption(
                          item.slug,
                          group.key,
                          option.key,
                          e.target.checked
                        )
                      }
                    />
                    {saving === id && (
                      <span className={styles['saving-indicator']}>…</span>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
