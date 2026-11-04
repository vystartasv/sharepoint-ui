import { createElement, type LabelHTMLAttributes, type ReactElement } from "react";

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className = "", ...props }: LabelProps): ReactElement {
  return createElement("label", { ...props, className: `spui-label ${className}`.trim() });
}
