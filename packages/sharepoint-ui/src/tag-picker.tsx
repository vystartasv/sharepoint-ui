import { createElement, type ReactElement, type SelectHTMLAttributes } from "react";

export type TagPickerOption = { value: string; label: string; disabled?: boolean };
export type TagPickerProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children" | "id" | "multiple"> & {
  id: string;
  label: string;
  options: readonly TagPickerOption[];
};

export function TagPicker({ id, label, options, className = "", size = 4, ...props }: TagPickerProps): ReactElement {
  return createElement("div", { className: "spui-field" },
    createElement("label", { htmlFor: id }, label),
    createElement("select", { ...props, id, multiple: true, size, className: `spui-select spui-tag-picker ${className}`.trim() },
      options.map(option => createElement("option", { key: option.value, value: option.value, disabled: option.disabled }, option.label)),
    ),
  );
}
