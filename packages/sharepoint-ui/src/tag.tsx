import { createElement, type HTMLAttributes, type ReactElement, type ReactNode } from "react";

export type TagProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  children?: ReactNode;
  onRemove?: () => void;
  removeLabel?: string;
};

export function Tag({ className = "", children, onRemove, removeLabel, ...props }: TagProps): ReactElement {
  const label = removeLabel ?? (typeof children === "string" ? `Remove ${children}` : "Remove tag");
  return createElement("span", { ...props, className: `spui-tag ${className}`.trim() },
    children,
    onRemove && createElement("button", { type: "button", className: "spui-tag-remove", "aria-label": label, onClick: onRemove }, "Remove"),
  );
}
