import { createElement, useId, type ChangeEventHandler, type FieldsetHTMLAttributes, type ReactElement } from "react";

export type SwatchOption = { value: string; label: string; color?: string; src?: string; disabled?: boolean };
export type SwatchPickerProps = Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, "children" | "name"> & {
  name: string;
  label: string;
  options: readonly SwatchOption[];
  value?: string;
  defaultValue?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
};

export function SwatchPicker({ name, label, options, value, defaultValue, onChange, className = "", ...props }: SwatchPickerProps): ReactElement {
  const id = useId();
  return createElement("fieldset", { ...props, className: `spui-swatch-picker ${className}`.trim() },
    createElement("legend", null, label),
    options.map((option, index) => createElement("label", { key: option.value, htmlFor: `${id}-${index}`, className: "spui-swatch-option" },
      createElement("input", {
        id: `${id}-${index}`, type: "radio", name, value: option.value, disabled: option.disabled, className: "spui-radio",
        checked: value === undefined ? undefined : value === option.value,
        defaultChecked: value === undefined && defaultValue === option.value,
        onChange,
      }),
      option.src ? createElement("img", { src: option.src, alt: "", "aria-hidden": true, className: "spui-swatch-dot" })
        : createElement("span", { "aria-hidden": true, className: "spui-swatch-dot", style: { backgroundColor: option.color } }),
      createElement("span", { className: "spui-swatch-label" }, option.label),
    )),
  );
}
