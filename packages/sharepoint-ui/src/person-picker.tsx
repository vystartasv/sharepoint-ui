import { createElement, type ReactElement, type SelectHTMLAttributes } from "react";

export type PersonOption = { value: string; name: string; detail?: string };
export type PersonPickerProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children" | "id"> & {
  id: string;
  label: string;
  options: readonly PersonOption[];
  placeholder?: string;
};

export function PersonPicker({ id, label, options, placeholder = "Choose a person", className = "", ...props }: PersonPickerProps): ReactElement {
  return createElement("div", { className: "spui-field" },
    createElement("label", { htmlFor: id }, label),
    createElement("select", { ...props, id, className: `spui-select ${className}`.trim() },
      createElement("option", { value: "" }, placeholder),
      options.map(person => createElement("option", { key: person.value, value: person.value },
        person.detail ? `${person.name} — ${person.detail}` : person.name,
      )),
    ),
  );
}
