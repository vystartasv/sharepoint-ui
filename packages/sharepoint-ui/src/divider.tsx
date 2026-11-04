import { createElement, type HTMLAttributes, type ReactElement } from "react";

export type DividerProps = HTMLAttributes<HTMLHRElement>;

export function Divider({ className = "", ...props }: DividerProps): ReactElement {
  return createElement("hr", { ...props, className: `spui-divider ${className}`.trim() });
}
