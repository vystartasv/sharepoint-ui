import { createElement, useId, type HTMLAttributes, type ReactElement } from "react";
import { Checkbox } from "./checkbox.js";
import { Field } from "./field.js";
import { Input } from "./input.js";
import { LookupPicker, type LookupOption } from "./lookup-picker.js";
import { PersonPicker, type PersonOption } from "./person-picker.js";
import { Select } from "./select.js";
import { TextArea } from "./textarea.js";

export type SharePointFieldType = "text" | "multiline" | "number" | "date" | "boolean" | "choice" | "person" | "lookup";
export type SharePointFieldProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  name: string;
  label: string;
  type: SharePointFieldType;
  value?: string | boolean;
  defaultValue?: string | boolean;
  required?: boolean;
  hint?: string;
  choices?: readonly string[];
  people?: readonly PersonOption[];
  lookups?: readonly LookupOption[];
  onValueChange?: (value: string | boolean) => void;
};

export function SharePointField({
  name, label, type, value, defaultValue, required, hint, choices = [], people = [], lookups = [], onValueChange,
  className = "", ...props
}: SharePointFieldProps): ReactElement {
  const id = useId();
  const onStringChange = (event: { currentTarget: { value: string } }) => onValueChange?.(event.currentTarget.value);
  const control = type === "boolean"
    ? createElement(Checkbox, {
        name, required,
        checked: value === undefined ? undefined : Boolean(value),
        defaultChecked: value === undefined ? Boolean(defaultValue) : undefined,
        onChange: event => onValueChange?.(event.currentTarget.checked),
      })
    : type === "choice"
      ? createElement(Select, {
          name, required, onChange: onStringChange,
          value: value === undefined ? undefined : typeof value === "string" ? value : "",
          defaultValue: value === undefined ? typeof defaultValue === "string" ? defaultValue : "" : undefined,
        },
          createElement("option", { value: "" }, "Choose an option"),
          choices.map(choice => createElement("option", { key: choice, value: choice }, choice)),
        )
      : type === "person"
        ? createElement(PersonPicker, {
            id, name, label, options: people, required, onChange: onStringChange,
            value: typeof value === "string" ? value : undefined,
            defaultValue: typeof value === "string" ? undefined : typeof defaultValue === "string" ? defaultValue : undefined,
            "aria-describedby": hint ? `${id}-hint` : undefined,
          })
        : type === "lookup"
          ? createElement(LookupPicker, {
              id, name, label, options: lookups, required, onChange: onStringChange,
              value: typeof value === "string" ? value : undefined,
              defaultValue: typeof value === "string" ? undefined : typeof defaultValue === "string" ? defaultValue : undefined,
              "aria-describedby": hint ? `${id}-hint` : undefined,
            })
          : type === "multiline"
            ? createElement(TextArea, {
                name, required, onChange: onStringChange,
                value: value === undefined ? undefined : typeof value === "string" ? value : "",
                defaultValue: value === undefined ? typeof defaultValue === "string" ? defaultValue : "" : undefined,
              })
            : createElement(Input, {
                name, type: type === "number" || type === "date" ? type : "text",
                required, onChange: onStringChange,
                value: value === undefined ? undefined : typeof value === "string" ? value : "",
                defaultValue: value === undefined ? typeof defaultValue === "string" ? defaultValue : "" : undefined,
              });
  return createElement("div", { ...props, className: `spui-sharepoint-field ${className}`.trim() },
    type === "person" || type === "lookup"
      ? control
      : createElement(Field, { id, label, hint, required, children: control as ReactElement<{ id?: string; required?: boolean }> }),
    (type === "person" || type === "lookup") && hint && createElement("span", { id: `${id}-hint`, className: "spui-hint" }, hint),
  );
}
