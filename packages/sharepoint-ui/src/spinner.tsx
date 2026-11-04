import { createElement, type HTMLAttributes, type ReactElement } from "react";

export type SpinnerProps = Omit<HTMLAttributes<HTMLSpanElement>, "children" | "aria-label"> & {
  label: string;
};

export function Spinner({ label, className = "", ...props }: SpinnerProps): ReactElement {
  return createElement("span", { ...props, role: "status", "aria-label": label, className: `spui-spinner ${className}`.trim() },
    createElement("span", { "aria-hidden": true }),
  );
}
