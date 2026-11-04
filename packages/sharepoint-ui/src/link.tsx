import { createElement, type AnchorHTMLAttributes, type ReactElement } from "react";

export type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement>;

export function Link({ className = "", target, rel, ...props }: LinkProps): ReactElement {
  return createElement("a", {
    ...props,
    target,
    rel: target === "_blank" ? [rel, "noopener", "noreferrer"].filter(Boolean).join(" ") : rel,
    className: `spui-link ${className}`.trim(),
  });
}
