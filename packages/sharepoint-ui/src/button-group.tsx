import { createElement, type HTMLAttributes, type ReactElement, type ReactNode } from "react";

export type ButtonGroupProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "aria-label"> & {
  label: string;
  children?: ReactNode;
};

export function ButtonGroup({ label, className = "", children, ...props }: ButtonGroupProps): ReactElement {
  return createElement("div", { ...props, role: "group", "aria-label": label, className: `spui-button-group ${className}`.trim() }, children);
}
