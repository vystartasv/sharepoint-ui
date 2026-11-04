import { cloneElement, createElement, type ReactElement, type ReactNode } from "react";

export type FieldProps = {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: ReactElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean; required?: boolean }>;
};

export function Field({ id, label, hint, error, required, children }: FieldProps): ReactElement {
  const describedBy = [children.props["aria-describedby"], hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ");
  const control = cloneElement(children, {
    id,
    required: required || children.props.required,
    "aria-describedby": describedBy || undefined,
    "aria-invalid": error ? true : children.props["aria-invalid"],
  });
  return createElement("div", { className: "spui-field" },
    createElement("label", { htmlFor: id }, label, required ? " *" : null),
    control,
    hint && createElement("div", { id: `${id}-hint`, className: "spui-hint" }, hint),
    error && createElement("div", { id: `${id}-error`, className: "spui-error", role: "alert" }, error),
  );
}
