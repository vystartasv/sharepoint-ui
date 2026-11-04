import { createElement, type DetailsHTMLAttributes, type ReactElement, type ReactNode } from "react";

export type PopoverProps = Omit<DetailsHTMLAttributes<HTMLDetailsElement>, "children"> & {
  label: string;
  children?: ReactNode;
};

export function Popover({ label, className = "", children, ...props }: PopoverProps): ReactElement {
  return createElement("details", { ...props, className: `spui-popover ${className}`.trim() },
    createElement("summary", null, label),
    createElement("div", { role: "region", "aria-label": `${label} details` }, children),
  );
}
