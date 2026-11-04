import { createElement, type HTMLAttributes, type ReactElement, type ReactNode } from "react";

export type AccordionItem = { id: string; label: ReactNode; content: ReactNode; open?: boolean };
export type AccordionProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  items: readonly AccordionItem[];
};

export function Accordion({ items, className = "", ...props }: AccordionProps): ReactElement {
  return createElement("div", { ...props, className: `spui-accordion ${className}`.trim() },
    items.map(item => createElement("details", { key: item.id, open: item.open },
      createElement("summary", null, item.label),
      createElement("div", { className: "spui-accordion-content" }, item.content),
    )),
  );
}
