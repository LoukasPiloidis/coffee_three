"use client";

import { type ReactNode, useState } from "react";

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
    <div className="accordion">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={item.key}
            className={`option-accordion${isOpen ? " option-accordion--open" : ""}`}
          >
            <div
              role="button"
              tabIndex={0}
              className="option-accordion__header"
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
                <span className="option-accordion__summary">
                  {item.summary}
                </span>
              )}
              <span className="option-accordion__chevron" aria-hidden="true" />
            </div>

            {isOpen && (
              <div className="option-accordion__inner">{item.content}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export type { AccordionItem };
