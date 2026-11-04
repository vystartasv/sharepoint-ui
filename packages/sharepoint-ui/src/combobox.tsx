import { createElement, useId, type InputHTMLAttributes, type ReactElement } from "react";

export type ComboBoxOption = { value: string; label?: string };
export type ComboBoxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "list"> & {
  options: readonly ComboBoxOption[];
};

export function ComboBox({ className = "", id, options, ...props }: ComboBoxProps): ReactElement {
  const generatedId = useId();
  const listId = `${id ?? generatedId}-options`;
  return createElement("span", { className: "spui-combobox" },
    createElement("input", { ...props, id, type: "text", list: listId, className: `spui-input ${className}`.trim() }),
    createElement("datalist", { id: listId }, options.map(option =>
      createElement("option", { key: option.value, value: option.value, label: option.label }),
    )),
  );
}
