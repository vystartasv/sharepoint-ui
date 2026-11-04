import { createElement, type HTMLAttributes, type ReactElement } from "react";

export type ViewOption = { value: string; label: string; disabled?: boolean };
export type ViewSwitcherProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "aria-label"> & {
  label: string;
  value: string;
  views: readonly ViewOption[];
  onChange: (value: string) => void;
};

export function ViewSwitcher({ label, value, views, onChange, className = "", ...props }: ViewSwitcherProps): ReactElement {
  return createElement("div", { ...props, role: "group", "aria-label": label, className: `spui-view-switcher ${className}`.trim() },
    views.map(view => createElement("button", {
      key: view.value, type: "button", disabled: view.disabled,
      "aria-pressed": value === view.value, onClick: () => onChange(view.value),
    }, view.label)),
  );
}
