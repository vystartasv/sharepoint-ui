import { createElement, type InputHTMLAttributes, type ReactElement } from "react";

export type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function Switch({ className = "", role = "switch", ...props }: SwitchProps): ReactElement {
  return createElement("input", { ...props, type: "checkbox", role, className: `spui-switch ${className}`.trim() });
}
