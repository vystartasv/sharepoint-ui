import { createElement, type HTMLAttributes, type ReactElement, type ReactNode } from "react";

export type TagGroupProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "aria-label"> & {
  label: string;
  children?: ReactNode;
};

export function TagGroup({ label, className = "", children, ...props }: TagGroupProps): ReactElement {
  return createElement("div", { ...props, role: "group", "aria-label": label, className: `spui-tag-group ${className}`.trim() }, children);
}
