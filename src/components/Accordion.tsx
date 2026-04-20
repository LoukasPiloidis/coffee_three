"use client";

import { type ReactNode, useState } from "react";
import styles from "./Accordion.module.css";

interface AccordionItem {
  key: string;
  title: ReactNode;
  summary?: string | null;
  content: ReactNode;
}

/** Uncontrolled — manages its own open state. */
export function Accordion({
  items,
  defaultOpen = 0,
}: {
  items: AccordionItem[];
  defaultOpen?: number | null;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpen);

  return (
    <AccordionControlled
      items={items}
      openIndex={openIndex}
      onToggle={(i) => setOpenIndex((prev) => (prev === i ? null : i))}
    />
  );
}

/** Controlled — parent owns open state. */
export function AccordionControlled({
  items,
  openIndex,
  onToggle,
}: {
  items: AccordionItem[];
  openIndex: number | null;
  onToggle: (index: number) => void;
}) {
  return (
    <div>
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={item.key}
            className={`${styles['option-accordion']}${isOpen ? ` ${styles['option-accordion--open']}` : ""}`}
          >
            <div
              role="button"
              tabIndex={0}
              className={styles['option-accordion__header']}
              onClick={() => onToggle(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onToggle(i);
                }
              }}
            >
              {item.title}
              {item.summary && !isOpen && (
                <span className={styles['option-accordion__summary']}>
                  {item.summary}
                </span>
              )}
              <span className={styles['option-accordion__chevron']} aria-hidden="true" />
            </div>

            {isOpen && (
              <div className={styles['option-accordion__inner']}>{item.content}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { styles as accordionStyles };
export type { AccordionItem };
