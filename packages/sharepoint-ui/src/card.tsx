import { createElement, type HTMLAttributes, type ReactElement } from "react";

export type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: CardProps): ReactElement {
  return createElement("div", { ...props, className: `spui-card ${className}`.trim() });
}
