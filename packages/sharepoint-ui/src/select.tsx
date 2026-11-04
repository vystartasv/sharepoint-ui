import { createElement, type ReactElement, type SelectHTMLAttributes } from "react";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className = "", ...props }: SelectProps): ReactElement {
  return createElement("select", { ...props, className: `spui-select ${className}`.trim() });
}
