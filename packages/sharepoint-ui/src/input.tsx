import { createElement, type InputHTMLAttributes, type ReactElement } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: InputProps): ReactElement {
  return createElement("input", { ...props, className: `spui-input ${className}`.trim() });
}
