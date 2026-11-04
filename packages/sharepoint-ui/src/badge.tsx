import { createElement, type HTMLAttributes, type ReactElement } from "react";

export type BadgeProps = HTMLAttributes<HTMLSpanElement>;

export function Badge({ className = "", ...props }: BadgeProps): ReactElement {
  return createElement("span", { ...props, className: `spui-badge ${className}`.trim() });
}
