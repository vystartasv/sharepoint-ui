import { createElement, type InputHTMLAttributes, type ReactElement } from "react";

export type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function Radio({ className = "", ...props }: RadioProps): ReactElement {
  return createElement("input", { ...props, type: "radio", className: `spui-radio ${className}`.trim() });
}
