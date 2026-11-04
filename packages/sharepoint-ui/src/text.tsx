import { createElement, type HTMLAttributes, type ReactElement } from "react";

export type TextProps = HTMLAttributes<HTMLElement> & { as?: "p" | "span" | "strong" | "small" | "div" };

export function Text({ as = "p", className = "", ...props }: TextProps): ReactElement {
  return createElement(as, { ...props, className: `spui-text ${className}`.trim() });
}
