import { createElement, type HTMLAttributes, type ReactElement, type ReactNode } from "react";

export type BreadcrumbItem = { label: ReactNode; href?: string };
export type BreadcrumbProps = Omit<HTMLAttributes<HTMLElement>, "children" | "aria-label"> & {
  label?: string;
  items: readonly BreadcrumbItem[];
};

export function Breadcrumb({ label = "Breadcrumb", items, className = "", ...props }: BreadcrumbProps): ReactElement {
  return createElement("nav", { ...props, "aria-label": label, className: `spui-breadcrumb ${className}`.trim() },
    createElement("ol", null, items.map((item, index) => {
      const current = index === items.length - 1;
      return createElement("li", { key: `${index}-${item.href ?? "current"}` },
        !current && item.href
          ? createElement("a", { href: item.href }, item.label)
          : createElement("span", { "aria-current": current ? "page" : undefined }, item.label),
      );
    })),
  );
}
