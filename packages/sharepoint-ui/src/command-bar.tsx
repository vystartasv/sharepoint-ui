import { createElement, type HTMLAttributes, type ReactElement, type ReactNode } from "react";

export type CommandBarProps = Omit<HTMLAttributes<HTMLElement>, "children" | "aria-label"> & {
  label: string;
  children?: ReactNode;
};

export function CommandBar({ label, className = "", children, ...props }: CommandBarProps): ReactElement {
  return createElement("nav", { ...props, "aria-label": label, className: `spui-command-bar ${className}`.trim() }, children);
}
