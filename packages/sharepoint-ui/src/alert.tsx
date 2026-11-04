import { createElement, type HTMLAttributes, type ReactElement } from "react";

export type AlertProps = HTMLAttributes<HTMLDivElement>;

export function Alert({ className = "", role = "status", ...props }: AlertProps): ReactElement {
  return createElement("div", { ...props, role, className: `spui-alert ${className}`.trim() });
}
