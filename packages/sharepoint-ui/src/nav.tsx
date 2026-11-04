import { createElement, type HTMLAttributes, type ReactElement, type ReactNode } from "react";

export type NavItem = { id: string; label: ReactNode; href: string; current?: boolean };
export type NavProps = Omit<HTMLAttributes<HTMLElement>, "children" | "aria-label"> & {
  label: string;
  items: readonly NavItem[];
};

export function Nav({ label, items, className = "", ...props }: NavProps): ReactElement {
  return createElement("nav", { ...props, "aria-label": label, className: `spui-nav ${className}`.trim() },
    createElement("ul", null, items.map(item => createElement("li", { key: item.id },
      createElement("a", { href: item.href, "aria-current": item.current ? "page" : undefined }, item.label),
    ))),
  );
}
