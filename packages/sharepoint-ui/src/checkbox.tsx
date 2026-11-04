import { createElement, type InputHTMLAttributes, type ReactElement } from "react";

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function Checkbox({ className = "", ...props }: CheckboxProps): ReactElement {
  return createElement("input", { ...props, type: "checkbox", className: `spui-checkbox ${className}`.trim() });
}
