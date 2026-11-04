import { createElement, type DetailsHTMLAttributes, type ReactElement, type ReactNode } from "react";

export type MenuProps = Omit<DetailsHTMLAttributes<HTMLDetailsElement>, "children"> & {
  label: string;
  children?: ReactNode;
};

export function Menu({ label, className = "", children, ...props }: MenuProps): ReactElement {
  return createElement("details", { ...props, className: `spui-menu ${className}`.trim() },
    createElement("summary", null, label),
    createElement("div", { role: "group", className: "spui-menu-items", "aria-label": `${label} actions` }, children),
  );
}
