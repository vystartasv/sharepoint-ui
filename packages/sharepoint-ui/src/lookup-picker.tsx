import { createElement, type ReactElement, type SelectHTMLAttributes } from "react";

export type LookupOption = { id: string; label: string };
export type LookupPickerProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children" | "id"> & {
  id: string;
  label: string;
  options: readonly LookupOption[];
  placeholder?: string;
};

export function LookupPicker({ id, label, options, placeholder = "Choose an item", className = "", ...props }: LookupPickerProps): ReactElement {
  return createElement("div", { className: "spui-field" },
    createElement("label", { htmlFor: id }, label),
    createElement("select", { ...props, id, className: `spui-select ${className}`.trim() },
      createElement("option", { value: "" }, placeholder),
      options.map(item => createElement("option", { key: item.id, value: item.id }, item.label)),
    ),
  );
}
