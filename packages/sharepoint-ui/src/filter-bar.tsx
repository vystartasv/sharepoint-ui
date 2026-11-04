import { createElement, type HTMLAttributes, type ReactElement, type ReactNode } from "react";

export type FilterBarProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "aria-label"> & {
  label: string;
  children?: ReactNode;
  onClear?: () => void;
  clearLabel?: string;
  activeFilterCount?: number;
};

export function FilterBar({
  label, children, onClear, clearLabel = "Clear filters", activeFilterCount, className = "", ...props
}: FilterBarProps): ReactElement {
  return createElement("div", {
    ...props, role: "search", "aria-label": label, className: `spui-filter-bar ${className}`.trim(),
  },
  createElement("div", { className: "spui-filter-controls" }, children),
  onClear && createElement("button", {
    type: "button", className: "spui-filter-clear", onClick: onClear,
    disabled: activeFilterCount === 0,
  }, clearLabel),
  );
}
