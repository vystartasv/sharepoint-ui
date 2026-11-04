import { createElement, type ButtonHTMLAttributes, type ReactElement } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ className = "", type = "button", ...props }: ButtonProps): ReactElement {
  return createElement("button", { ...props, type, className: `spui-button ${className}`.trim() });
}
