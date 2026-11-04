import { createElement, type HTMLAttributes, type ReactElement } from "react";

export type CardProps = HTMLAttributes<HTMLElement>;

export function Card({ className = "", ...props }: CardProps): ReactElement {
  return createElement("article", { ...props, className: `spui-card ${className}`.trim() });
}
